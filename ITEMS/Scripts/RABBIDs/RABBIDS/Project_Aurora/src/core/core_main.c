// core_main.c â€“ Loop principal do agente
#include "perception.h"
#include "inference.h"
#include "action.h"
#include "memory.h"
#include <windows.h>

int main() {
    Perception_Init();
    while (1) {
        double cpu = Perception_GetCpuUsage();
        Memory_AddReading(cpu);
        PolicyKey policy = Inference_DeterminePolicy();
        Action_ApplyPolicy(policy);
        Sleep(5000); // intervalo de 5 segundos
    }
    return 0;
}
