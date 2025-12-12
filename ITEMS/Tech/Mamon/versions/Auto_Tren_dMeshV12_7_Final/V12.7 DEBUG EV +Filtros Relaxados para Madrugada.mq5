//+------------------------------------------------------------------+
//|                         Auto_Trend_MeshV12_7_Final.mq5           |
//|                         Copyright 2025, Optimized Version        |
//| V12.7: DEBUG EV + Filtros Relaxados para Madrugada               |
//+------------------------------------------------------------------+
#property copyright "Copyright 2025, Optimized Version"
#property version   "12.70"
#property description "V12.7: Mostra EV no Log para diagnostico"

#include <Trade\Trade.mqh>
#include <Trade\SymbolInfo.mqh>
#include <Trade\PositionInfo.mqh>

//--- OBJETOS GLOBAIS
CTrade trade;
CSymbolInfo symbolInfo;
CPositionInfo positionInfo;

//--- HANDLES
int h_ema21_m5, h_ema100_m5, h_ema21_h1, h_ema100_h1;
int h_rsi, h_atr, h_adx, h_obv;

//--- INPUTS
input double InpBaseRisk = 0.01;              // Risco Base
input double InpMaxLotPerTrade = 5.0;         // Teto Máximo de Lote
input int    InpMaxOpenPositions = 5;         // Maximo posicoes
input int    InpMagicNumber = 999127;         // Magic Number (V12.7)
input double InpMinWinProbability = 0.65;     // Probabilidade Minima (65%)
input double InpMinExpectedValue = 1.0;       // EV Minimo (BAIXADO PARA 1.0 PARA TESTE DE SPREAD)
input int    InpADXThreshold = 12;            // ADX Minimo (Mantido em 12 conforme pedido)
input double InpRRRatio = 1.8;                // Risco Retorno
input int    InpMaxConsecutiveLosses = 5;     // Circuit Breaker perdas
input double InpMaxDailyLossPercent = 0.03;   // Circuit Breaker dia
input double InpMaxDrawdownPercent = 0.15;    // Circuit Breaker DD
input bool   InpUseAdvancedFilters = true;    // Filtros
input int    InpStartHour = 0;                // Hora Inicio
input int    InpEndHour = 24;                 // Hora Fim

//--- ESTADO
int g_consecutiveLosses = 0;
double g_dailyPnL = 0.0;
datetime g_lastResetDate = 0;
double g_initialBalance = 0;
uint g_lastLogTime = 0;

//+------------------------------------------------------------------+
//| INIT                                                             |
//+------------------------------------------------------------------+
int OnInit() {
   if(!symbolInfo.Name(_Symbol)) return INIT_FAILED;
   symbolInfo.Refresh();
   
   trade.SetExpertMagicNumber(InpMagicNumber);
   trade.SetDeviationInPoints(30);
   
   uint filling = (uint)SymbolInfoInteger(_Symbol, SYMBOL_FILLING_MODE);
   if((filling & SYMBOL_FILLING_FOK) == SYMBOL_FILLING_FOK) trade.SetTypeFilling(ORDER_FILLING_FOK);
   else if((filling & SYMBOL_FILLING_IOC) == SYMBOL_FILLING_IOC) trade.SetTypeFilling(ORDER_FILLING_IOC);
   else trade.SetTypeFilling(ORDER_FILLING_RETURN);
   
   trade.SetAsyncMode(false); 
   
   // M5
   h_ema21_m5 = iMA(_Symbol, PERIOD_M5, 21, 0, MODE_EMA, PRICE_CLOSE);
   h_ema100_m5 = iMA(_Symbol, PERIOD_M5, 100, 0, MODE_EMA, PRICE_CLOSE);
   h_rsi = iRSI(_Symbol, PERIOD_M5, 14, PRICE_CLOSE);
   h_atr = iATR(_Symbol, PERIOD_M5, 14);
   h_adx = iADX(_Symbol, PERIOD_M5, 14);
   h_obv = iOBV(_Symbol, PERIOD_M5, VOLUME_TICK);
   
   // H1
   h_ema21_h1 = iMA(_Symbol, PERIOD_H1, 21, 0, MODE_EMA, PRICE_CLOSE);
   h_ema100_h1 = iMA(_Symbol, PERIOD_H1, 100, 0, MODE_EMA, PRICE_CLOSE);
   
   if(h_ema21_m5 == INVALID_HANDLE || h_obv == INVALID_HANDLE) return INIT_FAILED;
   
   g_initialBalance = AccountInfoDouble(ACCOUNT_BALANCE);
   g_lastResetDate = TimeCurrent();
   
   return INIT_SUCCEEDED;
}

void OnDeinit(const int reason) {
   IndicatorRelease(h_ema21_m5); IndicatorRelease(h_ema100_m5);
   IndicatorRelease(h_ema21_h1); IndicatorRelease(h_ema100_h1);
   IndicatorRelease(h_rsi); IndicatorRelease(h_atr);
   IndicatorRelease(h_adx); IndicatorRelease(h_obv);
   Comment("");
}

//+------------------------------------------------------------------+
//| HELPERS                                                          |
//+------------------------------------------------------------------+
double GetIndicatorValue(int handle, int buffer, int index) {
    double val[]; ArraySetAsSeries(val, true);
    if(CopyBuffer(handle, buffer, index, 1, val) < 1) return 0.0;
    return val[0];
}

double CalculateOFI_Display() {
    long vol[]; double close[], open[];
    ArraySetAsSeries(vol,true); ArraySetAsSeries(close,true); ArraySetAsSeries(open,true);
    if(CopyTickVolume(_Symbol, PERIOD_CURRENT, 0, 5, vol)<5) return 0;
    if(CopyClose(_Symbol, PERIOD_CURRENT, 0, 5, close)<5) return 0;
    if(CopyOpen(_Symbol, PERIOD_CURRENT, 0, 5, open)<5) return 0;
     
    double ofi = 0; long totalVol = 0;
    for(int i=0; i<5; i++) {
        int dir = (close[i] >= open[i]) ? 1 : -1;
        ofi += (double)vol[i] * dir;
        totalVol += vol[i];
    }
    return (totalVol > 0) ? ofi / totalVol : 0;
}

//+------------------------------------------------------------------+
//| FILTROS                                                          |
//+------------------------------------------------------------------+
bool IsGoodTradingHour() {
   MqlDateTime dt; TimeToStruct(TimeCurrent(), dt);
   if(dt.hour < InpStartHour || dt.hour >= InpEndHour) return false;
   return true;
}

bool IsSpreadAcceptable() {
   double spread = (double)SymbolInfoInteger(_Symbol, SYMBOL_SPREAD); 
   double maxSpread = (StringFind(_Symbol, "XAU") >= 0) ? 300.0 : 30.0; 
   if(StringFind(_Symbol, "JPY") >= 0) maxSpread = 40.0;
   return (spread <= maxSpread);
}

bool IsVolatilityInRange() {
   double atr = GetIndicatorValue(h_atr, 0, 0);
   double atr_h1[]; ArraySetAsSeries(atr_h1, true);
   int h_temp = iATR(_Symbol, PERIOD_H1, 20);
   if(h_temp == INVALID_HANDLE) return false;
   
   if(CopyBuffer(h_temp, 0, 0, 1, atr_h1) < 1) { IndicatorRelease(h_temp); return false; }
   IndicatorRelease(h_temp);
   
   if(atr < atr_h1[0] * 0.5) return false; 
   if(atr > atr_h1[0] * 2.5) return false; 
   return true;
}

bool IsADXStrong() {
   return (GetIndicatorValue(h_adx, 0, 0) >= InpADXThreshold);
}

bool IsTrendAligned(bool &outIsBuy) {
   double m21 = GetIndicatorValue(h_ema21_m5, 0, 0);
   double m100 = GetIndicatorValue(h_ema100_m5, 0, 0);
   double h21 = GetIndicatorValue(h_ema21_h1, 0, 0);
   double h100 = GetIndicatorValue(h_ema100_h1, 0, 0);
   
   int tM5 = (m21 > m100) ? 1 : -1;
   int tH1 = (h21 > h100) ? 1 : -1;
   
   if(tM5 != tH1) return false;
   outIsBuy = (tM5 == 1);
   return true;
}

bool IsRSIFavorable(bool isBuy) {
   double rsi = GetIndicatorValue(h_rsi, 0, 0);
   if(isBuy && rsi > 50 && rsi < 70) return true;
   if(!isBuy && rsi > 30 && rsi < 50) return true;
   return false;
}

bool IsVolumeConfirming(bool isBuy) {
   double obv = GetIndicatorValue(h_obv, 0, 0);
   double obvArr[]; ArraySetAsSeries(obvArr, true);
   if(CopyBuffer(h_obv, 0, 0, 20, obvArr) < 20) return false;
   
   double sum = 0; for(int i=0; i<20; i++) sum += obvArr[i];
   double ma = sum / 20.0;
   
   if(isBuy && obv > ma) return true;
   if(!isBuy && obv < ma) return true;
   return false;
}

//+------------------------------------------------------------------+
//| DASHBOARD & LOGS                                                 |
//+------------------------------------------------------------------+
void UpdateDashboardAndLogs(bool isTrendAligned, bool isBuy, double winProb, double ev) {
    double rsi = GetIndicatorValue(h_rsi, 0, 0);
    double adx = GetIndicatorValue(h_adx, 0, 0);
    double ofi = CalculateOFI_Display();
    double spread = (double)SymbolInfoInteger(_Symbol, SYMBOL_SPREAD);
    double atr = GetIndicatorValue(h_atr, 0, 0);
     
    double m21 = GetIndicatorValue(h_ema21_m5, 0, 0);
    double m100 = GetIndicatorValue(h_ema100_m5, 0, 0);
     
    string trendStr = isTrendAligned ? (isBuy ? "BULL" : "BEAR") : "MISTO";
    string status = "ATIVO (24H)";
     
    if(!IsGoodTradingHour()) status = "PAUSA(Hora)";
    else if(!IsSpreadAcceptable()) status = "PAUSA(Spread)";
    else if(!IsADXStrong()) status = "PAUSA(ADX)";
     
    string dash = StringFormat(
        "=== V12.7 DASH (EV Debug) ===\nSt: %s | Sp: %.0f\nEMA(21/100): %.5f / %.5f\nTr: %s | RSI: %.2f\nOFI: %.3f | ADX: %.2f\nProb: %.1f%% | EV: %.2f\nPnL: %.2f",
        status, spread, m21, m100, trendStr, rsi, ofi, adx, winProb*100, ev, g_dailyPnL
    );
    Comment(dash);
     
    if(GetTickCount() - g_lastLogTime > 15000) {
        g_lastLogTime = GetTickCount();
        // AQUI ESTA A CORREÇÃO: ADICIONEI O CAMPO EV NO LOG
        Print(StringFormat("LOG 15s | %s | RSI:%.2f | Prob:%.1f%% | EV:%.2f", status, rsi, winProb*100, ev));
    }
}

//+------------------------------------------------------------------+
//| CÁLCULOS                                                         |
//+------------------------------------------------------------------+
double CalculateWinProbability(bool isBuy) {
   double base_prob = 0.30; 
   double m21 = GetIndicatorValue(h_ema21_m5, 0, 0);
   double m100 = GetIndicatorValue(h_ema100_m5, 0, 0);
   
   if(m100 != 0) {
      double dist = MathAbs(m21 - m100) / m100;
      base_prob += MathMin(dist * 100, 0.15); 
   }
   
   if(IsRSIFavorable(isBuy)) base_prob += 0.10;
   if(IsVolumeConfirming(isBuy)) base_prob += 0.10;
   if(GetIndicatorValue(h_adx, 0, 0) > 40) base_prob += 0.10;
   
   bool dummy; if(IsTrendAligned(dummy)) base_prob += 0.15;
   return MathMin(base_prob, 0.90); 
}

double CalculateAdaptiveSL(bool isBuy) {
   double atr = GetIndicatorValue(h_atr, 0, 0);
   if(atr == 0) return 0;
   
   double sl = atr * 1.5;
   long stp = SymbolInfoInteger(_Symbol, SYMBOL_TRADE_STOPS_LEVEL);
   double min = stp * _Point;
   if(sl < min) sl = min + (5 * _Point);
   return sl;
}

double CalculateExpectedValue(double winProb, double slPips, double tpPips) {
   double loseProb = 1.0 - winProb;
   double spread = (double)SymbolInfoInteger(_Symbol, SYMBOL_SPREAD);
   double costs = spread + 1.5; 
   return (winProb * (tpPips - costs)) - (loseProb * (slPips + costs));
}

void ExecuteOptimizedTrade(bool isBuy, double winProb) {
   double slDist = CalculateAdaptiveSL(isBuy);
   if(slDist == 0) return;
   double tpDist = slDist * InpRRRatio;
   
   double probMultiplier = winProb / InpMinWinProbability;
   if(probMultiplier > 1.5) probMultiplier = 1.5; 
   if(probMultiplier < 1.0) probMultiplier = 1.0;
   
   double risk = InpBaseRisk * probMultiplier; 
   if(g_consecutiveLosses >= 3) risk *= 0.5; 
   
   double equity = AccountInfoDouble(ACCOUNT_EQUITY);
   double riskMoney = equity * risk;
   double tickVal = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   if(tickVal == 0) tickVal = 1.0; 
   
   double pointVal = tickVal; 
   double lots = riskMoney / ((slDist / _Point) * pointVal);
   
   double step = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);
   lots = MathFloor(lots / step) * step;
   lots = NormalizeDouble(lots, 2);
   
   double minLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   if(lots < minLot) lots = minLot; 
   if(lots > InpMaxLotPerTrade) lots = InpMaxLotPerTrade; 
   
   double price = isBuy ? SymbolInfoDouble(_Symbol, SYMBOL_ASK) : SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double sl = isBuy ? price - slDist : price + slDist;
   double tp = isBuy ? price + tpDist : price - tpDist;
   
   sl = NormalizeDouble(sl, _Digits);
   tp = NormalizeDouble(tp, _Digits);
   
   string cmt = StringFormat("V12.7|P:%.0f%%", winProb*100);
   
   bool res;
   if(isBuy) res = trade.Buy(lots, _Symbol, price, sl, tp, cmt);
   else res = trade.Sell(lots, _Symbol, price, sl, tp, cmt);
   
   if(res) Print("ORDEM ABERTA (V12.7): ", lots, " Lotes");
   else Print("ERRO ORDEM: ", trade.ResultRetcodeDescription());
}

void UpdateStats() {
   if(TimeCurrent() - g_lastResetDate > 86400) {
       g_dailyPnL = 0; g_consecutiveLosses = 0; g_lastResetDate = TimeCurrent();
   }
}

//+------------------------------------------------------------------+
//| TICK                                                             |
//+------------------------------------------------------------------+
void OnTick() {
   UpdateStats();
   
   bool isBuy = false;
   bool aligned = IsTrendAligned(isBuy);
   double winProb = CalculateWinProbability(isBuy);
   
   double slPips = CalculateAdaptiveSL(isBuy)/_Point;
   double ev = CalculateExpectedValue(winProb, slPips, slPips * InpRRRatio);
   
   UpdateDashboardAndLogs(aligned, isBuy, winProb, ev);
   
   if(PositionsTotal() >= InpMaxOpenPositions) return;
   if(!IsGoodTradingHour()) return;
   if(!IsSpreadAcceptable()) return;
   if(!IsVolatilityInRange()) return;
   if(!IsADXStrong()) return;
   
   if(!aligned) return;
   if(winProb < InpMinWinProbability) return; // 65%
   if(ev < InpMinExpectedValue) return;       // 1.0 (Mais facil passar)
   
   ExecuteOptimizedTrade(isBuy, winProb);
}

void OnTradeTransaction(const MqlTradeTransaction &trans, const MqlTradeRequest &request, const MqlTradeResult &result) {
   if(trans.type == TRADE_TRANSACTION_DEAL_ADD) {
      if(HistoryDealSelect(trans.deal)) {
         if(HistoryDealGetInteger(trans.deal, DEAL_MAGIC) == InpMagicNumber) {
            double profit = HistoryDealGetDouble(trans.deal, DEAL_PROFIT);
            if(profit < 0) g_consecutiveLosses++; else g_consecutiveLosses = 0;
            g_dailyPnL += profit;
         }
      }
   }
}
//+------------------------------------------------------------------+