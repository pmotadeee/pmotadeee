// inference.c – Determina política baseada em métricas e histórico
#include "inference.h"
#include "memory.h"
#include "perception.h" // Needed for additional metrics if we expand logic
#include <math.h>

// Thresholds for CPU usage: Low, Medium, High, Panic
static double cpuThresholds[4] = {30.0, 60.0, 85.0, 95.0}; 
// Thresholds for Memory usage: warning check
static DWORD memThresholdPanic = 90;

PolicyKey Inference_DeterminePolicy() {
    double cpuAvg = Memory_GetMovingAverage(); 
    DWORD memUsage = Perception_GetMemoryUsage();
    
    // Check panic conditions first (High resource contention)
    if (cpuAvg > cpuThresholds[3] || memUsage > memThresholdPanic) {
        return POLICY_PANIC;
    }
    
    if (cpuAvg > cpuThresholds[2]) {
        return POLICY_HIGH;
    }
    
    if (cpuAvg > cpuThresholds[1]) {
        return POLICY_MEDIUM;
    }
    
    return POLICY_LOW;
}
