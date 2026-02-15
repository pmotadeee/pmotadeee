# Relatório Detalhado de Conteúdo dos Arquivos - Project Aurora

Este relatório detalha o conteúdo técnico específico que foi injetado em cada arquivo do projeto `Project_Aurora` durante a etapa de população (`populate_all.ps1`). Diferenciamos entre **Lógica Implementada (Esqueletos Funcionais)** e **Stubs (Placeholders)**.

---

## 1. Núcleo (Core) - Lógica Estrutural Implementada

Os arquivos do diretório `src/core/` receberam implementações básicas funcionais para estabelecer o ciclo de vida do agente.

| Arquivo | Conteúdo Preenchido | Detalhes Técnicos |
| :--- | :--- | :--- |
| `perception.c` | **Funcional** | Setup da API **PDH (Performance Data Helper)** do Windows para leitura real de uso de CPU (`\Processor(_Total)\% Processor Time`) e `GlobalMemoryStatusEx` para memória. |
| `inference.c` | **Lógica de Decisão** | Implementa uma máquina de estados simples com **thresholds** definidos (30%, 60%, 85%, 95%) para decidir o nível de agressividade (`POLICY_LOW` a `POLICY_PANIC`). |
| `memory.c` | **Algoritmo** | Implementação de um buffer circular para cálculo de **média móvel** das métricas, permitindo decisões baseadas em tendências e não apenas valores instantâneos. |
| `action.c` | **Switch-Case** | Estrutura de despacho que recebe a `PolicyKey` e chama funções placeholder para ações (ex: `Action_SetPowerScheme`). |
| `core_main.c` | **Loop Principal** | Loop infinito (`while(1)`) que orquestra a chamada sequencial: `Perception` -> `Memory` -> `Inference` -> `Action`, com `Sleep(5000)` para termorregulação. |

---

## 2. Módulos Operacionais - Stubs e Protótipos

Os arquivos em `src/modules/` contêm a estrutura das funções e placeholders para a futura implementação das técnicas ofensivas.

| Módulo | Arquivos | Conteúdo (Stub) |
| :--- | :--- | :--- |
| **Propagation** | `smb_exploit.c`<br>`rdp_bruteforce.c`<br>`ssh_scanner.c` | Funções void (ex: `SMB_TryExploit`) contendo `printf` para simular a tentativa de ataque. Preparado para receber código de sockets/exploit. |
| **Camouflage** | `process_hollowing.c`<br>`dll_injection.c` | Estrutura de funções para injeção. `ProcessHollowing_Run` está preparada para receber a lógica de `CreateProcess` (suspenso) e `WriteProcessMemory`. |
| **Resource** | `cgroup_sim.c`<br>`priority_stealing.c` | Protótipos para manipulação de **Job Objects** (simulação de cgroups) e APIs de prioridade (`SetPriorityClass`). |
| **Network** | `firewall_block.c`<br>`dns_tunneling.c` | Stubs para chamadas futuras ao `netsh` ou APIs de firewall COM, e lógica de encapsulamento DNS. |
| **Comm (C2)** | `https_beacon.c`<br>`dns_beacon.c` | Estrutura básica com includes de `winhttp.h`, preparada para configurar sessões TLS e requisições POST. |

---

## 3. Evasão e Persistência - Técnicas Definidas

Arquivos em `src/evasion/` e `src/persistence/` foram preenchidos com foco nas APIs específicas que serão abusadas.

| Técnica | Arquivo | O que foi preenchido |
| :--- | :--- | :--- |
| **AMSI Bypass** | `amsi_bypass.c` | Função `AMSI_Bypass` documentada para localizar `amsi.dll` e sobrescrever o buffer de `AmsiScanBuffer` (técnica de patching). |
| **Anti-Sandbox** | `detction.c` | Checks básicos simulados: verificação de drivers de VM (`vboxguest.dll`) e debugger (`IsDebuggerPresent`). |
| **Ofuscação** | `string_obfuscation.c` | Implementação funcional de uma rotina **XOR** simples para cifrar/decifrar strings em memória. |
| **API Resolver** | `api_resolver.c` | Função funcional `ResolveAPI` que encapsula `LoadLibrary` e `GetProcAddress`, base para esconder imports na IAT. |
| **Persistência** | `scheduled_task.c` | Comando `system()` pré-formatado para usar `schtasks.exe` como exemplo de persistência via tarefa agendada. |
| **Registry** | `registry_run.c` | Uso da API `RegOpenKeyExA` e `RegSetValueExA` para escrever na chave `Run` do usuário atual. |

---

## 4. Configuração e Build

Arquivos de suporte para garantir que o projeto compile e tenha parâmetros ajustáveis.

-   **`Makefile`**: Script de build funcional configurado para gcc (MinGW), compilando recursivamente todos os `.c` em `src/` e gerando `rabbids.exe`.
-   **`CMakeLists.txt`**: Configuração alternativa para quem usa CLion ou Visual Studio com CMake.
-   **`config/evasion_rules.json`**: JSON estruturado definindo regras como `min_cpu_cores: 4` e `amsi_bypass: true`, servindo de modelo para o parser de configuração.
-   **Headers (`include/*.h`)**: Todos os headers públicos foram criados com *Include Guards* (`#ifndef ...`) para evitar erros de compilação.

---

### Resumo
O projeto agora possui um **esqueleto compilável**. O "Core" está vivo (coleta métricas e decide), enquanto os "braços" (ataque/defesa) estão definidos como funções vazias prontas para receber a lógica pesada (WinAPI calls reais).
