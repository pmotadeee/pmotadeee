// logger.c â€“ Sistema de log simples
#include "logger.h"
#include <stdio.h>
#include <time.h>

void Log(const char *msg) {
    FILE *f = fopen("rabbids.log", "a");
    if (f) {
        time_t t = time(NULL);
        fprintf(f, "[%s] %s\n", ctime(&t), msg);
        fclose(f);
    }
}
