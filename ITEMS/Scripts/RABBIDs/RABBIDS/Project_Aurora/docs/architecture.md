# Arquitetura do RABBIDS

## VisÃ£o Geral
Agente modular composto por:
- **Core**: PercepÃ§Ã£o, inferÃªncia, aÃ§Ã£o, memÃ³ria.
- **MÃ³dulos**: PropagaÃ§Ã£o, camuflagem, controle de recursos, isolamento de rede, comunicaÃ§Ã£o.
- **Evasion**: TÃ©cnicas anti-detecÃ§Ã£o (AMSI, ETW, sandbox, ofuscaÃ§Ã£o).
- **Persistence**: MÃºltiplos mÃ©todos de persistÃªncia.
- **Utils**: FunÃ§Ãµes auxiliares (crypto, logger, config).

## Fluxo Principal
1. Coleta mÃ©tricas do sistema.
2. Avalia polÃ­tica com base em thresholds e histÃ³rico.
3. Executa aÃ§Ãµes (ajuste de prioridade, controle de processos, etc.).
4. Executa mÃ³dulos conforme necessidade (propagaÃ§Ã£o, comunicaÃ§Ã£o).
5. Aplica evasÃ£o contÃ­nua.
