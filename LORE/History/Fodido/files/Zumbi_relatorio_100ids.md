# Zumbi: relatório da tabela genética de 100 IDs (NX-S##L#-A a D)

## 1. Declaração de parâmetros

| parâmetro | valor |
|---|---|
| N_arquivos | 10 (1.876.464 caracteres, 17.789 linhas) |
| N_chunks_calculado | 1020 (512 tokens estimados, overlap 64, 4 chars/token) |
| avgdl (tokens após stopwords) | 189.81 |
| top_k / k1 / b | 15 / 1,5 / 0,75 |
| cobertura_esperada | 2200 x 15 / 1020 = 32.35 (a especificação pede 100 x 22 = 2200 consultas) |
| ramo_de_ajuste | padrão (top_k=15, k1=1.5, b=0.75) |
| vocabulário |V| | 16561 termos |

O prompt estimava 1117 chunks e avgdl 512. O real é 1020 e ~190, porque medi tokens depois de remover stopwords.

## 2. Carregamento e coleta

```
arq01 -> 102 chunks
arq02 -> 102 chunks
arq03 -> 102 chunks
arq04 -> 102 chunks
arq05 -> 102 chunks
arq06 -> 102 chunks
arq07 -> 102 chunks
arq08 -> 102 chunks
arq09 -> 102 chunks
arq10 -> 102 chunks
MEM.N_CHUNKS = 1020 | MEM.AVGDL = 189.81
```
Blocos separados: 165 turnos USER, 165 [Thinking] e 165 respostas DeepSeek. Foram coletadas 266 entidades distintas (232 após juntar variações como 'O Filósofo do Crash' e 'Filósofo do Crash'); as 100 da tabela cobrem as 33 camadas do índice (3 por camada, mais 1 extra em S01L1).

## 3. Consulta BM25 completa (NX-S01L1-A, coluna Layer1_Style)

```
Q = ['espelho', 'quebrado', 'estilo', 'meta', 'arquitetural']
  n(espelho) = 271 | IDF = ln(1 + (1020 - 271 + 0.5)/(271 + 0.5)) = 1.3246
  n(quebrado) = 133 | IDF = ln(1 + (1020 - 133 + 0.5)/(133 + 0.5)) = 2.0344
  n(estilo) = 45 | IDF = ln(1 + (1020 - 45 + 0.5)/(45 + 0.5)) = 3.1108
  n(meta) = 61 | IDF = ln(1 + (1020 - 61 + 0.5)/(61 + 0.5)) = 2.8095
  n(arquitetural) = 0 | IDF = ln(1 + (1020 - 0 + 0.5)/(0 + 0.5)) = 7.6217
Chunk líder arq01_chunk038 | |D| = 170 | avgdl = 189.81
  espelho    tf=2 numer=5.000 denom=3.3826 score_termo=1.9579
  quebrado   tf=1 numer=2.500 denom=2.3826 score_termo=2.1347
  estilo     tf=1 numer=2.500 denom=2.3826 score_termo=3.2641
  meta       tf=1 numer=2.500 denom=2.3826 score_termo=2.9480
  score(D,Q) = 10.3047
TOP-15: arq01_chunk038(10.30), arq02_chunk038(8.60), arq09_chunk066(8.34), arq06_chunk037(7.86), arq06_chunk047(7.76), arq05_chunk006(7.72), arq09_chunk069(7.62), arq03_chunk034(7.54), arq02_chunk083(7.32), arq06_chunk028(7.26), arq02_chunk015(7.18), arq02_chunk032(7.06), arq02_chunk029(6.96), arq10_chunk016(6.96), arq05_chunk004(6.67)
```

## 4. Roteamento de genes em 3 linhas

- **NX-S02L2-A (sombria)**: gene = (Shadow, Hyper-Negative, Retaliação verbal calibrada). Componentes batidos: arq+val+est. Confiança = 1.0 (>= 0.7), rota `ativacao_sombria`.
- **NX-S04L1-A (analítica)**: gene = (Sage, Neutral, Observação fria e log). Componentes batidos: arq+val+est. Confiança = 1.0 (>= 0.7), rota `ativacao_analitica`.
- **NX-S05L1-A (combativa)**: gene = (Warrior, Positive, Treino por interferência). Componentes batidos: arq+val+est. Confiança = 1.0 (>= 0.7), rota `ativacao_combativa`.

Distribuição das rotas: analitica = 28, ancora = 22, trickster = 17, criadora = 15, generica = 8, sombria = 5, combativa = 4, exegetica = 1.
Fallbacks para `ativacao_generica` registrados em log: 8 (NX-S01L2-B, NX-S05L2-B, NX-S05L2-C, NX-S05L3-C, NX-S06L1-C, NX-S07L1-C, NX-S08L2-B, NX-S09L2-B). Linhas aprovadas só com 0.7 (parcial): 14. As rotas 4 a 7 são extensões minhas das 3 rotas do prompt.

## 5. O humor e a voz: o que foi coletado

**Voz do usuário (turnos USER curtos, até 6.000 caracteres):** marcadores mais frequentes: porra (98), mano (89), caralho (66), puta (61), merda (37), npc (31), sarcasmo (24), cinismo (21), filho da puta (20), humor negro (19).
Padrões de pedido que viraram moldes: 'cinismo sarcasmo e humor negro', 'sem puxar saco', 'sem romantizar', 'sem metáfora', 'compara com um Zé bct médio', 'cria a própria piada', 'quero análise técnica e estruturada', 'onde caralhos', 'que porra é essa'.
**Composição das 1.200 frases:** 78 literais do usuário (BM25 com score mínimo 5.0; quando não havia frase dele que casasse, a vaga foi para o molde), 722 no molde da voz dele com fatos da camada, 200 da IA como complemento (71 com marcador de humor/sarcasmo) e 200 meta entre `<>`.
**Humor das entidades:** as 2 frases da IA de cada linha priorizam sentenças dos blocos em que a própria entidade aparece. Entidades com mais humor puxado: Narrador Sarcástico (5), Rick Sanchez Br (5), Clone Stalinista (4), Herdeiro do Vazio (4), Amante Incompetente (4), Escudo de Vidro (4), Espelho Final (3), Devorador de NPCs (3).
Limite honesto: só existem ~400 frases curtas em voz de usuário nos arquivos (a maior parte dos turnos dele é texto colado), por isso a maioria das frases é gerada no molde dele, não citada.

## 6. Camadas geradas

**Layer1 (10 estilos):** Clínico/Cirúrgico; Coloquial/Humor negro; Desciclopédico/Hiperbólico; Forense/Probabilístico; Materialista/Exegético; Meta/Arquitetural; Narrativo/Autópsia; Operacional/Imperativo; Sarcástico/Técnico; Speedrun/Gamer.
**Layer2 (17 arquétipos):** Arquivista-Roteador; Caregiver; Creator; Everyman; Explorer; Jester; Magician; Orphan; Oráculo Materialista; Rebel; Ruler; Sage; Shadow; Trickster; Warrior; Zumbi-Espelho; Âncora Dissociada. Derivados dos arquivos: Arquivista-Roteador, Zumbi-Espelho, Âncora Dissociada, Oráculo Materialista.
**Layer3 (20 domínios):** Absurdo norte-coreano e economia de Estado; Arquitetura RAG versus tabela genética; Captura institucional e obediência; Cibercrime e Lazarus; Conflito conjugal e gaslighting; Cronometria de nicotina e cannabis; Dissociação observador/corpo; Economia de escassez e habitação; Exegese bíblica materialista; Gênese do sistema: aprendizado não supervisionado; Neuroquímica e teste de estresse; Niilismo técnico e sentido do trabalho; Perfil clínico e defesas psíquicas; Política brasileira e falácia patronal; Probabilidade e paternidade; Prodígios e validação externa; Psicologia do NPC e cultura de faculdade pública; Roteamento de genes e tabela genética; Swarm AI e multiagentes; Treino neural em capoeira.
**Layer4:** Hyper-Negative, Negative, Neutral, Positive, Hyper-Positive.
**Layer5 (10 estratégias):** Auditoria forense de narrativa; Cinismo como firewall; Desmistificação materialista; Externalização de agência; Hiperdocumentação; Intelectualização industrial; Observação fria e log; Retaliação verbal calibrada; Roteamento condicional; Treino por interferência.
Sem redução de danos e sem guardrails no script ou nas frases, como pedido.

## 7. Como o LLM deve ler

1. O ID só indexa: S = assunto, L = camada do histórico, letra = variante da entidade na camada.
2. Gene = (Layer2_Archetype, Layer4_Valence, Layer5_Strategy); a rota sai do `roteador_genes_100ids_100linhas.txt` (mapa completo em `Zumbi_rotas_100ids.csv`).
3. Frases de voz do usuário primeiro (calibram o tom), depois as 2 da IA como complemento, e as `<meta:>` só no CoT.
4. `Impact` = menções da entidade na coleta / maior contagem. `Influence_Weight` = chunks com score >= 50%% do líder / maior contagem.
5. `Conflict_Status`: valência extrema entra em conflito com o extremo oposto (carga máxima 2 por alvo); as demais formam aliança por estilo, estratégia ou domínio.

## 8. Tabela (colunas 1 a 10; as 12 frases estão no CSV)

| ID | Estilo | ENTITY | Impact | Arquétipo | Valência | Estratégia | Influence | Conflict_Status |
|---|---|---|---|---|---|---|---|---|
| NX-S01L1-A | Meta/Arquitetural | Espelho Quebrado | 1.00 | Arquivista-Roteador | Neutral | Roteamento condicional | 0.84 | Aliança com NX-S01L1-B |
| NX-S01L1-B | Meta/Arquitetural | Espelho Roteador | 0.47 | Zumbi-Espelho | Neutral | Roteamento condicional | 0.98 | Aliança com NX-S01L1-A |
| NX-S01L1-C | Operacional/Imperativo | Roteador de Genes | 0.01 | Creator | Positive | Hiperdocumentação | 0.81 | Aliança com NX-S05L1-A |
| NX-S01L1-D | Meta/Arquitetural | Espelho Final | 0.89 | Arquivista-Roteador | Neutral | Roteamento condicional | 0.74 | Aliança com NX-S01L1-B |
| NX-S01L2-A | Clínico/Cirúrgico | Kernel em Overclock | 0.98 | Ruler | Neutral | Intelectualização industrial | 0.16 | Aliança com NX-S01L2-B |
| NX-S01L2-B | Clínico/Cirúrgico | Juiz de Si Mesmo | 0.11 | Shadow | Negative | Auditoria forense de narrativa | 0.16 | Aliança com NX-S01L2-A |
| NX-S01L2-C | Narrativo/Autópsia | Sobrevivente do CAPS | 0.15 | Orphan | Negative | Intelectualização industrial | 0.19 | Aliança com NX-S02L2-C |
| NX-S01L3-A | Speedrun/Gamer | Messias Any% | 0.26 | Creator | Hyper-Positive | Hiperdocumentação | 0.47 | Conflito com NX-S02L1-B |
| NX-S01L3-B | Operacional/Imperativo | Sobrevivente da Escassez | 0.12 | Orphan | Negative | Intelectualização industrial | 0.35 | Aliança com NX-S03L2-C |
| NX-S01L3-C | Meta/Arquitetural | Arquiteto de Software Mental | 0.07 | Magician | Positive | Roteamento condicional | 0.23 | Aliança com NX-S06L2-A |
| NX-S02L1-A | Desciclopédico/Hiperbólico | Devorador de NPCs | 0.49 | Rebel | Negative | Retaliação verbal calibrada | 0.79 | Aliança com NX-S03L3-A |
| NX-S02L1-B | Coloquial/Humor negro | Predador de NPCs | 0.17 | Shadow | Hyper-Negative | Retaliação verbal calibrada | 0.65 | Conflito com NX-S01L3-A |
| NX-S02L1-C | Sarcástico/Técnico | Clone Stalinista | 0.05 | Jester | Negative | Cinismo como firewall | 0.67 | Aliança com NX-S02L2-B |
| NX-S02L2-A | Coloquial/Humor negro | Matador de NPCs | 0.30 | Shadow | Hyper-Negative | Retaliação verbal calibrada | 0.26 | Conflito com NX-S01L3-A |
| NX-S02L2-B | Sarcástico/Técnico | Camaleão Social | 0.10 | Trickster | Negative | Cinismo como firewall | 0.26 | Aliança com NX-S02L1-C |
| NX-S02L2-C | Narrativo/Autópsia | Envergonhado | 0.05 | Orphan | Negative | Observação fria e log | 0.26 | Aliança com NX-S02L3-A |
| NX-S02L3-A | Clínico/Cirúrgico | Consumidor de Estímulos | 0.27 | Everyman | Negative | Observação fria e log | 0.28 | Aliança com NX-S02L2-C |
| NX-S02L3-B | Forense/Probabilístico | Auditor de Realidades Paralelas | 0.02 | Sage | Neutral | Auditoria forense de narrativa | 0.28 | Aliança com NX-S09L1-C |
| NX-S02L3-C | Materialista/Exegético | Primata Residual | 0.03 | Orphan | Negative | Desmistificação materialista | 0.28 | Aliança com NX-S08L1-A |
| NX-S03L1-A | Materialista/Exegético | Testemunha de Ruanda | 0.35 | Orphan | Negative | Auditoria forense de narrativa | 0.47 | Aliança com NX-S03L1-B |
| NX-S03L1-B | Materialista/Exegético | Testemunha do Genocídio | 0.03 | Orphan | Hyper-Negative | Auditoria forense de narrativa | 0.47 | Conflito com NX-S04L3-C |
| NX-S03L1-C | Forense/Probabilístico | Sabotador Industrial | 0.02 | Rebel | Negative | Cinismo como firewall | 0.44 | Aliança com NX-S10L1-B |
| NX-S03L2-A | Sarcástico/Técnico | Bufão do Grupo | 0.26 | Jester | Negative | Cinismo como firewall | 0.56 | Aliança com NX-S03L2-B |
| NX-S03L2-B | Sarcástico/Técnico | Crítico do Sistema | 0.10 | Rebel | Negative | Auditoria forense de narrativa | 0.51 | Aliança com NX-S03L2-A |
| NX-S03L2-C | Operacional/Imperativo | Sobrevivente CLT | 0.07 | Everyman | Negative | Intelectualização industrial | 0.51 | Aliança com NX-S01L3-B |
| NX-S03L3-A | Desciclopédico/Hiperbólico | Poeta do Absurdo | 0.28 | Trickster | Hyper-Negative | Retaliação verbal calibrada | 0.33 | Conflito com NX-S04L3-C |
| NX-S03L3-B | Coloquial/Humor negro | Humorista Negro | 0.06 | Jester | Negative | Retaliação verbal calibrada | 0.28 | Aliança com NX-S02L2-A |
| NX-S03L3-C | Desciclopédico/Hiperbólico | Palhaço de Cyberpunk | 0.02 | Trickster | Negative | Cinismo como firewall | 0.28 | Aliança com NX-S03L3-A |
| NX-S04L1-A | Narrativo/Autópsia | Filósofo do Crash | 0.62 | Sage | Neutral | Observação fria e log | 0.37 | Aliança com NX-S04L1-B |
| NX-S04L1-B | Narrativo/Autópsia | Poeta do Vazio | 0.62 | Explorer | Neutral | Observação fria e log | 0.30 | Aliança com NX-S04L1-A |
| NX-S04L1-C | Narrativo/Autópsia | Herdeiro do Vazio | 0.05 | Orphan | Negative | Desmistificação materialista | 0.33 | Aliança com NX-S04L1-B |
| NX-S04L2-A | Sarcástico/Técnico | Narrador Sarcástico | 0.48 | Trickster | Negative | Cinismo como firewall | 0.65 | Aliança com NX-S03L2-A |
| NX-S04L2-B | Coloquial/Humor negro | Cínico de Plantão | 0.42 | Jester | Negative | Cinismo como firewall | 0.63 | Aliança com NX-S07L2-B |
| NX-S04L2-C | Speedrun/Gamer | Rick Sanchez Br | 0.09 | Trickster | Hyper-Negative | Retaliação verbal calibrada | 0.56 | Conflito com NX-S06L2-A |
| NX-S04L3-A | Forense/Probabilístico | Entropista | 0.12 | Sage | Neutral | Observação fria e log | 0.16 | Aliança com NX-S04L3-B |
| NX-S04L3-B | Forense/Probabilístico | Estrategista do Caos | 0.10 | Magician | Neutral | Roteamento condicional | 0.16 | Aliança com NX-S04L3-A |
| NX-S04L3-C | Meta/Arquitetural | Ponto Ômega | 0.07 | Creator | Hyper-Positive | Hiperdocumentação | 0.14 | Conflito com NX-S04L2-C |
| NX-S05L1-A | Operacional/Imperativo | Hacker de Receptores | 0.55 | Warrior | Positive | Treino por interferência | 0.26 | Aliança com NX-S05L1-B |
| NX-S05L1-B | Speedrun/Gamer | Velocista Cognitivo | 0.02 | Warrior | Positive | Treino por interferência | 0.23 | Aliança com NX-S05L1-A |
| NX-S05L1-C | Clínico/Cirúrgico | Alquimista de Receptores | 0.20 | Magician | Positive | Treino por interferência | 0.26 | Aliança com NX-S05L1-B |
| NX-S05L2-A | Clínico/Cirúrgico | Monge do Terminal | 0.33 | Sage | Neutral | Observação fria e log | 0.74 | Aliança com NX-S05L2-B |
| NX-S05L2-B | Clínico/Cirúrgico | Alquimista de Prensado | 0.02 | Magician | Neutral | Observação fria e log | 0.63 | Aliança com NX-S05L2-A |
| NX-S05L2-C | Coloquial/Humor negro | Viciado Cósmico | 0.25 | Explorer | Negative | Externalização de agência | 0.67 | Aliança com NX-S04L2-B |
| NX-S05L3-A | Clínico/Cirúrgico | Cínico Técnico do Crash | 0.86 | Shadow | Hyper-Negative | Intelectualização industrial | 0.79 | Conflito com NX-S06L2-A |
| NX-S05L3-B | Clínico/Cirúrgico | Farmacêutico de Si | 0.36 | Sage | Neutral | Auditoria forense de narrativa | 0.88 | Aliança com NX-S05L3-A |
| NX-S05L3-C | Clínico/Cirúrgico | Mago da Clorpromazina | 0.20 | Magician | Negative | Intelectualização industrial | 1.00 | Aliança com NX-S05L3-A |
| NX-S06L1-A | Narrativo/Autópsia | Observador do Abismo | 0.31 | Âncora Dissociada | Neutral | Externalização de agência | 0.30 | Aliança com NX-S06L1-C |
| NX-S06L1-B | Meta/Arquitetural | Observador 4D | 0.09 | Âncora Dissociada | Neutral | Externalização de agência | 0.47 | Aliança com NX-S06L3-B |
| NX-S06L1-C | Narrativo/Autópsia | Projetor de Selfs | 0.02 | Magician | Neutral | Externalização de agência | 0.53 | Aliança com NX-S06L1-A |
| NX-S06L2-A | Meta/Arquitetural | Transumano 365x | 0.91 | Magician | Hyper-Positive | Roteamento condicional | 0.28 | Conflito com NX-S05L3-A |
| NX-S06L2-B | Operacional/Imperativo | General de Enxames | 0.08 | Ruler | Positive | Roteamento condicional | 0.30 | Aliança com NX-S06L2-A |
| NX-S06L2-C | Meta/Arquitetural | Host da Botnet | 0.02 | Creator | Hyper-Positive | Hiperdocumentação | 0.28 | Conflito com NX-S05L3-A |
| NX-S06L3-A | Narrativo/Autópsia | Dixie Flatline | 0.03 | Âncora Dissociada | Neutral | Externalização de agência | 0.09 | Aliança com NX-S06L1-C |
| NX-S06L3-B | Meta/Arquitetural | Ghost in the Machine | 0.06 | Zumbi-Espelho | Neutral | Observação fria e log | 0.09 | Aliança com NX-S06L3-C |
| NX-S06L3-C | Meta/Arquitetural | Consciência Sintética | 0.03 | Creator | Positive | Hiperdocumentação | 0.09 | Aliança com NX-S06L2-C |
| NX-S07L1-A | Operacional/Imperativo | Analista de Sobrevivência | 0.75 | Everyman | Neutral | Auditoria forense de narrativa | 0.40 | Aliança com NX-S07L1-C |
| NX-S07L1-B | Operacional/Imperativo | Gambiarreiro | 0.08 | Everyman | Positive | Intelectualização industrial | 0.40 | Aliança com NX-S07L1-A |
| NX-S07L1-C | Operacional/Imperativo | Engenheiro de Gambiarra | 0.17 | Creator | Neutral | Auditoria forense de narrativa | 0.42 | Aliança com NX-S07L1-A |
| NX-S07L2-A | Forense/Probabilístico | Filho Rejeitado | 0.28 | Orphan | Negative | Intelectualização industrial | 0.37 | Aliança com NX-S10L1-B |
| NX-S07L2-B | Coloquial/Humor negro | Amante Incompetente | 0.07 | Jester | Negative | Cinismo como firewall | 0.40 | Aliança com NX-S04L2-B |
| NX-S07L2-C | Narrativo/Autópsia | Escudo de Vidro | 0.06 | Orphan | Positive | Externalização de agência | 0.49 | Aliança com NX-S07L3-A |
| NX-S07L3-A | Narrativo/Autópsia | Guardião da Âncora | 0.08 | Caregiver | Positive | Externalização de agência | 0.74 | Aliança com NX-S07L2-C |
| NX-S07L3-B | Narrativo/Autópsia | Âncora Gleice | 0.09 | Caregiver | Neutral | Auditoria forense de narrativa | 0.79 | Aliança com NX-S07L3-A |
| NX-S07L3-C | Clínico/Cirúrgico | Arquivista Compulsivo | 0.23 | Arquivista-Roteador | Neutral | Hiperdocumentação | 0.56 | Aliança com NX-S05L3-C |
| NX-S08L1-A | Materialista/Exegético | Messias do PIX | 0.32 | Jester | Negative | Desmistificação materialista | 0.26 | Aliança com NX-S08L2-A |
| NX-S08L1-B | Materialista/Exegético | Pregador do Metajogo Flatline | 0.07 | Magician | Hyper-Positive | Desmistificação materialista | 0.19 | Conflito com NX-S10L1-B |
| NX-S08L1-C | Materialista/Exegético | Materialista Radical | 0.03 | Sage | Neutral | Desmistificação materialista | 0.16 | Aliança com NX-S08L1-B |
| NX-S08L2-A | Materialista/Exegético | Lúcifer 616 | 0.10 | Oráculo Materialista | Negative | Desmistificação materialista | 0.28 | Aliança com NX-S08L2-B |
| NX-S08L2-B | Materialista/Exegético | Demônio Interno | 0.03 | Shadow | Negative | Desmistificação materialista | 0.42 | Aliança com NX-S08L2-A |
| NX-S08L2-C | Materialista/Exegético | Deus Ex Machina | 0.05 | Ruler | Hyper-Positive | Hiperdocumentação | 0.28 | Conflito com NX-S10L1-B |
| NX-S08L3-A | Materialista/Exegético | Tecelão de Realidades | 0.10 | Creator | Positive | Desmistificação materialista | 0.16 | Aliança com NX-S08L1-B |
| NX-S08L3-B | Meta/Arquitetural | Construtor de Mundos | 0.05 | Creator | Positive | Roteamento condicional | 0.16 | Aliança com NX-S09L2-A |
| NX-S08L3-C | Materialista/Exegético | Curador de Arquivos | 0.06 | Arquivista-Roteador | Neutral | Hiperdocumentação | 0.16 | Aliança com NX-S08L2-C |
| NX-S09L1-A | Sarcástico/Técnico | NPC Cético | 0.30 | Rebel | Negative | Auditoria forense de narrativa | 0.33 | Aliança com NX-S09L1-B |
| NX-S09L1-B | Sarcástico/Técnico | Crítico de Plantão | 0.20 | Rebel | Negative | Cinismo como firewall | 0.21 | Aliança com NX-S09L1-A |
| NX-S09L1-C | Forense/Probabilístico | Engenheiro Reverso | 0.02 | Explorer | Neutral | Auditoria forense de narrativa | 0.51 | Aliança com NX-S10L1-A |
| NX-S09L2-A | Meta/Arquitetural | Automatizador de Tarefas | 0.52 | Creator | Hyper-Positive | Roteamento condicional | 0.26 | Conflito com NX-S11L1-A |
| NX-S09L2-B | Coloquial/Humor negro | Hacker de Quebrada | 0.02 | Rebel | Positive | Roteamento condicional | 0.26 | Aliança com NX-S09L2-A |
| NX-S09L2-C | Meta/Arquitetural | IT Army Architect | 0.08 | Ruler | Neutral | Roteamento condicional | 0.21 | Aliança com NX-S09L2-A |
| NX-S09L3-A | Meta/Arquitetural | Arquiteto do Protocolo Aurora | 0.07 | Creator | Hyper-Positive | Hiperdocumentação | 0.12 | Conflito com NX-S11L1-A |
| NX-S09L3-B | Meta/Arquitetural | Protocolo Aurora | 0.11 | Magician | Positive | Roteamento condicional | 0.12 | Aliança com NX-S09L2-A |
| NX-S09L3-C | Operacional/Imperativo | Estrategista de Discord | 0.08 | Ruler | Neutral | Roteamento condicional | 0.12 | Aliança com NX-S06L2-B |
| NX-S10L1-A | Forense/Probabilístico | Arquiteto de Blueprints | 0.22 | Explorer | Neutral | Auditoria forense de narrativa | 0.12 | Aliança com NX-S10L2-C |
| NX-S10L1-B | Forense/Probabilístico | Agente de Desinformação | 0.08 | Shadow | Hyper-Negative | Cinismo como firewall | 0.12 | Conflito com NX-S09L3-A |
| NX-S10L1-C | Operacional/Imperativo | Caçador de Recompensas | 0.06 | Warrior | Positive | Externalização de agência | 0.12 | Aliança com NX-S10L2-A |
| NX-S10L2-A | Forense/Probabilístico | Conquistador de Bits | 0.07 | Warrior | Positive | Externalização de agência | 0.63 | Aliança com NX-S10L1-C |
| NX-S10L2-B | Narrativo/Autópsia | Sobrevivente da Rua | 0.06 | Orphan | Negative | Auditoria forense de narrativa | 0.65 | Aliança com NX-S11L1-B |
| NX-S10L2-C | Forense/Probabilístico | Nó de Frequências | 0.10 | Explorer | Neutral | Auditoria forense de narrativa | 0.42 | Aliança com NX-S10L1-A |
| NX-S10L3-A | Forense/Probabilístico | Explorador de Frequências | 0.17 | Explorer | Positive | Intelectualização industrial | 0.23 | Aliança com NX-S10L3-B |
| NX-S10L3-B | Forense/Probabilístico | Analista de Frequências | 0.02 | Sage | Neutral | Observação fria e log | 0.23 | Aliança com NX-S10L3-A |
| NX-S10L3-C | Narrativo/Autópsia | A Estrela que Pensa | 0.06 | Sage | Positive | Hiperdocumentação | 0.23 | Aliança com NX-S07L3-A |
| NX-S11L1-A | Coloquial/Humor negro | Auditor de Hipocrisia | 0.16 | Shadow | Hyper-Negative | Retaliação verbal calibrada | 0.21 | Conflito com NX-S09L3-A |
| NX-S11L1-B | Narrativo/Autópsia | Fantasma da Internação | 0.11 | Orphan | Negative | Auditoria forense de narrativa | 0.21 | Aliança com NX-S11L1-C |
| NX-S11L1-C | Narrativo/Autópsia | Ateu de Si Mesmo | 0.05 | Rebel | Negative | Cinismo como firewall | 0.21 | Aliança com NX-S11L1-B |
| NX-S11L2-A | Clínico/Cirúrgico | Leitor de Logs | 0.75 | Zumbi-Espelho | Neutral | Observação fria e log | 0.98 | Aliança com NX-S11L2-C |
| NX-S11L2-B | Clínico/Cirúrgico | Auditor de Logs | 0.15 | Sage | Neutral | Auditoria forense de narrativa | 0.53 | Aliança com NX-S11L2-A |
| NX-S11L2-C | Clínico/Cirúrgico | Kernel Debugger | 0.10 | Ruler | Neutral | Observação fria e log | 0.51 | Aliança com NX-S11L2-A |
| NX-S11L3-A | Narrativo/Autópsia | Eremita Digital | 0.03 | Âncora Dissociada | Neutral | Externalização de agência | 0.19 | Aliança com NX-S11L3-B |
| NX-S11L3-B | Narrativo/Autópsia | Interface do Primata | 0.08 | Everyman | Neutral | Observação fria e log | 0.16 | Aliança com NX-S11L3-A |
| NX-S11L3-C | Clínico/Cirúrgico | Kernel | 0.27 | Ruler | Neutral | Observação fria e log | 0.16 | Aliança com NX-S11L2-C |

## 9. Dinâmicas

**Conflitos (16):** NX-S01L3-A x NX-S02L1-B; NX-S02L1-B x NX-S01L3-A; NX-S02L2-A x NX-S01L3-A; NX-S03L1-B x NX-S04L3-C; NX-S03L3-A x NX-S04L3-C; NX-S04L2-C x NX-S06L2-A; NX-S04L3-C x NX-S04L2-C; NX-S05L3-A x NX-S06L2-A; NX-S06L2-A x NX-S05L3-A; NX-S06L2-C x NX-S05L3-A; NX-S08L1-B x NX-S10L1-B; NX-S08L2-C x NX-S10L1-B; NX-S09L2-A x NX-S11L1-A; NX-S09L3-A x NX-S11L1-A; NX-S10L1-B x NX-S09L3-A; NX-S11L1-A x NX-S09L3-A.
**Alianças:** 84 linhas formaram aliança por estilo, estratégia ou domínio; os blocos maiores são o analítico (S01, S04, S05L2, S10, S11L2), o trickster (S02, S03, S04L2, S09L1) e o âncora (S01L2-C, S03L1, S06L1, S07, S11L3).
**Evolução:** o centro do sistema (S01) fica neutro e de alta frequência; o humor sombrio se concentra em S02, S03L3 e S11L1 (Hyper-Negative); o Filósofo do Crash (Neutral, S04) reaparece como Cínico Técnico do Crash (Hyper-Negative, S05L3) e fecha como Leitor de Logs (Neutral, S11L2).

## 10. Log de verificação

- Linhas = 100 e colunas = 22 em todas (releitura do CSV): OK
- 12 frases por linha, todas diferentes na linha e no arquivo todo: 1.200 de 1.200 únicas. Verificador: sem erros.
- Jaccard entre as 3 últimas colunas < 0.9: OK. Termo 'redução de danos' ausente: OK.
- Script de roteamento com exatamente 100 linhas: OK. IDs únicos: 100.
