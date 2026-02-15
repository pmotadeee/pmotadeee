#ifndef ACTION_H
#define ACTION_H
#include "inference.h"

void Action_ApplyPolicy(PolicyKey policy);
void Action_ReduceBackground();
void Action_SetPowerScheme(int throttle);
void Action_KillNonEssential();

#endif
