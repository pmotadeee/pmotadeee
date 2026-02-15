// perception.c – Módulo de percepção do sistema (coleta de métricas usando GetSystemTimes)
#include "perception.h"
#include <windows.h>
#include <stdio.h>
#include <tlhelp32.h>

static ULARGE_INTEGER lastIdle, lastKernel, lastUser;
static int initialized = 0;

void Perception_Init() {
    FILETIME idle, kernel, user;
    if (GetSystemTimes(&idle, &kernel, &user)) {
        lastIdle.LowPart = idle.dwLowDateTime;
        lastIdle.HighPart = idle.dwHighDateTime;
        lastKernel.LowPart = kernel.dwLowDateTime;
        lastKernel.HighPart = kernel.dwHighDateTime;
        lastUser.LowPart = user.dwLowDateTime;
        lastUser.HighPart = user.dwHighDateTime;
        initialized = 1;
    }
}

double Perception_GetCpuUsage() {
    if (!initialized) {
        Perception_Init();
        return 0.0;
    }

    FILETIME idle, kernel, user;
    if (!GetSystemTimes(&idle, &kernel, &user)) {
        return 0.0;
    }

    ULARGE_INTEGER currentIdle, currentKernel, currentUser;
    currentIdle.LowPart = idle.dwLowDateTime;
    currentIdle.HighPart = idle.dwHighDateTime;
    currentKernel.LowPart = kernel.dwLowDateTime;
    currentKernel.HighPart = kernel.dwHighDateTime;
    currentUser.LowPart = user.dwLowDateTime;
    currentUser.HighPart = user.dwHighDateTime;

    ULONGLONG idleDiff = currentIdle.QuadPart - lastIdle.QuadPart;
    ULONGLONG kernelDiff = currentKernel.QuadPart - lastKernel.QuadPart;
    ULONGLONG userDiff = currentUser.QuadPart - lastUser.QuadPart;
    ULONGLONG totalDiff = kernelDiff + userDiff;

    lastIdle = currentIdle;
    lastKernel = currentKernel;
    lastUser = currentUser;

    if (totalDiff == 0) return 0.0;
    
    // CPU Usage = (Total - Idle) / Total * 100
    // Note: Kernel time includes idle time in GetSystemTimes
    double usage = 100.0 * (double)(totalDiff - idleDiff) / (double)totalDiff;
    if (usage < 0.0) usage = 0.0;
    if (usage > 100.0) usage = 100.0;

    return usage;
}

DWORD Perception_GetMemoryUsage() {
    MEMORYSTATUSEX memInfo;
    memInfo.dwLength = sizeof(MEMORYSTATUSEX);
    if (GlobalMemoryStatusEx(&memInfo)) {
        return (DWORD)memInfo.dwMemoryLoad;
    }
    return 0;
}

int Perception_GetProcessCount() {
    int count = 0;
    HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (hSnapshot != INVALID_HANDLE_VALUE) {
        PROCESSENTRY32 pe32;
        pe32.dwSize = sizeof(PROCESSENTRY32);
        if (Process32First(hSnapshot, &pe32)) {
            do {
                count++;
            } while (Process32Next(hSnapshot, &pe32));
        }
        CloseHandle(hSnapshot);
    }
    return count;
}
