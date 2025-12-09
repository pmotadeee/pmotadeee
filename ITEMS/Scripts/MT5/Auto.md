//@version=5
indicator("Unified TrendMesh Sniper [Atous]", overlay=true, max_lines_count=500, max_boxes_count=50, max_labels_count=500)

// ---------------------------------------------------------------------------------------------------------------------
// INPUTS
// ---------------------------------------------------------------------------------------------------------------------

texto = ""
grp_macro = "=== CONFIGURAÇÃO MACRO (MESH/FIBO) ==="
inp_LookBack    = input.int(500, "Histórico (Velas) para Fibo", group=grp_macro)
inp_ConnectPast = input.int(3, "Conexões MESH por Pivô", group=grp_macro)
inp_ShowFibo    = input.bool(true, "Mostrar Zona Fibo?", group=grp_macro)

grp_zigzag = "=== SENSIBILIDADE (ZIGZAG) ==="
inp_ZigDepth = input.int(12, "Depth", group=grp_zigzag)
inp_ZigDev   = input.int(5, "Deviation", group=grp_zigzag)
inp_ZigBack  = input.int(3, "Backstep", group=grp_zigzag)

grp_micro = "=== CONFIGURAÇÃO MICRO (SCALPING) ==="
inp_EmaFast     = input.int(8, "EMA Rápida", group=grp_micro)
inp_EmaSlow     = input.int(21, "EMA Lenta", group=grp_micro)
inp_RsiPeriod   = input.int(14, "Período RSI", group=grp_micro)
inp_RsiLower    = input.int(30, "Nível RSI Sobrevenda", group=grp_micro)
inp_RsiUpper    = input.int(70, "Nível RSI Sobrecompra", group=grp_micro)

grp_visual = "=== VISUAL ==="
inp_ColorRes = input.color(color.new(color.gray, 50), "Resistência Mesh", group=grp_visual)
inp_ColorSup = input.color(color.new(color.teal, 50), "Suporte Mesh", group=grp_visual)
inp_ColorBuy = input.color(color.new(color.green, 85), "Zona Fibo Compra", group=grp_visual)
inp_ColorSell= input.color(color.new(color.red, 85), "Zona Fibo Venda", group=grp_visual)

// ---------------------------------------------------------------------------------------------------------------------
// ZIGZAG & MESH LOGIC
// ---------------------------------------------------------------------------------------------------------------------
// Custom ZigZag Function equivalent to standard
// Note: Pine's built-in ta.pivot is simple. For true ZigZag with depth/deviation we typically use a library or custom logic.
// Here we use a standard robust implementation for ZigZag to get Pivot Points.

var float[] highs_price = array.new_float()
var int[]   highs_idx   = array.new_int()
var float[] lows_price  = array.new_float()
var int[]   lows_idx    = array.new_int()

// Calculate ZigZag
var float dir = 0
var float last_zig = 0
var int last_zig_idx = 0

// Raw High/Low for depth
float ph = ta.highest(high, inp_ZigDepth)
float pl = ta.lowest(low, inp_ZigDepth)
bool is_high = high == ph
bool is_low  = low == pl
texto append ultuomo valor
// Direction change detection considering Deviation
// Simplified implementation for visual mapping
// Using explicit Pivot High/Low for stable Mesh generation
piv_h = ta.pivothigh(high, inp_ZigDepth, inp_ZigDepth)
piv_l = ta.pivotlow(low, inp_ZigDepth, inp_ZigDepth)

// Update Arrays on confirmed pivots
if not na(piv_h)
    array.unshift(highs_price, piv_h)
    array.unshift(highs_idx, bar_index - inp_ZigDepth)
    // Draw Pivot Marker (Downward Arrow for Resistance)
    label.new(bar_index - inp_ZigDepth, piv_h, style=label.style_triangledown, color=color.red, size=size.tiny)
    
    // Draw Mesh Lines (High to High)
    if array.size(highs_idx) > 1
        int connections = 0
        for i = 1 to array.size(highs_idx) - 1
            line.new(array.get(highs_idx, 0), array.get(highs_price, 0), array.get(highs_idx, i), array.get(highs_price, i), color=inp_ColorRes, style=line.style_dotted)
            connections += 1
            if connections >= inp_ConnectPast
                break

if not na(piv_l)
    array.unshift(lows_price, piv_l)
    array.unshift(lows_idx, bar_index - inp_ZigDepth)
    // Draw Pivot Marker (Upward Arrow for Support)
    label.new(bar_index - inp_ZigDepth, piv_l, style=label.style_triangleup, color=color.lime, size=size.tiny)

    // Draw Mesh Lines (Low to Low)
    if array.size(lows_idx) > 1
        int connections = 0
        for i = 1 to array.size(lows_idx) - 1
            line.new(array.get(lows_idx, 0), array.get(lows_price, 0), array.get(lows_idx, i), array.get(lows_price, i), color=inp_ColorSup, style=line.style_dotted)
            connections += 1
            if connections >= inp_ConnectPast
                break

// Cleanup Arrays to prevent memory issues
if array.size(highs_idx) > 50
    array.pop(highs_idx)
    array.pop(highs_price)
if array.size(lows_idx) > 50
    array.pop(lows_idx)
    array.pop(lows_price)


// ---------------------------------------------------------------------------------------------------------------------
// FIBO ZONE LOGIC
// ---------------------------------------------------------------------------------------------------------------------
// Calculate Max/Min over LookBack
highest_price = ta.highest(high, inp_LookBack)
lowest_price  = ta.lowest(low, inp_LookBack)
highest_idx   = ta.highestbars(high, inp_LookBack) // returns offset (negative)
lowest_idx    = ta.lowestbars(low, inp_LookBack)

bool is_uptrend_fibo = lowest_idx < highest_idx // If lowest was further back (-100 < -10) -> Uptrend

var box fibo_box = na
if inp_ShowFibo
    box.delete(fibo_box) // Redraw every bar to move with chart
    
    float p50  = 0.0
    float p618 = 0.0
    color zColor = na
    float range_ = highest_price - lowest_price
    
    if is_uptrend_fibo
        p50  := highest_price - (range_ * 0.5)
        p618 := highest_price - (range_ * 0.618)
        zColor := inp_ColorBuy
    else
        p50  := lowest_price + (range_ * 0.5)
        p618 := lowest_price + (range_ * 0.618)
        zColor := inp_ColorSell
        
    // Draw
    left_bar = bar_index - inp_LookBack
    fibo_box := box.new(left_bar, p50, bar_index + 50, p618, border_width=0, bgcolor=zColor)


// ---------------------------------------------------------------------------------------------------------------------
// SCALPING LOGIC & SIGNALS
// ---------------------------------------------------------------------------------------------------------------------
emaFast = ta.ema(close, inp_EmaFast)
emaSlow = ta.ema(close, inp_EmaSlow)
rsi     = ta.rsi(close, inp_RsiPeriod)

// Conditions
buyMicro  = (emaFast > emaSlow) and (rsi > inp_RsiLower and rsi < inp_RsiUpper) and (close > open)
sellMicro = (emaFast < emaSlow) and (rsi > inp_RsiLower and rsi < inp_RsiUpper) and (close < open)

// Confluence
buyCondition  = buyMicro and is_uptrend_fibo
sellCondition = sellMicro and not is_uptrend_fibo

// Filter: Only trigger on the first bar where the condition becomes valid (avoids spam)
// Also ensures we don't plot on every bar of a trend
buySignal  = buyCondition and not buyCondition[1]
sellSignal = sellCondition and not sellCondition[1]

// Plot Signals (Removed text to reduce clutter, adjusted style)
plotshape(buySignal, title="Buy Signal", style=shape.triangleup, location=location.belowbar, color=color.new(color.green, 0), size=size.small)
plotshape(sellSignal, title="Sell Signal", style=shape.triangledown, location=location.abovebar, color=color.new(color.red, 0), size=size.small)

// Alerts
alertcondition(buySignal, title="Sniper Buy", message="Unified TrendMesh Sniper: BUY Signal")
alertcondition(sellSignal, title="Sniper Sell", message="Unified TrendMesh Sniper: SELL Signal")

// Plot EMAs for reference
plot(emaFast, "EMA Fast", color.yellow)
plot(emaSlow, "EMA Slow", color.purple)


arquivo recebe texto 