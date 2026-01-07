# **PAIMON BLESS V17.7 - Quantitative Trading System**

## **Overview**

**Paimon Bless V17.7** is a sophisticated quantitative trading system built for MetaTrader 5 that combines machine learning, Bayesian inference, and Kelly criterion risk management. The system employs a multi-model approach to generate probabilistic trade signals with uncertainty quantification.

## **Architecture**

### **Core Components**

```
┌─────────────────────────────────────────────────────┐
│                    DATA LAYER                        │
│  • RSI, ADX, ATR, Bollinger Bands, EMA Indicators   │
│  • Market Feature Extraction & Normalization         │
└─────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────┐
│               MACHINE LEARNING LAYER                 │
│  • Neural Network with Monte Carlo Dropout           │
│  • Bayesian Gaussian Naive Bayes Classifier         │
│  • Model Fusion with Uncertainty Weighting           │
└─────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────┐
│             RISK MANAGEMENT LAYER                    │
│  • 4-Moment Kelly Criterion (Mean, Variance,        │
│    Skewness, Kurtosis)                              │
│  • Dynamic Position Sizing                          │
│  • Drawdown Protection & Circuit Breakers           │
└─────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────┐
│               EXECUTION LAYER                        │
│  • Signal Validation & Filtering                    │
│  • Order Management with Magic Number Isolation      │
│  • Stop Loss/Take Profit Calculation                │
└─────────────────────────────────────────────────────┘
```

## **Mathematical Foundations**

### **1. Feature Engineering**

The system extracts 6 normalized market features:

```python
MarketFeatures = {
    f0_rsi: RSI / 100.0,                    # Momentum
    f1_adx: ADX / 100.0,                    # Trend strength
    f2_trend: (EMA_fast - EMA_slow) / EMA_slow * 1000,  # Trend direction
    f3_vol: ATR,                            # Volatility
    f4_bb: (BB_upper - BB_lower) / ATR,     # Bollinger Band compression
    f5_spread: Normalized spread            # Market liquidity
}
```

### **2. Rolling Statistics (Online Moment Calculation)**

The system uses Welford's online algorithm for calculating moments:

```cpp
// Online update of moments
void Update(double x) {
    long n1 = n; n++;
    double delta = x - M1;
    double delta_n = delta / n;
    double term1 = delta * delta_n * n1;
    
    M4 += term1 * delta_n * delta_n * (n*n - 3*n + 3) + 6 * delta_n * delta_n * M2 - 4 * delta_n * M3;
    M3 += term1 * delta_n * (n - 2) - 3 * delta_n * M2;
    M2 += term1;
    M1 += delta_n;
}
```

### **3. Neural Network with Monte Carlo Dropout**

```cpp
class CNeuralNet {
private:
    double weights[MAX_FEATURES];  // Learned weights
    double bias;                   // Bias term
    
public:
    PredictionResult PredictMC(double &f[]) {
        // Monte Carlo dropout for uncertainty estimation
        double sum_prob = 0, sum_sq_prob = 0;
        for(int k=0; k<InpMCDropoutIters; k++) {
            double z = bias;
            for(int i=0; i<MAX_FEATURES; i++) {
                if(MathRand()%100 > 20) {  // 80% dropout rate
                    z += weights[i] * f[i];
                }
            }
            double p = 1.0 / (1.0 + MathExp(-z));  // Sigmoid
            sum_prob += p;
            sum_sq_prob += p*p;
        }
        
        PredictionResult res;
        res.probability = sum_prob / InpMCDropoutIters;
        double variance = (sum_sq_prob / InpMCDropoutIters) - (res.probability * res.probability);
        res.uncertainty = MathSqrt(MathMax(variance, 0.0));
        return res;
    }
};
```

### **4. Bayesian Gaussian Naive Bayes**

```cpp
class CBayesGNB {
    // Online Bayesian updating of feature distributions
    void Update(double &f[], bool win) {
        if(win) {
            n_win++;
            for(int i=0; i<MAX_FEATURES; i++) {
                double delta = f[i] - mean_win[i];
                mean_win[i] += delta / n_win;  // Online mean update
                M2_win[i] += delta * (f[i] - mean_win[i]);  // Online variance
            }
        }
        // Similar for loss class
    }
    
    double Predict(double &f[]) {
        // Bayesian inference with Gaussian likelihoods
        double log_p_win = MathLog(prior + EPSILON);
        double log_p_loss = MathLog((1.0 - prior) + EPSILON);
        
        for(int i=0; i<MAX_FEATURES; i++) {
            log_p_win += LogGaussian(f[i], mean_win[i], variance_win[i]);
            log_p_loss += LogGaussian(f[i], mean_loss[i], variance_loss[i]);
        }
        
        // Numerical stability with log-sum-exp
        double max_log = MathMax(log_p_win, log_p_loss);
        double exp_win = MathExp(log_p_win - max_log);
        double exp_loss = MathExp(log_p_loss - max_log);
        
        return exp_win / (exp_win + exp_loss);
    }
};
```

### **5. Kelly Criterion with Skewness Adjustment**

```cpp
double GetKellyFraction(double currentDD) {
    // Basic Kelly: f* = (p*b - q) / b
    double p = win_rate;
    double q = 1.0 - p;
    double b = avg_win / avg_loss;
    double f = (p * b - q) / b;
    
    // Skewness adjustment: Reduce position size for negative skew
    double totalSkew = win_skew - loss_skew;
    if(totalSkew < 0) f *= (1.0 + totalSkew * 0.1);
    
    // Drawdown protection
    if(currentDD > 0.05) f *= 0.75;
    if(currentDD > 0.10) f *= 0.50;
    
    return MathMax(0.001, MathMin(f, InpMaxRisk));
}
```

## **Trading Logic**

### **Signal Generation**

```cpp
// Model fusion with uncertainty weighting
PredictionResult mlRes = g_ml.PredictMC(f_array);
double bayesProb = g_bayes.Predict(f_array);

// Uncertainty-weighted ensemble
double wML = 1.0 - mlRes.uncertainty;    // More certain = more weight
double wBayes = mlRes.uncertainty;       // Less certain = less weight
double finalProb = (mlRes.probability * wML) + (bayesProb * wBayes);

// Decision thresholds
double buyThreshold = InpMinProb;        // Default: 0.60
double sellThreshold = 1.0 - InpMinProb; // Default: 0.40

bool buySignal = (finalProb >= buyThreshold) && (rsi < 70);
bool sellSignal = (finalProb <= sellThreshold) && (rsi > 30);
```

### **Position Sizing**

```cpp
// Kelly-based position sizing
double kellyFraction = g_risk.GetKellyFraction(currentDrawdown);
double riskCapital = AccountEquity() * kellyFraction;

// Volatility-adjusted stop loss
double atr = GetATR();
double slDistance = atr * 2.0;
double slPoints = slDistance / PointValue;

// Lot size calculation
double tickValue = SymbolInfoDouble(SYMBOL_TRADE_TICK_VALUE);
double lotSize = riskCapital / (slPoints * tickValue);

// Normalize to broker constraints
lotSize = MathFloor(lotSize / VolumeStep) * VolumeStep;
lotSize = MathMax(lotSize, MinLot);
lotSize = MathMin(lotSize, MaxLot);
```

## **Risk Management**

### **Multi-Layer Protection**

1. **Circuit Breakers:**
   - Max drawdown limit (default: 15%)
   - Daily loss limits
   - Cooldown periods between trades

2. **Position Limits:**
   - Maximum 3 concurrent positions
   - Magic number isolation
   - Correlation awareness

3. **Uncertainty Filters:**
   - No trading when ML uncertainty > 20%
   - RSI overbought/oversold filters
   - Spread widening protection

## **Online Learning**

### **Continuous Model Improvement**

```cpp
void OnTradeTransaction() {
    if(tradeClosed && profitKnown) {
        // Prepare training data
        double target = (profit > 0) ? 1.0 : 0.0;
        
        // Train neural network
        if(InpUseML) {
            g_ml.Train(featuresArray, target);
        }
        
        // Update Bayesian model
        if(InpUseBayes) {
            g_bayes.Update(featuresArray, profit > 0);
        }
        
        // Update risk statistics
        g_risk.AddTradeReturn(profit / balance);
    }
}
```

## **Configuration**

### **Input Parameters**

```cpp
// Risk Management
input double InpMaxRisk = 0.05;        // Maximum risk per trade (5%)
input double InpKellyFraction = 0.25;  // Fraction of full Kelly
input double InpMaxDrawdown = 0.15;    // Maximum allowed drawdown

// Strategy
input int    InpMagic = 999176;        // Magic number for order isolation
input double InpMinProb = 0.60;        // Minimum probability threshold
input double InpMaxUncertainty = 0.20; // Maximum allowed uncertainty

// Machine Learning
input double InpLearningRate = 0.01;   // SGD learning rate
input double InpL2Reg = 0.0001;        // L2 regularization
input int    InpMCDropoutIters = 30;   // Monte Carlo iterations
```

## **Monitoring & Logging**

### **Real-Time Dashboard**

```
╔════PAIMON V17.7 FIXED═════╗
║ Status: 🟢 BUY SIGNAL
║ --------------------------
║ Prob Final: 67.4% (+/-4.2%)
║ Targets: >60% (B) ou <40% (S)
║ Kelly f*: 2.35% (Skew Adj)
║ --------------------------
║ Saldo: $15432.87
║ DD: 3.21%
╚═══════════════════════════╝
```

### **Log Output Example**
```
--- HEARTBEAT [12:30:45] ---
| STATE: 🟢 BUY SIGNAL
| INPUTS: RSI=45.2 ADX=32.4 Trend=0.0143 Vol=0.00052
| MODELS: ML=68.4%(U:0.042) Bayes=65.2% -> FINAL=67.4%
| RISK: Kelly=2.35% DD=3.21% Trades=Wins:45 Loss:32
| ML ITERATIONS: 1287
```

## **Performance Characteristics**

### **Expected Behavior**

1. **High Conviction Trades:** Only acts when probability > 60% and uncertainty < 20%
2. **Adaptive Position Sizing:** Adjusts based on win/loss statistics and current drawdown
3. **Continuous Learning:** Improves models with each completed trade
4. **Defensive Posture:** Reduces exposure during high uncertainty or drawdown periods

### **Key Innovations**

1. **Uncertainty-Aware Ensemble:** Dynamically weights models based on their confidence
2. **4-Moment Kelly Criterion:** Incorporates skewness and kurtosis into risk calculation
3. **Online Bayesian Learning:** Updates feature distributions in real-time
4. **Monte Carlo Dropout:** Quantifies model uncertainty for better risk management

## **Requirements**

- MetaTrader 5
- Sufficient historical data for indicator calculation
- Broker with reasonable spreads and execution
- CPU capable of real-time ML inference

## **Disclaimer**

This system is for educational and research purposes. Past performance does not guarantee future results. Use at your own risk and always test thoroughly in a demo environment before live trading.

---

**Author:** PhD Mathematics Finance  
**Version:** 17.70  
**Last Updated:** 2025