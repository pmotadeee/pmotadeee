// vm_detection.c â€“ Detecta mÃ¡quina virtual
#include <windows.h>
#include <stdio.h>

int VM_Detect() {
    // Verificar presenÃ§a de mÃ³dulos VM
    if (GetModuleHandleA("vboxguest.dll")) return 1;
    if (GetModuleHandleA("vmhgfs.dll")) return 1;
    return 0;
}
