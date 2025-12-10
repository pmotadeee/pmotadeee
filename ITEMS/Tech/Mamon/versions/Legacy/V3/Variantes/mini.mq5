//+------------------------------------------------------------------+
//|                               Trend_Mesh_Mini_V3_GoldFix.mq5     |
//|                        Copyright 2025, Atous Technology Systems  |
//|               Mini Version: Max 3 Orders Global + Gold Limit Fix |
//+------------------------------------------------------------------+
#property copyright "Copyright 2025, Atous Technology Systems"
#property version   "3.30"
#property description "Trend Mesh Mini: Gold Limit (0.15 Max) + Hard Limits"

//--- Includes
#include <Trade\Trade.mqh>
#include <Trade\AccountInfo.mqh>
#include <Trade\SymbolInfo.mqh>
#include <Trade\PositionInfo.mqh>

//--- INPUTS ---
input group "=== CONFIGURAÇÃO MACRO (MESH / FIBO) ==="
input int InpLookBack = 500; // Histórico de Velas para Mesh
input int InpConnectPast = 3; // Conexões por Pivô
input int InpMinBarsDist = 5; // Distância Mínima entre Pivôs
input bool InpShowFibo = true; // Mostrar Zona Fibo?

input group "=== SENSIBILIDADE (ZIGZAG) ==="
input int InpZigDepth = 12; // Depth
input int InpZigDev = 5; // Deviation
input int InpZigBack = 3; // Backstep

input group "=== CONFIGURAÇÃO MICRO (SCALPING) ==="
input int InpEmaFast = 8; // EMA Rápida
input int InpEmaSlow = 21; // EMA Lenta
input int InpRsiPeriod = 14; // Período RSI

input group "=== GESTÃO DE RISCO (PERFIL MINI) ==="
input bool InpEnableTrading = true; // Ativar Negociação Real?
input int MaxOpenPositions = 3; // Máximo GLOBAL de Posições (Conta)
input double HardStopLoss = 50.0; // Hard Stop Loss em USD (Ajustado Mini)
input double LowConfidenceLot = 0.05; // Lote Baixa Confiança (Mini)
input double MediumConfidenceLot = 0.25; // Lote Média Confiança (Mini)
input double HighConfidenceLot = 0.50; // Lote Alta Confiança (Mini)

input group "=== TRAILING STOP ==="
input double TrailingActivation = 2.0; // Ativação do trailing em $ (Mais sensível)
input double TrailingDistance = 2.0; // Distância do trailing em $
input double InitialStopLoss = 10.0; // Stop loss inicial em pontos (*10)
input double InitialTakeProfit = 20.0; // Take profit inicial em pontos (*10)
input double TpExpansion = 2.5; // Expansão do TP (multiplicador)

input group "=== VISUAL ==="
input color InpColorRes = clrSlateGray; // Resistência Mesh
input color InpColorSup = clrTeal; // Suporte Mesh
input color InpColorZoneBuy = C'220, 240, 220'; // Zona Compra
input color InpColorZoneSell = C'240, 220, 220'; // Zona Venda
input ENUM_LINE_STYLE InpLineStyle = STYLE_DOT; // Estilo da linha Mesh

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
int handleZigZag;
int handleEmaFast;
int handleEmaSlow;
int handleRsi;
string objPrefix;
datetime lastBarTime = 0;
ulong currentMagicNumber = 888999; // Magic Number FIXO para Mini

//--- Classes MQL5
CTrade trade;
CSymbolInfo symbolInfo;
CAccountInfo accountInfo;
CPositionInfo positionInfo;

//--- Estados
datetime lastTradeTime = 0;

//--- Forward Declarations
void UpdateMacroAnalysis();
void CheckHardStopLoss();
void ManageTrailingStop();
void CheckEntrySignalsWithScore();
int CountGlobalPositions();
bool IsSymbolBusy();
void ExecuteTrade(bool isBuy, double lotSize, double confidence);
void DrawMesh(PivotPoint &pivots[], int total, color clr);
void DrawPivots(PivotPoint &pivots[], int total, bool isHigh);
void DrawAutoFibo(const double &high[], const double &low[], const datetime &time[]);
void CreateHLine(string name, double price, color clr);
void DrawSignalArrow(bool isBuy, double price, datetime time);
double GetLotSizeByConfidence(double confidence); // Atualizada

//+------------------------------------------------------------------+
//| OnInit                                                           |
//+------------------------------------------------------------------+
int OnInit()
{
    Print("=== INICIALIZANDO TREND MESH MINI V3 GOLD FIX ===");
   
    if(!symbolInfo.Name(_Symbol)) return INIT_FAILED;
    symbolInfo.Refresh();
   
    objPrefix = "ATM_MINI_" + Symbol + "";
   
    // Magic Number Fixo para a versão Mini
    currentMagicNumber = 888999; 
    
    trade.SetExpertMagicNumber(currentMagicNumber);
    trade.SetDeviationInPoints(10);
    trade.SetTypeFilling(ORDER_FILLING_FOK);
    
    // Inicializar Random
    MathSrand(GetTickCount());
   
    //--- Inicializar Indicadores
    handleZigZag = iCustom(_Symbol, _Period, "Examples\\ZigZag", InpZigDepth, InpZigDev, InpZigBack);
    if(handleZigZag == INVALID_HANDLE) {
        handleZigZag = iCustom(_Symbol, _Period, "ZigZag", InpZigDepth, InpZigDev, InpZigBack);
        if(handleZigZag == INVALID_HANDLE) {
            Print("ERRO CRÍTICO: ZigZag não encontrado.");
            return INIT_FAILED;
        }
    }
   
    handleEmaFast = iMA(_Symbol, _Period, InpEmaFast, 0, MODE_EMA, PRICE_CLOSE);
    handleEmaSlow = iMA(_Symbol, _Period, InpEmaSlow, 0, MODE_EMA, PRICE_CLOSE);
    handleRsi = iRSI(_Symbol, _Period, InpRsiPeriod, PRICE_CLOSE);
   
    if(handleEmaFast == INVALID_HANDLE || handleEmaSlow == INVALID_HANDLE || handleRsi == INVALID_HANDLE) {
        Print("ERRO CRÍTICO: Falha ao criar handles de indicadores.");
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
}

//+------------------------------------------------------------------+
//| OnTick                                                           |
//+------------------------------------------------------------------+
void OnTick()
{
    // 1. Atualizar Dados
    if(!symbolInfo.RefreshRates()) return;
   
    // 2. Análise Macro
    datetime currentTime[1];
    if(CopyTime(_Symbol, _Period, 0, 1, currentTime) > 0) {
        if(currentTime[0] != lastBarTime) {
            lastBarTime = currentTime[0];
            UpdateMacroAnalysis();
        }
    }
   
    // 3. Verificar Hard Stop Loss
    CheckHardStopLoss();
   
    // 4. Gerenciar Trailing Stop
    ManageTrailingStop();
   
    // 5. Verificar Sinais de Entrada
    
    // REGRA 1: Verificar se este símbolo já tem posição (Limite: 1 por ativo)
    if(IsSymbolBusy()) return;

    // REGRA 2: Verificar Limite Global (Limite: 3 por conta para versão Mini)
    if(CountGlobalPositions() >= MaxOpenPositions) return;

    // Atraso aleatório pequeno para evitar conflito de execução
    Sleep(MathRand() % 100); 
    
    CheckEntrySignalsWithScore();
}

//+------------------------------------------------------------------+
//| CÁLCULO DE LOTE (COM EXCEÇÃO PARA OURO)                          |
//+------------------------------------------------------------------+
double GetLotSizeByConfidence(double confidence)
{
    double lot = 0.0;
    
    // Lógica padrão de confiança
    if(confidence >= 0.70) lot = HighConfidenceLot;
    else if(confidence >= 0.50) lot = MediumConfidenceLot;
    else lot = LowConfidenceLot;
    
    // --- EXCEÇÃO PARA OURO (GOLD LIMIT) ---
    // Verifica se o símbolo atual contém "XAU" ou "GOLD"
    if(StringFind(_Symbol, "XAU") != -1 || StringFind(_Symbol, "GOLD") != -1) {
        // Se for Ouro, o teto máximo é 0.15
        if(lot > 0.15) {
            lot = 0.15;
            Print("GOLD LIMIT ATIVADO: Lote reduzido para 0.15 (Ativo de Alto Risco)");
        }
    }
    
    return lot;
}

//+------------------------------------------------------------------+
//| Verifica se JÁ existe ordem neste símbolo (1 por ativo)          |
//+------------------------------------------------------------------+
bool IsSymbolBusy()
{
    // Verifica Posições Abertas
    for(int i = PositionsTotal() - 1; i >= 0; i--) {
        if(PositionGetTicket(i) > 0) {
            // Verifica se é nossa (MagicNumber) E se é deste símbolo
            if(PositionGetInteger(POSITION_MAGIC) == currentMagicNumber && 
               PositionGetString(POSITION_SYMBOL) == _Symbol) {
                return true; // Já tem posição, bloqueia nova entrada
            }
        }
    }
    
    // Verifica Ordens Pendentes
    for(int i = OrdersTotal() - 1; i >= 0; i--) {
        if(OrderGetTicket(i) > 0) {
            if(OrderGetInteger(ORDER_MAGIC) == currentMagicNumber && 
               OrderGetString(ORDER_SYMBOL) == _Symbol) {
                return true; // Já tem ordem pendente
            }
        }
    }
    
    return false;
}

//+------------------------------------------------------------------+
//| Contar TODAS as posições do robô na conta (Limite Global)        |
//+------------------------------------------------------------------+
int CountGlobalPositions()
{
    int count = 0;
    
    // Contar Posições
    for(int i = PositionsTotal() - 1; i >= 0; i--) {
        if(PositionGetTicket(i) > 0) {
            // Conta qualquer posição com nosso Magic Number, independente do símbolo
            if(PositionGetInteger(POSITION_MAGIC) == currentMagicNumber) {
                count++;
            }
        }
    }

    // Contar Ordens
    for(int i = OrdersTotal() - 1; i >= 0; i--) {
        if(OrderGetTicket(i) > 0) {
            if(OrderGetInteger(ORDER_MAGIC) == currentMagicNumber) {
                count++;
            }
        }
    }
    
    return count;
}

//+------------------------------------------------------------------+
//| Verificar Hard Stop Loss                                         |
//+------------------------------------------------------------------+
void CheckHardStopLoss()
{
    for(int i = PositionsTotal() - 1; i >= 0; i--) {
        ulong ticket = PositionGetTicket(i);
        if(ticket > 0 && PositionSelectByTicket(ticket)) {
            
            // Gerencia apenas as posições deste Magic Number
            if(PositionGetInteger(POSITION_MAGIC) == currentMagicNumber) {
                
                double profit = PositionGetDouble(POSITION_PROFIT);
                double swap = PositionGetDouble(POSITION_SWAP);
                double commission = PositionGetDouble(POSITION_COMMISSION);
                double totalPL = profit + swap + commission;
                
                if(totalPL <= -MathAbs(HardStopLoss)) {
                    Print("HARD STOP LOSS (MINI)! Ticket: ", ticket, " P/L: ", totalPL);
                    trade.PositionClose(ticket);
                }
            }
        }
    }
}

//+------------------------------------------------------------------+
//| Score de Confiabilidade                                          |
//+------------------------------------------------------------------+
SignalScore CalculateSignalScore(bool isBuySignal, double signalPrice)
{
    SignalScore score;
    score.isValid = false;
    score.isBuy = isBuySignal;
    score.confidence = 0.0;
    score.price = signalPrice;
    score.reason = "";
   
    double emaFast[], emaSlow[], rsi[];
    ArraySetAsSeries(emaFast, true);
    ArraySetAsSeries(emaSlow, true);
    ArraySetAsSeries(rsi, true);
   
    if(CopyBuffer(handleEmaFast, 0, 0, 3, emaFast) < 3) return score;
    if(CopyBuffer(handleEmaSlow, 0, 0, 3, emaSlow) < 3) return score;
    if(CopyBuffer(handleRsi, 0, 0, 3, rsi) < 3) return score;
   
    double points = 0.0;
    string reasons = "";
   
    // 1. EMAs (30%)
    if(isBuySignal) { if(emaFast[0] > emaSlow[0]) { points += 0.30; reasons += "EMA+ "; } }
    else { if(emaFast[0] < emaSlow[0]) { points += 0.30; reasons += "EMA+ "; } }
   
    // 2. RSI (25%)
    if(isBuySignal) { if(rsi[0] < 30) { points += 0.25; reasons += "RSI_Over+ "; } else if(rsi[0] < 50) { points += 0.15; reasons += "RSI_Low+ "; } }
    else { if(rsi[0] > 70) { points += 0.25; reasons += "RSI_Over+ "; } else if(rsi[0] > 50) { points += 0.15; reasons += "RSI_High+ "; } }
   
    // 3. Momentum (20%)
    if(isBuySignal) { if(emaFast[0] > emaFast[1]) { points += 0.20; reasons += "Mom+ "; } }
    else { if(emaFast[0] < emaFast[1]) { points += 0.20; reasons += "Mom+ "; } }
   
    // 4. Preço (15%)
    double currentPrice = isBuySignal ? symbolInfo.Ask() : symbolInfo.Bid();
    double distToFast = MathAbs(currentPrice - emaFast[0]) / currentPrice * 100;
    if(distToFast < 0.5) { points += 0.15; reasons += "NearEMA+ "; }
   
    // 5. ZigZag (10%)
    double zigZagBuffer[]; ArraySetAsSeries(zigZagBuffer, true);
    if(CopyBuffer(handleZigZag, 0, 0, 5, zigZagBuffer) >= 5) {
        if(zigZagBuffer[1] != 0.0 && zigZagBuffer[1] != EMPTY_VALUE) { points += 0.10; reasons += "Fresh+ "; }
    }
   
    score.confidence = points;
    score.reason = reasons;
    score.isValid = (points >= 0.30);
   
    return score;
}

//+------------------------------------------------------------------+
//| Verificar Sinais                                                 |
//+------------------------------------------------------------------+
void CheckEntrySignalsWithScore()
{
    double zigZagBuffer[], high[], low[];
    datetime time[];
    ArraySetAsSeries(zigZagBuffer, true);
    ArraySetAsSeries(high, true);
    ArraySetAsSeries(low, true);
    ArraySetAsSeries(time, true);
   
    int checkRange = 10;
    if(CopyBuffer(handleZigZag, 0, 0, checkRange, zigZagBuffer) < checkRange) return;
    if(CopyHigh(_Symbol, _Period, 0, checkRange, high) < checkRange) return;
    if(CopyLow(_Symbol, _Period, 0, checkRange, low) < checkRange) return;
    if(CopyTime(_Symbol, _Period, 0, checkRange, time) < checkRange) return;
   
    for(int i = 1; i < checkRange; i++) {
        double zVal = zigZagBuffer[i];
        if(zVal != 0.0 && zVal != EMPTY_VALUE) {
            if(time[i] <= lastTradeTime) continue;
           
            bool isHigh = (MathAbs(high[i] - zVal) < _Point);
            bool isLow = (MathAbs(low[i] - zVal) < _Point);
           
            if(isHigh || isLow) {
                bool isBuySignal = isLow;
                SignalScore score = CalculateSignalScore(isBuySignal, zVal);
                
                if(score.isValid) {
                    
                    // --- VERIFICAÇÃO FINAL ANTES DE ENVIAR A ORDEM ---
                    if(IsSymbolBusy()) return; // 1 por Ativo
                    if(CountGlobalPositions() >= MaxOpenPositions) return; // 3 Global

                    // Aqui usamos a função atualizada com o limite de Ouro
                    double lotSize = GetLotSizeByConfidence(score.confidence);
                    
                    Print("Sinal Detectado (MINI): ", _Symbol, " | Conf: ", score.confidence, " | Lote: ", lotSize);
                    DrawSignalArrow(isBuySignal, zVal, time[i]);
                    
                    if(InpEnableTrading) {
                        ExecuteTrade(isBuySignal, lotSize, score.confidence);
                    }
                    
                    lastTradeTime = time[i];
                    break;
                }
            }
        }
    }
}

//+------------------------------------------------------------------+
//| Executar Trade                                                   |
//+------------------------------------------------------------------+
void ExecuteTrade(bool isBuy, double lotSize, double confidence)
{
    double entry = isBuy ? symbolInfo.Ask() : symbolInfo.Bid();
    double slPoints = InitialStopLoss * 10 * _Point;
    double tpPoints = InitialTakeProfit * 10 * _Point;
   
    double sl = isBuy ? NormalizeDouble(entry - slPoints, _Digits) : NormalizeDouble(entry + slPoints, _Digits);
    double tp = isBuy ? NormalizeDouble(entry + tpPoints, _Digits) : NormalizeDouble(entry - tpPoints, _Digits);
    
    string comment = StringFormat("MINI_C%.0f", confidence * 100);
   
    bool res = false;
    if(isBuy) res = trade.Buy(lotSize, _Symbol, entry, sl, tp, comment);
    else res = trade.Sell(lotSize, _Symbol, entry, sl, tp, comment);
    
    if(res) Print("Ordem enviada com sucesso: ", _Symbol);
    else Print("Erro ao enviar ordem: ", trade.ResultRetcodeDescription());
}

//+------------------------------------------------------------------+
//| Gerenciar Trailing Stop                                          |
//+------------------------------------------------------------------+
void ManageTrailingStop()
{
    for(int i = PositionsTotal() - 1; i >= 0; i--) {
        ulong ticket = PositionGetTicket(i);
        if(ticket > 0 && PositionSelectByTicket(ticket)) {
            
            // Só gerencia o que é nosso
            if(PositionGetInteger(POSITION_MAGIC) == currentMagicNumber) {
                
                // Trailing também só deve atuar no símbolo atual do gráfico para evitar conflitos de cache
                if(PositionGetString(POSITION_SYMBOL) == _Symbol) {
                    
                    double profit = PositionGetDouble(POSITION_PROFIT);
                    if(profit >= TrailingActivation) {
                        double currentPrice = PositionGetDouble(POSITION_PRICE_CURRENT);
                        double stopLoss = PositionGetDouble(POSITION_SL);
                        double takeProfit = PositionGetDouble(POSITION_TP);
                        double trailPts = TrailingDistance * 10 * _Point;
                        
                        double newSL = 0;
                        bool update = false;

                        if(PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY) {
                            newSL = NormalizeDouble(currentPrice - trailPts, _Digits);
                            if(newSL > stopLoss || stopLoss == 0) update = true;
                        } else {
                            newSL = NormalizeDouble(currentPrice + trailPts, _Digits);
                            if(newSL < stopLoss || stopLoss == 0) update = true;
                        }
                        
                        if(update) trade.PositionModify(ticket, newSL, takeProfit);
                    }
                }
            }
        }
    }
}

//+------------------------------------------------------------------+
//| Visual e Auxiliares                                              |
//+------------------------------------------------------------------+
void UpdateMacroAnalysis() {
    double zigZagBuffer[], high[], low[];
    datetime time[];
    ArraySetAsSeries(zigZagBuffer, true); ArraySetAsSeries(high, true); ArraySetAsSeries(low, true); ArraySetAsSeries(time, true);
    if(CopyBuffer(handleZigZag, 0, 0, InpLookBack, zigZagBuffer) < 0) return;
    if(CopyHigh(_Symbol, _Period, 0, InpLookBack, high) < 0) return;
    if(CopyLow(_Symbol, _Period, 0, InpLookBack, low) < 0) return;
    if(CopyTime(_Symbol, _Period, 0, InpLookBack, time) < 0) return;
    ObjectsDeleteAll(0, objPrefix + "Ln_"); ObjectsDeleteAll(0, objPrefix + "Fibo");
    PivotPoint highs[], lows[]; ArrayResize(highs, InpLookBack); ArrayResize(lows, InpLookBack);
    int hCount = 0, lCount = 0;
    for(int i = 1; i < InpLookBack; i++) {
        double zVal = zigZagBuffer[i];
        if(zVal != 0.0 && zVal != EMPTY_VALUE) {
            if(MathAbs(high[i] - zVal) < _Point) { highs[hCount].price = zVal; highs[hCount].time = time[i]; highs[hCount].barIndex = i; highs[hCount].isHigh = true; hCount++; } 
            else if(MathAbs(low[i] - zVal) < _Point) { lows[lCount].price = zVal; lows[lCount].time = time[i]; lows[lCount].barIndex = i; lows[lCount].isHigh = false; lCount++; }
        }
    }
    DrawMesh(highs, hCount, InpColorRes); DrawMesh(lows, lCount, InpColorSup); DrawPivots(highs, hCount, true); DrawPivots(lows, lCount, false);
    if(InpShowFibo) DrawAutoFibo(high, low, time);
    ChartRedraw(0);
}

void DrawMesh(PivotPoint &pivots[], int total, color clr) {
    int limit = MathMin(total, 15);
    for(int i = 0; i < limit; i++) {
        int linesDrawn = 0;
        for(int j = i + 1; j < total; j++) {
            if(MathAbs(pivots[i].barIndex - pivots[j].barIndex) < InpMinBarsDist) continue;
            string name = objPrefix + "Ln_" + IntegerToString(pivots[i].isHigh) + "" + IntegerToString(i) + "" + IntegerToString(j);
            if(ObjectCreate(0, name, OBJ_TREND, 0, pivots[j].time, pivots[j].price, pivots[i].time, pivots[i].price)) {
                ObjectSetInteger(0, name, OBJPROP_COLOR, clr); ObjectSetInteger(0, name, OBJPROP_RAY_RIGHT, true);
                ObjectSetInteger(0, name, OBJPROP_STYLE, InpLineStyle); ObjectSetInteger(0, name, OBJPROP_BACK, true);
            }
            linesDrawn++; if(linesDrawn >= InpConnectPast) break;
        }
    }
}

void DrawSignalArrow(bool isBuy, double price, datetime time) {
    string name = objPrefix + "Sig_" + IntegerToString((long)time) + "_" + (isBuy ? "B" : "S");
    if(ObjectCreate(0, name, OBJ_ARROW, 0, time, price)) {
        ObjectSetInteger(0, name, OBJPROP_ARROWCODE, isBuy ? 241 : 242); ObjectSetInteger(0, name, OBJPROP_COLOR, isBuy ? clrBlue : clrRed);
        ObjectSetInteger(0, name, OBJPROP_WIDTH, 2); ObjectSetInteger(0, name, OBJPROP_ANCHOR, isBuy ? ANCHOR_TOP : ANCHOR_BOTTOM);
    }
}

void DrawPivots(PivotPoint &pivots[], int total, bool isHigh) {
    for(int i = 0; i < total; i++) {
        string name = objPrefix + "Piv_" + (isHigh ? "H_" : "L_") + IntegerToString(pivots[i].barIndex);
        if(ObjectCreate(0, name, OBJ_ARROW, 0, pivots[i].time, pivots[i].price)) {
            ObjectSetInteger(0, name, OBJPROP_ARROWCODE, isHigh ? 242 : 241); ObjectSetInteger(0, name, OBJPROP_COLOR, isHigh ? clrRed : clrBlue);
            ObjectSetInteger(0, name, OBJPROP_WIDTH, 2); ObjectSetInteger(0, name, OBJPROP_ANCHOR, isHigh ? ANCHOR_BOTTOM : ANCHOR_TOP);
        }
    }
}

void DrawAutoFibo(const double &high[], const double &low[], const datetime &time[]) {
    double maxP = -DBL_MAX, minP = DBL_MAX; int iMax = -1, iMin = -1;
    for(int i = 1; i < InpLookBack; i++) { if(high[i] > maxP) { maxP = high[i]; iMax = i; } if(low[i] < minP) { minP = low[i]; iMin = i; } }
    if(iMax == -1 || iMin == -1) return;
    bool isUptrend = (iMin > iMax); double p50, p618; color zoneColor; double range = maxP - minP;
    if(isUptrend) { p50 = maxP - (range * 0.5); p618 = maxP - (range * 0.618); zoneColor = InpColorZoneBuy; } 
    else { p50 = minP + (range * 0.5); p618 = minP + (range * 0.618); zoneColor = InpColorZoneSell; }
    string rectName = objPrefix + "FiboZone"; datetime tStart = (isUptrend ? time[iMin] : time[iMax]); datetime tEnd = time[0] + PeriodSeconds() * 50;
    if(ObjectCreate(0, rectName, OBJ_RECTANGLE, 0, tStart, p50, tEnd, p618)) { ObjectSetInteger(0, rectName, OBJPROP_COLOR, zoneColor); ObjectSetInteger(0, rectName, OBJPROP_FILL, true); ObjectSetInteger(0, rectName, OBJPROP_BACK, true); }
    CreateHLine(objPrefix + "Lv50", p50, zoneColor); CreateHLine(objPrefix + "Lv618", p618, zoneColor);
}

void CreateHLine(string name, double price, color clr) {
    if(ObjectCreate(0, name, OBJ_HLINE, 0, 0, price)) { ObjectSetInteger(0, name, OBJPROP_COLOR, clr); ObjectSetInteger(0, name, OBJPROP_STYLE, STYLE_SOLID); ObjectSetInteger(0, name, OBJPROP_BACK, true); } 
    else { ObjectSetDouble(0, name, OBJPROP_PRICE, price); }
}
//+------------------------------------------------------------------+