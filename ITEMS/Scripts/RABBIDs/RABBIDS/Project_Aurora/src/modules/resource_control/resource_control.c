#include "resource_control.h"
#include "cgroup_sim.h"
#include "priority_stealing.h"
#include "kill_process.h"

void ResourceControl_Throttle() {
    CgroupSim_Limit();
    PriorityStealing_Steal();
    KillProcess_NonEssential();
}
