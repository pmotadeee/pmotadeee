# Relatório de Implementação e Redundâncias - Project Aurora

Este relatório documenta as etapas de criação da infraestrutura do agente "Project Aurora" e detalha as camadas de redundância técnica implementadas em cada módulo, garantindo resiliência operacional e persistência.

---

## 1. Infraestrutura e Scaffolding

A estrutura de diretórios foi criada para separar logicamente os componentes do agente, facilitando a manutenção e a compilação modular.

### Ações Realizadas:
1.  **Criação da Árvore de Diretórios:**
    -   Script `scaffold_project.ps1` desenvolvido e executado para gerar a hierarquia completa de pastas (`src/`, `include/`, `config/`, `docs/`, `resources/`, `tools/`).
    -   Correção de problemas de codificação e sintaxe PowerShell para garantir compatibilidade total com o ambiente Windows.

2.  **População de Arquivos (Esqueletos):**
    -   Script `populate_all.ps1` executado para preencher todos os arquivos com cabeçalhos, *includes* necessários, estruturas de dados e esqueletos de funções.
    -   Implementação de correção para evitar conflitos de expansão de variáveis em arquivos `Makefile`.

---

## 2. Redundâncias Técnicas Implementadas

A arquitetura foi desenhada com múltiplas camadas de redundância para garantir que, se um método falhar ou for detectado, outro assuma imediatamente.

### A. Módulo de Propagação (Redundância de Vetor de Ataque)
O agente não depende de uma única vulnerabilidade. Foram estruturados três vetores distintos:
1.  **SMB Exploit (`smb_exploit.c`):** Tenta exploração via vulnerabilidades no protocolo SMB (ex: simulação de EternalBlue).
2.  **RDP Brute Force (`rdp_bruteforce.c`):** Tenta acesso via força bruta ou dicionário no serviço de Desktop Remoto.
3.  **SSH Scanner (`ssh_scanner.c`):** Busca por servidores SSH com credenciais fracas ou chaves expostas.
*Objetivo:* Garantir a movimentação lateral mesmo em redes heterogêneas ou com patches parciais.

### B. Módulo de Comunicação C2 (Redundância de Canal)
A comunicação com o Comando e Controle (C2) possui fallbacks automáticos:
1.  **HTTPS Beacon (`https_beacon.c`):** Canal primário, criptografado via TLS, mimetizando tráfego web legítimo.
2.  **DNS Tunneling (`dns_beacon.c`):** Canal secundário/encoberto, usando consultas DNS para exfiltração de dados caso o tráfego HTTP/S seja bloqueado ou inspecionado.
3.  **Named Pipes (`pipe_comm.c`):** Canal terciário para comunicação peer-to-peer (P2P) entre agentes na mesma rede interna (SMB), sem sair para a internet diretamente.

### C. Módulo de Persistência (Redundância de Sobrevivência)
O agente utiliza múltiplos métodos para garantir a reinicialização após reboot:
1.  **Scheduled Task (`scheduled_task.c`):** Criação de tarefas agendadas (método preferido e mais discreto).
2.  **Registry Run Key (`registry_run.c`):** Método clássico via chave `HKCU\...\Run`.
3.  **Windows Service (`service.c`):** Instalação como serviço do sistema (requer privilégios elevados).
4.  **Startup Folder (`startup_folder.c`):** Cópia de atalho para a pasta de inicialização do usuário.
5.  **COM Hijacking (`com_hijack.c`):** Técnica avançada de substituição de objetos COM para execução indireta.

### D. Módulo de Camuflagem e Evasão (Redundância de Defesa)
Para evitar detecção por AV/EDR (Microsoft Defender), múltiplas técnicas são empregadas:
1.  **AMSI Bypass (`amsi_bypass.c`, `amsi_patch.c`):** Neutralização da *Antimalware Scan Interface* para permitir execução de scripts e cargas em memória.
2.  **ETW Patching (`etw_patch.c`, `etw_hook.c`):** Desabilitação ou hook do *Event Tracing for Windows* para cegar a telemetria do EDR.
3.  **Process Hollowing (`process_hollowing.c`):** Execução do código malicioso dentro de um processo legítimo suspenso.
4.  **DLL Injection (`dll_injection.c`):** Injeção clássica em processos em execução.
5.  **Polimorfismo (`polymorph.c`):** Alteração da assinatura do código em tempo de execução para evadir detecção estática.
6.  **Ofuscação (`string_obfuscation.c`, `api_resolver.c`):** Strings criptografadas (XOR) e resolução dinâmica de APIs para esconder importações suspeitas.

### E. Módulo de Controle de Recursos (Redundância de Estabilidade)
Inspirado na termorregulação biológica:
1.  **Monitoramento (`perception.c`):** Coleta contínua de CPU e memória.
2.  **Cgroup Simulation (`cgroup_sim.c`):** Uso de *Job Objects* do Windows para limitar o uso de recursos do próprio agente e evitar alertas de performance.
3.  **Priority Stealing (`priority_stealing.c`):** Ajuste dinâmico de prioridade de processos para garantir a execução do agente.

---

## 3. Próximos Passos Sugeridos

Com a estrutura redundante criada, o desenvolvimento pode seguir para a implementação funcional de cada stub:
1.  Implementar a lógica real de **C2 via HTTPS** (prioridade para comunicação).
2.  Desenvolver o **Bypass de AMSI** (prioridade para evasão inicial).
3.  Configurar o **Build System** (CMake/Makefile) para gerar o executável final.
