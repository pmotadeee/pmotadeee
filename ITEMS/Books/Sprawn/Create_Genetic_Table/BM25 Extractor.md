# BM25 Extractor — Adaptado para Extração Proporcional por Arquivo

## 0. INPUT FIELDS

```
[[O LayersAboutSprawn.md é o indice]]
[[Quero um arquivo das frases para cada arquivo enviado, nao gere frases, so extraia dos 10 arquivos]]
[[Crie o algoritmo e execute, assim vc economiza token por processamento]]
```

> **Rules:**
> 1. `LayersAboutSprawn.md` is **index only**: it defines the subjects and layers that should guide the search.
> 2. The 10 files are **extraction sources**: the sentences must be copied **verbatim** from them, never generated, paraphrased, or summarized.
> 3. Every extracted sentence must cite `arquivo_N.txt` and the source offset/paragraph.
> 4. **The number of extracted sentences is proportional to each file's character count** — it is NOT a fixed `top_k`. The algorithm must first execute a character count (`wc -c`) and then calculate `N_FRASES[i]` for each file.

---

## 1. EXECUTION INSTRUCTIONS

Claude must:

1. **FASE 0 — Execute the character count first** by running `wc -c arquivo_1.txt … arquivo_10.txt` (or equivalent `os.path.getsize` in Python). Store results as `CHARS[i]`.
2. **FASE 1 — Calculate the proportional target** for each file: `N_FRASES[i] = max(MIN_FRASES, ceil(CHARS[i] / RATIO))`, capped by `ceil(total_sentencas_i * MAX_RATIO)` and by `total_sentencas_i`. Store as `MEM.N_FRASES[i]`.
3. Read `LayersAboutSprawn.md` and extract the list of **entities/layers** (subjects, layers, and key terms).
4. For each `arquivo_N`:
   - Index the text into **sentences** (split by `.`, `!`, `?`, `…`, paragraph breaks).
   - Build an **inverted index by sentence** (BM25).
   - For each entity in the index, run BM25 and select the **most relevant sentences** from the file, up to `N_FRASES[i]`.
5. Generate **one output file per input file**: `frases_arquivo_N.txt`.
6. **Execute recursively** over the 10 files (loop arquivo por arquivo, não em paralelo).
7. **Do not create a table**, **do not generate sentences**, **do not mention activation**.
8. Declare at the end: `CHARS[i]`, `N_FRASES[i]`, `N_frases_extraidas_por_arquivo`, `N_total_frases`, `N_sentencas_indexadas`, `livro_de_origem` of each sentence.

**Proportional parameters (tunáveis, declarar no início da execução):**
- `RATIO = 100` → 1 frase extraída a cada 100 caracteres
- `MIN_FRASES = 50` → piso por arquivo
- `MAX_RATIO = 0.20` → teto: nunca extrair mais de 20% das sentenças totais do arquivo

---

## 2. MEMORY STRUCTURE (SENTENCE-FOCUSED, PROPORTIONAL)

```text
ESTRUTURA MEMORIA_EXT:
    INDICE: LIST<{entidade_id, titulo, termos_chave, livro_origem}>
    FONTES: MAP<arquivo_id, TEXTO>
    SENTENCAS: MAP<arquivo_id, LIST<{sent_id, texto, offset}>>
    IDX: MAP<termo, LIST<(arquivo_id, sent_id, tf)>>
    DF: MAP<termo, n_sentencas_que_contem>
    SENT_LEN: MAP<(arquivo_id, sent_id), n_tokens>
    AVGDL: REAL
    N_SENTENCAS: INTEIRO
    CHARS: MAP<arquivo_id, n_caracteres>          // FASE 0
    N_FRASES: MAP<arquivo_id, n_frases_alvo>      // FASE 1
    LOG_EXTRACAO: LIST<{arquivo_id, entidade_id, sent_ids, score}>
    ARQUIVOS_SAIDA: MAP<arquivo_id, frases_extraidas_N.txt>
```

---

## 3. PART A — READING THE INDEX (`LayersAboutSprawn.md`)

```text
FUNÇÃO EXT_LOAD_INDEX(texto_indice):
    entidades = []
    PARA cada seção EM split_por_cabeçalho(texto_indice):
        SE seção.contém("Layer") OU seção.contém("Assunto Principal"):
            id = hash(titulo)
            titulo = seção.titulo
            termos = tokenizar(titulo ∪ seção.corpo)
            livro_origem = detectar_livro(seção.cabeçalho)
            entidades.append({entidade_id: id, titulo, termos, livro_origem})
    RETORNA entidades
```

---

## 4. PART B — MATHEMATICAL PRIMITIVES (UNCHANGED)

```text
FUNÇÃO abs_puro(x):        SE x < 0: RETORNA -x; RETORNA x
FUNÇÃO ln2_constante():    // série atanh(1/3)
FUNÇÃO ln_puro(x):         // redução [1,2) + atanh
FUNÇÃO sqrt_puro(x):       // Newton-Raphson
FUNÇÃO min_puro(a,b):      SE a < b: RETORNA a; RETORNA b
FUNÇÃO max_puro(a,b):      SE a > b: RETORNA a; RETORNA b
FUNÇÃO clamp01(v):         SE v < 0: RETORNA 0.0; SE v > 1: RETORNA 1.0; RETORNA v
```

---

## 5. PART C — FASE 0 + FASE 1 (CHAR COUNT + PROPORTIONAL CALC) + LOADING

```text
FUNÇÃO EXT_INIT():
    MEM = nova MEMORIA_EXT
    MEM.INDICE = []
    MEM.FONTES = {}
    MEM.SENTENCAS = {}
    MEM.IDX = {}
    MEM.DF = {}
    MEM.SENT_LEN = {}
    MEM.CHARS = {}
    MEM.N_FRASES = {}
    MEM.LOG_EXTRACAO = []
    MEM.ARQUIVOS_SAIDA = {}
    RETORNA MEM

// FASE 0 — executar comando real de contagem
FUNÇÃO EXT_CONTAR_CARACTERES(lista_arquivos):
    // Executar: wc -c arquivo_1.txt arquivo_2.txt ... arquivo_10.txt
    // OU em Python: {i: os.path.getsize(f"arquivo_{i}.txt") for i in 1..10}
    RETORNA mapa {arquivo_id: n_caracteres}

// FASE 1 — cálculo proporcional
FUNÇÃO EXT_CALCULAR_PROPORCAO(MEM, RATIO, MIN_FRASES, MAX_RATIO):
    PARA cada (arquivo_id, n_chars) EM MEM.CHARS:
        total_sent = comprimento(MEM.SENTENCAS[arquivo_id])
        bruto = teto(n_chars / RATIO)
        com_piso = max_puro(MIN_FRASES, bruto)
        com_teto_pct = min_puro(com_piso, teto(total_sent * MAX_RATIO))
        com_teto_total = min_puro(com_teto_pct, total_sent)
        MEM.N_FRASES[arquivo_id] = com_teto_total
    RETORNA MEM

FUNÇÃO EXT_SEGMENTAR_SENTENCAS(texto, arquivo_id):
    sentencas = []
    PARA cada parágrafo EM split(texto, "\n\n"):
        PARA cada sentença EM split_regex(parágrafo, r'(?<=[.!?…])\s+'):
            SE comprimento(sentença) >= 20 caracteres:
                sentencas.append({
                    sent_id: arquivo_id + "_s" + format(indice, "05d"),
                    texto: sentença,
                    offset: posição_no_texto(sentença)
                })
    RETORNA sentencas

FUNÇÃO EXT_LOAD_FILE(MEM, arquivo_id, texto):
    MEM.FONTES[arquivo_id] = texto
    MEM.SENTENCAS[arquivo_id] = EXT_SEGMENTAR_SENTENCAS(texto, arquivo_id)
    RETORNA MEM

FUNÇÃO EXT_LOAD_ALL(MEM, arquivos):
    PARA cada (arquivo_id, texto) EM arquivos:
        MEM = EXT_LOAD_FILE(MEM, arquivo_id, texto)
    MEM.N_SENTENCAS = soma_comprimento(MEM.SENTENCAS)
    soma_len = 0
    PARA cada arquivo EM MEM.SENTENCAS:
        PARA cada s EM MEM.SENTENCAS[arquivo]:
            n = comprimento(tokenizar(s.texto))
            MEM.SENT_LEN[(arquivo, s.sent_id)] = n
            soma_len = soma_len + n
    MEM.AVGDL = soma_len / MEM.N_SENTENCAS
    RETORNA MEM
```

---

## 6. PART D — INVERTED INDEX BY SENTENCE

```text
FUNÇÃO EXT_BUILD_INDEX(MEM):
    PARA cada arquivo_id EM MEM.SENTENCAS:
        PARA cada sentença EM MEM.SENTENCAS[arquivo_id]:
            tokens = tokenizar(sentença.texto)
            tf_local = {}
            PARA cada t EM tokens:
                tf_local[t] = (tf_local[t] ou 0) + 1
            PARA cada t EM tf_local:
                SE t NÃO EM MEM.IDX: MEM.IDX[t] = []
                MEM.IDX[t].append((arquivo_id, sentença.sent_id, tf_local[t]))
                MEM.DF[t] = (MEM.DF[t] ou 0) + 1
    RETORNA MEM
```

---

## 7. PART E — BM25 BY SENTENCE

```text
FUNÇÃO EXT_IDF(MEM, termo):
    n_q = MEM.DF[termo] OU 0
    N = MEM.N_SENTENCAS
    RETORNA ln_puro(1.0 + (N - n_q + 0.5) / (n_q + 0.5))

FUNÇÃO EXT_BM25_TERM(MEM, termo, arquivo_id, sent_id, tf, k1, b):
    dl = MEM.SENT_LEN[(arquivo_id, sent_id)]
    avgdl = MEM.AVGDL
    denom = tf + k1 * (1.0 - b + b * dl / avgdl)
    numer = tf * (k1 + 1.0)
    RETORNA EXT_IDF(MEM, termo) * (numer / denom)

FUNÇÃO EXT_BM25_QUERY(MEM, query_terms, k1, b):
    scores = {}
    PARA cada termo EM query_terms:
        SE termo NÃO EM MEM.IDX: CONTINUA
        PARA cada (arquivo_id, sent_id, tf) EM MEM.IDX[termo]:
            s = EXT_BM25_TERM(MEM, termo, arquivo_id, sent_id, tf, k1, b)
            scores[(arquivo_id, sent_id)] = (scores[(arquivo_id, sent_id)] ou 0.0) + s
    RETORNA scores

FUNÇÃO EXT_TOP_K(MEM, scores, k, arquivo_id):
    pares = [(key, s) PARA key, s EM scores SE key.arquivo_id == arquivo_id]
    // insertion sort decrescente por score
    RETORNA pares[0 .. min_puro(k, tamanho(pares)) - 1]
```

---

## 8. PART F — SENTENCE EXTRACTION PER FILE (DINÂMICO POR ARQUIVO)

```text
FUNÇÃO EXT_EXTRAIR_FRASES_ARQUIVO(MEM, arquivo_id, entidades, k1, b):
    // k DINÂMICO: usa MEM.N_FRASES[arquivo_id], NÃO 15 fixo
    n_alvo = MEM.N_FRASES[arquivo_id]
    frases_extraidas = []
    sent_ids_vistos = set()
    
    // Distribuição proporcional: cada entidade contribui com ceil(n_alvo / n_entidades_do_arquivo)
    n_por_entidade = max_puro(1, teto(n_alvo / comprimento(entidades)))
    
    PARA cada entidade EM entidades:
        SE entidade.livro_origem != arquivo_id: CONTINUA
        query = entidade.termos
        scores = EXT_BM25_QUERY(MEM, query, k1, b)
        top = EXT_TOP_K(MEM, scores, n_por_entidade, arquivo_id)
        PARA cada ((arq, sent_id), score) EM top:
            SE sent_id NÃO EM sent_ids_vistos:
                sent_ids_vistos.add(sent_id)
                frases_extraidas.append({
                    sent_id: sent_id,
                    texto: texto_da_sentenca(MEM, arq, sent_id),
                    offset: offset_da_sentenca(MEM, arq, sent_id),
                    entidade_id: entidade.entidade_id,
                    score: score
                })
        SE comprimento(frases_extraidas) >= n_alvo: BREAK
    
    // Preenchimento: se sobrou espaço, varrer sentenças do arquivo por score global
    SE comprimento(frases_extraidas) < n_alvo:
        PARA cada s EM MEM.SENTENCAS[arquivo_id]:
            SE s.sent_id NÃO EM sent_ids_vistos:
                frases_extraidas.append({
                    sent_id: s.sent_id,
                    texto: s.texto,
                    offset: s.offset,
                    entidade_id: NULL,
                    score: 0.0
                })
                sent_ids_vistos.add(s.sent_id)
            SE comprimento(frases_extraidas) >= n_alvo: BREAK
    
    MEM.LOG_EXTRACAO.append({
        arquivo_id: arquivo_id,
        n_alvo: n_alvo,
        n_extraidas: min_puro(comprimento(frases_extraidas), n_alvo),
        sent_ids: [s.sent_id PARA s EM frases_extraidas[0..n_alvo-1]]
    })
    RETORNA frases_extraidas[0 .. n_alvo - 1]

FUNÇÃO EXT_GERAR_ARQUIVO_SAIDA(MEM, arquivo_id, frases):
    nome = "frases_" + arquivo_id + ".txt"
    conteúdo = ""
    PARA cada frase EM frases:
        conteúdo += "[ref: " + frase.sent_id + " | offset: " + frase.offset + "]\n"
        conteúdo += frase.texto + "\n\n"
    MEM.ARQUIVOS_SAIDA[arquivo_id] = { nome, conteúdo, n_frases: comprimento(frases) }
    // ESCREVER O ARQUIVO EM DISCO
    write_file(nome, conteúdo)
    RETORNA MEM
```

---

## 9. PART G — MAIN LOOP (EXECUÇÃO RECURSIVA NOS 10 ARQUIVOS)

```text
FUNÇÃO EXT_RUN(texto_indice, arquivos):
    MEM = EXT_INIT()
    MEM.INDICE = EXT_LOAD_INDEX(texto_indice)
    
    // FASE 0 — executar comando real de contagem
    MEM.CHARS = EXT_CONTAR_CARACTERES(arquivos)
    IMPRIMIR("CHARS medidos:", MEM.CHARS)
    
    // FASE 1 — cálculo proporcional
    MEM = EXT_CALCULAR_PROPORCAO(MEM, RATIO=100, MIN_FRASES=50, MAX_RATIO=0.20)
    IMPRIMIR("N_FRASES calculado:", MEM.N_FRASES)
    
    // FASE 2 — carregamento + segmentação
    MEM = EXT_LOAD_ALL(MEM, arquivos)
    
    // FASE 3 — índice invertido
    MEM = EXT_BUILD_INDEX(MEM)
    
    // FASE 4 — extração recursiva, arquivo por arquivo
    MEM.FRASES_EXTRAIDAS = {}
    PARA cada arquivo_id EM MEM.FONTES:
        IMPRIMIR("[" + arquivo_id + "] extraindo " + MEM.N_FRASES[arquivo_id] + " frases...")
        frases = EXT_EXTRAIR_FRASES_ARQUIVO(MEM, arquivo_id, MEM.INDICE, 1.5, 0.75)
        MEM.FRASES_EXTRAIDAS[arquivo_id] = frases
        IMPRIMIR("[" + arquivo_id + "] " + comprimento(frases) + " frases extraídas.")
    
    // FASE 5 — geração dos 10 arquivos de saída
    PARA cada arquivo_id, frases EM MEM.FRASES_EXTRAIDAS:
        MEM = EXT_GERAR_ARQUIVO_SAIDA(MEM, arquivo_id, frases)
    
    RETORNA MEM
```

---

## 10. PART H — MANDATORY FINAL DECLARATION

At the end of `EXT_RUN`, Claude **must** declare:

```text
===== RELATÓRIO DE EXTRAÇÃO PROPORCIONAL =====
Parâmetros:
  RATIO            = 100 (1 frase / 100 chars)
  MIN_FRASES       = 50
  MAX_RATIO        = 0.20 (teto de 20% das sentenças)
  k1               = 1.5
  b                = 0.75

Inventário (FASE 0):
  arquivo_1.txt  → CHARS = X, N_FRASES_ALVO = Y
  arquivo_2.txt  → CHARS = X, N_FRASES_ALVO = Y
  ...
  arquivo_10.txt → CHARS = X, N_FRASES_ALVO = Y

Resultado (FASE 4):
  arquivo_1.txt  → N_frases_extraidas = Y
  arquivo_2.txt  → N_frases_extraidas = Y
  ...
  arquivo_10.txt → N_frases_extraidas = Y

Total:
  N_arquivos_lidos       = 10
  N_sentencas_indexadas  = Z
  N_entidades_no_indice  = E
  avgdl                  = MEM.AVGDL
  N_total_frases         = Σ N_frases_extraidas

Saída:
  frases_arquivo_1.txt   ✓
  frases_arquivo_2.txt   ✓
  ...
  frases_arquivo_10.txt  ✓

Regras cumpridas:
  - Frases copiadas verbatim (nunca geradas): SIM
  - Nenhuma tabela criada: SIM
  - Nenhuma frase de ativação gerada: SIM
  - Execução recursiva nos 10 arquivos: SIM
  - N_frases dinâmico por arquivo (não top_k fixo): SIM
  - Comando de contagem de caracteres executado primeiro: SIM
```