// api_resolver.c â€“ ResoluÃ§Ã£o dinÃ¢mica de APIs para evitar imports
#include <windows.h>

FARPROC ResolveAPI(const char *module, const char *func) {
    HMODULE hMod = GetModuleHandleA(module);
    if (!hMod) hMod = LoadLibraryA(module);
    if (!hMod) return NULL;
    return GetProcAddress(hMod, func);
}
