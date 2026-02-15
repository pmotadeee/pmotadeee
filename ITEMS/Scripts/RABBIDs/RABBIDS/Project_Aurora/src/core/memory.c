// memory.c â€“ MantÃ©m histÃ³rico e mÃ©dia mÃ³vel
#include "memory.h"
#include <stdlib.h>

#define HISTORY_SIZE 10

static double history[HISTORY_SIZE];
static int index = 0;
static int count = 0;

void Memory_AddReading(double value) {
    history[index] = value;
    index = (index + 1) % HISTORY_SIZE;
    if (count < HISTORY_SIZE) count++;
}

double Memory_GetMovingAverage() {
    if (count == 0) return 0.0;
    double sum = 0.0;
    for (int i = 0; i < count; i++) {
        sum += history[i];
    }
    return sum / count;
}
