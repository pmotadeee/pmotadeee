//+------------------------------------------------------------------+
//|                                               PaiMonInvoke.mq5   |
//|                        Copyright 2025, Atous Technology Systems  |
//|       V6.00: High Precision (90%) + ATR Breath Fix + 6 Orders    |
//+------------------------------------------------------------------+
#property copyright "Copyright 2025, Atous Technology Systems"
#property version   "6.00"
#property description "PaiMon Invoke V6: Score > 90%. Trailing Stop solto para evitar saídas prematuras."

#include <Trade\Trade.mqh>
#include <Trade\SymbolInfo.mqh>
#include <Trade\PositionInfo.mqh>
#include <Trade\HistoryOrderInfo.mqh>

//--- INPUTS ---
input group "=== GESTÃO DE RISCO ==="
input double InpMaxDailyLossPercent = 1.0;     // Perda Máxima Diária (% Saldo)
input int    InpMaxOpenPositions    = 6;       // Máximo Global de Ordens (Aumentado para 6)
input double InpMaxLotSize          = 0.20;    // Lote Máximo (Score 100%)
input double InpMinLotSize          = 0.01;    // Lote Mínimo (Score 90%)

input group "=== CRITÉRIOS DE ENTRADA (ELITE) ==="
input int    InpMinConfidence       = 90;      // Score Mínimo (Aumentado para 90%)
input int    InpCooldownMinutes     = 5;       // Tempo entre trades no mesmo par

input group "=== ANÁLISE TÉCNICA ==="
input int    InpVsaPeriod           = 20;      // VSA
input double InpSpreadFactor        = 0.8;     // Spread
input int    InpEmaTrendPeriod      = 200;     // Tendência
input int    InpRsiPeriod           = 14;      // RSI
input int    InpFractalBars         = 5;       // Estrutura Fractal

input group "=== TRAILING STOP (AJUSTADO) ==="
input bool   InpUseTrailing         = true;
input int    InpAtrPeriod           = 20;      // ATR mais suave (20) para evitar ruído M1
input double InpTrailActivate       = 2.0;     // SÓ ATIVA se lucrar 2x a Volatilidade (Evita sair no 0x0)
input double InpTrailDistance       = 2.5;     // Mantém distância de 2.5x para o preço respirar

input group "=== SISTEMA ==="
input int    InpMagicNumber         = 999000;  // Magic V6
input int    InpSlippage            = 10;      
input bool   InpDebugMode           = true;

//--- GLOBAIS ---
CTrade         trade;
CSymbolInfo    symbolInfo;
int            handleEMA;
int            handleRSI;
int            handleATR;
datetime       lastBarTime = 0;
datetime       lastTradeTime = 0; 
double         dailyStartBalance = 0.0;
int            currentDayOfYear = 0;

//+------------------------------------------------------------------+
//| FUNÇÕES AUXILIARES                                               |
//+------------------------------------------------------------------+

bool IsSymbolPositionOpen() {
   for(int i = PositionsTotal() - 1; i >= 0; i--) {
      ulong ticket = PositionGetTicket(i);
      if(ticket > 0) {
         if(PositionGetInteger(POSITION_MAGIC) == InpMagicNumber && PositionGetString(POSITION_SYMBOL) == _Symbol) return true;
      }
   }
   return false;
}

double CalculateScoreLotSize(int score) {
   if(score < InpMinConfidence) return 0.0;
   
   // Normalização: Score 90 = 0.0, Score 100 = 1.0
   double normalized = (double)(score - InpMinConfidence) / (100.0 - InpMinConfidence);
   if(normalized > 1.0) normalized = 1.0;
   if(normalized < 0.0) normalized = 0.0;
   
   double lots = InpMinLotSize + (normalized * (InpMaxLotSize - InpMinLotSize));
   
   double step = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);
   lots = MathFloor(lots / step) * step;
   
   double minAllowed = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double maxAllowed = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
   
   if(lots < minAllowed) lots = minAllowed;
   if(lots > maxAllowed) lots = maxAllowed;
   if(lots > InpMaxLotSize) lots = InpMaxLotSize; 
   
   return lots;
}

bool CheckDailyStopLoss() {
   MqlDateTime dt; TimeCurrent(dt);
   if(dt.day_of_year != currentDayOfYear) {
      currentDayOfYear = dt.day_of_year;
      dailyStartBalance = AccountInfoDouble(ACCOUNT_BALANCE); 
      if(InpDebugMode) Print("=== NOVO DIA V6 === Saldo Base: ", dailyStartBalance);
   }
   if(dailyStartBalance <= 0) dailyStartBalance = AccountInfoDouble(ACCOUNT_BALANCE);

   double dailyProfit = 0.0;
   HistorySelect(iTime(_Symbol, PERIOD_D1, 0), TimeCurrent());
   int deals = HistoryDealsTotal();
   for(int i=0; i<deals; i++) {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket > 0) {
         if(HistoryDealGetInteger(ticket, DEAL_MAGIC) == InpMagicNumber) {
             dailyProfit += HistoryDealGetDouble(ticket, DEAL_PROFIT);
             dailyProfit += HistoryDealGetDouble(ticket, DEAL_SWAP);
             dailyProfit += HistoryDealGetDouble(ticket, DEAL_COMMISSION);
         }
      }
   }
   
   for(int i=PositionsTotal()-1; i>=0; i--) {
       if(PositionGetTicket(i) > 0 && PositionGetInteger(POSITION_MAGIC) == InpMagicNumber) {
           dailyProfit += PositionGetDouble(POSITION_PROFIT);
           dailyProfit += PositionGetDouble(POSITION_SWAP);
       }
   }
   
   double maxLossAmount = dailyStartBalance * (InpMaxDailyLossPercent / 100.0);
   if(dailyProfit <= -maxLossAmount) {
      if(InpDebugMode) PrintFormat("HARD STOP DIÁRIO! Perda: %.2f", dailyProfit);
      return false; 
   }
   return true; 
}

void AutoSetFillingMode() {
   uint filling = (uint)SymbolInfoInteger(_Symbol, SYMBOL_FILLING_MODE);
   if((filling & SYMBOL_FILLING_FOK) == SYMBOL_FILLING_FOK) trade.SetTypeFilling(ORDER_FILLING_FOK);
   else if((filling & SYMBOL_FILLING_IOC) == SYMBOL_FILLING_IOC) trade.SetTypeFilling(ORDER_FILLING_IOC);
   else trade.SetTypeFilling(ORDER_FILLING_RETURN);
}

int CountGlobalPositions() {
   int count = 0;
   for(int i = PositionsTotal() - 1; i >= 0; i--) {
      ulong ticket = PositionGetTicket(i);
      if(ticket > 0 && PositionGetInteger(POSITION_MAGIC) == InpMagicNumber) count++;
   }
   return count;
}

double GetNearestFractalLevel(bool searchUpper) {
   double prices[];
   if(searchUpper) CopyHigh(_Symbol, PERIOD_CURRENT, 0, 100, prices);
   else CopyLow(_Symbol, PERIOD_CURRENT, 0, 100, prices);
   ArraySetAsSeries(prices, true);
   
   // Aumentei o range de busca para garantir estrutura sólida
   for(int i = 3; i < 97; i++) {
      if(searchUpper) {
         if(prices[i] > prices[i-1] && prices[i] > prices[i-2] && prices[i] > prices[i+1] && prices[i] > prices[i+2]) return prices[i];
      } else {
         if(prices[i] < prices[i-1] && prices[i] < prices[i-2] && prices[i] < prices[i+1] && prices[i] < prices[i+2]) return prices[i];
      }
   }
   return (searchUpper ? prices[1] + 100*_Point : prices[1] - 100*_Point);
}

int GetVSASignal(int shift) {
   MqlRates rates[];
   ArraySetAsSeries(rates, true);
   if(CopyRates(_Symbol, PERIOD_CURRENT, 0, 30, rates) < 25) return 0;
   
   double close = rates[shift].close;
   double open  = rates[shift].open;
   long   vol   = rates[shift].tick_volume;
   long volPrev1 = rates[shift+1].tick_volume;
   long volPrev2 = rates[shift+2].tick_volume;
   
   double sumRange = 0;
   for(int k = 1; k <= InpVsaPeriod; k++) sumRange += (rates[shift+k].high - rates[shift+k].low);
   double avgRange = sumRange / InpVsaPeriod;
   
   bool isLowVol = (vol < volPrev1) && (vol < volPrev2);
   bool isNarrowSpread = (rates[shift].high - rates[shift].low) < (avgRange * InpSpreadFactor);
   
   if(!isLowVol || !isNarrowSpread) return 0;
   if(close >= open) return -1; // No Demand
   if(close < open) return 1;   // No Supply
   return 0;
}

// CORREÇÃO DO TRAILING: Lógica mais solta para deixar o trade correr
void ManageTrailingStop() {
   if(!InpUseTrailing) return;
   double atr[]; ArraySetAsSeries(atr, true);
   if(CopyBuffer(handleATR, 0, 0, 1, atr) < 1) return;
   double volVal = atr[0];

   for(int i = PositionsTotal() - 1; i >= 0; i--) {
      if(PositionGetSymbol(i) != _Symbol) continue; 
      ulong ticket = PositionGetTicket(i);
      if(ticket <= 0) continue;
      if(PositionGetInteger(POSITION_MAGIC) != InpMagicNumber) continue;

      long type = PositionGetInteger(POSITION_TYPE);
      double current = PositionGetDouble(POSITION_PRICE_CURRENT);
      double open = PositionGetDouble(POSITION_PRICE_OPEN);
      double sl = PositionGetDouble(POSITION_SL);
      double tp = PositionGetDouble(POSITION_TP);
      
      double newSL = 0.0;
      bool modify = false;
      
      long stopLevel = SymbolInfoInteger(_Symbol, SYMBOL_TRADE_STOPS_LEVEL);
      double minDist = (stopLevel + 10) * _Point;

      // Calculo do Trailing mais largo
      double activationDist = volVal * InpTrailActivate;
      double trailDist = volVal * InpTrailDistance;

      if(type == POSITION_TYPE_BUY) {
         // Só move se o lucro > 2.0x ATR (Antes era 1.0x)
         if((current - open) > activationDist) {
            double trail = current - trailDist;
            
            // Se o trailing calculado invadir a zona proibida do broker, afasta ele
            if (current - trail < minDist) trail = current - minDist;

            // Se o trailing estiver abaixo da entrada, move para Breakeven pelo menos
            if(trail < open) trail = open + _Point; 
            
            if(trail > sl) { newSL = NormalizeDouble(trail, _Digits); modify = true; }
         }
      } else if(type == POSITION_TYPE_SELL) {
         if((open - current) > activationDist) {
            double trail = current + trailDist;
            
            if (trail - current < minDist) trail = current + minDist;

            if(trail > open) trail = open - _Point; 
            
            if(trail < sl || sl == 0) { newSL = NormalizeDouble(trail, _Digits); modify = true; }
         }
      }
      if(modify) trade.PositionModify(ticket, newSL, tp);
   }
}

int CalculateConfidenceScore(bool isBuy, double currentPrice, double slPrice) {
   int score = 40; // Base VSA (Forte)
   
   double ema[]; CopyBuffer(handleEMA, 0, 0, 1, ema);
   // Tendência é crucial para Score > 90
   if(isBuy && currentPrice > ema[0]) score += 20;       
   else if(!isBuy && currentPrice < ema[0]) score += 20; 
   
   double rsi[]; CopyBuffer(handleRSI, 0, 0, 1, rsi);
   if(isBuy) {
      if(rsi[0] > 30 && rsi[0] < 60) score += 20; 
      else if(rsi[0] <= 30) score += 10;          
   } else {
      if(rsi[0] > 40 && rsi[0] < 70) score += 20; 
      else if(rsi[0] >= 70) score += 10;          
   }
   
   double slDist = MathAbs(currentPrice - slPrice) / _Point;
   if(slDist >= 50) score += 20; 
   else score += 5;               
   
   return score;
}

//+------------------------------------------------------------------+
//| MAIN FUNCTIONS                                                   |
//+------------------------------------------------------------------+
int OnInit() {
   if(!symbolInfo.Name(_Symbol)) return INIT_FAILED;
   symbolInfo.Refresh();
   trade.SetExpertMagicNumber(InpMagicNumber);
   trade.SetDeviationInPoints(InpSlippage);
   AutoSetFillingMode();
   
   handleEMA = iMA(_Symbol, PERIOD_CURRENT, InpEmaTrendPeriod, 0, MODE_EMA, PRICE_CLOSE);
   handleRSI = iRSI(_Symbol, PERIOD_CURRENT, InpRsiPeriod, PRICE_CLOSE);
   handleATR = iATR(_Symbol, PERIOD_CURRENT, InpAtrPeriod); // ATR 20 para suavizar
   
   if(handleEMA == INVALID_HANDLE || handleRSI == INVALID_HANDLE || handleATR == INVALID_HANDLE) return INIT_FAILED;
   
   MathSrand(GetTickCount());
   Print("=== PaiMon Invoke V6.00 (SNIPER ELITE) ===");
   Print("Score > ", InpMinConfidence, "% | Trailing: ", InpTrailActivate, "x ATR (Ativação)");
   return INIT_SUCCEEDED;
}

void OnDeinit(const int reason) {
   IndicatorRelease(handleEMA);
   IndicatorRelease(handleRSI);
   IndicatorRelease(handleATR);
}

void OnTick() {
   if(!symbolInfo.RefreshRates()) return;
   
   ManageTrailingStop();
   if(!CheckDailyStopLoss()) return;
   if(CountGlobalPositions() >= InpMaxOpenPositions) return;
   if(IsSymbolPositionOpen()) return;

   datetime currentTime = iTime(_Symbol, PERIOD_CURRENT, 0);
   if(currentTime == lastBarTime) return; 
   lastBarTime = currentTime;

   if(TimeCurrent() < lastTradeTime + (InpCooldownMinutes * 60)) return;

   int vsaSignal = GetVSASignal(1); 
   if(vsaSignal == 0) return;

   double stopLossPrice = 0.0;
   double entryPrice = 0.0;
   bool isBuy = false;

   if(vsaSignal == 1) { 
      isBuy = true; entryPrice = symbolInfo.Ask();
      stopLossPrice = GetNearestFractalLevel(false); 
      if(stopLossPrice >= entryPrice) return; 
   } else { 
      isBuy = false; entryPrice = symbolInfo.Bid();
      stopLossPrice = GetNearestFractalLevel(true);
      if(stopLossPrice <= entryPrice) return;
   }

   long stopLevel = SymbolInfoInteger(_Symbol, SYMBOL_TRADE_STOPS_LEVEL);
   double minDist = (stopLevel + 20) * _Point;
   double safeDist = (double)SymbolInfoInteger(_Symbol, SYMBOL_SPREAD) * _Point + minDist;

   if(MathAbs(entryPrice - stopLossPrice) < safeDist) {
      if(isBuy) stopLossPrice = entryPrice - safeDist;
      else      stopLossPrice = entryPrice + safeDist;
   }

   // Filtro Sniper (90%)
   int confidence = CalculateConfidenceScore(isBuy, entryPrice, stopLossPrice);
   if(confidence < InpMinConfidence) {
      if(InpDebugMode) Print("Score: ", confidence, "% (Wait for 90%)");
      return;
   }

   double lotSize = CalculateScoreLotSize(confidence);
   if(lotSize <= 0) return;

   // Margem Check
   double marginRequired = 0.0;
   ENUM_ORDER_TYPE oType = isBuy ? ORDER_TYPE_BUY : ORDER_TYPE_SELL;
   if(OrderCalcMargin(oType, _Symbol, lotSize, SymbolInfoDouble(_Symbol, SYMBOL_ASK), marginRequired)) {
      if(marginRequired > AccountInfoDouble(ACCOUNT_MARGIN_FREE)) {
         Print("Margem insuficiente. Abortar.");
         return; 
      }
   }

   symbolInfo.RefreshRates();
   entryPrice = isBuy ? symbolInfo.Ask() : symbolInfo.Bid();
   
   if(isBuy) { if(entryPrice - stopLossPrice < safeDist) stopLossPrice = entryPrice - safeDist; }
   else { if(stopLossPrice - entryPrice < safeDist) stopLossPrice = entryPrice + safeDist; }

   double tp = 0.0;
   double finalRiskDist = MathAbs(entryPrice - stopLossPrice);
   
   if(isBuy) tp = entryPrice + (finalRiskDist * 1.5);
   else      tp = entryPrice - (finalRiskDist * 1.5);

   if(IsSymbolPositionOpen()) return;

   bool res = false;
   if(isBuy) {
      stopLossPrice = NormalizeDouble(stopLossPrice, _Digits);
      tp = NormalizeDouble(tp, _Digits);
      res = trade.Buy(lotSize, _Symbol, entryPrice, stopLossPrice, tp, "PaiMon V6 Score:"+IntegerToString(confidence));
   } else {
      stopLossPrice = NormalizeDouble(stopLossPrice, _Digits);
      tp = NormalizeDouble(tp, _Digits);
      res = trade.Sell(lotSize, _Symbol, entryPrice, stopLossPrice, tp, "PaiMon V6 Score:"+IntegerToString(confidence));
   }
   
   if(res) {
      lastTradeTime = TimeCurrent();
      Print("PaiMon V6 SNIPER: Ordem Enviada. Score: ", confidence, "%");
   }
}
//+------------------------------------------------------------------+