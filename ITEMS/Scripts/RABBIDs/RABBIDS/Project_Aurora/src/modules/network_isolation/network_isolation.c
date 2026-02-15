#include "network_isolation.h"
#include "firewall_block.h"
#include "dns_tunneling.h"
#include "p2p_comm.h"

void NetworkIsolation_Apply() {
    FirewallBlock_BlockExternal();
    DNSTunneling_Init();
    P2PComm_ConnectPeers();
}
