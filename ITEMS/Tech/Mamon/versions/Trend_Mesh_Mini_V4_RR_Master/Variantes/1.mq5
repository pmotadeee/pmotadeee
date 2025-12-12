//+------------------------------------------------------------------+
//|                           Trend_Mesh_Mini_V4_RR_Master.mq5       |
//|                        Copyright 2025, Atous Technology Systems  |
//|          Features: Dynamic R:R (1:2 to 1:5) + Smart Trailing     |
//+------------------------------------------------------------------+
#property copyright "Copyright 2025, Atous Technology Systems"
#property version   "4.00"
#property description "Trend Mesh Mini: Risk:Reward Math & Trailing"

#include <Trade\Trade.mqh>
#include <Trade\AccountInfo.mqh>
#include <Trade\SymbolInfo.mqh>
#include <Trade\PositionInfo.mqh>

//--- INPUTS ---
input group "=== GESTÃO DE RISCO:RETORNO (MATH) ==="
input double InpBaseRiskReward = 2.0; // R:R Base (Mínimo 1:2)
input double InpSlAtrMult = 1.0;      // Multiplicador ATR para Stop Loss (Reduzido para trades rápidos)

input group "=== CONFIGURAÇÃO MACRO (MESH / FIBO) ==="
input int InpLookBack = 200;          // Reduzido para resposta mais rápida
input int InpConnectPast = 2; 
input int InpMinBarsDist = 3;         // Reduzido para mais sensibilidade
input bool InpShowFibo = false;       // Desativado para performance

input group "=== SENSIBILIDADE (ZIGZAG) ==="
input int InpZigDepth = 8;            // Reduzido para mais pontos
input int InpZigDev = 3;              // Reduzido para mais sensibilidade
input int InpZigBack = 2;             // Reduzido

input group "=== CONFIGURAÇÃO MICRO (SCALPING) ==="
input int InpEmaFast = 3;             // MAIS RÁPIDO
input int InpEmaSlow = 8;             // MAIS RÁPIDO
input int InpRsiPeriod = 7;           // MAIS RÁPIDO
input int InpAtrPeriod = 7;           // MAIS RÁPIDO

input group "=== GESTÃO DE CAPITAL (MINI) ==="
input bool InpEnableTrading = true; 
input int MaxOpenPositions = 10;      // Reduzido para gerenciamento melhor
input double HardStopLoss = 30.0;     // Reduzido para trades rápidos
input double LowConfidenceLot = 0.02; // Reduzido
input double MediumConfidenceLot = 0.10; // Reduzido
input double HighConfidenceLot = 0.20;   // Reduzido

input group "=== TRAILING STOP INTELIGENTE ==="
input bool   UseBreakeven = true;        // Mover para 0x0 rápido?
input double BreakevenTriggerRR = 0.3;   // MAIS RÁPIDO (0.3x Risco)
input double TrailingStepRR = 0.2;       // MAIS RÁPIDO (0.2x Risco)
input double MinTrailingDistance = 5.0;  // Distância mínima em pontos

input group "=== FILTROS DE ENTRADA ==="
input int MinBarsBetweenTrades = 1;      // Mínimo de barras entre trades
input double MinConfidence = 0.35;       // Confiança mínima reduzida

input group "=== VISUAL ==="
input color InpColorRes = clrSlateGray; 
input color InpColorSup = clrTeal; 

//--- ESTRUTURAS ---
struct PivotPoint {
    double price;
    datetime time;
    int barIndex;
    bool isHigh;
};

struct SignalScore {
    bool isValid;
    bool isBuy;
    double confidence;
    double price;
    datetime time;
    string reason;
};

//--- GLOBAIS ---
int handleZigZag, handleEmaFast, handleEmaSlow, handleRsi, handleAtr;
string objPrefix;
datetime lastBarTime = 0;
ulong currentMagicNumber = 888999; 

//--- Classes
CTrade trade;
CSymbolInfo symbolInfo;
CAccountInfo accountInfo;
CPositionInfo positionInfo;

datetime lastTradeTime = 0;
int lastTradeBar = 0;
int consecutiveLosses = 0;  // Contador de perdas consecutivas

//--- Para trailing stop agressivo
struct TrailingInfo {
    ulong ticket;
    double bestPrice;
    double initialSL;
    bool breakevenTriggered;
};
TrailingInfo trailingList[100];
int trailingCount = 0;

//--- Forward Declarations
void UpdateMacroAnalysis();
void CheckHardStopLoss();
void ManageAggressiveTrailing();
void CheckEntrySignalsWithScore();
int CountGlobalPositions();
bool IsSymbolBusy();
void ExecuteTrade(bool isBuy, double lotSize, double confidence);
void DrawMesh(PivotPoint &pivots[], int total, color clr);
void DrawPivots(PivotPoint &pivots[], int total, bool isHigh);
void DrawAutoFibo(const double &high[], const double &low[], const datetime &time[]);
void CreateHLine(string name, double price, color clr);
void DrawSignalArrow(bool isBuy, double price, datetime time);
double GetLotSizeByConfidence(double confidence);
double GetRiskRewardMultiplier(double confidence);
void UpdateTrailingList();
void AddToTrailingList(ulong ticket, double entry, double sl);
void RemoveFromTrailingList(ulong ticket);

//+------------------------------------------------------------------+
//| OnInit                                                           |
//+------------------------------------------------------------------+
int OnInit()
{
    Print("=== INICIALIZANDO TREND MESH V4 RR MASTER (MODO RÁPIDO) ===");
   
    if(!symbolInfo.Name(_Symbol)) return INIT_FAILED;
    symbolInfo.Refresh();
    objPrefix = "ATM_MINI_" + _Symbol;
    currentMagicNumber = 888999; 
    
    trade.SetExpertMagicNumber(currentMagicNumber);
    trade.SetDeviationInPoints(5);  // Reduzido para execução mais rápida
    trade.SetTypeFilling(ORDER_FILLING_FOK);
    
    MathSrand(GetTickCount());
   
    // Indicadores
    handleZigZag = iCustom(_Symbol, _Period, "Examples\\ZigZag", InpZigDepth, InpZigDev, InpZigBack);
    if(handleZigZag == INVALID_HANDLE) {
        handleZigZag = iCustom(_Symbol, _Period, "ZigZag", InpZigDepth, InpZigDev, InpZigBack);
        if(handleZigZag == INVALID_HANDLE) {
             Print("ERRO: ZigZag não encontrado.");
             return INIT_FAILED;
        }
    }
   
    handleEmaFast = iMA(_Symbol, _Period, InpEmaFast, 0, MODE_EMA, PRICE_CLOSE);
    handleEmaSlow = iMA(_Symbol, _Period, InpEmaSlow, 0, MODE_EMA, PRICE_CLOSE);
    handleRsi = iRSI(_Symbol, _Period, InpRsiPeriod, PRICE_CLOSE);
    handleAtr = iATR(_Symbol, _Period, InpAtrPeriod);
   
    if(handleEmaFast == INVALID_HANDLE || handleEmaSlow == INVALID_HANDLE || handleRsi == INVALID_HANDLE || handleAtr == INVALID_HANDLE) {
        Print("ERRO CRÍTICO: Falha ao criar handles.");
        return INIT_FAILED;
    }
   
    return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| OnDeinit                                                         |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
    ObjectsDeleteAll(0, objPrefix);
    IndicatorRelease(handleZigZag);
    IndicatorRelease(handleEmaFast);
    IndicatorRelease(handleEmaSlow);
    IndicatorRelease(handleRsi);
    IndicatorRelease(handleAtr);
}

//+------------------------------------------------------------------+
//| OnTick                                                           |
//+------------------------------------------------------------------+
void OnTick()
{
    if(!symbolInfo.RefreshRates()) return;
   
    // CORREÇÃO: Adicionar filtro de tempo entre trades
    if(TimeCurrent() - lastTradeTime < 30) return; // Aguardar 30 segundos entre trades
   
    // Macro (atualiza apenas a cada barra)
    datetime currentTime[1];
    if(CopyTime(_Symbol, _Period, 0, 1, currentTime) > 0) {
        if(currentTime[0] != lastBarTime) {
            lastBarTime = currentTime[0];
            UpdateMacroAnalysis();
        }
    }
   
    CheckHardStopLoss();
    ManageAggressiveTrailing(); // AGORA CHAMADO A CADA TICK
   
    // CORREÇÃO: Parar após 3 perdas consecutivas
    if(consecutiveLosses >= 3) {
        Print("ALERTA: 3 perdas consecutivas detectadas. Trades pausados por 5 minutos.");
        if(TimeCurrent() - lastTradeTime < 300) return; // Pausar por 5 minutos
        consecutiveLosses = 0; // Resetar após pausa
    }
   
    if(IsSymbolBusy()) return;
    if(CountGlobalPositions() >= MaxOpenPositions) return;

    CheckEntrySignalsWithScore();
}

//+------------------------------------------------------------------+
//| CÁLCULO DE LOTE (COM EXCEÇÃO PARA OURO)                          |
//+------------------------------------------------------------------+
double GetLotSizeByConfidence(double confidence)
{
    double lot = 0.0;
    
    if(confidence >= 0.60) lot = HighConfidenceLot;
    else if(confidence >= 0.40) lot = MediumConfidenceLot;
    else lot = LowConfidenceLot;
    
    // CORREÇÃO: Reduzir lotes após perdas consecutivas
    if(consecutiveLosses > 0) {
        lot = lot * (1.0 - (consecutiveLosses * 0.2)); // Reduzir 20% por perda consecutiva
        if(lot < LowConfidenceLot * 0.1) lot = LowConfidenceLot * 0.1; // Lote mínimo
    }
    
    // Regra Ouro
    if(StringFind(_Symbol, "XAU") != -1 || StringFind(_Symbol, "GOLD") != -1) {
        if(lot > 0.10) lot = 0.10;
    }
    
    return lot;
}

//+------------------------------------------------------------------+
//| DEFINIÇÃO DE RISCO:RETORNO BASEADA EM SCORE                      |
//+------------------------------------------------------------------+
double GetRiskRewardMultiplier(double confidence)
{
    // CORREÇÃO: Aumentar R:R para compensar frequência reduzida
    if(confidence >= 0.70) return 3.0; // R:R 1:3
    else if(confidence >= 0.50) return 2.0; // R:R 1:2
    else return 1.5; // R:R 1:1.5
}

//+------------------------------------------------------------------+
//| Executar Trade com Validação de Stops                            |
//+------------------------------------------------------------------+
void ExecuteTrade(bool isBuy, double lotSize, double confidence)
{
    double ask = symbolInfo.Ask();
    double bid = symbolInfo.Bid();
    double entry = isBuy ? ask : bid;
    
    // Obter o Stop Level e Freeze Level do símbolo
    int stopLevel = (int)symbolInfo.StopsLevel();
    int freezeLevel = (int)symbolInfo.FreezeLevel();
    
    // 1. Obter Volatilidade (ATR) para definir SL Técnico
    double atrVal[1];
    if(CopyBuffer(handleAtr, 0, 0, 1, atrVal) < 1) return;
    double volatility = atrVal[0];
    
    // 2. Calcular Distância do SL (Risco)
    double slDistance = volatility * InpSlAtrMult;
    
    // Garantir distância mínima para evitar "invalid stops"
    double minSLDistance = MathMax(100 * _Point, stopLevel * _Point);
    if(slDistance < minSLDistance) slDistance = minSLDistance;
    
    double maxSLDistance = 500 * _Point;
    if(slDistance > maxSLDistance) slDistance = maxSLDistance;

    // 3. Calcular Distância do TP (Retorno) baseado no R:R
    double rrRatio = GetRiskRewardMultiplier(confidence);
    double tpDistance = slDistance * rrRatio;
    
    // 4. Definir Preços com validação
    double sl = 0, tp = 0;
    
    if(isBuy) {
        sl = NormalizeDouble(bid - slDistance, _Digits);
        tp = NormalizeDouble(ask + tpDistance, _Digits);
        
        double minSl = bid - MathMax(slDistance, stopLevel * _Point);
        if(sl > minSl) sl = minSl;
        
        double minTp = ask + MathMax(tpDistance, stopLevel * _Point);
        if(tp < minTp) tp = minTp;
    } else {
        sl = NormalizeDouble(ask + slDistance, _Digits);
        tp = NormalizeDouble(bid - tpDistance, _Digits);
        
        double minSl = ask + MathMax(slDistance, stopLevel * _Point);
        if(sl < minSl) sl = minSl;
        
        double minTp = bid - MathMax(tpDistance, stopLevel * _Point);
        if(tp > minTp) tp = minTp;
    }
    
    // Verificação final: se o SL ou TP estiverem muito próximos
    if(isBuy) {
        if(sl >= bid - freezeLevel * _Point) {
            sl = bid - MathMax(slDistance, (freezeLevel + 1) * _Point);
        }
        if(tp <= ask + freezeLevel * _Point) {
            tp = ask + MathMax(tpDistance, (freezeLevel + 1) * _Point);
        }
    } else {
        if(sl <= ask + freezeLevel * _Point) {
            sl = ask + MathMax(slDistance, (freezeLevel + 1) * _Point);
        }
        if(tp >= bid - freezeLevel * _Point) {
            tp = bid - MathMax(tpDistance, (freezeLevel + 1) * _Point);
        }
    }
    
    string comment = StringFormat("FAST_1:%.1f_C%.0f", rrRatio, confidence * 100);
   
    Print("Tentando abrir trade: ", isBuy ? "COMPRA" : "VENDA",
          " | Entry: ", entry, 
          " | SL: ", sl, 
          " | TP: ", tp,
          " | Distância SL: ", (MathAbs(entry - sl)/_Point), " pontos",
          " | Distância TP: ", (MathAbs(entry - tp)/_Point), " pontos");
   
    bool res = false;
    if(isBuy) res = trade.Buy(lotSize, _Symbol, entry, sl, tp, comment);
    else res = trade.Sell(lotSize, _Symbol, entry, sl, tp, comment);
    
    if(res) {
        ulong ticket = trade.ResultOrder();
        AddToTrailingList(ticket, entry, sl);
        
        Print("TRADE ABERTO | ", _Symbol, 
              " | Direção: ", isBuy ? "COMPRA" : "VENDA",
              " | Entrada: ", DoubleToString(entry, _Digits),
              " | SL: ", DoubleToString(sl, _Digits),
              " | TP: ", DoubleToString(tp, _Digits),
              " | R:R: 1:", DoubleToString(rrRatio, 1));
              
        lastTradeTime = TimeCurrent();
        lastTradeBar = Bars(_Symbol, _Period);
        
        // CORREÇÃO: Aguardar após trade para evitar execução excessiva
        Sleep(1000);
    } else {
        Print("Erro ao enviar ordem: ", trade.ResultRetcodeDescription());
        Print("Código do erro: ", trade.ResultRetcode());
    }
}

//+------------------------------------------------------------------+
//| Gerenciar Trailing Stop Agressivo (CHAMADO A CADA TICK)          |
//+------------------------------------------------------------------+
void ManageAggressiveTrailing()
{
    UpdateTrailingList();
    
    for(int i = trailingCount - 1; i >= 0; i--) {
        ulong ticket = trailingList[i].ticket;
        
        if(!PositionSelectByTicket(ticket)) {
            RemoveFromTrailingList(ticket);
            continue;
        }
        
        double currentPrice = PositionGetDouble(POSITION_PRICE_CURRENT);
        double stopLoss = PositionGetDouble(POSITION_SL);
        double takeProfit = PositionGetDouble(POSITION_TP);
        long type = PositionGetInteger(POSITION_TYPE);
        double openPrice = PositionGetDouble(POSITION_PRICE_OPEN);
        
        if(type == POSITION_TYPE_BUY) {
            if(currentPrice > trailingList[i].bestPrice) {
                trailingList[i].bestPrice = currentPrice;
            }
        } else {
            if(currentPrice < trailingList[i].bestPrice) {
                trailingList[i].bestPrice = currentPrice;
            }
        }
        
        double profitPoints = 0;
        if(type == POSITION_TYPE_BUY) {
            profitPoints = currentPrice - openPrice;
        } else {
            profitPoints = openPrice - currentPrice;
        }
        
        double initialSLDistance = MathAbs(openPrice - trailingList[i].initialSL);
        
        // --- FASE 1: BREAKEVEN RÁPIDO ---
        if(UseBreakeven && !trailingList[i].breakevenTriggered && 
           profitPoints >= (initialSLDistance * BreakevenTriggerRR)) {
            
            double newSL = 0;
            if(type == POSITION_TYPE_BUY) {
                newSL = openPrice + (symbolInfo.Spread() * _Point);
                if(newSL > stopLoss || stopLoss == 0) {
                    if(trade.PositionModify(ticket, newSL, takeProfit)) {
                        trailingList[i].breakevenTriggered = true;
                        Print("BREAKEVEN ATIVADO | Ticket: ", ticket, " | Novo SL: ", newSL);
                    }
                }
            } else {
                newSL = openPrice - (symbolInfo.Spread() * _Point);
                if(newSL < stopLoss || stopLoss == 0) {
                    if(trade.PositionModify(ticket, newSL, takeProfit)) {
                        trailingList[i].breakevenTriggered = true;
                        Print("BREAKEVEN ATIVADO | Ticket: ", ticket, " | Novo SL: ", newSL);
                    }
                }
            }
        }
        
        // --- FASE 2: TRAILING DINÂMICO ---
        if(profitPoints >= (initialSLDistance * TrailingStepRR)) {
            double newSL = 0;
            bool shouldUpdate = false;
            
            double trailingDistance = initialSLDistance * 0.5;
            
            if(trailingDistance < (MinTrailingDistance * _Point)) {
                trailingDistance = MinTrailingDistance * _Point;
            }
            
            if(type == POSITION_TYPE_BUY) {
                newSL = NormalizeDouble(currentPrice - trailingDistance, _Digits);
                if((newSL > stopLoss && (newSL - stopLoss) >= (5 * _Point)) || stopLoss == 0) {
                    shouldUpdate = true;
                }
            } else {
                newSL = NormalizeDouble(currentPrice + trailingDistance, _Digits);
                if(((newSL < stopLoss && (stopLoss - newSL) >= (5 * _Point)) || stopLoss == 0)) {
                    shouldUpdate = true;
                }
            }
            
            if(shouldUpdate) {
                if(trade.PositionModify(ticket, newSL, takeProfit)) {
                    Print("TRAILING ATUALIZADO | Ticket: ", ticket, 
                          " | Preço: ", currentPrice, 
                          " | Novo SL: ", newSL,
                          " | Lucro: ", DoubleToString(profitPoints/_Point, 0), "pts");
                }
            }
        }
    }
}

//+------------------------------------------------------------------+
//| Atualizar Lista de Trailing                                      |
//+------------------------------------------------------------------+
void UpdateTrailingList()
{
    for(int i = trailingCount - 1; i >= 0; i--) {
        if(!PositionSelectByTicket(trailingList[i].ticket)) {
            RemoveFromTrailingList(trailingList[i].ticket);
        }
    }
    
    for(int i = PositionsTotal() - 1; i >= 0; i--) {
        ulong ticket = PositionGetTicket(i);
        if(ticket > 0 && PositionSelectByTicket(ticket)) {
            if(PositionGetInteger(POSITION_MAGIC) == currentMagicNumber && 
               PositionGetString(POSITION_SYMBOL) == _Symbol) {
                
                bool found = false;
                for(int j = 0; j < trailingCount; j++) {
                    if(trailingList[j].ticket == ticket) {
                        found = true;
                        break;
                    }
                }
                
                if(!found) {
                    double entry = PositionGetDouble(POSITION_PRICE_OPEN);
                    double sl = PositionGetDouble(POSITION_SL);
                    AddToTrailingList(ticket, entry, sl);
                }
            }
        }
    }
}

void AddToTrailingList(ulong ticket, double entry, double sl)
{
    if(trailingCount >= 100) return;
    
    trailingList[trailingCount].ticket = ticket;
    trailingList[trailingCount].bestPrice = entry;
    trailingList[trailingCount].initialSL = sl;
    trailingList[trailingCount].breakevenTriggered = false;
    trailingCount++;
}

void RemoveFromTrailingList(ulong ticket)
{
    for(int i = 0; i < trailingCount; i++) {
        if(trailingList[i].ticket == ticket) {
            for(int j = i; j < trailingCount - 1; j++) {
                trailingList[j] = trailingList[j + 1];
            }
            trailingCount--;
            break;
        }
    }
}

//+------------------------------------------------------------------+
//| AUXILIARES DE LÓGICA E CONTAGEM                                  |
//+------------------------------------------------------------------+
bool IsSymbolBusy()
{
    int currentBar = Bars(_Symbol, _Period);
    if((currentBar - lastTradeBar) < MinBarsBetweenTrades) {
        return true;
    }
    
    for(int i = PositionsTotal() - 1; i >= 0; i--) {
        if(PositionGetTicket(i) > 0) {
            if(PositionGetInteger(POSITION_MAGIC) == currentMagicNumber && 
               PositionGetString(POSITION_SYMBOL) == _Symbol) return true;
        }
    }
    for(int i = OrdersTotal() - 1; i >= 0; i--) {
        if(OrderGetTicket(i) > 0) {
            if(OrderGetInteger(ORDER_MAGIC) == currentMagicNumber && 
               OrderGetString(ORDER_SYMBOL) == _Symbol) return true;
        }
    }
    return false;
}

int CountGlobalPositions()
{
    int count = 0;
    for(int i = PositionsTotal() - 1; i >= 0; i--) {
        if(PositionGetTicket(i) > 0) {
            if(PositionGetInteger(POSITION_MAGIC) == currentMagicNumber) count++;
        }
    }
    return count;
}

void CheckHardStopLoss()
{
    for(int i = PositionsTotal() - 1; i >= 0; i--) {
        ulong ticket = PositionGetTicket(i);
        if(ticket > 0 && PositionSelectByTicket(ticket)) {
            if(PositionGetInteger(POSITION_MAGIC) == currentMagicNumber) {
                double profit = PositionGetDouble(POSITION_PROFIT);
                double swap = PositionGetDouble(POSITION_SWAP);
                double commission = PositionGetDouble(POSITION_COMMISSION);
                double totalPL = profit + swap + commission;
                
                if(totalPL <= -MathAbs(HardStopLoss)) {
                    Print("HARD STOP LOSS! Ticket: ", ticket, " | Perda: ", totalPL);
                    trade.PositionClose(ticket);
                    RemoveFromTrailingList(ticket);
                    
                    // CORREÇÃO: Contar perda consecutiva
                    consecutiveLosses++;
                    Print("Perda consecutiva #", consecutiveLosses);
                }
            }
        }
    }
}

//+------------------------------------------------------------------+
//| SINAIS E SCORE (OTIMIZADO PARA VELOCIDADE)                       |
//+------------------------------------------------------------------+
SignalScore CalculateSignalScore(bool isBuySignal, double signalPrice)
{
    SignalScore score;
    score.isValid = false;
    score.isBuy = isBuySignal;
    score.confidence = 0.0;
    score.price = signalPrice;
    score.reason = "";
   
    double emaFast[2], emaSlow[2], rsi[2];
    ArraySetAsSeries(emaFast, true);
    ArraySetAsSeries(emaSlow, true);
    ArraySetAsSeries(rsi, true);
   
    if(CopyBuffer(handleEmaFast, 0, 0, 2, emaFast) < 2) return score;
    if(CopyBuffer(handleEmaSlow, 0, 0, 2, emaSlow) < 2) return score;
    if(CopyBuffer(handleRsi, 0, 0, 2, rsi) < 2) return score;
   
    double points = 0.0;
   
    // 1. EMAs (40%) - Mais peso para trades rápidos
    if(isBuySignal) { 
        if(emaFast[0] > emaSlow[0]) points += 0.40; 
    } else { 
        if(emaFast[0] < emaSlow[0]) points += 0.40; 
    }
   
    // 2. RSI (30%) - Limites mais apertados
    if(isBuySignal) { 
        if(rsi[0] < 35) points += 0.30; 
        else if(rsi[0] < 45) points += 0.15; 
    } else { 
        if(rsi[0] > 65) points += 0.30; 
        else if(rsi[0] > 55) points += 0.15; 
    }
   
    // 3. Momentum (30%)
    if(isBuySignal) { 
        if(emaFast[0] > emaFast[1]) points += 0.30; 
    } else { 
        if(emaFast[0] < emaFast[1]) points += 0.30; 
    }
   
    score.confidence = points;
    
    // CORREÇÃO: Aumentar confiança mínima após perdas consecutivas
    double minConfidenceRequired = MinConfidence;
    if(consecutiveLosses > 0) {
        minConfidenceRequired += (consecutiveLosses * 0.05); // Aumentar 5% por perda
        if(minConfidenceRequired > 0.70) minConfidenceRequired = 0.70;
    }
    
    score.isValid = (points >= minConfidenceRequired); 
   
    return score;
}

void CheckEntrySignalsWithScore()
{
    double zigZagBuffer[], high[], low[];
    datetime time[];
    ArraySetAsSeries(zigZagBuffer, true);
    ArraySetAsSeries(high, true);
    ArraySetAsSeries(low, true);
    ArraySetAsSeries(time, true);
   
    int checkRange = 5;
    if(CopyBuffer(handleZigZag, 0, 0, checkRange, zigZagBuffer) < checkRange) return;
    if(CopyHigh(_Symbol, _Period, 0, checkRange, high) < checkRange) return;
    if(CopyLow(_Symbol, _Period, 0, checkRange, low) < checkRange) return;
    if(CopyTime(_Symbol, _Period, 0, checkRange, time) < checkRange) return;
   
    for(int i = 1; i < checkRange; i++) {
        double zVal = zigZagBuffer[i];
        if(zVal != 0.0 && zVal != EMPTY_VALUE) {
           
            bool isHigh = (MathAbs(high[i] - zVal) < (2 * _Point));
            bool isLow = (MathAbs(low[i] - zVal) < (2 * _Point));
           
            if(isHigh || isLow) {
                bool isBuySignal = isLow;
                SignalScore score = CalculateSignalScore(isBuySignal, zVal);
                
                if(score.isValid) {
                    if(IsSymbolBusy()) return; 
                    if(CountGlobalPositions() >= MaxOpenPositions) return; 

                    double lotSize = GetLotSizeByConfidence(score.confidence);
                    
                    Print("SINAL DETECTADO: ", _Symbol, 
                          " | Conf: ", DoubleToString(score.confidence, 2),
                          " | Direção: ", isBuySignal ? "COMPRA" : "VENDA",
                          " | Lote: ", lotSize,
                          " | Perdas consecutivas: ", consecutiveLosses);
                    
                    if(InpEnableTrading) {
                        ExecuteTrade(isBuySignal, lotSize, score.confidence);
                    }
                    
                    break;
                }
            }
        }
    }
}

//+------------------------------------------------------------------+
//| VISUALIZAÇÃO (SIMPLIFICADA)                                      |
//+------------------------------------------------------------------+
void UpdateMacroAnalysis() {
    double zigZagBuffer[], high[], low[];
    datetime time[];
    ArraySetAsSeries(zigZagBuffer, true); ArraySetAsSeries(high, true); ArraySetAsSeries(low, true); ArraySetAsSeries(time, true);
    if(CopyBuffer(handleZigZag, 0, 0, InpLookBack, zigZagBuffer) < 0) return;
    if(CopyHigh(_Symbol, _Period, 0, InpLookBack, high) < 0) return;
    if(CopyLow(_Symbol, _Period, 0, InpLookBack, low) < 0) return;
    if(CopyTime(_Symbol, _Period, 0, InpLookBack, time) < 0) return;
    
    ObjectsDeleteAll(0, objPrefix + "Ln_"); 
    ObjectsDeleteAll(0, objPrefix + "Piv_");
    
    PivotPoint highs[], lows[]; 
    ArrayResize(highs, InpLookBack); 
    ArrayResize(lows, InpLookBack);
    int hCount = 0, lCount = 0;
    
    for(int i = 1; i < InpLookBack; i++) {
        double zVal = zigZagBuffer[i];
        if(zVal != 0.0 && zVal != EMPTY_VALUE) {
            if(MathAbs(high[i] - zVal) < (2 * _Point)) { 
                highs[hCount].price = zVal; 
                highs[hCount].time = time[i]; 
                highs[hCount].barIndex = i; 
                highs[hCount].isHigh = true; 
                hCount++; 
            } 
            else if(MathAbs(low[i] - zVal) < (2 * _Point)) { 
                lows[lCount].price = zVal; 
                lows[lCount].time = time[i]; 
                lows[lCount].barIndex = i; 
                lows[lCount].isHigh = false; 
                lCount++; 
            }
        }
    }
    
    DrawPivots(highs, hCount, true); 
    DrawPivots(lows, lCount, false);
}

void DrawPivots(PivotPoint &pivots[], int total, bool isHigh) {
    for(int i = 0; i < total; i++) {
        string name = objPrefix + "Piv_" + (isHigh ? "H_" : "L_") + IntegerToString(pivots[i].barIndex);
        if(ObjectCreate(0, name, OBJ_ARROW, 0, pivots[i].time, pivots[i].price)) {
            ObjectSetInteger(0, name, OBJPROP_ARROWCODE, isHigh ? 234 : 233);
            ObjectSetInteger(0, name, OBJPROP_COLOR, isHigh ? clrRed : clrBlue);
            ObjectSetInteger(0, name, OBJPROP_WIDTH, 2); 
            ObjectSetInteger(0, name, OBJPROP_ANCHOR, isHigh ? ANCHOR_BOTTOM : ANCHOR_TOP);
            ObjectSetInteger(0, name, OBJPROP_HIDDEN, true);
        }
    }
}
//+------------------------------------------------------------------+