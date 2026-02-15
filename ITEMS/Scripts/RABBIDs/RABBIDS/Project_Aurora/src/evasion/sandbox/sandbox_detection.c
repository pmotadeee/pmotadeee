// sandbox_detection.c – Detecta ambiente de análise
#include <windows.h>
#include <stdio.h>
#include <winternl.h> // For PEB access if needed

int Sandbox_Detect() {
    // 1. Check for specific DLLs loaded by VMs / Sandbox tools
    // "sbiedll.dll" (Sandboxie), "dbghelp.dll" (Debugger), "api_log.dll" (Analysis tool)
    if (GetModuleHandleA("sbiedll.dll") != NULL) return 1;
    if (GetModuleHandleA("dbghelp.dll") != NULL) return 1;
    if (GetModuleHandleA("api_log.dll") != NULL) return 1;

    // 2. Check for VM Guest Drivers/Services
    // "vboxguest.dll", "vmhgfs.dll" (VMware)
    if (GetModuleHandleA("vboxguest.dll") != NULL) return 1;
    if (GetModuleHandleA("vmhgfs.dll") != NULL) return 1;
    
    // 3. Hardware Checks (basic)
    SYSTEM_INFO si;
    GetSystemInfo(&si);
    if (si.dwNumberOfProcessors < 2) return 1; // Many sandboxes assign 1 CPU

    // 4. Memory Check
    MEMORYSTATUSEX memStatus;
    memStatus.dwLength = sizeof(memStatus);
    GlobalMemoryStatusEx(&memStatus);
    if (memStatus.ullTotalPhys < (2ULL * 1024 * 1024 * 1024)) return 1; // < 2GB RAM is suspicious for modern Windows

    // 5. Uptime check
    // Sandboxes often have short uptime (< 10 mins)
    if (GetTickCount64() < (10 * 60 * 1000)) return 1;

    // 6. Disk space check (optional, requires GetDiskFreeSpaceEx)
    // ...

    return 0; // Likely real machine
}

int VM_Detect() {
    // Simplified wrapper for now - calls Sandbox_Detect logic or specific VM logic
    // Could check CPUID hypervisor bit here
    return Sandbox_Detect();
}
