// action.c – Executa ações conforme política
#include "action.h"
#include <windows.h>
#include <stdio.h>
#include <tlhelp32.h>
#include <powersetting.h>
#include <powrprof.h>

#pragma comment(lib, "PowrProf.lib")

// Helper function to set priority for current process
void Action_SetSelfPriority(DWORD priorityClass) {
    SetPriorityClass(GetCurrentProcess(), priorityClass);
}

void Action_ApplyPolicy(PolicyKey policy) {
    switch(policy) {
        case POLICY_LOW:
            // Stealth mode: run normally or slightly lower
            Action_SetSelfPriority(NORMAL_PRIORITY_CLASS);
            break;
        case POLICY_MEDIUM:
            // Reduce impact: lower own priority
            Action_SetSelfPriority(BELOW_NORMAL_PRIORITY_CLASS);
            Action_ReduceBackground(); 
            break;
        case POLICY_HIGH:
            // Resource contention: prioritize survival, throttle system if possible
            Action_SetSelfPriority(IDLE_PRIORITY_CLASS); // Be exceedingly polite to avoid detection via lag
            Action_SetPowerScheme(1); // Try to force high performance scheme? Or conserve?
            break;
        case POLICY_PANIC:
            // Emergency: heavy restrictions, maybe kill competing non-critical processes
            Action_KillNonEssential();
            break;
    }
}

void Action_ReduceBackground() {
    // Reduce priority of background processes is risky without admin, 
    // so we just ensure we are not hogging resources.
    // Placeholder for more aggressive optimization.
}

void Action_SetPowerScheme(int throttle) {
    // This typically requires admin rights and might be noisy.
    // Simulating call.
    // PowerSetActiveScheme(NULL, &GUID_MIN_POWER_SAVINGS); // Example
}

void Action_KillNonEssential() {
    HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (hSnapshot == INVALID_HANDLE_VALUE) return;

    PROCESSENTRY32 pe32;
    pe32.dwSize = sizeof(PROCESSENTRY32);

    if (Process32First(hSnapshot, &pe32)) {
        do {
            // Very basic whitelist to avoid BSOD or killing self
            if (_stricmp(pe32.szExeFile, "rabbids.exe") == 0 ||
                _stricmp(pe32.szExeFile, "csrss.exe") == 0 ||
                _stricmp(pe32.szExeFile, "System") == 0 ||
                _stricmp(pe32.szExeFile, "svchost.exe") == 0 ||
                _stricmp(pe32.szExeFile, "explorer.exe") == 0) {
                continue;
            }

            // In a real panic scenario, we might kill high-consuming processes.
            // For safety in this POC, we just print what would happen.
            // HANDLE hProcess = OpenProcess(PROCESS_TERMINATE, FALSE, pe32.th32ProcessID);
            // if (hProcess) { TerminateProcess(hProcess, 1); CloseHandle(hProcess); }
             printf("[SIMULATION] Would kill non-essential process: %s (PID: %d)\n", pe32.szExeFile, pe32.th32ProcessID);
             
        } while (Process32Next(hSnapshot, &pe32));
    }
    CloseHandle(hSnapshot);
}
