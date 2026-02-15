// debugger_check.c â€“ Anti-debug
#include <windows.h>
#include <stdio.h>

int Debugger_Check() {
    return IsDebuggerPresent();
}
