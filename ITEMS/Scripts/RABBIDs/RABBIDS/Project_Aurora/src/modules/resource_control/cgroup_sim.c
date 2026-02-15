// cgroup_sim.c – Simula cgroups via Job Objects no Windows
#include <windows.h>
#include <stdio.h>
#include "../../utils/logger.h"

static HANDLE hJob = NULL;

void CgroupSim_Limit() {
    if (hJob != NULL) return; // Already limited

    // 1. Create Job Object
    hJob = CreateJobObject(NULL, "AuroraJobObject");
    
    if (hJob) {
        JOBOBJECT_CPU_RATE_CONTROL_INFORMATION cpuInfo = {0};
        
        // 2. Configure CPU limit (e.g., 20% max)
        cpuInfo.ControlFlags = JOB_OBJECT_CPU_RATE_CONTROL_ENABLE | JOB_OBJECT_CPU_RATE_CONTROL_HARD_CAP;
        cpuInfo.CpuRate = 2000; // 20% of CPU cycles (10000 = 100%)
        
        if (SetInformationJobObject(hJob, JobObjectCpuRateControlInformation, &cpuInfo, sizeof(cpuInfo))) {
            // 3. Assign process to Job
            if (AssignProcessToJobObject(hJob, GetCurrentProcess())) {
                Log("Resource Control: CPU Hard Cap set to 20%");
            } else {
                Log("Resource Control: Failed to assign process to job");
            }
        } else {
            Log("Resource Control: Failed to set CPU limit");
        }
    } else {
        Log("Resource Control: Failed to create Job Object");
    }
}
