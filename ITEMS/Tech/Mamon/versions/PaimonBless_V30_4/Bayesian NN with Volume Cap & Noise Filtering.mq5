//+------------------------------------------------------------------+
//|                                         PaimonBless_V30_4.mq5    |
//|                        Copyright 2025, Atous Technology Systems. |
//|                                       Scientist: DevRodts (PhD)  |
//|                                            Location: Valinhos, SP|
//+------------------------------------------------------------------+
#property copyright "Atous Technology Systems - PhD Quant Division"
#property version   "30.40"
#property strict
#property description "Bayesian NN with Volume Cap & Noise Filtering"

#include <Trade\Trade.mqh>
#include <Math\Stat\Normal.mqh>

//--- Neural Settings
input group "Neural Network"
input int    InpHiddenLayer  = 48;     
input double InpLearningRate = 0.01;   // Reduzido para estabilidade
input double InpEpsilon      = 1e-8;   

//--- Risk Management (SAFETY FIRST)
input group "Risk & Kelly"
input double InpKellyMetric  = 0.15;   // Reduzido para 15% do Kelly
input double InpMaxLeverage  = 10.0;   // Reduzido para 10x
input double InpMaxRiskPerTrade = 2.0; // Max 2% de risco por trade

//--- Fractal Geometry 
input group "Fractal Physics"
input int    InpFDI_Period   = 30;     // Janela maior
input double InpTrendFDI     = 1.48;   
input double InpChaosFDI     = 1.52;   

//--- Volatility & Protection
input group "Kinetic Protection"
input int    InpATRPeriod    = 14;     
input double InpSL_Mult      = 2.0;    // SL mais apertado
input double InpTP_Mult      = 4.0;    
input bool   InpExpTrailing  = true;   

input group "Data & Visuals"
input bool   InpSaveData     = true;   
input string InpFolder       = "Paimon_Data_V30";
input color  InpDashColor    = C'0,191,255'; 

//--- Structs
struct STradeContext {
   double features[]; 
   int    op_type; 
   ulong  ticket;     
};

//--- Globais
CTrade         Trade;
STradeContext  ActiveContext;
bool           HasActiveContext = false;
double         GlobalProb = 0.5;
double         GlobalFDI = 1.5; 
double         GlobalDominance = 0.0;

int            HandleATR;
int            HandleEMA; 

//+------------------------------------------------------------------+
//| CLASSE 0: Data Logger                                            |
//+------------------------------------------------------------------+
class CDataLogger {
private:
   string m_filename;
public:
   CDataLogger() {}

   void Init(string symbol) {
      m_filename = symbol + "_V30_Fractal.csv";
      if(FileIsExist(m_filename, FILE_COMMON)) return;
      int h = FileOpen(m_filename, FILE_WRITE|FILE_CSV|FILE_ANSI|FILE_COMMON, ",");
      if(h != INVALID_HANDLE) {
         FileWrite(h, "Time","Ticket","Type","Price","Prob","Kelly","FDI","CandleDom","RelVol","DistEMA");
         FileClose(h);
      }
   }
   
   void Log(ulong t, string type, double p, double prob, double k, const double &f[]) {
      if(!InpSaveData) return;
      int h = FileOpen(m_filename, FILE_READ|FILE_WRITE|FILE_CSV|FILE_ANSI|FILE_COMMON, ",");
      if(h != INVALID_HANDLE) {
         FileSeek(h, 0, SEEK_END);
         FileWrite(h, TimeToString(TimeLocal(),TIME_DATE|TIME_SECONDS),
            (long)t, type, DoubleToString(p,_Digits),
            DoubleToString(prob,4), DoubleToString(k,5),
            DoubleToString(f[0],5), DoubleToString(f[1],5), 
            DoubleToString(f[2],5), DoubleToString(f[3],5)  
         );
         FileClose(h);
      }
   }
};

//+------------------------------------------------------------------+
//| CLASSE 1: Feature Engine                                         |
//+------------------------------------------------------------------+
class CFeatureEngine {
public:
   CFeatureEngine() {}

   void GetFeatures(double &out[]) {
      ArrayResize(out, 4);
      double close[], high[], low[], open[];
      ArraySetAsSeries(close,true); ArraySetAsSeries(high,true); 
      ArraySetAsSeries(low,true); ArraySetAsSeries(open,true);
      
      if(CopyClose(_Symbol,_Period,0,InpFDI_Period,close)<InpFDI_Period) return;
      if(CopyHigh(_Symbol,_Period,0,InpFDI_Period,high)<InpFDI_Period) return;
      if(CopyLow(_Symbol,_Period,0,InpFDI_Period,low)<InpFDI_Period) return;
      if(CopyOpen(_Symbol,_Period,0,1,open)<1) return;

      // 1. Fractal Dimension Index (Sevcik)
      double max_p = -DBL_MAX, min_p = DBL_MAX;
      for(int i=0; i<InpFDI_Period; i++) {
         if(high[i] > max_p) max_p = high[i];
         if(low[i] < min_p) min_p = low[i];
      }
      double range = max_p - min_p;
      if(range <= 0) range = _Point; 
      
      double length = 0;
      double diff_norm;
      double time_norm = 1.0 / (double)(InpFDI_Period - 1); 
      
      for(int i=1; i<InpFDI_Period; i++) {
         diff_norm = (close[i-1] - close[i]) / range;
         length += MathSqrt(diff_norm*diff_norm + time_norm*time_norm);
      }
      
      double numer = MathLog(length) + MathLog(2.0);
      double denom = MathLog(2.0 * (double)(InpFDI_Period - 1));
      double fdi = 1.0 + (numer / denom);
      
      out[0] = (fdi - 1.5) * 4.0; 
      GlobalFDI = fdi;

      // 2. Candle Dominance
      double spread = high[0] - low[0];
      if(spread <= 0) spread = _Point;
      out[1] = (close[0] - open[0]) / spread;
      GlobalDominance = out[1];

      // 3. Relative Volatility
      double atr[]; ArraySetAsSeries(atr, true);
      if(CopyBuffer(HandleATR, 0, 0, 50, atr) < 50) return;
      
      double avg_atr = 0; 
      for(int i=0;i<50;i++) avg_atr += atr[i];
      avg_atr /= 50.0;
      
      out[2] = (avg_atr > 0) ? MathLog(atr[0] / avg_atr) : 0;

      // 4. Distance from EMA
      double ema[]; ArraySetAsSeries(ema, true);
      if(CopyBuffer(HandleEMA, 0, 0, 1, ema) < 1) return;
      
      out[3] = (atr[0] > 0) ? (close[0] - ema[0]) / (atr[0] * 5.0) : 0; 
      if(out[3] > 1.0) out[3]=1.0; 
      if(out[3] < -1.0) out[3]=-1.0;
   }
};

//+------------------------------------------------------------------+
//| CLASSE 2: MLP (Static)                                           |
//+------------------------------------------------------------------+
class CMLP {
private:
   int m_nin, m_nhid, m_nout;
   double W1[], B1[], W2[], B2[];
   double mW1[], vW1[], mB1[], vB1[], mW2[], vW2[], mB2[], vB2[]; 
   int t; double alpha, eps;

   double Tanh(double x) {
      if(x > 10.0) return 1.0; if(x < -10.0) return -1.0;
      double p=MathExp(x), n=MathExp(-x);
      if(!MathIsValidNumber(p) || !MathIsValidNumber(n)) return 0.0;
      return (p-n)/(p+n);
   }
   double Sigmoid(double x) {
      if(x > 10.0) return 1.0; if(x < -10.0) return 0.0;
      return 1.0/(1.0+MathExp(-x));
   }
   
   void InitR(double &w[], int n) {
      ArrayResize(w, n);
      double lim = MathSqrt(6.0/(double)n);
      for(int i=0;i<n;i++) w[i] = ((double)MathRand()/32767.0 * 2.0 * lim) - lim;
   }
   void InitZ(double &v[], int n) { ArrayResize(v,n); ArrayInitialize(v,0.0); }

public:
   CMLP() {}
   void Init(int in, int hid, int out) {
      m_nin=in; m_nhid=hid; m_nout=out; alpha=InpLearningRate; eps=InpEpsilon; t=0;
      MathSrand(GetTickCount());
      InitR(W1, in*hid); InitZ(B1, hid);
      InitR(W2, hid*out); InitZ(B2, out);
      InitZ(mW1, in*hid); InitZ(vW1, in*hid); InitZ(mB1, hid); InitZ(vB1, hid);
      InitZ(mW2, hid*out); InitZ(vW2, hid*out); InitZ(mB2, out); InitZ(vB2, out);
   }

   double Predict(const double &x[]) {
      if(ArraySize(x) != m_nin) return 0.5;
      double h[]; ArrayResize(h, m_nhid);
      for(int j=0; j<m_nhid; j++) {
         double z=0;
         for(int i=0; i<m_nin; i++) z += x[i] * W1[i*m_nhid+j];
         h[j] = Tanh(z + B1[j]);
      }
      double z=0;
      for(int j=0; j<m_nhid; j++) z += h[j] * W2[j];
      return Sigmoid(z + B2[0]);
   }

   void Train(const double &x[], double y) {
      t++;
      double h[]; ArrayResize(h, m_nhid);
      for(int j=0; j<m_nhid; j++) {
         double z=0;
         for(int i=0; i<m_nin; i++) z += x[i] * W1[i*m_nhid+j];
         h[j] = Tanh(z + B1[j]);
      }
      double z_out = 0;
      for(int j=0; j<m_nhid; j++) z_out += h[j] * W2[j];
      double out = Sigmoid(z_out + B2[0]);

      double err = out - y;
      double gW2[], gB2[]; ArrayResize(gW2, m_nhid); ArrayResize(gB2, 1);
      gB2[0] = err;
      for(int j=0; j<m_nhid; j++) gW2[j] = err * h[j];

      double gW1[], gB1[]; ArrayResize(gW1, m_nin*m_nhid); ArrayResize(gB1, m_nhid);
      for(int j=0; j<m_nhid; j++) {
         double e = err * W2[j] * (1.0 - h[j]*h[j]); 
         gB1[j] = e;
         for(int i=0; i<m_nin; i++) gW1[i*m_nhid+j] = e * x[i];
      }
      
      Adam(W2, mW2, vW2, gW2); Adam(B2, mB2, vB2, gB2);
      Adam(W1, mW1, vW1, gW1); Adam(B1, mB1, vB1, gB1);
   }

   void Adam(double &p[], double &m[], double &v[], const double &g[]) {
      double bc1 = 1.0 - MathPow(0.9, t);
      double bc2 = 1.0 - MathPow(0.999, t);
      if(bc2 == 0) bc2 = 1.0; 
      for(int i=0; i<ArraySize(p); i++) {
         m[i] = 0.9 * m[i] + 0.1 * g[i];
         v[i] = 0.999 * v[i] + 0.001 * g[i] * g[i];
         double m_hat = m[i] / bc1;
         double v_hat = v[i] / bc2;
         double den = MathSqrt(v_hat) + eps;
         p[i] -= alpha * m_hat / den;
      }
   }
   int Steps() { return t; }
};

//+------------------------------------------------------------------+
//| CLASSE 3: Kelly Criterion (Safe)                                 |
//+------------------------------------------------------------------+
class CKelly {
   double mu, nu, alpha, beta, f;
public:
   void Init() { mu=0.0005; nu=5.0; alpha=2.0; beta=0.01; f=InpKellyMetric; }
   void Update(double r) {
      // Janela deslizante suave para evitar explosão de 'nu'
      if(nu > 100) nu = 90; // Reseta memória para manter adaptabilidade
      
      double pn=nu, pm=mu, pb=beta;
      nu+=1.0; alpha+=0.5;
      mu=(pn*pm+r)/nu;
      double diff = r-pm;
      beta=pb + (pn/nu)*0.5*diff*diff;
   }
   double GetF() {
      if(alpha<=1.0) return 0.0;
      double var = (beta/(alpha-1.0))*(1.0+1.0/nu);
      if(var<1e-9) return 0.0;
      double k = mu/var;
      if(k<0) k=0; 
      if(k>InpMaxLeverage) k=InpMaxLeverage;
      return k * f;
   }
   string GetStats() { return StringFormat("Mu:%.5f Nu:%.0f", mu, nu); }
};

//+------------------------------------------------------------------+
//| CLASSE 4: Dashboard                                              |
//+------------------------------------------------------------------+
class CDashboard {
public:
   CDashboard() {}
   
   void CreateLabel(string name, int x, int y, string text, color clr) {
      if(ObjectFind(0, name) < 0) {
         ObjectCreate(0, name, OBJ_LABEL, 0, 0, 0);
         ObjectSetInteger(0, name, OBJPROP_CORNER, CORNER_LEFT_UPPER);
         ObjectSetInteger(0, name, OBJPROP_XDISTANCE, x);
         ObjectSetInteger(0, name, OBJPROP_YDISTANCE, y);
         ObjectSetInteger(0, name, OBJPROP_FONTSIZE, 9);
         ObjectSetString(0, name, OBJPROP_FONT, "Consolas");
      }
      ObjectSetString(0, name, OBJPROP_TEXT, text);
      ObjectSetInteger(0, name, OBJPROP_COLOR, clr);
   }

   void Update(double prob, double kelly, int steps, string bayes_stats, string status, double fdi) {
      int y = 20; int lh = 18;
      CreateLabel("PB_Title", 20, y, ":: PaimonBless V30.4 (Emergency Patch) ::", InpDashColor); y+=lh;
      
      color probColor = clrWhite;
      if(prob > 0.58) probColor = clrLime; 
      else if(prob < 0.42) probColor = clrRed; 
      
      CreateLabel("PB_Prob",  20, y, StringFormat("P(Up): %.2f%% [Sig >58%%]", prob * 100), probColor); y+=lh;
      
      color fdiColor = clrWhite;
      if(fdi < InpTrendFDI) fdiColor = clrLime; 
      else if(fdi > InpChaosFDI) fdiColor = clrOrange; 
      else fdiColor = clrGray; 
      
      CreateLabel("PB_FDI", 20, y, StringFormat("FDI: %.3f [%s]", fdi, status), fdiColor); y+=lh;
      CreateLabel("PB_Kelly", 20, y, StringFormat("Kelly: %.4fx", kelly), clrYellow); y+=lh;
      CreateLabel("PB_Bayes", 20, y, "Bayes: " + bayes_stats, clrGray); y+=lh;
      CreateLabel("PB_Train", 20, y, StringFormat("Steps: %d", steps), clrGray);
   }
   void Cleanup() { ObjectsDeleteAll(0, "PB_"); }
};

//+------------------------------------------------------------------+
//| INSTÂNCIAS GLOBAIS ESTÁTICAS                                     |
//+------------------------------------------------------------------+
CMLP           Net;
CKelly         Risk;
CFeatureEngine Feat;
CDataLogger    Log;
CDashboard     Dash; 
double         Features[];

//+------------------------------------------------------------------+
//| Helpers                                                          |
//+------------------------------------------------------------------+
double GetATR() {
   double v[]; ArraySetAsSeries(v,true);
   return (CopyBuffer(HandleATR,0,0,1,v)==1)?v[0]:0.0;
}

bool IsSymbolBusy() {
   for(int i=PositionsTotal()-1; i>=0; i--) {
      if(PositionGetTicket(i) > 0)
         if(PositionGetInteger(POSITION_MAGIC)==777 && PositionGetString(POSITION_SYMBOL)==_Symbol) return true;
   }
   return false;
}

void ApplyKineticTrailing() {
   if(!InpExpTrailing) return;
   double atr = GetATR(); if(atr<=0) return;
   
   for(int i=PositionsTotal()-1; i>=0; i--) {
      ulong ticket = PositionGetTicket(i);
      if(ticket>0 && PositionGetString(POSITION_SYMBOL)==_Symbol && PositionGetInteger(POSITION_MAGIC)==777) {
         double open_price = PositionGetDouble(POSITION_PRICE_OPEN);
         double sl = PositionGetDouble(POSITION_SL);
         double tp = PositionGetDouble(POSITION_TP);
         long type = PositionGetInteger(POSITION_TYPE);
         double cur_price = (type==POSITION_TYPE_BUY) ? SymbolInfoDouble(_Symbol,SYMBOL_BID) : SymbolInfoDouble(_Symbol,SYMBOL_ASK);
         
         double profit_pts = (type==POSITION_TYPE_BUY) ? (cur_price - open_price) : (open_price - cur_price);
         if(profit_pts <= 0) continue; 
         
         double volatility_factor = profit_pts / atr;
         double adaptive_mult = InpSL_Mult / (1.0 + (volatility_factor * 0.5)); 
         if(adaptive_mult < 0.5) adaptive_mult = 0.5;
         
         double dist = atr * adaptive_mult;
         
         if(type==POSITION_TYPE_BUY) {
            double new_sl = cur_price - dist;
            new_sl = NormalizeDouble(new_sl, _Digits);
            if(new_sl > sl + _Point) Trade.PositionModify(ticket, new_sl, tp);
         } else {
            double new_sl = cur_price + dist;
            new_sl = NormalizeDouble(new_sl, _Digits);
            if(new_sl < sl - _Point || sl==0) Trade.PositionModify(ticket, new_sl, tp);
         }
      }
   }
}

//+------------------------------------------------------------------+
//| MAIN: Initialization                                             |
//+------------------------------------------------------------------+
int OnInit() {
   int retry=0;
   do {
      HandleATR = iATR(_Symbol, _Period, InpATRPeriod);
      HandleEMA = iMA(_Symbol, _Period, 200, 0, MODE_EMA, PRICE_CLOSE);
      if(HandleATR!=INVALID_HANDLE && HandleEMA!=INVALID_HANDLE) break;
      Sleep(100); retry++;
   } while(retry<10);
   
   if(HandleATR==INVALID_HANDLE || HandleEMA==INVALID_HANDLE) return INIT_FAILED;
   
   Net.Init(4, InpHiddenLayer, 1);
   Risk.Init();
   Log.Init(_Symbol);
   
   EventSetTimer(15); 
   Print(":: PaimonBless V30.4 (Emergency Patch) ::");
   return INIT_SUCCEEDED;
}

void OnDeinit(const int r) { 
   EventKillTimer(); 
   IndicatorRelease(HandleATR); 
   IndicatorRelease(HandleEMA); 
   Dash.Cleanup(); 
}

void OnTimer() {
   PrintFormat(">> HEARTBEAT: FDI: %.3f | Prob(Up): %.2f%% | Kelly: %.4fx", 
               GlobalFDI, GlobalProb*100, Risk.GetF());
}

//+------------------------------------------------------------------+
//| MAIN: OnTick Logic                                               |
//+------------------------------------------------------------------+
void OnTick() {
   Feat.GetFeatures(Features);
   if(ArraySize(Features)==0) return;
   
   double prob = Net.Predict(Features);
   GlobalProb = prob; 
   
   ApplyKineticTrailing();
   
   bool trend_mode = (GlobalFDI < InpTrendFDI);
   bool chaos_mode = (GlobalFDI > InpChaosFDI);
   string regime = "NOISE (Blocked)";
   if(trend_mode) regime = "TREND";
   if(chaos_mode) regime = "CHAOS (Reversion)";
   
   Dash.Update(prob, Risk.GetF(), Net.Steps(), Risk.GetStats(), regime, GlobalFDI);
   
   if(HasActiveContext) return; 
   if(IsSymbolBusy()) return; 

   int signal = 0;
   
   // FILTRO AGRESSIVO: Requer > 58% de certeza
   if(trend_mode) {
      if(prob > 0.58 && GlobalDominance > 0.3) signal = 1;       
      else if(prob < 0.42 && GlobalDominance < -0.3) signal = -1; 
   }
   else if(chaos_mode) {
      if(prob > 0.65 && Features[3] < -1.8) signal = 1;  
      else if(prob < 0.35 && Features[3] > 1.8) signal = -1; 
   }
   
   if(signal != 0) {
      double k = Risk.GetF();
      if(k < 0.001) k = 0.01; 
      
      double equity = AccountInfoDouble(ACCOUNT_EQUITY);
      double price = (signal==1) ? SymbolInfoDouble(_Symbol, SYMBOL_ASK) : SymbolInfoDouble(_Symbol, SYMBOL_BID);
      
      // TRAVA DE SEGURANÇA DE VOLUME
      double max_risk_amount = equity * (InpMaxRiskPerTrade / 100.0);
      double atr = GetATR();
      double sl_pips = atr * InpSL_Mult / _Point;
      double tick_value = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
      
      // Volume baseado em Risco Monetário Fixo (Máximo)
      double safe_vol = 0;
      if(sl_pips > 0 && tick_value > 0) {
         safe_vol = max_risk_amount / (sl_pips * tick_value);
      }
      
      // Volume Kelly
      double kelly_vol = (equity * k) / price; 
      
      // Usa o menor dos dois (Kelly ou Risco Fixo)
      double vol = MathMin(kelly_vol, safe_vol);
      
      double min_vol = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
      double max_vol = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
      double step_vol = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);
      
      vol = MathFloor(vol / step_vol) * step_vol;
      if(vol < min_vol) vol = min_vol;
      if(vol > max_vol) vol = max_vol;
      
      double sl = (signal==1) ? price - atr*InpSL_Mult : price + atr*InpSL_Mult;
      double tp = (signal==1) ? price + atr*InpTP_Mult : price - atr*InpTP_Mult;
      sl = NormalizeDouble(sl, _Digits);
      tp = NormalizeDouble(tp, _Digits);
      
      Trade.SetExpertMagicNumber(777);
      if(signal==1) Trade.Buy(vol, _Symbol, price, sl, tp, "Paimon V30.4 Safe");
      else          Trade.Sell(vol, _Symbol, price, sl, tp, "Paimon V30.4 Safe");
      
      if(Trade.ResultRetcode() == TRADE_RETCODE_DONE) {
         ActiveContext.ticket = Trade.ResultOrder();
         ActiveContext.op_type = signal;
         ArrayCopy(ActiveContext.features, Features);
         HasActiveContext = true;
         Log.Log(ActiveContext.ticket, (signal==1)?"BUY":"SELL", price, prob, k, Features);
         PrintFormat(">> OPEN TRADE %s | Prob: %.2f | Vol: %.2f", (signal==1)?"BUY":"SELL", prob, vol);
      }
   }
}

void OnTradeTransaction(const MqlTradeTransaction& trans, const MqlTradeRequest& req, const MqlTradeResult& res) {
   if(trans.type == TRADE_TRANSACTION_DEAL_ADD) {
      if(HistoryDealSelect(trans.deal)) {
         if(HistoryDealGetInteger(trans.deal, DEAL_MAGIC) == 777 && HistoryDealGetInteger(trans.deal, DEAL_ENTRY) == DEAL_ENTRY_OUT) {
            double profit = HistoryDealGetDouble(trans.deal, DEAL_PROFIT);
            Risk.Update(profit > 0 ? 0.05 : -0.05); 
            
            if(HasActiveContext) {
               double target = 0.5;
               if(profit > 0) target = (ActiveContext.op_type == 1) ? 0.95 : 0.05;
               else           target = (ActiveContext.op_type == 1) ? 0.10 : 0.90;
               
               Net.Train(ActiveContext.features, target);
               PrintFormat(">> TRADE CLOSED. PnL: %.2f. Neural Updated.", profit);
               HasActiveContext = false;
            }
         }
      }
   }
}