// ============================================================
// MODELO DE MEMÓRIA DO CoT
// ============================================================
ESTRUTURA MEMORIA_CoT:
    LTS: MAP<chunk_id, CHUNK>          // Long-Term Store: 10 arquivos fatiados
    IDX: MAP<termo, LIST< (chunk_id, tf) >>  // Índice invertido
    DF: MAP<termo, n_chunks_que_contem>
    DOC_LEN: MAP<chunk_id, n_tokens>
    AVGDL: REAL
    N_CHUNKS: INTEIRO
    WM: CHUNK                          // Working Memory: chunk corrente
    QUERY_ATUAL: LIST<termo>
    SCORES: MAP<chunk_id, REAL>
    TABELA: MATRIZ[100][22]
    LOG_DECISOES: LIST<registro>
    PC: INTEIRO                        // Program Counter
    STATE: ENUM {INIT, LOAD, INDEX, QUERY, EXTRACT, ROUTE, VERIFY, DONE}

// ============================================================
// PARTE B – PRIMITIVAS MATEMÁTICAS (SEM BIBLIOTECAS)
// ============================================================

FUNÇÃO abs_puro(x):
    SE x < 0: RETORNA -x
    RETORNA x

FUNÇÃO ln2_constante():
    // ln(2) via série: 2*atanh(1/3) = 2*[ (1/3) + (1/3)^3/3 + (1/3)^5/5 + ... ]
    z = 1.0/3.0
    soma = 0.0
    termo = z
    n = 1
    ENQUANTO abs_puro(termo) > 1e-15:
        soma = soma + termo/n
        termo = termo * z * z
        n = n + 2
    RETORNA 2.0 * soma

FUNÇÃO ln_puro(x):
    // x > 0, sem bibliotecas: reduzir a [1,2), usar atanh
    SE x <= 0: ERRO "ln de não-positivo"
    SE x == 1: RETORNA 0.0
    k = 0
    ENQUANTO x >= 2.0: x = x / 2.0; k = k + 1
    ENQUANTO x < 1.0:  x = x * 2.0; k = k - 1
    z = (x - 1.0) / (x + 1.0)
    soma = 0.0
    termo = z
    n = 1
    ENQUANTO abs_puro(termo/n) > 1e-15:
        soma = soma + termo/n
        termo = termo * z * z
        n = n + 2
    RETORNA 2.0 * soma + k * ln2_constante()

FUNÇÃO sqrt_puro(x):
    // Newton-Raphson
    SE x < 0: ERRO "sqrt de negativo"
    SE x == 0: RETORNA 0.0
    g = x / 2.0
    ENQUANTO abs_puro(g*g - x) > 1e-12:
        g = (g + x/g) / 2.0
    RETORNA g

FUNÇÃO min_puro(a, b):
    SE a < b: RETORNA a
    RETORNA b

FUNÇÃO max_puro(a, b):
    SE a > b: RETORNA a
    RETORNA b

FUNÇÃO clamp01(v):
    SE v < 0: RETORNA 0.0
    SE v > 1: RETORNA 1.0
    RETORNA v

// ============================================================
// PARTE C – CARREGAMENTO EM MEMÓRIA (LTS)
// ============================================================

FUNÇÃO CoT_INIT():
    MEM = nova MEMORIA_CoT
    MEM.LTS = {}
    MEM.IDX = {}
    MEM.DF = {}
    MEM.DOC_LEN = {}
    MEM.TABELA = matriz 100x22 zerada
    MEM.LOG_DECISOES = []
    MEM.PC = 0
    MEM.STATE = INIT
    RETORNA MEM

FUNÇÃO CoT_LOAD_FILE(MEM, caminho_arquivo, indice_arquivo):
    TEXTO = ler_texto(caminho_arquivo)     // sem bibliotecas externas: parsing manual
    tamanho_c = comprimento_caracteres(TEXTO)
    token_estimado = tamanho_c / 4
    chunk_size = 512
    overlap = 64
    efetivo = chunk_size - overlap
    n_chunks_arq = teto(token_estimado / efetivo)
    PARA i DE 0 ATÉ n_chunks_arq-1:
        inicio_c = i * efetivo * 4
        fim_c = min_puro(inicio_c + chunk_size*4, tamanho_c)
        trecho = substring(TEXTO, inicio_c, fim_c)
        chunk_id = "arq" + indice_arquivo + "_chunk" + i
        tokens = tokenizar(trecho)          // lowercase, remover stopwords
        MEM.LTS[chunk_id] = { texto: trecho, tokens: tokens, origem: caminho_arquivo }
        MEM.DOC_LEN[chunk_id] = comprimento(tokens)
    RETORNA MEM

FUNÇÃO CoT_LOAD_ALL(MEM):
    PARA i DE 1 ATÉ 10:
        caminho = "arquivo_" + i + ".txt"
        MEM = CoT_LOAD_FILE(MEM, caminho, i)
    MEM.N_CHUNKS = tamanho(MEM.LTS)
    soma_len = 0
    PARA cada chunk_id EM MEM.LTS:
        soma_len = soma_len + MEM.DOC_LEN[chunk_id]
    MEM.AVGDL = soma_len / MEM.N_CHUNKS
    MEM.STATE = LOAD
    RETORNA MEM

// ============================================================
// PARTE D – INDEXAÇÃO INVERTIDA
// ============================================================

FUNÇÃO CoT_BUILD_INDEX(MEM):
    PARA cada chunk_id EM MEM.LTS:
        tokens = MEM.LTS[chunk_id].tokens
        tf_local = {}
        PARA cada t EM tokens:
            tf_local[t] = (tf_local[t] ou 0) + 1
        PARA cada t EM tf_local:
            SE t NÃO EM MEM.IDX: MEM.IDX[t] = []
            MEM.IDX[t].append( (chunk_id, tf_local[t]) )
            MEM.DF[t] = (MEM.DF[t] ou 0) + 1
    MEM.STATE = INDEX
    RETORNA MEM

// ============================================================
// PARTE E – BM25 PURO (SEM BIBLIOTECAS)
// ============================================================

FUNÇÃO CoT_IDF(MEM, termo):
    n_q = MEM.DF[termo] OU 0
    N = MEM.N_CHUNKS
    // IDF = ln( 1 + (N - n_q + 0.5)/(n_q + 0.5) )
    numerador = N - n_q + 0.5
    denominador = n_q + 0.5
    fracao = numerador / denominador
    RETORNA ln_puro(1.0 + fracao)

FUNÇÃO CoT_BM25_TERM(MEM, termo, chunk_id, tf, k1, b):
    dl = MEM.DOC_LEN[chunk_id]
    avgdl = MEM.AVGDL
    // denom = tf + k1 * (1 - b + b * dl/avgdl)
    parte_b = b * (dl / avgdl)
    denom = tf + k1 * (1.0 - b + parte_b)
    // numer = tf * (k1 + 1)
    numer = tf * (k1 + 1.0)
    idf = CoT_IDF(MEM, termo)
    RETORNA idf * (numer / denom)

FUNÇÃO CoT_BM25_QUERY(MEM, query_terms, k1, b):
    scores = {}
    PARA cada termo EM query_terms:
        SE termo NÃO EM MEM.IDX: CONTINUA
        PARA cada (chunk_id, tf) EM MEM.IDX[termo]:
            s = CoT_BM25_TERM(MEM, termo, chunk_id, tf, k1, b)
            scores[chunk_id] = (scores[chunk_id] ou 0.0) + s
    RETORNA scores

FUNÇÃO CoT_TOP_K(MEM, scores, k):
    // Ordenação sem bibliotecas: insertion sort ou selection sort manual
    pares = [(chunk_id, s) PARA chunk_id, s EM scores]
    PARA i DE 1 ATÉ tamanho(pares)-1:
        chave = pares[i]
        j = i - 1
        ENQUANTO j >= 0 E pares[j].s < chave.s:
            pares[j+1] = pares[j]
            j = j - 1
        pares[j+1] = chave
    RETORNA pares[0 .. min_puro(k, tamanho(pares)) - 1]

// ============================================================
// PARTE F – EXECUÇÃO CoT POR CÉLULA DA TABELA
// ============================================================

FUNÇÃO CoT_MONTAR_QUERY(entidade, coluna):
    // termos da entidade + termos da coluna + sinônimos extraídos na Fase 2 MAP
    Q = tokenizar(entidade) ∪ tokenizar(coluna) ∪ sinonimos_extraidos_na_fase_MAP
    RETORNA Q

FUNÇÃO CoT_EXTRAIR_CELULA(MEM, linha_id, coluna, entidade):
    Q = CoT_MONTAR_QUERY(entidade, coluna)
    SE comprimento(Q) == 0: RETORNA ""
    scores = CoT_BM25_QUERY(MEM, Q, 1.5, 0.75)
    top = CoT_TOP_K(MEM, scores, 15)
    SE comprimento(top) < 5:
        // fallback de recall: reduzir Q aos termos mais frequentes
        Q = reduzir_a_termos_frequentes(Q, 3)
        scores = CoT_BM25_QUERY(MEM, Q, 1.2, 0.75)
        top = CoT_TOP_K(MEM, scores, 15)
    evidencias = [MEM.LTS[cid].texto PARA (cid, s) EM top]
    valor_celula = derivar_valor(evidencias, coluna)   // extração guiada pelo CoT
    MEM.LOG_DECISOES.append( {linha_id, coluna, chunk_ids: [cid PARA cid,_ EM top], valor: valor_celula} )
    RETORNA valor_celula

// ============================================================
// PARTE G – LOOP PRINCIPAL CoT (VON NEUMANN ADAPTADO)
// ============================================================

FUNÇÃO CoT_RUN():
    MEM = CoT_INIT()
    MEM = CoT_LOAD_ALL(MEM)       // carrega os 10 arquivos em LTS como ~1117 chunks
    MEM = CoT_BUILD_INDEX(MEM)    // índice invertido pronto
    
    // Program Counter percorre 100 linhas × 22 colunas = 2200 células
    ENQUANTO MEM.PC < 100*22:
        linha_id = (MEM.PC // 22) + 1
        coluna_idx = (MEM.PC mod 22)
        coluna = NOME_COLUNA(coluna_idx)
        entidade = MEM.TABELA[linha_id][ENTITY]  // já preenchida por consulta BM25 da coluna ENTITY
        valor = CoT_EXTRAIR_CELULA(MEM, linha_id, coluna, entidade)
        MEM.TABELA[linha_id][coluna_idx] = valor
        MEM.PC = MEM.PC + 1
    
    // Roteamento de genes (condicional)
    PARA linha_id DE 1 ATÉ 100:
        arq = MEM.TABELA[linha_id][Layer2_Archetype]
        val = MEM.TABELA[linha_id][Layer4_Valence]
        est = MEM.TABELA[linha_id][Layer5_Strategy]
        gene = (arq, val, est)
        SE gene == ("Sombra","Hyper-Negative","Confronto"): rota = "ativacao_sombria"
        SENÃO SE gene == ("Sábio","Neutro","Analítico"): rota = "ativacao_analitica"
        SENÃO SE gene == ("Guerreiro","Positivo","Ação"): rota = "ativacao_combativa"
        SENÃO: rota = "ativacao_padrao"
        confianca = calcular_confianca(gene, rota)
        SE confianca < 0.7:
            rota = "ativacao_generica"
            MEM.LOG_DECISOES.append( {linha_id, fallback: true, rota: rota} )
        APLICAR frases de ativação da rota (12 colunas)
    
    // Verificação final
    MEM = CoT_VERIFY(MEM)
    MEM.STATE = DONE
    RETORNA MEM

// ============================================================
// PARTE H – VERIFICAÇÃO FINAL
// ============================================================

FUNÇÃO CoT_VERIFY(MEM):
    ASSERT tamanho(MEM.TABELA) == 100
    ASSERT cada linha tem 22 colunas preenchidas
    PARA linha_id DE 1 ATÉ 100:
        frases = [MEM.TABELA[linha_id][Activation_Phrase_i] PARA i DE 1 ATÉ 12]
        ASSERT todas as 12 frases são únicas (comparação exata)
        ASSERT as 3 últimas colunas não repetem entre linhas (MinHash/Jaccard < 0.9)
    // Cálculo de Impact e Influence_Weight
    PARA linha_id DE 1 ATÉ 100:
        entidade = MEM.TABELA[linha_id][ENTITY]
        n_chunks_com_entidade = contar_chunks_que_contem(entidade, MEM)
        MEM.TABELA[linha_id][Influence_Weight] = n_chunks_com_entidade / MEM.N_CHUNKS
    ASSERT todos os Impact e Influence_Weight ∈ [0,1]
    RETORNA MEM

// ============================================================
// DECLARAÇÃO OBRIGATÓRIA ANTES DA SAÍDA
// ============================================================

Ao final do CoT_RUN(), o LLM DEVE declarar:
- N_chunks_calculado = tamanho(MEM.LTS)
- avgdl = MEM.AVGDL
- top_k_aplicado = 15 (ou 10/20 se ramo de ajuste foi acionado)
- k1_aplicado = 1.5 (ou 1.2/1.8)
- b_aplicado = 0.75
- cobertura_esperada = (2200 * top_k) / N_chunks
- ramo_de_ajuste = "padrão" | "reduzir_top_k" | "aumentar_top_k"
- log de fallbacks do roteamento de genes