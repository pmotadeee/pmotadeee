//+------------------------------------------------------------------+
//|                     Auto_Trend_MeshV14_AsianPro.mq5              |
//|                          Copyright 2025, Asian Session Pro       |
//| V14.0: ML + Trailing + Breakeven + Correlação                    |
//|        Target: 70%+ Winrate com IA Adaptativa                    |
//+------------------------------------------------------------------+
#property copyright "Copyright 2025, Asian Session Pro"
#property version   "14.00"
#property description "V14.0: IA + Trailing + BE + Correlação"

#include <Trade\Trade.mqh>
#include <Trade\SymbolInfo.mqh>
#include <Trade\PositionInfo.mqh>

//--- OBJETOS GLOBAIS
CTrade trade;
CSymbolInfo symbolInfo;
CPositionInfo positionInfo;

//--- HANDLES
int h_ema21_m5, h_ema100_m5, h_ema21_h1, h_ema100_h1;
int h_rsi, h_atr, h_adx, h_obv, h_bb, h_ema9_m5;

//--- INPUTS PRINCIPAIS
input group "=== RISCO E GESTÃO ==="
input double InpBaseRisk = 0.008;             // Risco Base (0.8%)
input double InpMaxLotPerTrade = 3.0;         // Lote Máximo
input int    InpMaxOpenPositions = 2;         // Posições Simultâneas
input int    InpMagicNumber = 999140;         // Magic Number V14.0

input group "=== PROBABILIDADE ==="
input double InpMinWinProbability = 0.70;     // Prob Mínima 70%
input double InpMinConfidenceScore = 80;      // Score Mínimo
input double InpMinExpectedValue = 1.5;       // EV Mínimo
input int    InpADXThreshold = 18;            // ADX Mínimo
input double InpRRRatio = 2.2;                // Risk/Reward

input group "=== TRAILING STOP ==="
input bool   InpUseTrailing = true;           // Ativar Trailing Stop
input double InpTrailingStart = 1.2;          // Iniciar em X*ATR lucro
input double InpTrailingStep = 0.4;           // Passo do Trailing (ATR)
input double InpTrailingDistance = 1.0;       // Distância do preço (ATR)

input group "=== BREAKEVEN ==="
input bool   InpUseBreakeven = true;          // Ativar Breakeven
input double InpBreakevenTrigger = 1.0;       // Gatilho em X*ATR
input double InpBreakevenOffset = 0.3;        // Offset acima Entry (ATR)

input group "=== CORRELAÇÃO ==="
input bool   InpCheckCorrelation = true;      // Checar Correlação
input double InpMaxCorrelation = 0.70;        // Correlação Máxima
input int    InpCorrelationBars = 100;        // Barras para Cálculo

input group "=== MACHINE LEARNING ==="
input bool   InpUseML = true;                 // Ativar ML
input int    InpMLHistorySize = 50;           // Trades para Aprender
input double InpMLAdaptSpeed = 0.15;          // Velocidade Adaptação

input group "=== HORÁRIO E PROTEÇÃO ==="
input int    InpStartHour = 0;                // Hora Início
input int    InpEndHour = 7;                  // Hora Fim
input int    InpMaxConsecutiveLosses = 3;     // Circuit Breaker
input double InpMaxDailyLossPercent = 0.02;   // Loss Diário Máx

//--- ESTRUTURAS
struct MarketContext {
   bool isRange;
   bool isTrending;
   double volatility;
   double avgVolatility;
   int trendStrength;
   double momentum;
};

struct TradeRecord {
   datetime openTime;
   bool isBuy;
   double openPrice;
   double closePrice;
   double profit;
   double winProb;
   double confScore;
   bool wasWin;
};

struct MLParameters {
   double probThreshold;      // Limiar de probabilidade
   double confThreshold;      // Limiar de confiança
   double rrRatio;            // Risk/Reward
   double adxThreshold;       // ADX mínimo
   double avgWinRate;         // Winrate médio
   int totalTrades;           // Total de trades
   int wins;                  // Vitórias
};

struct CorrelationData {
   string symbol;
   double correlation;
   bool hasPosition;
};

//--- ESTADO GLOBAL
int g_consecutiveLosses = 0;
double g_dailyPnL = 0.0;
datetime g_lastResetDate = 0;
double g_initialBalance = 0;
uint g_lastLogTime = 0;
datetime g_lastTradeTime = 0;

TradeRecord g_tradeHistory[];
MLParameters g_mlParams;
datetime g_lastTrailingCheck = 0;
datetime g_lastBECheck = 0;

//+------------------------------------------------------------------+
//| INIT                                                             |
//+------------------------------------------------------------------+
int OnInit() {
   if(!symbolInfo.Name(_Symbol)) return INIT_FAILED;
   symbolInfo.Refresh();
   
   trade.SetExpertMagicNumber(InpMagicNumber);
   trade.SetDeviationInPoints(30);
   
   uint filling = (uint)SymbolInfoInteger(_Symbol, SYMBOL_FILLING_MODE);
   if((filling & SYMBOL_FILLING_FOK) == SYMBOL_FILLING_FOK) 
      trade.SetTypeFilling(ORDER_FILLING_FOK);
   else if((filling & SYMBOL_FILLING_IOC) == SYMBOL_FILLING_IOC) 
      trade.SetTypeFilling(ORDER_FILLING_IOC);
   else 
      trade.SetTypeFilling(ORDER_FILLING_RETURN);
   
   trade.SetAsyncMode(false);
   
   // Indicadores
   h_ema9_m5 = iMA(_Symbol, PERIOD_M5, 9, 0, MODE_EMA, PRICE_CLOSE);
   h_ema21_m5 = iMA(_Symbol, PERIOD_M5, 21, 0, MODE_EMA, PRICE_CLOSE);
   h_ema100_m5 = iMA(_Symbol, PERIOD_M5, 100, 0, MODE_EMA, PRICE_CLOSE);
   h_rsi = iRSI(_Symbol, PERIOD_M5, 14, PRICE_CLOSE);
   h_atr = iATR(_Symbol, PERIOD_M5, 14);
   h_adx = iADX(_Symbol, PERIOD_M5, 14);
   h_obv = iOBV(_Symbol, PERIOD_M5, VOLUME_TICK);
   h_bb = iBands(_Symbol, PERIOD_M5, 20, 0, 2.0, PRICE_CLOSE);
   h_ema21_h1 = iMA(_Symbol, PERIOD_H1, 21, 0, MODE_EMA, PRICE_CLOSE);
   h_ema100_h1 = iMA(_Symbol, PERIOD_H1, 100, 0, MODE_EMA, PRICE_CLOSE);
   
   if(h_ema21_m5 == INVALID_HANDLE) return INIT_FAILED;
   
   g_initialBalance = AccountInfoDouble(ACCOUNT_BALANCE);
   g_lastResetDate = TimeCurrent();
   
   // Inicializa ML
   InitializeML();
   
   Print("═════════════════════════════════════");
   Print("V14.0 ASIAN SESSION PRO INICIADO");
   Print("✓ Trailing Stop: ", InpUseTrailing ? "ON" : "OFF");
   Print("✓ Breakeven: ", InpUseBreakeven ? "ON" : "OFF");
   Print("✓ Correlação: ", InpCheckCorrelation ? "ON" : "OFF");
   Print("✓ Machine Learning: ", InpUseML ? "ON" : "OFF");
   Print("═════════════════════════════════════");
   
   return INIT_SUCCEEDED;
}

void OnDeinit(const int reason) {
   IndicatorRelease(h_ema9_m5); IndicatorRelease(h_ema21_m5);
   IndicatorRelease(h_ema100_m5); IndicatorRelease(h_ema21_h1);
   IndicatorRelease(h_ema100_h1); IndicatorRelease(h_rsi);
   IndicatorRelease(h_atr); IndicatorRelease(h_adx);
   IndicatorRelease(h_obv); IndicatorRelease(h_bb);
   
   // Salva dados ML
   if(InpUseML) SaveMLData();
   
   Comment("");
   Print("V14.0 FINALIZADO | Trades: ", g_mlParams.totalTrades, 
         " | WR: ", g_mlParams.avgWinRate * 100, "%");
}

//+------------------------------------------------------------------+
//| HELPERS                                                          |
//+------------------------------------------------------------------+
double GetIndicatorValue(int handle, int buffer, int index) {
   double val[]; ArraySetAsSeries(val, true);
   if(CopyBuffer(handle, buffer, index, 1, val) < 1) return 0.0;
   return val[0];
}

//+------------------------------------------------------------------+
//| MACHINE LEARNING                                                 |
//+------------------------------------------------------------------+
void InitializeML() {
   g_mlParams.probThreshold = InpMinWinProbability;
   g_mlParams.confThreshold = InpMinConfidenceScore;
   g_mlParams.rrRatio = InpRRRatio;
   g_mlParams.adxThreshold = InpADXThreshold;
   g_mlParams.avgWinRate = 0.50;
   g_mlParams.totalTrades = 0;
   g_mlParams.wins = 0;
   
   ArrayResize(g_tradeHistory, 0);
   
   // Tenta carregar dados anteriores
   LoadMLData();
}

void LoadMLData() {
   int file = FileOpen("AsianSession_ML.dat", FILE_READ|FILE_BIN);
   if(file != INVALID_HANDLE) {
      g_mlParams.probThreshold = FileReadDouble(file);
      g_mlParams.confThreshold = FileReadDouble(file);
      g_mlParams.rrRatio = FileReadDouble(file);
      g_mlParams.adxThreshold = FileReadDouble(file);
      g_mlParams.avgWinRate = FileReadDouble(file);
      g_mlParams.totalTrades = FileReadInteger(file);
      g_mlParams.wins = FileReadInteger(file);
      FileClose(file);
      
      Print("✓ ML: Dados carregados | Trades: ", g_mlParams.totalTrades, 
            " | WR: ", g_mlParams.avgWinRate * 100, "%");
   }
}

void SaveMLData() {
   int file = FileOpen("AsianSession_ML.dat", FILE_WRITE|FILE_BIN);
   if(file != INVALID_HANDLE) {
      FileWriteDouble(file, g_mlParams.probThreshold);
      FileWriteDouble(file, g_mlParams.confThreshold);
      FileWriteDouble(file, g_mlParams.rrRatio);
      FileWriteDouble(file, g_mlParams.adxThreshold);
      FileWriteDouble(file, g_mlParams.avgWinRate);
      FileWriteInteger(file, g_mlParams.totalTrades);
      FileWriteInteger(file, g_mlParams.wins);
      FileClose(file);
   }
}

void UpdateMLModel(const TradeRecord &trade) {
   if(!InpUseML) return;
   
   // Adiciona ao histórico
   int size = ArraySize(g_tradeHistory);
   if(size >= InpMLHistorySize) {
      // Remove mais antigo
      for(int i=0; i<size-1; i++) {
         g_tradeHistory[i] = g_tradeHistory[i+1];
      }
      size--;
   }
   
   ArrayResize(g_tradeHistory, size + 1);
   g_tradeHistory[size] = trade;
   
   // Atualiza estatísticas
   g_mlParams.totalTrades++;
   if(trade.wasWin) g_mlParams.wins++;
   
   g_mlParams.avgWinRate = (double)g_mlParams.wins / g_mlParams.totalTrades;
   
   // Adaptação de parâmetros (apenas se temos histórico suficiente)
   if(g_mlParams.totalTrades >= 20) {
      double targetWR = 0.70;
      double currentWR = g_mlParams.avgWinRate;
      
      // Se winrate está abaixo do alvo, aumenta rigor
      if(currentWR < targetWR) {
         g_mlParams.probThreshold += InpMLAdaptSpeed * (targetWR - currentWR);
         g_mlParams.confThreshold += InpMLAdaptSpeed * 50 * (targetWR - currentWR);
         g_mlParams.adxThreshold += InpMLAdaptSpeed * 20 * (targetWR - currentWR);
         
         // Limites
         if(g_mlParams.probThreshold > 0.85) g_mlParams.probThreshold = 0.85;
         if(g_mlParams.confThreshold > 95) g_mlParams.confThreshold = 95;
         if(g_mlParams.adxThreshold > 30) g_mlParams.adxThreshold = 30;
         
         Print("🤖 ML: Aumentando rigor | Prob: ", g_mlParams.probThreshold,
               " | Conf: ", g_mlParams.confThreshold);
      }
      // Se winrate está muito acima, pode relaxar um pouco
      else if(currentWR > targetWR + 0.10) {
         g_mlParams.probThreshold -= InpMLAdaptSpeed * 0.5 * (currentWR - targetWR);
         g_mlParams.confThreshold -= InpMLAdaptSpeed * 25 * (currentWR - targetWR);
         
         // Limites mínimos
         if(g_mlParams.probThreshold < InpMinWinProbability) 
            g_mlParams.probThreshold = InpMinWinProbability;
         if(g_mlParams.confThreshold < InpMinConfidenceScore) 
            g_mlParams.confThreshold = InpMinConfidenceScore;
         
         Print("🤖 ML: Relaxando filtros | WR atual: ", currentWR * 100, "%");
      }
   }
   
   // Salva periodicamente
   if(g_mlParams.totalTrades % 10 == 0) SaveMLData();
}

double GetMLAdjustedProbThreshold() {
   return InpUseML ? g_mlParams.probThreshold : InpMinWinProbability;
}

double GetMLAdjustedConfThreshold() {
   return InpUseML ? g_mlParams.confThreshold : InpMinConfidenceScore;
}

//+------------------------------------------------------------------+
//| CORRELAÇÃO ENTRE PARES                                           |
//+------------------------------------------------------------------+
double CalculateCorrelation(string symbol1, string symbol2, int bars) {
   double close1[], close2[];
   ArraySetAsSeries(close1, true);
   ArraySetAsSeries(close2, true);
   
   if(CopyClose(symbol1, PERIOD_H1, 0, bars, close1) < bars) return 0;
   if(CopyClose(symbol2, PERIOD_H1, 0, bars, close2) < bars) return 0;
   
   // Calcula retornos
   double ret1[], ret2[];
   ArrayResize(ret1, bars-1);
   ArrayResize(ret2, bars-1);
   
   for(int i=0; i<bars-1; i++) {
      ret1[i] = (close1[i] - close1[i+1]) / close1[i+1];
      ret2[i] = (close2[i] - close2[i+1]) / close2[i+1];
   }
   
   // Correlação de Pearson
   double mean1=0, mean2=0;
   for(int i=0; i<bars-1; i++) {
      mean1 += ret1[i];
      mean2 += ret2[i];
   }
   mean1 /= (bars-1);
   mean2 /= (bars-1);
   
   double num=0, den1=0, den2=0;
   for(int i=0; i<bars-1; i++) {
      double d1 = ret1[i] - mean1;
      double d2 = ret2[i] - mean2;
      num += d1 * d2;
      den1 += d1 * d1;
      den2 += d2 * d2;
   }
   
   double denom = MathSqrt(den1 * den2);
   return (denom > 0) ? num / denom : 0;
}

bool CheckCorrelationOverexposure(bool isBuy) {
   if(!InpCheckCorrelation) return false;
   
   // Lista de símbolos relacionados comuns
   string relatedSymbols[];
   string current = _Symbol;
   
   if(StringFind(current, "USD") >= 0) {
      ArrayResize(relatedSymbols, 6);
      relatedSymbols[0] = "EURUSD";
      relatedSymbols[1] = "GBPUSD";
      relatedSymbols[2] = "USDJPY";
      relatedSymbols[3] = "AUDUSD";
      relatedSymbols[4] = "NZDUSD";
      relatedSymbols[5] = "USDCHF";
   }
   
   int correlatedPositions = 0;
   
   // Verifica posições existentes
   for(int i=0; i<PositionsTotal(); i++) {
      if(positionInfo.SelectByIndex(i)) {
         if(positionInfo.Magic() == InpMagicNumber) {
            string posSymbol = positionInfo.Symbol();
            
            // Calcula correlação
            for(int j=0; j<ArraySize(relatedSymbols); j++) {
               if(relatedSymbols[j] == posSymbol || relatedSymbols[j] == current) {
                  double corr = CalculateCorrelation(current, posSymbol, 
                                                   InpCorrelationBars);
                  
                  // Se correlação alta E mesma direção
                  bool sameDirection = (isBuy && positionInfo.PositionType() == POSITION_TYPE_BUY) ||
                                      (!isBuy && positionInfo.PositionType() == POSITION_TYPE_SELL);
                  
                  if(MathAbs(corr) > InpMaxCorrelation && sameDirection) {
                     correlatedPositions++;
                     Print("⚠ CORRELAÇÃO: ", current, " x ", posSymbol, 
                           " = ", corr);
                  }
               }
            }
         }
      }
   }
   
   return (correlatedPositions > 0);
}

//+------------------------------------------------------------------+
//| TRAILING STOP                                                    |
//+------------------------------------------------------------------+
void ManageTrailingStop() {
   if(!InpUseTrailing) return;
   if(TimeCurrent() - g_lastTrailingCheck < 5) return; // A cada 5 segundos
   
   g_lastTrailingCheck = TimeCurrent();
   
   double atr = GetIndicatorValue(h_atr, 0, 0);
   if(atr == 0) return;
   
   for(int i=0; i<PositionsTotal(); i++) {
      if(positionInfo.SelectByIndex(i)) {
         if(positionInfo.Magic() != InpMagicNumber) continue;
         if(positionInfo.Symbol() != _Symbol) continue;
         
         bool isBuy = (positionInfo.PositionType() == POSITION_TYPE_BUY);
         double openPrice = positionInfo.PriceOpen();
         double currentPrice = isBuy ? SymbolInfoDouble(_Symbol, SYMBOL_BID) :
                                      SymbolInfoDouble(_Symbol, SYMBOL_ASK);
         double currentSL = positionInfo.StopLoss();
         
         // Calcula lucro em ATR
         double profit = isBuy ? (currentPrice - openPrice) : (openPrice - currentPrice);
         double profitATR = profit / atr;
         
         // Só ativa trailing após lucro mínimo
         if(profitATR < InpTrailingStart) continue;
         
         // Calcula novo SL
         double trailingDist = atr * InpTrailingDistance;
         double newSL = isBuy ? currentPrice - trailingDist : 
                                currentPrice + trailingDist;
         
         newSL = NormalizeDouble(newSL, _Digits);
         
         // Move SL apenas se melhorar (nunca piora)
         bool shouldMove = false;
         if(isBuy && newSL > currentSL + _Point * 10) shouldMove = true;
         if(!isBuy && (currentSL == 0 || newSL < currentSL - _Point * 10)) shouldMove = true;
         
         if(shouldMove) {
            if(trade.PositionModify(positionInfo.Ticket(), newSL, positionInfo.TakeProfit())) {
               Print("✓ TRAILING: ", positionInfo.Symbol(), " | Novo SL: ", newSL,
                     " | Lucro: ", profitATR, " ATR");
            }
         }
      }
   }
}

//+------------------------------------------------------------------+
//| BREAKEVEN                                                        |
//+------------------------------------------------------------------+
void ManageBreakeven() {
   if(!InpUseBreakeven) return;
   if(TimeCurrent() - g_lastBECheck < 10) return; // A cada 10 segundos
   
   g_lastBECheck = TimeCurrent();
   
   double atr = GetIndicatorValue(h_atr, 0, 0);
   if(atr == 0) return;
   
   for(int i=0; i<PositionsTotal(); i++) {
      if(positionInfo.SelectByIndex(i)) {
         if(positionInfo.Magic() != InpMagicNumber) continue;
         if(positionInfo.Symbol() != _Symbol) continue;
         
         bool isBuy = (positionInfo.PositionType() == POSITION_TYPE_BUY);
         double openPrice = positionInfo.PriceOpen();
         double currentPrice = isBuy ? SymbolInfoDouble(_Symbol, SYMBOL_BID) :
                                      SymbolInfoDouble(_Symbol, SYMBOL_ASK);
         double currentSL = positionInfo.StopLoss();
         
         // Verifica se SL já está em BE
         double spread = SymbolInfoInteger(_Symbol, SYMBOL_SPREAD) * _Point;
         bool alreadyBE = false;
         if(isBuy && currentSL >= openPrice - _Point * 5) alreadyBE = true;
         if(!isBuy && currentSL <= openPrice + _Point * 5) alreadyBE = true;
         
         if(alreadyBE) continue;
         
         // Calcula lucro
         double profit = isBuy ? (currentPrice - openPrice) : (openPrice - currentPrice);
         double profitATR = profit / atr;
         
         // Ativa BE?
         if(profitATR >= InpBreakevenTrigger) {
            double offset = atr * InpBreakevenOffset;
            double newSL = isBuy ? openPrice + offset : openPrice - offset;
            newSL = NormalizeDouble(newSL, _Digits);
            
            if(trade.PositionModify(positionInfo.Ticket(), newSL, positionInfo.TakeProfit())) {
               Print("✓ BREAKEVEN: ", positionInfo.Symbol(), " | SL: ", newSL);
            }
         }
      }
   }
}

//+------------------------------------------------------------------+
//| ANÁLISE DE CONTEXTO                                              |
//+------------------------------------------------------------------+
MarketContext AnalyzeMarketContext() {
   MarketContext ctx;
   
   double atr = GetIndicatorValue(h_atr, 0, 0);
   double atrArr[]; ArraySetAsSeries(atrArr, true);
   if(CopyBuffer(h_atr, 0, 0, 20, atrArr) >= 20) {
      double sum = 0;
      for(int i=0; i<20; i++) sum += atrArr[i];
      ctx.avgVolatility = sum / 20.0;
      ctx.volatility = atr;
   }
   
   double bb_upper = GetIndicatorValue(h_bb, 1, 0);
   double bb_lower = GetIndicatorValue(h_bb, 2, 0);
   double bb_middle = GetIndicatorValue(h_bb, 0, 0);
   double price = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   
   double bb_width = bb_upper - bb_lower;
   double bb_width_pct = (bb_middle > 0) ? (bb_width / bb_middle) * 100 : 0;
   double price_position = (bb_upper - bb_lower > 0) ? 
                           (price - bb_lower) / (bb_upper - bb_lower) : 0.5;
   
   ctx.isRange = (bb_width_pct < 0.5 && price_position > 0.3 && price_position < 0.7);
   
   double adx = GetIndicatorValue(h_adx, 0, 0);
   double ema21 = GetIndicatorValue(h_ema21_m5, 0, 0);
   double ema100 = GetIndicatorValue(h_ema100_m5, 0, 0);
   
   double ema_separation = (ema100 > 0) ? MathAbs(ema21 - ema100) / ema100 * 100 : 0;
   
   ctx.trendStrength = (int)(adx * 0.6 + ema_separation * 400);
   if(ctx.trendStrength > 100) ctx.trendStrength = 100;
   
   ctx.isTrending = (adx > 20 && ema_separation > 0.003);
   
   double rsi = GetIndicatorValue(h_rsi, 0, 0);
   ctx.momentum = (rsi - 50) / 50;
   
   return ctx;
}

//+------------------------------------------------------------------+
//| FILTROS                                                          |
//+------------------------------------------------------------------+
bool IsAsianSessionActive() {
   MqlDateTime dt;
   TimeToStruct(TimeCurrent(), dt);
   return (dt.hour >= InpStartHour && dt.hour < InpEndHour);
}

bool IsSpreadAcceptableAsian() {
   double spread = (double)SymbolInfoInteger(_Symbol, SYMBOL_SPREAD);
   string symbol = _Symbol;
   double maxSpread = 60.0;
   
   if(StringFind(symbol, "XAU") >= 0) maxSpread = 400.0;
   else if(StringFind(symbol, "XAG") >= 0) maxSpread = 350.0;
   else if(StringFind(symbol, "JPY") >= 0) maxSpread = 40.0;
   else if(StringFind(symbol, "AUD") >= 0 || StringFind(symbol, "NZD") >= 0) 
      maxSpread = 35.0;
   
   return (spread <= maxSpread);
}

bool IsVolatilityOptimalAsian(const MarketContext &ctx) {
   if(ctx.volatility < ctx.avgVolatility * 0.15) return false;
   if(ctx.volatility > ctx.avgVolatility * 4.0) return false;
   return true;
}

bool HasMinimumMovement() {
   double high[], low[];
   ArraySetAsSeries(high, true);
   ArraySetAsSeries(low, true);
   
   if(CopyHigh(_Symbol, PERIOD_M5, 0, 5, high) < 5) return false;
   if(CopyLow(_Symbol, PERIOD_M5, 0, 5, low) < 5) return false;
   
   double totalRange = 0;
   for(int i=0; i<5; i++) totalRange += (high[i] - low[i]);
   
   double avgRange = totalRange / 5.0;
   double atr = GetIndicatorValue(h_atr, 0, 0);
   
   return (avgRange > atr * 0.3);
}

//+------------------------------------------------------------------+
//| SCORE E PROBABILIDADE                                            |
//+------------------------------------------------------------------+
double CalculateConfidenceScore(bool isBuy, const MarketContext &ctx) {
   double score = 0;
   
   double ema9 = GetIndicatorValue(h_ema9_m5, 0, 0);
   double ema21 = GetIndicatorValue(h_ema21_m5, 0, 0);
   double ema100 = GetIndicatorValue(h_ema100_m5, 0, 0);
   double h21 = GetIndicatorValue(h_ema21_h1, 0, 0);
   double h100 = GetIndicatorValue(h_ema100_h1, 0, 0);
   
   bool m5_aligned = isBuy ? (ema9 > ema21 && ema21 > ema100) : 
                             (ema9 < ema21 && ema21 < ema100);
   bool h1_aligned = isBuy ? (h21 > h100) : (h21 < h100);
   
   if(m5_aligned && h1_aligned) score += 25;
   else if(m5_aligned || h1_aligned) score += 12;
   
   double rsi = GetIndicatorValue(h_rsi, 0, 0);
   if(isBuy && rsi > 45 && rsi < 65) score += 20;
   else if(!isBuy && rsi > 35 && rsi < 55) score += 20;
   else if(isBuy && rsi > 40 && rsi < 70) score += 10;
   else if(!isBuy && rsi > 30 && rsi < 60) score += 10;
   
   double adx = GetIndicatorValue(h_adx, 0, 0);
   if(adx >= 25) score += 15;
   else if(adx >= 18) score += 10;
   else if(adx >= 15) score += 5;
   
   double obv = GetIndicatorValue(h_obv, 0, 0);
   double obvArr[]; ArraySetAsSeries(obvArr, true);
   if(CopyBuffer(h_obv, 0, 0, 10, obvArr) >= 10) {
      double sum = 0;
      for(int i=0; i<10; i++) sum += obvArr[i];
      double ma = sum / 10.0;
      
      if(isBuy && obv > ma * 1.05) score += 15;
      else if(!isBuy && obv < ma * 0.95) score += 15;
      else if(isBuy && obv > ma) score += 8;
      else if(!isBuy && obv < ma) score += 8;
   }
   
   if(ctx.isTrending && !ctx.isRange) score += 15;
   else if(ctx.isRange) score += 5;
   
   if(ctx.volatility > ctx.avgVolatility * 0.8 && 
      ctx.volatility < ctx.avgVolatility * 1.5) score += 10;
   else if(ctx.volatility > ctx.avgVolatility * 0.5) score += 5;
   
   return score;
}

double CalculateWinProbabilityAsian(bool isBuy, const MarketContext &ctx, double confScore) {
   double base_prob = 0.35;
   
   base_prob += (confScore / 100.0) * 0.30;
   
   if(ctx.trendStrength > 60) base_prob += 0.12;
   else if(ctx.trendStrength > 40) base_prob += 0.08;
   
   double ema21_m5 = GetIndicatorValue(h_ema21_m5, 0, 0);
   double ema100_m5 = GetIndicatorValue(h_ema100_m5, 0, 0);
   double ema21_h1 = GetIndicatorValue(h_ema21_h1, 0, 0);
   double ema100_h1 = GetIndicatorValue(h_ema100_h1, 0, 0);
   
   bool m5_trend = isBuy ? (ema21_m5 > ema100_m5) : (ema21_m5 < ema100_m5);
   bool h1_trend = isBuy ? (ema21_h1 > ema100_h1) : (ema21_h1 < ema100_h1);
   
   if(m5_trend && h1_trend) base_prob += 0.10;
   
   if((isBuy && ctx.momentum > 0.1) || (!isBuy && ctx.momentum < -0.1)) 
      base_prob += 0.08;
   
   if(IsVolatilityOptimalAsian(ctx) && HasMinimumMovement()) 
      base_prob += 0.05;
   
   return MathMin(base_prob, 0.92);
}

double CalculateAdaptiveSLAsian(bool isBuy, const MarketContext &ctx) {
   double atr = GetIndicatorValue(h_atr, 0, 0);
   if(atr == 0) return 0;
   
   double multiplier = 2.0;
   
   if(ctx.isRange) multiplier = 1.5;
   else if(ctx.isTrending && ctx.trendStrength > 50) multiplier = 2.5;
   
   if(ctx.volatility > ctx.avgVolatility * 1.5) multiplier *= 1.2;
   
   double sl = atr * multiplier;
   
   long stp = SymbolInfoInteger(_Symbol, SYMBOL_TRADE_STOPS_LEVEL);
   double min = stp * _Point;
   if(sl < min) sl = min + (10 * _Point);
   
   return sl;
}

double CalculateExpectedValue(double winProb, double slPips, double tpPips) {
   double loseProb = 1.0 - winProb;
   double spread = (double)SymbolInfoInteger(_Symbol, SYMBOL_SPREAD);
   double costs = spread + 2.0;
   
   return (winProb * (tpPips - costs)) - (loseProb * (slPips + costs));
}

//+------------------------------------------------------------------+
//| EXECUÇÃO                                                         |
//+------------------------------------------------------------------+
void ExecuteAsianTrade(bool isBuy, double winProb, double confScore) {
   if(TimeCurrent() - g_lastTradeTime < 900) return;
   
   MarketContext ctx = AnalyzeMarketContext();
   double slDist = CalculateAdaptiveSLAsian(isBuy, ctx);
   if(slDist == 0) return;
   
   double tpDist = slDist * InpRRRatio;
   
   double probMultiplier = (winProb / InpMinWinProbability) * (confScore / 100.0);
   probMultiplier = MathMin(probMultiplier, 1.3);
   probMultiplier = MathMax(probMultiplier, 0.7);
   
   double risk = InpBaseRisk * probMultiplier;
   
   if(g_consecutiveLosses >= 2) risk *= 0.6;
   if(g_consecutiveLosses >= 3) risk *= 0.4;
   
   double equity = AccountInfoDouble(ACCOUNT_EQUITY);
   double riskMoney = equity * risk;
   double tickVal = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   if(tickVal == 0) tickVal = 1.0;
   
   double lots = riskMoney / ((slDist / _Point) * tickVal);
   
   double step = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);
   lots = MathFloor(lots / step) * step;
   lots = NormalizeDouble(lots, 2);
   
   double minLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   if(lots < minLot) lots = minLot;
   if(lots > InpMaxLotPerTrade) lots = InpMaxLotPerTrade;
   
   double price = isBuy ? SymbolInfoDouble(_Symbol, SYMBOL_ASK) : 
                          SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double sl = isBuy ? price - slDist : price + slDist;
   double tp = isBuy ? price + tpDist : price - tpDist;
   
   sl = NormalizeDouble(sl, _Digits);
   tp = NormalizeDouble(tp, _Digits);
   
   string comment = StringFormat("V14|P:%.0f%%|S:%.0f|ML:%s", 
                                winProb*100, confScore, 
                                InpUseML ? "ON" : "OFF");
   
   bool result;
   if(isBuy) result = trade.Buy(lots, _Symbol, price, sl, tp, comment);
   else result = trade.Sell(lots, _Symbol, price, sl, tp, comment);
   
   if(result) {
      g_lastTradeTime = TimeCurrent();
      Print(StringFormat("✓ TRADE: %s | %.2f | P:%.0f%% | S:%.0f", 
            isBuy ? "BUY" : "SELL", lots, winProb*100, confScore));
   }
}

//+------------------------------------------------------------------+
//| DASHBOARD (CORRIGIDO PARA MQL5)                                  |
//+------------------------------------------------------------------+
void UpdateDashboard(const MarketContext &ctx, double winProb, double confScore) {
   double spread = (double)SymbolInfoInteger(_Symbol, SYMBOL_SPREAD);
   double rsi = GetIndicatorValue(h_rsi, 0, 0);
   double adx = GetIndicatorValue(h_adx, 0, 0);
   
   string status = "⏸ FORA";
   if(IsAsianSessionActive()) {
      double mlProb = GetMLAdjustedProbThreshold();
      double mlConf = GetMLAdjustedConfThreshold();
      
      if(!IsSpreadAcceptableAsian()) status = "⚠ SPREAD";
      else if(winProb < mlProb) status = "⚠ PROB";
      else if(confScore < mlConf) status = "⚠ CONF";
      else status = "✓ OK";
   }
   
   string context = ctx.isRange ? "RNG" : (ctx.isTrending ? "TRD" : "NEU");
   
   string mlStatus = "";
   if(InpUseML && g_mlParams.totalTrades > 0) {
      mlStatus = StringFormat("\n🤖ML: %d trades | WR:%.1f%%\n   Thr:%.2f/%.0f",
                             g_mlParams.totalTrades,
                             g_mlParams.avgWinRate * 100,
                             g_mlParams.probThreshold,
                             g_mlParams.confThreshold);
   }
   
   // --- FIX: Uso de MqlDateTime em vez de TimeHour/TimeMinute ---
   MqlDateTime dt;
   TimeToStruct(TimeCurrent(), dt);
   
   string dash = StringFormat(
      "═══ V14 PRO ═══\n"
      "%s | %02d:%02d | Sp:%.0f\n"
      "Ctx:%s F:%d%% V:%.5f\n"
      "RSI:%.1f ADX:%.1f\n"
      "P:%.0f%% C:%.0f%s\n"
      "PnL:%.2f L:%d\n"
      "%s%s%s%s",
      status, dt.hour, dt.min,
      spread, context, ctx.trendStrength, ctx.volatility,
      rsi, adx, winProb*100, confScore, mlStatus,
      g_dailyPnL, g_consecutiveLosses,
      InpUseTrailing ? "T" : "",
      InpUseBreakeven ? "B" : "",
      InpCheckCorrelation ? "C" : "",
      InpUseML ? "M" : ""
   );
   
   Comment(dash);
}

//+------------------------------------------------------------------+
//| TICK                                                             |
//+------------------------------------------------------------------+
void OnTick() {
   // Reset diário
   if(TimeCurrent() - g_lastResetDate > 86400) {
      g_dailyPnL = 0;
      g_lastResetDate = TimeCurrent();
   }
   
   // Gestão de posições abertas
   ManageTrailingStop();
   ManageBreakeven();
   
   MarketContext ctx = AnalyzeMarketContext();
   
   bool isBuy = false;
   double ema21 = GetIndicatorValue(h_ema21_m5, 0, 0);
   double ema100 = GetIndicatorValue(h_ema100_m5, 0, 0);
   bool trend_detected = (ema21 > ema100) || (ema21 < ema100);
   isBuy = (ema21 > ema100);
   
   double confScore = CalculateConfidenceScore(isBuy, ctx);
   double winProb = CalculateWinProbabilityAsian(isBuy, ctx, confScore);
   
   double slPips = CalculateAdaptiveSLAsian(isBuy, ctx) / _Point;
   double ev = CalculateExpectedValue(winProb, slPips, slPips * InpRRRatio);
   
   UpdateDashboard(ctx, winProb, confScore);
   
   // === FILTROS ===
   if(PositionsTotal() >= InpMaxOpenPositions) return;
   if(!IsAsianSessionActive()) return;
   if(!IsSpreadAcceptableAsian()) return;
   
   if(g_consecutiveLosses >= InpMaxConsecutiveLosses) return;
   if(g_dailyPnL < -AccountInfoDouble(ACCOUNT_BALANCE) * InpMaxDailyLossPercent) return;
   
   if(!IsVolatilityOptimalAsian(ctx)) return;
   if(!HasMinimumMovement()) return;
   if(!trend_detected) return;
   
   // Filtros ML ajustados
   double mlProb = GetMLAdjustedProbThreshold();
   double mlConf = GetMLAdjustedConfThreshold();
   
   if(winProb < mlProb) return;
   if(confScore < mlConf) return;
   if(ev < InpMinExpectedValue) return;
   if(GetIndicatorValue(h_adx, 0, 0) < g_mlParams.adxThreshold) return;
   
   // Correlação
   if(CheckCorrelationOverexposure(isBuy)) {
      Print("⚠ BLOQUEADO: Correlação alta com posições existentes");
      return;
   }
   
   ExecuteAsianTrade(isBuy, winProb, confScore);
}

void OnTradeTransaction(const MqlTradeTransaction &trans, 
                        const MqlTradeRequest &request, 
                        const MqlTradeResult &result) {
   if(trans.type == TRADE_TRANSACTION_DEAL_ADD) {
      if(HistoryDealSelect(trans.deal)) {
         if(HistoryDealGetInteger(trans.deal, DEAL_MAGIC) == InpMagicNumber) {
            double profit = HistoryDealGetDouble(trans.deal, DEAL_PROFIT);
            bool wasWin = (profit > 0);
            
            // Registra para ML
            if(InpUseML) {
               TradeRecord rec;
               rec.openTime = (datetime)HistoryDealGetInteger(trans.deal, DEAL_TIME);
               rec.closePrice = HistoryDealGetDouble(trans.deal, DEAL_PRICE);
               rec.profit = profit;
               rec.wasWin = wasWin;
               rec.winProb = 0; // Seria necessário armazenar quando abriu
               rec.confScore = 0;
               
               UpdateMLModel(rec);
            }
            
            if(wasWin) {
               g_consecutiveLosses = 0;
               Print("✓ WIN: ", profit);
            } else {
               g_consecutiveLosses++;
               Print("⚠ LOSS: ", profit, " | Perdas: ", g_consecutiveLosses);
            }
            
            g_dailyPnL += profit;
         }
      }
   }
}
//+------------------------------------------------------------------+