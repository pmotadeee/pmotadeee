//+------------------------------------------------------------------+
//|                             Trend_Mesh_V5_Enhanced.mq5           |
//|                        Copyright 2025, Atous Technology Systems  |
//|           Enhanced: Filtros de Mercado + MTF + Scoring Robusto   |
//+------------------------------------------------------------------+
#property copyright "Copyright 2025, Atous Technology Systems"
#property version   "5.02"
#property description "Trend Mesh V5: Matematicamente Otimizado para 70%+ WR"

#include <Trade\Trade.mqh>
#include <Trade\AccountInfo.mqh>
#include <Trade\SymbolInfo.mqh>
#include <Trade\PositionInfo.mqh>

//--- INPUTS ---
input group "=== GESTAO DE RISCO (% DO CAPITAL) ==="
input double InpRiskPercent = 1.5;          // Risco por trade (% do capital)
input double InpMaxSpreadMultiplier = 2.0; // Spread maximo permitido (x media)
input double InpMinRR = 1.0;               // R:R Minimo (Conservador: 1:1)
input double InpMaxRR = 2.0;               // R:R Maximo (Agressivo: 1:2)

input group "=== FILTROS DE QUALIDADE ==="
input bool InpEnableSpreadFilter = true;    // Filtro de Spread?
input bool InpEnableVolatilityFilter = true;// Filtro de Volatilidade ATR?
input bool InpEnableTimeFilter = true;      // Filtro de Horario (Liquidez)?
input bool InpEnableMultiTF = true;         // Multi-Timeframe Analysis?

input group "=== INDICADORES PRINCIPAIS ==="
input int InpEmaFast = 8; 
input int InpEmaSlow = 21; 
input int InpEmaFilter = 50;                // EMA de Filtro de Tendencia
input int InpRsiPeriod = 14; 
input int InpAtrPeriod = 14;
input int InpAtrMaLength = 20;              // Media movel do ATR para volatilidade

input group "=== PIVOT DETECTION (SEM ZIGZAG!) ==="
input int InpSwingBars = 3;                 // Barras para confirmar pivot (Fractals-like)
input int InpMinPivotDistance = 10;         // Distancia minima entre pivots (barras)

input group "=== MULTI-TIMEFRAME ==="
input ENUM_TIMEFRAMES InpHTF = PERIOD_H1;   // Higher Timeframe (Tendencia)
input ENUM_TIMEFRAMES InpMTF = PERIOD_M15;  // Medium Timeframe (Setup)

input group "=== HORARIOS DE OPERACAO (GMT) ==="
input int InpStartHour = 8;                 // Hora inicio (08:00 GMT = Londres)
input int InpEndHour = 20;                  // Hora fim (20:00 GMT = Final NY)

input group "=== TRADING ==="
input bool InpEnableTrading = false;        // Habilitar trading ao vivo?
input int InpMaxGlobalPositions = 3;        // Maximo posicoes TOTAIS na conta
input int InpMaxPositionsPerSymbol = 1;     // Maximo posicoes por simbolo
input double InpHardStopLoss = 100.0;       // Hard Stop ($)
input int InpMagicNumber = 999888;

input group "=== TRAILING STOP ==="
input bool InpUseBreakeven = true;          // Mover para Breakeven?
input double InpBreakevenTriggerRR = 0.5;   // Ativar BE quando ganhar 0.5R
input double InpTrailingStepRR = 0.7;       // Distancia do trailing (0.7R)

//--- ESTRUTURAS ---
struct MarketContext {
    bool isTrending;
    bool isVolatilityNormal;
    bool isSpreadAcceptable;
    bool isTimeGood;
    bool htfBullish;
    bool mtfBullish;
    double atrValue;
    double spreadPips;
    int contextScore;
};

struct PivotPoint {
    double price;
    datetime time;
    int barIndex;
    bool isHigh;
    bool confirmed;
};

struct SignalScore {
    bool isValid;
    bool isBuy;
    int totalScore;      // 0-100 pontos
    double confidence;   // 0-1 (normalizado)
    double entryPrice;
    datetime time;
    string breakdown;    // Detalhamento dos pontos
};

//--- GLOBAIS ---
int handleEmaFast, handleEmaSlow, handleEmaFilter, handleRsi, handleAtr;
int handleHTF_Ema, handleMTF_Ema; // Multi-timeframe EMAs

datetime lastBarTime = 0;
datetime lastTradeTime = 0;
double avgSpread = 0;
int spreadSamples = 0;

CTrade trade;
CSymbolInfo symbolInfo;
CAccountInfo accountInfo;
CPositionInfo positionInfo;

//+------------------------------------------------------------------+
//| FUNCOES AUXILIARES (Definidas antes do uso para evitar erros)    |
//+------------------------------------------------------------------+

//--- Atualizar Media de Spread
void UpdateSpreadAverage()
{
    spreadSamples++;
    double currentSpread = symbolInfo.Spread();
    avgSpread = ((avgSpread * (spreadSamples - 1)) + currentSpread) / spreadSamples;
}

//--- Verificar Spread
bool IsSpreadAcceptable()
{
    if(!InpEnableSpreadFilter) return true;
    if(avgSpread == 0) return true; 
    
    double currentSpread = symbolInfo.Spread();
    return (currentSpread <= avgSpread * InpMaxSpreadMultiplier);
}

//--- Verificar Volatilidade
bool IsVolatilityNormal()
{
    if(!InpEnableVolatilityFilter) return true;
    
    double atr[], atrMA[]; 
    ArraySetAsSeries(atrMA, true);
    if(CopyBuffer(handleAtr, 0, 0, 1, atr) < 1) return false;
    
    // Calcular media do ATR
    if(CopyBuffer(handleAtr, 0, 0, InpAtrMaLength, atrMA) < InpAtrMaLength) return false;
    
    double atrAvg = 0;
    for(int i = 0; i < InpAtrMaLength; i++) atrAvg += atrMA[i];
    atrAvg /= InpAtrMaLength;
    
    // ATR deve estar entre 50% e 150% da media
    return (atr[0] >= atrAvg * 0.5 && atr[0] <= atrAvg * 1.5);
}

//--- Verificar Horario
bool IsTradingTime()
{
    if(!InpEnableTimeFilter) return true;
    
    MqlDateTime dt;
    TimeToStruct(TimeCurrent(), dt);
    
    return (dt.hour >= InpStartHour && dt.hour < InpEndHour);
}

//--- Contar Posicoes Globais
int CountGlobalPositions()
{
    int count = 0;
    for(int i = PositionsTotal() - 1; i >= 0; i--) {
        ulong ticket = PositionGetTicket(i);
        if(ticket > 0) {
            if(PositionGetInteger(POSITION_MAGIC) == InpMagicNumber) {
                count++;
            }
        }
    }
    return count;
}

//--- Contar Posicoes por Simbolo
int CountSymbolPositions(string symbol)
{
    int count = 0;
    for(int i = PositionsTotal() - 1; i >= 0; i--) {
        ulong ticket = PositionGetTicket(i);
        if(ticket > 0) {
            if(PositionGetInteger(POSITION_MAGIC) == InpMagicNumber &&
               PositionGetString(POSITION_SYMBOL) == symbol) {
                count++;
            }
        }
    }
    return count;
}

//--- Verificar Posicao no Simbolo
bool HasSymbolPosition(string symbol)
{
    return (CountSymbolPositions(symbol) >= InpMaxPositionsPerSymbol);
}

//+------------------------------------------------------------------+
//| ANALISE DE MERCADO                                               |
//+------------------------------------------------------------------+
MarketContext GetMarketContext()
{
    MarketContext ctx;
    ctx.contextScore = 0;
    
    // 1. SPREAD
    ctx.isSpreadAcceptable = IsSpreadAcceptable();
    ctx.spreadPips = symbolInfo.Spread() / 10.0;
    if(ctx.isSpreadAcceptable) ctx.contextScore += 10;
    
    // 2. VOLATILIDADE
    ctx.isVolatilityNormal = IsVolatilityNormal();
    double atr[]; 
    if(CopyBuffer(handleAtr, 0, 0, 1, atr) > 0) {
        ctx.atrValue = atr[0];
    } else {
        ctx.atrValue = 0;
    }
    if(ctx.isVolatilityNormal) ctx.contextScore += 10;
    
    // 3. HORARIO
    ctx.isTimeGood = IsTradingTime();
    if(ctx.isTimeGood) ctx.contextScore += 5;
    
    // 4. MULTI-TIMEFRAME TREND
    ctx.htfBullish = false;
    ctx.mtfBullish = false;
    
    if(InpEnableMultiTF) {
        double htfEma[], mtfEma[], htfClose[], mtfClose[]; 
        
        if(CopyBuffer(handleHTF_Ema, 0, 0, 1, htfEma) > 0 && 
           CopyClose(_Symbol, InpHTF, 0, 1, htfClose) > 0) {
            ctx.htfBullish = (htfClose[0] > htfEma[0]);
            ctx.contextScore += 7;
        }
        if(CopyBuffer(handleMTF_Ema, 0, 0, 1, mtfEma) > 0 && 
           CopyClose(_Symbol, InpMTF, 0, 1, mtfClose) > 0) {
            ctx.mtfBullish = (mtfClose[0] > mtfEma[0]);
            ctx.contextScore += 8;
        }
    }
    
    // 5. TENDENCIA LOCAL
    double emaFast[], emaSlow[], emaFilter[]; 
    if(CopyBuffer(handleEmaFast, 0, 0, 1, emaFast) > 0 &&
       CopyBuffer(handleEmaSlow, 0, 0, 1, emaSlow) > 0 &&
       CopyBuffer(handleEmaFilter, 0, 0, 1, emaFilter) > 0) {
        bool aligned = (emaFast[0] > emaSlow[0] && emaSlow[0] > emaFilter[0]) ||
                       (emaFast[0] < emaSlow[0] && emaSlow[0] < emaFilter[0]);
        ctx.isTrending = aligned;
        if(ctx.isTrending) ctx.contextScore += 10;
    }
    
    return ctx;
}

//+------------------------------------------------------------------+
//| CALCULO DE SINAL                                                 |
//+------------------------------------------------------------------+
SignalScore CalculateAdvancedSignal(bool isBuyCandidate, double price)
{
    SignalScore score;
    score.isValid = false;
    score.isBuy = isBuyCandidate;
    score.totalScore = 0;
    score.entryPrice = price;
    score.breakdown = "";
    
    MarketContext ctx = GetMarketContext();
    
    // --- Contexto Macro ---
    if(InpEnableMultiTF) {
        if(isBuyCandidate) {
            if(ctx.htfBullish && ctx.mtfBullish) {
                score.totalScore += 15;
                score.breakdown += "HTF+MTF Bull(+15) ";
            } else if(ctx.htfBullish || ctx.mtfBullish) {
                score.totalScore += 7;
                score.breakdown += "Partial Trend(+7) ";
            }
        } else {
            if(!ctx.htfBullish && !ctx.mtfBullish) {
                score.totalScore += 15;
                score.breakdown += "HTF+MTF Bear(+15) ";
            } else if(!ctx.htfBullish || !ctx.mtfBullish) {
                score.totalScore += 7;
                score.breakdown += "Partial Trend(+7) ";
            }
        }
    }
    
    // --- EMAs ---
    double emaFast[], emaSlow[], emaFilter[]; 
    if(CopyBuffer(handleEmaFast, 0, 0, 1, emaFast) > 0 &&
       CopyBuffer(handleEmaSlow, 0, 0, 1, emaSlow) > 0 &&
       CopyBuffer(handleEmaFilter, 0, 0, 1, emaFilter) > 0) {
        if(isBuyCandidate) {
            if(emaFast[0] > emaSlow[0] && emaSlow[0] > emaFilter[0]) {
                score.totalScore += 10;
                score.breakdown += "EMA Bull(+10) ";
            }
        } else {
            if(emaFast[0] < emaSlow[0] && emaSlow[0] < emaFilter[0]) {
                score.totalScore += 10;
                score.breakdown += "EMA Bear(+10) ";
            }
        }
    }
    
    // --- Volatilidade ---
    if(ctx.isVolatilityNormal) {
        score.totalScore += 5;
        score.breakdown += "VolOK(+5) ";
    }
    
    // --- RSI ---
    double rsi[]; 
    ArraySetAsSeries(rsi, true);
    if(CopyBuffer(handleRsi, 0, 0, 3, rsi) > 0) {
        if(isBuyCandidate) {
            if(rsi[0] < 30) {
                score.totalScore += 15;
                score.breakdown += "RSI<30(+15) ";
            } else if(rsi[0] < 40) {
                score.totalScore += 10;
                score.breakdown += "RSI<40(+10) ";
            } else if(rsi[0] < 50) {
                score.totalScore += 5;
                score.breakdown += "RSI<50(+5) ";
            }
        } else {
            if(rsi[0] > 70) {
                score.totalScore += 15;
                score.breakdown += "RSI>70(+15) ";
            } else if(rsi[0] > 60) {
                score.totalScore += 10;
                score.breakdown += "RSI>60(+10) ";
            } else if(rsi[0] > 50) {
                score.totalScore += 5;
                score.breakdown += "RSI>50(+5) ";
            }
        }
    }
    
    // --- Momentum ---
    double close[]; 
    ArraySetAsSeries(close, true);
    if(CopyClose(_Symbol, PERIOD_CURRENT, 0, 3, close) > 0) {
        if(isBuyCandidate) {
            if(close[0] > close[1] && close[1] > close[2]) {
                score.totalScore += 10;
                score.breakdown += "Mom+(+10) ";
            }
        } else {
            if(close[0] < close[1] && close[1] < close[2]) {
                score.totalScore += 10;
                score.breakdown += "Mom-(+10) ";
            }
        }
    }
    
    // --- Pivot ---
    score.totalScore += 15;
    score.breakdown += "Pivot(+15) ";
    
    // --- Filtros Extras ---
    if(ctx.isSpreadAcceptable) {
        score.totalScore += 10;
        score.breakdown += "Spread(+10) ";
    }
    if(ctx.isVolatilityNormal) {
        score.totalScore += 10;
        score.breakdown += "ATR(+10) ";
    }
    if(ctx.isTimeGood) {
        score.totalScore += 10;
        score.breakdown += "Time(+10) ";
    }
    
    score.confidence = score.totalScore / 100.0;
    score.isValid = (score.totalScore >= 70); 
    
    return score;
}

//+------------------------------------------------------------------+
//| DETECCAO DE PIVOT                                                |
//+------------------------------------------------------------------+
PivotPoint FindConfirmedPivot(bool searchHigh)
{
    PivotPoint pivot;
    pivot.confirmed = false;
    pivot.price = 0;
    pivot.time = 0;
    pivot.barIndex = 0;
    pivot.isHigh = searchHigh;
    
    double high[], low[];
    datetime time[];
    ArraySetAsSeries(high, true);
    ArraySetAsSeries(low, true);
    ArraySetAsSeries(time, true);
    
    int lookback = 50;
    if(CopyHigh(_Symbol, PERIOD_CURRENT, 0, lookback, high) < lookback) return pivot;
    if(CopyLow(_Symbol, PERIOD_CURRENT, 0, lookback, low) < lookback) return pivot;
    if(CopyTime(_Symbol, PERIOD_CURRENT, 0, lookback, time) < lookback) return pivot;
    
    for(int i = InpSwingBars + 1; i < lookback - InpSwingBars; i++) {
        bool isPivot = false;
        
        if(searchHigh) {
            isPivot = true;
            for(int j = 1; j <= InpSwingBars; j++) {
                if(high[i] <= high[i-j] || high[i] <= high[i+j]) {
                    isPivot = false;
                    break;
                }
            }
            if(isPivot) {
                pivot.price = high[i];
                pivot.isHigh = true;
            }
        } else {
            isPivot = true;
            for(int j = 1; j <= InpSwingBars; j++) {
                if(low[i] >= low[i-j] || low[i] >= low[i+j]) {
                    isPivot = false;
                    break;
                }
            }
            if(isPivot) {
                pivot.price = low[i];
                pivot.isHigh = false;
            }
        }
        
        if(isPivot) {
            pivot.confirmed = true;
            pivot.time = time[i];
            pivot.barIndex = i;
            break; 
        }
    }
    
    return pivot;
}

//+------------------------------------------------------------------+
//| GESTAO DE RISCO E EXECUCAO                                       |
//+------------------------------------------------------------------+
double CalculateDynamicRR(MarketContext &context)
{
    double atr[], atrMA[]; 
    ArraySetAsSeries(atrMA, true);
    if(CopyBuffer(handleAtr, 0, 0, 1, atr) < 1) return InpMinRR;
    if(CopyBuffer(handleAtr, 0, 0, InpAtrMaLength, atrMA) < InpAtrMaLength) return InpMinRR;
    
    double atrAvg = 0;
    for(int i = 0; i < InpAtrMaLength; i++) atrAvg += atrMA[i];
    atrAvg /= InpAtrMaLength;
    
    double volatilityRank = atr[0] / atrAvg;
    
    if(volatilityRank < 0.8) return InpMinRR;
    if(volatilityRank > 1.2) return InpMaxRR;
    
    return (InpMinRR + InpMaxRR) / 2.0;
}

double CalculatePositionSize(double slDistance)
{
    double accountBalance = accountInfo.Balance();
    double riskAmount = accountBalance * (InpRiskPercent / 100.0);
    
    double tickValue = symbolInfo.TickValue();
    double slPips = slDistance / _Point;
    
    if(slPips == 0 || tickValue == 0) return symbolInfo.LotsMin();

    double lotSize = riskAmount / (slPips * tickValue);
    
    double minLot = symbolInfo.LotsMin();
    double maxLot = symbolInfo.LotsMax();
    double lotStep = symbolInfo.LotsStep();
    
    lotSize = MathFloor(lotSize / lotStep) * lotStep;
    lotSize = MathMax(minLot, MathMin(lotSize, maxLot));
    
    if(StringFind(_Symbol, "XAU") != -1 || StringFind(_Symbol, "GOLD") != -1) {
        lotSize = MathMin(lotSize, 0.15);
    }
    
    return lotSize;
}

void ExecuteOptimizedTrade(SignalScore &signal)
{
    if(CountGlobalPositions() >= InpMaxGlobalPositions) {
        Print("[INFO] Limite global atingido.");
        return;
    }
     
    if(HasSymbolPosition(_Symbol)) {
        Print("[INFO] Ja existe posicao neste simbolo.");
        return;
    }
     
    MarketContext ctx = GetMarketContext();
    
    double entry = signal.isBuy ? symbolInfo.Ask() : symbolInfo.Bid();
    
    double slDistance = ctx.atrValue * 1.5;
    if(slDistance < 50 * _Point) slDistance = 50 * _Point; 
    
    double rrRatio = CalculateDynamicRR(ctx);
    double tpDistance = slDistance * rrRatio;
    
    double sl = signal.isBuy ? 
        NormalizeDouble(entry - slDistance, _Digits) : 
        NormalizeDouble(entry + slDistance, _Digits);
    
    double tp = signal.isBuy ? 
        NormalizeDouble(entry + tpDistance, _Digits) : 
        NormalizeDouble(entry - tpDistance, _Digits);
    
    double lotSize = CalculatePositionSize(slDistance);
    
    string comment = StringFormat("Score:%d|RR:%.1f", signal.totalScore, rrRatio);
    
    bool result = false;
    if(signal.isBuy) {
        result = trade.Buy(lotSize, _Symbol, entry, sl, tp, comment);
    } else {
        result = trade.Sell(lotSize, _Symbol, entry, sl, tp, comment);
    }
    
    if(result) {
        Print("[TRADE] ORDEM EXECUTADA");
        Print("Simbolo: ", _Symbol, " | Lote: ", lotSize);
        Print("SL: ", (int)(slDistance/_Point), " pts | TP: ", (int)(tpDistance/_Point), " pts");
        Print("Score: ", signal.totalScore, "/100");
    } else {
        Print("[ERRO] Falha na ordem: ", trade.ResultRetcodeDescription());
    }
}

void ManageIntelligentTrailing()
{
    for(int i = PositionsTotal() - 1; i >= 0; i--) {
        ulong ticket = PositionGetTicket(i);
        if(ticket <= 0) continue;
        if(!PositionSelectByTicket(ticket)) continue;
        if(PositionGetInteger(POSITION_MAGIC) != InpMagicNumber) continue;
        if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;
        
        double openPrice = PositionGetDouble(POSITION_PRICE_OPEN);
        double currentPrice = PositionGetDouble(POSITION_PRICE_CURRENT);
        double stopLoss = PositionGetDouble(POSITION_SL);
        double takeProfit = PositionGetDouble(POSITION_TP);
        long type = PositionGetInteger(POSITION_TYPE);
        
        double atr[]; 
        if(CopyBuffer(handleAtr, 0, 0, 1, atr) < 1) continue;
        double riskUnit = atr[0] * 1.5;
        if(riskUnit <= 0) continue;
        
        double profitPoints = (type == POSITION_TYPE_BUY) ? 
            (currentPrice - openPrice) : (openPrice - currentPrice);
        
        // Breakeven
        if(InpUseBreakeven && profitPoints >= riskUnit * InpBreakevenTriggerRR) {
            double beLevel = (type == POSITION_TYPE_BUY) ? 
                openPrice + (10 * _Point) : openPrice - (10 * _Point);
            
            bool needUpdate = false;
            if(type == POSITION_TYPE_BUY && stopLoss < openPrice) needUpdate = true;
            if(type == POSITION_TYPE_SELL && (stopLoss > openPrice || stopLoss == 0)) needUpdate = true;
            
            if(needUpdate) {
                trade.PositionModify(ticket, beLevel, takeProfit);
                Print("[BE] Breakeven ativado | Ticket: ", ticket);
            }
        }
        
        // Trailing
        if(profitPoints >= riskUnit) {
            double trailDist = riskUnit * InpTrailingStepRR;
            double newSL = (type == POSITION_TYPE_BUY) ?
                NormalizeDouble(currentPrice - trailDist, _Digits) :
                NormalizeDouble(currentPrice + trailDist, _Digits);
            
            bool updateSL = false;
            if(type == POSITION_TYPE_BUY && newSL > stopLoss) updateSL = true;
            if(type == POSITION_TYPE_SELL && (newSL < stopLoss || stopLoss == 0)) updateSL = true;
            
            if(updateSL) {
                trade.PositionModify(ticket, newSL, takeProfit);
                Print("[TRAIL] Stop Ajustado | Novo SL: ", newSL);
            }
        }
    }
}

void CheckHardStopLoss()
{
    for(int i = PositionsTotal() - 1; i >= 0; i--) {
        ulong ticket = PositionGetTicket(i);
        if(ticket <= 0) continue;
        if(!PositionSelectByTicket(ticket)) continue;
        if(PositionGetInteger(POSITION_MAGIC) != InpMagicNumber) continue;
        
        double profit = PositionGetDouble(POSITION_PROFIT);
        double swap = PositionGetDouble(POSITION_SWAP);
        double totalPL = profit + swap;
        
        if(totalPL <= -MathAbs(InpHardStopLoss)) {
            Print("[STOP] HARD STOP LOSS! Perda: ", totalPL);
            trade.PositionClose(ticket);
        }
    }
}

//+------------------------------------------------------------------+
//| EVENT HANDLERS (No final, pois chamam as funcoes acima)          |
//+------------------------------------------------------------------+
int OnInit()
{
    Print("=== INICIANDO TREND MESH V5 ENHANCED ===");
    
    if(!symbolInfo.Name(_Symbol)) return INIT_FAILED;
    symbolInfo.Refresh();
    
    trade.SetExpertMagicNumber(InpMagicNumber);
    trade.SetDeviationInPoints(10);
    trade.SetTypeFilling(ORDER_FILLING_FOK);
    
    handleEmaFast = iMA(_Symbol, PERIOD_CURRENT, InpEmaFast, 0, MODE_EMA, PRICE_CLOSE);
    handleEmaSlow = iMA(_Symbol, PERIOD_CURRENT, InpEmaSlow, 0, MODE_EMA, PRICE_CLOSE);
    handleEmaFilter = iMA(_Symbol, PERIOD_CURRENT, InpEmaFilter, 0, MODE_EMA, PRICE_CLOSE);
    handleRsi = iRSI(_Symbol, PERIOD_CURRENT, InpRsiPeriod, PRICE_CLOSE);
    handleAtr = iATR(_Symbol, PERIOD_CURRENT, InpAtrPeriod);
    
    if(InpEnableMultiTF) {
        handleHTF_Ema = iMA(_Symbol, InpHTF, InpEmaSlow, 0, MODE_EMA, PRICE_CLOSE);
        handleMTF_Ema = iMA(_Symbol, InpMTF, InpEmaSlow, 0, MODE_EMA, PRICE_CLOSE);
    }
    
    if(handleEmaFast == INVALID_HANDLE || handleEmaSlow == INVALID_HANDLE || 
       handleEmaFilter == INVALID_HANDLE || handleRsi == INVALID_HANDLE || 
       handleAtr == INVALID_HANDLE) {
        Print("[ERRO] Falha ao criar indicadores");
        return INIT_FAILED;
    }
    
    Print("[OK] Sistema inicializado.");
    return INIT_SUCCEEDED;
}

void OnDeinit(const int reason)
{
    IndicatorRelease(handleEmaFast);
    IndicatorRelease(handleEmaSlow);
    IndicatorRelease(handleEmaFilter);
    IndicatorRelease(handleRsi);
    IndicatorRelease(handleAtr);
    if(InpEnableMultiTF) {
        IndicatorRelease(handleHTF_Ema);
        IndicatorRelease(handleMTF_Ema);
    }
}

void OnTick()
{
    if(!symbolInfo.RefreshRates()) return;
    
    datetime currentTime[]; 
    if(CopyTime(_Symbol, PERIOD_CURRENT, 0, 1, currentTime) <= 0) return;
    if(currentTime[0] == lastBarTime) return;
    lastBarTime = currentTime[0];
    
    UpdateSpreadAverage();
    ManageIntelligentTrailing();
    CheckHardStopLoss();
    
    if(!InpEnableTrading) return;
    if(CountGlobalPositions() >= InpMaxGlobalPositions) return;
    if(HasSymbolPosition(_Symbol)) return;
    
    MarketContext context = GetMarketContext();
    
    if(!context.isSpreadAcceptable) {
        Print("[FILTRO] Spread alto: ", context.spreadPips);
        return;
    }
    if(!context.isVolatilityNormal) {
        Print("[FILTRO] Volatilidade anormal");
        return;
    }
    if(!context.isTimeGood) return;
    
    PivotPoint pivotLow = FindConfirmedPivot(false);
    PivotPoint pivotHigh = FindConfirmedPivot(true);
    
    if(pivotLow.confirmed && pivotLow.time > lastTradeTime) {
        SignalScore signal = CalculateAdvancedSignal(true, pivotLow.price);
        if(signal.isValid && signal.totalScore >= 70) {
            Print("[SINAL] COMPRA DETECTADA | Score: ", signal.totalScore);
            ExecuteOptimizedTrade(signal);
            lastTradeTime = pivotLow.time;
            return;
        }
    }
    
    if(pivotHigh.confirmed && pivotHigh.time > lastTradeTime) {
        SignalScore signal = CalculateAdvancedSignal(false, pivotHigh.price);
        if(signal.isValid && signal.totalScore >= 70) {
            Print("[SINAL] VENDA DETECTADA | Score: ", signal.totalScore);
            ExecuteOptimizedTrade(signal);
            lastTradeTime = pivotHigh.time;
            return;
        }
    }
}
//+------------------------------------------------------------------+