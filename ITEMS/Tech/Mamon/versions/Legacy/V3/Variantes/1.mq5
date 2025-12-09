//+------------------------------------------------------------------+
//|                                     Trend_Mesh_V3_FinalFix.mq5   |
//|                        Copyright 2025, Atous Technology Systems  |
//|               Fix: Single Position per Asset + Max 5 Global      |
//+------------------------------------------------------------------+
#property copyright "Copyright 2025, Atous Technology Systems"
#property version   "3.30"
#property description "Trend Mesh V3: Hard Limit Fix + Race Condition Protection"

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
input int InpAtrPeriod = 14; // Período ATR para volatilidade

input group "=== GESTÃO DE RISCO E POSIÇÕES ==="
input bool InpEnableTrading = true; // Ativar Negociação Real?
input int MaxOpenPositions = 5; // Máximo GLOBAL de Posições (Conta)
input double HardStopLoss = 25.0; // Hard Stop Loss em USD
input double LowConfidenceLot = 0.15; // Lote para Baixa Confiança
input double MediumConfidenceLot = 0.25; // Lote para Média Confiança
input double HighConfidenceLot = 0.05; // Lote para Alta Confiança

input group "=== TRAILING STOP ==="
input double TrailingActivation = 5.0; // Ativação do trailing em $
input double BaseTrailingDistance = 3.0; // Distância BASE do trailing em $
input double InitialStopLoss = 10.0; // Stop loss inicial em pontos (*10)
input double InitialTakeProfit = 20.0; // Take profit inicial em pontos (*10)
input double TpExpansion = 2.5; // Expansão do TP (multiplicador)

// NOVOS PARÂMETROS PARA DINAMISMO
input double MaxAdverseExcursion = 15.0; // Máximo drawdown tolerado em $
input double FearMultiplier = 2.0; // Multiplicador do trailing em medo
input double ConfidenceMultiplier = 0.5; // Multiplicador do trailing em confiança
input double MeshFilterDistance = 20.0; // Distância em pontos para filtrar entrada perto do mesh

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
int handleAtr; // Novo handle para ATR
string objPrefix;
datetime lastBarTime = 0;
ulong currentMagicNumber = 777888;

//--- Classes MQL5
CTrade trade;
CSymbolInfo symbolInfo;
CAccountInfo accountInfo;
CPositionInfo positionInfo;

//--- Estados
datetime lastTradeTime = 0;

//--- VARIÁVEIS PARA TRAILING DINÂMICO
double dynamicTrailingDistance = 0;
double adverseExcursionHistory = 0;

//--- Forward Declarations
void UpdateMacroAnalysis();
void CheckHardStopLoss();
void ManageDynamicTrailingStop();
void CheckEntrySignalsWithScore();
int CountGlobalPositions();
bool IsSymbolBusy();
void ExecuteTrade(bool isBuy, double lotSize, double confidence);
void DrawMesh(PivotPoint &pivots[], int total, color clr);
void DrawPivots(PivotPoint &pivots[], int total, bool isHigh);
void DrawAutoFibo(const double &high[], const double &low[], const datetime &time[]);
void CreateHLine(string name, double price, color clr);
void DrawSignalArrow(bool isBuy, double price, datetime time);

//--- NOVAS FUNÇÕES
bool CheckEmaCrossover(bool &isBuy);
SignalScore CalculateSignalScore(bool isBuySignal, double signalPrice);
double GetLotSizeByConfidence(double confidence);
double GetDynamicTrailingDistance(double adverseExcursion);
bool IsPriceNearMesh(double price);

//+------------------------------------------------------------------+
//| OnInit                                                           |
//+------------------------------------------------------------------+
int OnInit()
{
    Print("=== INICIALIZANDO TREND MESH V3 FINAL FIX ===");
   
    if(!symbolInfo.Name(_Symbol)) return INIT_FAILED;
    symbolInfo.Refresh();
   
    objPrefix = "ATM_V3_" + Symbol() + "_";
   
    currentMagicNumber = 777888; 
    trade.SetExpertMagicNumber(currentMagicNumber);
    trade.SetDeviationInPoints(10);
    trade.SetTypeFilling(ORDER_FILLING_FOK);
    
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
    handleAtr = iATR(_Symbol, _Period, InpAtrPeriod); // Inicializar ATR
   
    if(handleEmaFast == INVALID_HANDLE || handleEmaSlow == INVALID_HANDLE || 
       handleRsi == INVALID_HANDLE || handleAtr == INVALID_HANDLE) {
        Print("ERRO CRÍTICO: Falha ao criar handles de indicadores.");
        return INIT_FAILED;
    }
   
    dynamicTrailingDistance = BaseTrailingDistance;
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
   
    datetime currentTime[1];
    if(CopyTime(_Symbol, _Period, 0, 1, currentTime) > 0) {
        if(currentTime[0] != lastBarTime) {
            lastBarTime = currentTime[0];
            UpdateMacroAnalysis();
        }
    }
   
    CheckHardStopLoss();
    ManageDynamicTrailingStop();
    
    if(IsSymbolBusy()) return;
    if(CountGlobalPositions() >= MaxOpenPositions) return;

    Sleep(MathRand() % 100); 
    CheckEntrySignalsWithScore();
}

//+------------------------------------------------------------------+
//| 1. TROCAR GATILHO DE ENTRADA: Crossover de EMAs                 |
//+------------------------------------------------------------------+
bool CheckEmaCrossover(bool &isBuy)
{
    double emaFast[], emaSlow[];
    ArraySetAsSeries(emaFast, true);
    ArraySetAsSeries(emaSlow, true);
   
    if(CopyBuffer(handleEmaFast, 0, 0, 3, emaFast) < 3) return false;
    if(CopyBuffer(handleEmaSlow, 0, 0, 3, emaSlow) < 3) return false;
   
    bool crossoverBuy = (emaFast[1] <= emaSlow[1] && emaFast[0] > emaSlow[0]);
    bool crossoverSell = (emaFast[1] >= emaSlow[1] && emaFast[0] < emaSlow[0]);
   
    if(!crossoverBuy && !crossoverSell) return false;
    
    isBuy = crossoverBuy;
    return true;
}

//+------------------------------------------------------------------+
//| 2. SIMPLIFICAR SCORE DE CONFIABILIDADE                          |
//+------------------------------------------------------------------+
SignalScore CalculateSignalScore(bool isBuySignal, double signalPrice)
{
    SignalScore score;
    score.isValid = false;
    score.isBuy = isBuySignal;
    score.confidence = 0.0;
    score.price = signalPrice;
    score.reason = "";
   
    double emaFast[], emaSlow[], rsi[], atr[];
    ArraySetAsSeries(emaFast, true);
    ArraySetAsSeries(emaSlow, true);
    ArraySetAsSeries(rsi, true);
    ArraySetAsSeries(atr, true);
   
    if(CopyBuffer(handleEmaFast, 0, 0, 3, emaFast) < 3) return score;
    if(CopyBuffer(handleEmaSlow, 0, 0, 3, emaSlow) < 3) return score;
    if(CopyBuffer(handleRsi, 0, 0, 3, rsi) < 3) return score;
    if(CopyBuffer(handleAtr, 0, 0, 1, atr) < 1) return score;
   
    double points = 0.0;
    string reasons = "";
   
    // 1. Distância entre EMAs (força do trend) - 50%
    double emaDistance = MathAbs(emaFast[0] - emaSlow[0]) / symbolInfo.Point();
    double atrValue = atr[0] / symbolInfo.Point();
    
    if(emaDistance > atrValue * 0.5) {
        points += 0.5;
        reasons += "TrendForte ";
    } else if(emaDistance > atrValue * 0.2) {
        points += 0.3;
        reasons += "TrendModerado ";
    }
   
    // 2. RSI (apenas como filtro) - 30%
    if(isBuySignal) {
        if(rsi[0] < 30) { 
            points += 0.3; 
            reasons += "RSI_Oversold "; 
        } else if(rsi[0] < 45) { 
            points += 0.15; 
            reasons += "RSI_Baixo "; 
        }
    } else {
        if(rsi[0] > 70) { 
            points += 0.3; 
            reasons += "RSI_Overbought "; 
        } else if(rsi[0] > 55) { 
            points += 0.15; 
            reasons += "RSI_Alto "; 
        }
    }
   
    // 3. Volatilidade (ATR) - 20%
    if(atrValue < emaDistance * 2) {
        points += 0.2;
        reasons += "VolOK ";
    }
   
    score.confidence = MathMin(points, 1.0);
    score.reason = reasons;
    score.isValid = (points >= 0.5);
   
    return score;
}

//+------------------------------------------------------------------+
//| 4. APROVEITAR MESH COMO FILTRO MACRO                            |
//+------------------------------------------------------------------+
bool IsPriceNearMesh(double price)
{
    int total = ObjectsTotal(0, 0, OBJ_TREND);
    for(int i = 0; i < total; i++) {
        string name = ObjectName(0, i, 0, OBJ_TREND);
        if(StringFind(name, objPrefix + "Ln_") == 0) {
            double linePrice1 = ObjectGetDouble(0, name, OBJPROP_PRICE, 0);
            double linePrice2 = ObjectGetDouble(0, name, OBJPROP_PRICE, 1);
            datetime time1 = (datetime)ObjectGetInteger(0, name, OBJPROP_TIME, 0);
            datetime time2 = (datetime)ObjectGetInteger(0, name, OBJPROP_TIME, 1);
            
            // Interpolação linear para o tempo atual
            double slope = (linePrice2 - linePrice1) / (time2 - time1);
            datetime currentTime = TimeCurrent();
            double linePriceAtCurrentTime = linePrice1 + slope * (currentTime - time1);
            
            if(MathAbs(price - linePriceAtCurrentTime) < MeshFilterDistance * _Point) {
                return true;
            }
        }
    }
    return false;
}

//+------------------------------------------------------------------+
//| 2. ADAPTAR TRAILING STOP DINÂMICO                               |
//+------------------------------------------------------------------+
double GetDynamicTrailingDistance(double adverseExcursion)
{
    if(adverseExcursion > MaxAdverseExcursion) {
        return BaseTrailingDistance * FearMultiplier;
    } else if(adverseExcursion < (MaxAdverseExcursion * 0.3)) {
        return BaseTrailingDistance * ConfidenceMultiplier;
    }
    return BaseTrailingDistance;
}

void ManageDynamicTrailingStop()
{
    for(int i = PositionsTotal() - 1; i >= 0; i--) {
        ulong ticket = PositionGetTicket(i);
        if(ticket > 0 && PositionSelectByTicket(ticket)) {
            
            if(PositionGetInteger(POSITION_MAGIC) == currentMagicNumber && 
               PositionGetString(POSITION_SYMBOL) == _Symbol) {
                
                double profit = PositionGetDouble(POSITION_PROFIT);
                if(profit >= TrailingActivation) {
                    double currentPrice = PositionGetDouble(POSITION_PRICE_CURRENT);
                    double stopLoss = PositionGetDouble(POSITION_SL);
                    double takeProfit = PositionGetDouble(POSITION_TP);
                    double openPrice = PositionGetDouble(POSITION_PRICE_OPEN);
                    
                    // Calcular adverse excursion
                    double adverseExcursion = 0;
                    if(PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY) {
                        adverseExcursion = (openPrice - currentPrice) / _Point * 10; // Em USD
                        if(adverseExcursion < 0) adverseExcursion = 0;
                    } else {
                        adverseExcursion = (currentPrice - openPrice) / _Point * 10;
                        if(adverseExcursion < 0) adverseExcursion = 0;
                    }
                    
                    // Atualizar histórico com média móvel
                    adverseExcursionHistory = (adverseExcursionHistory * 0.7) + (adverseExcursion * 0.3);
                    
                    // Calcular trailing dinâmico
                    double dynamicDistance = GetDynamicTrailingDistance(adverseExcursionHistory);
                    double trailPts = dynamicDistance * 10 * _Point;
                    
                    double newSL = 0;
                    bool update = false;

                    if(PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY) {
                        newSL = NormalizeDouble(currentPrice - trailPts, _Digits);
                        if(newSL > stopLoss || stopLoss == 0) update = true;
                    } else {
                        newSL = NormalizeDouble(currentPrice + trailPts, _Digits);
                        if(newSL < stopLoss || stopLoss == 0) update = true;
                    }
                    
                    if(update) {
                        trade.PositionModify(ticket, newSL, takeProfit);
                        Print(StringFormat("Trailing dinâmico ajustado: %.2f (Adverse: %.2f)", 
                              dynamicDistance, adverseExcursionHistory));
                    }
                }
            }
        }
    }
}

//+------------------------------------------------------------------+
//| VERIFICAR SINAIS DE ENTRADA (COM NOVA LÓGICA)                   |
//+------------------------------------------------------------------+
void CheckEntrySignalsWithScore()
{
    bool isBuySignal = false;
    
    // Usar crossover de EMAs como gatilho principal
    if(!CheckEmaCrossover(isBuySignal)) return;
    
    double currentPrice = isBuySignal ? symbolInfo.Ask() : symbolInfo.Bid();
    
    // Filtrar por proximidade do mesh
    if(IsPriceNearMesh(currentPrice)) {
        Print("Preço próximo do mesh - entrada filtrada");
        return;
    }
    
    SignalScore score = CalculateSignalScore(isBuySignal, currentPrice);
    
    if(score.isValid) {
        if(IsSymbolBusy()) return;
        if(CountGlobalPositions() >= MaxOpenPositions) return;

        // 5. AJUSTAR LOTE POR VOLATILIDADE
        double atr[];
        ArraySetAsSeries(atr, true);
        if(CopyBuffer(handleAtr, 0, 0, 1, atr) >= 1) {
            double atrMultiplier = MathMin(atr[0] / (100 * _Point), 2.0);
            
            double baseLot = GetLotSizeByConfidence(score.confidence);
            double adjustedLot = NormalizeDouble(baseLot * atrMultiplier, 2);
            adjustedLot = MathMax(adjustedLot, 0.01);
            
            Print(StringFormat("Sinal: %s | Conf: %.2f | Lote: %.2f (ATR: %.2f)", 
                  isBuySignal ? "COMPRA" : "VENDA", score.confidence, adjustedLot, atr[0]));
            
            DrawSignalArrow(isBuySignal, currentPrice, TimeCurrent());
            
            if(InpEnableTrading) {
                ExecuteTrade(isBuySignal, adjustedLot, score.confidence);
            }
            
            lastTradeTime = TimeCurrent();
        }
    }
}

//+------------------------------------------------------------------+
//| FUNÇÕES EXISTENTES (MODIFICADAS)                                |
//+------------------------------------------------------------------+
bool IsSymbolBusy()
{
    for(int i = PositionsTotal() - 1; i >= 0; i--) {
        if(PositionGetTicket(i) > 0) {
            if(PositionGetInteger(POSITION_MAGIC) == currentMagicNumber && 
               PositionGetString(POSITION_SYMBOL) == _Symbol) {
                return true;
            }
        }
    }
    
    for(int i = OrdersTotal() - 1; i >= 0; i--) {
        if(OrderGetTicket(i) > 0) {
            if(OrderGetInteger(ORDER_MAGIC) == currentMagicNumber && 
               OrderGetString(ORDER_SYMBOL) == _Symbol) {
                return true;
            }
        }
    }
    
    return false;
}

int CountGlobalPositions()
{
    int count = 0;
    
    for(int i = PositionsTotal() - 1; i >= 0; i--) {
        if(PositionGetTicket(i) > 0) {
            if(PositionGetInteger(POSITION_MAGIC) == currentMagicNumber) {
                count++;
            }
        }
    }

    for(int i = OrdersTotal() - 1; i >= 0; i--) {
        if(OrderGetTicket(i) > 0) {
            if(OrderGetInteger(ORDER_MAGIC) == currentMagicNumber) {
                count++;
            }
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
                
                // 5. AJUSTAR HARD STOP POR VOLATILIDADE
                double atr[];
                ArraySetAsSeries(atr, true);
                if(CopyBuffer(handleAtr, 0, 0, 1, atr) >= 1) {
                    double dynamicHardStop = HardStopLoss * (atr[0] / (100 * _Point));
                    dynamicHardStop = MathMax(dynamicHardStop, HardStopLoss * 0.5);
                    
                    if(totalPL <= -MathAbs(dynamicHardStop)) {
                        Print(StringFormat("HARD STOP DINÂMICO! Ticket: %d P/L: %.2f (ATR: %.2f)", 
                              ticket, totalPL, atr[0]));
                        trade.PositionClose(ticket);
                    }
                }
            }
        }
    }
}

double GetLotSizeByConfidence(double confidence)
{
    if(confidence >= 0.70) return HighConfidenceLot;
    else if(confidence >= 0.50) return MediumConfidenceLot;
    else return LowConfidenceLot;
}

void ExecuteTrade(bool isBuy, double lotSize, double confidence)
{
    double entry = isBuy ? symbolInfo.Ask() : symbolInfo.Bid();
    
    // 5. STOP LOSS E TP BASEADOS EM ATR
    double atr[];
    ArraySetAsSeries(atr, true);
    if(CopyBuffer(handleAtr, 0, 0, 1, atr) < 1) return;
    
    double slPoints = MathMax(InitialStopLoss * 10 * _Point, atr[0] * 1.5);
    double tpPoints = MathMax(InitialTakeProfit * 10 * _Point, atr[0] * 2.5);
   
    double sl = isBuy ? NormalizeDouble(entry - slPoints, _Digits) : NormalizeDouble(entry + slPoints, _Digits);
    double tp = isBuy ? NormalizeDouble(entry + tpPoints, _Digits) : NormalizeDouble(entry - tpPoints, _Digits);
    
    string comment = StringFormat("V3_C%.0f_ATR%.0f", confidence * 100, atr[0] / _Point);
   
    bool res = false;
    if(isBuy) res = trade.Buy(lotSize, _Symbol, entry, sl, tp, comment);
    else res = trade.Sell(lotSize, _Symbol, entry, sl, tp, comment);
    
    if(res) Print("Ordem enviada com sucesso: ", _Symbol);
    else Print("Erro ao enviar ordem: ", trade.ResultRetcodeDescription());
}

//+------------------------------------------------------------------+
//| FUNÇÕES VISUAIS (SEM ALTERAÇÕES)                                |
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
    if(ObjectCreate(0, name, OBJ_HLINE, 0, 0, price)) { 
        ObjectSetInteger(0, name, OBJPROP_COLOR, clr); 
        ObjectSetInteger(0, name, OBJPROP_STYLE, STYLE_SOLID); 
        ObjectSetInteger(0, name, OBJPROP_BACK, true); 
    } else { 
        ObjectSetDouble(0, name, OBJPROP_PRICE, price); 
    }
}
//+------------------------------------------------------------------+