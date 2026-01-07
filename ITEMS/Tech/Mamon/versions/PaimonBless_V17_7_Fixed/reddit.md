**Post Title: Deconstructing Paimon Bless V17.7: A Hybrid ML-Bayesian System with Uncertainty-Weighted Execution**

**Subreddit:** r/algotrading
**Flair:** Strategy Discussion

Hello r/algotrading,

I've been developing a quantitative trading system for MetaTrader 5 over the past year and wanted to share the core architecture of its latest iteration. The system, dubbed "Paimon Bless V17.7," is built around a central thesis: **model uncertainty is not noise to be ignored, but a critical signal for dynamic risk allocation.** This post breaks down its components without the marketing fluff.

### **Core Architecture: A Three-Model Ensemble**

The system isn't a single model. It's a framework that runs three distinct prediction engines in parallel and weighs their outputs based on real-time confidence:

1.  **A Shallow Neural Network with Monte Carlo Dropout:** This is the primary workhorse. It's a single-hidden-layer network (6 input features, 1 output) trained online via stochastic gradient descent. The key is its inference method: it performs **Monte Carlo Dropout** (30 forward passes with random dropout). The mean of these passes is the predicted probability, and their standard deviation is the **model uncertainty**. High uncertainty = lower model weight in the final decision.

2.  **A Bayesian Gaussian Naive Bayes Classifier:** This model maintains online, recursive estimates of the mean and variance for each input feature, separately for winning and losing trade outcomes. Its prediction is a pure Bayesian posterior. It's robust, requires little data, and often contradicts the neural net when markets shift.

3.  **A Four-Moment Kelly Criterion Engine:** This isn't a predictor, but a dynamic risk allocator. It tracks not just win rate and win/loss ratio (the standard Kelly inputs), but also the **skewness** and **kurtosis** of returns. A negatively skewed return distribution (big, infrequent losses) automatically reduces position size. It also scales down aggressiveness based on current system drawdown.

### **Signal Generation: Uncertainty-Weighted Fusion**

This is where the system moves beyond simple model averaging. Every tick, it performs the following:

```python
# Pseudocode of the core loop
ml_prediction, ml_uncertainty = neural_net.predict(features, mc_iterations=30)
bayes_prediction = bayesian_model.predict(features)

# Inverse uncertainty weighting
ml_weight = 1.0 - ml_uncertainty
bayes_weight = ml_uncertainty  # When NN is unsure, rely more on Bayes

final_probability = (ml_prediction * ml_weight) + (bayes_prediction * bayes_weight)
```

The logic is simple: if the neural network is "confident" (low uncertainty across dropout passes), its vote counts for more. If it's confused (high variance in outputs), the system leans on the more stable, probabilistic Bayesian model. The final output is a single probability between 0 and 1.

**Trade Execution Logic:**
*   **Long Signal:** `final_probability > threshold` (e.g., 0.60) **AND** RSI < 70.
*   **Short Signal:** `final_probability < (1 - threshold)` (e.g., 0.40) **AND** RSI > 30.
*   **No Trade:** Uncertainty metric exceeds a maximum cap (e.g., 0.20) or drawdown limits are triggered.

### **Feature Space & Risk Management**

**Features (All normalized):**
*   RSI (momentum)
*   ADX (trend strength)
*   Normalized difference between fast (9) and slow (21) EMAs (trend direction)
*   ATR (volatility)
*   Bollinger Band width normalized by ATR (compression/expansion)
*   Normalized spread (liquidity)

**Risk Management Layers:**
1.  **Kelly-Based Position Sizing:** The base position size is `f* = (p*b - q)/b`, where `p` is win rate, `b` is avg_win/avg_loss, and `q = 1-p`. This `f*` is then scaled by the user-defined `KellyFraction` (e.g., 0.25 for "quarter Kelly") and further reduced by the skewness factor and current drawdown.
2.  **Circuit Breakers:** Hard stop on all new positions if total drawdown > 15%.
3.  **Trade Cooldown:** Mandatory 300-second wait between entries to prevent over-trading in volatile periods.

### **Online Learning Feedback Loop**

The system doesn't have a separate "backtesting" and "live" mode. Every closed trade is a training event.

```python
# After a trade closes:
if profit > 0:
    target = 1.0 if last_signal_was_long else 0.0  # Reinforce correct direction
else:
    target = 0.0 if last_signal_was_long else 1.0  # Punish incorrect direction

neural_net.train(last_features, target, learning_rate=0.01)
bayesian_model.update(last_features, is_win=(profit>0))
risk_engine.update_stats(profit_return)
```

This creates a slow-adapting system. It doesn't chase the last trade but gradually adjusts its weights and priors to the current market regime.

### **Practical Considerations & Challenges**

*   **Computational Cost:** The MC Dropout inference is heavier than a standard forward pass. This is fine on a single pair but scales poorly to hundreds without optimization.
*   **Initial "Bootstrap" Period:** The Bayesian model and risk engine need ~20-30 trades to produce meaningful statistics. The system uses ultra-conservative position sizing until then.
*   **Overfitting Control:** L2 regularization on the neural net and the use of a simple model architecture are crucial. The Bayesian model, by its nature, is less prone to overfitting.

### **Why This Approach?**

The goal was to build something that acknowledges the non-stationary, noisy nature of market data. By explicitly quantifying and utilizing uncertainty, the system aims to be more selective in its trades and more adaptive in its risk, potentially smoothing the equity curve compared to a deterministic model.

I'm sharing this to discuss the architectural philosophy. Has anyone else implemented similar uncertainty-weighted ensembles or online Bayesian updates in a live trading context? What are the biggest pitfalls you've found with adaptive online learning systems?

**Disclaimer:** This is a description of a research framework. It is not financial advice, nor a guarantee of performance. All trading involves substantial risk.