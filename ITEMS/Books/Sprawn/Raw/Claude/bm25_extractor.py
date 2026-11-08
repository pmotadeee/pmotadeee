#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
BM25 Extractor - extração proporcional de frases (verbatim) por arquivo.
Implementa o prompt "BM25 Extractor.md":
  FASE 0  contagem de caracteres (wc -c real)
  FASE 2  carga integral + segmentação em sentenças
  FASE 1  N_FRASES[i] proporcional (precisa do total de sentenças)
  FASE 3  índice invertido por sentença
  FASE 4  BM25 por entidade do índice (LayersAboutSprawn.md), arquivo por arquivo
  FASE 5  um arquivo de saída por arquivo de entrada (sem cabeçalho)
"""
import os
import re
import subprocess
import unicodedata
import time
from bisect import bisect_right

UPLOADS = "/mnt/user-data/uploads"
OUTDIR = "/mnt/user-data/outputs"
INDEX_FILE = os.path.join(UPLOADS, "LayersAboutSprawn.md")
N_ARQUIVOS = 10

RATIO = 100
MIN_FRASES = 50
MAX_RATIO = 0.20
K1 = 1.5
B = 0.75
MIN_SENT_CHARS = 20


def caminho(i):
    return os.path.join(UPLOADS, "context_part_%02d.txt" % i)


def nome_arq(i):
    return "arquivo_%d.txt" % i


# ----------------------------------------------------------------------------
# PART B - primitivas matemáticas (sem bibliotecas)
# ----------------------------------------------------------------------------
def abs_puro(x):
    if x < 0:
        return -x
    return x


def ln2_constante():
    z = 1.0 / 3.0
    soma = 0.0
    termo = z
    n = 1
    while abs_puro(termo) > 1e-15:
        soma = soma + termo / n
        termo = termo * z * z
        n = n + 2
    return 2.0 * soma


LN2 = ln2_constante()


def ln_puro(x):
    if x <= 0:
        raise ValueError("ln de nao-positivo")
    if x == 1:
        return 0.0
    k = 0
    while x >= 2.0:
        x = x / 2.0
        k = k + 1
    while x < 1.0:
        x = x * 2.0
        k = k - 1
    z = (x - 1.0) / (x + 1.0)
    soma = 0.0
    termo = z
    n = 1
    while abs_puro(termo / n) > 1e-15:
        soma = soma + termo / n
        termo = termo * z * z
        n = n + 2
    return 2.0 * soma + k * LN2


def sqrt_puro(x):
    if x < 0:
        raise ValueError("sqrt de negativo")
    if x == 0:
        return 0.0
    g = x / 2.0
    while abs_puro(g * g - x) > 1e-12:
        g = (g + x / g) / 2.0
    return g


def min_puro(a, b):
    if a < b:
        return a
    return b


def max_puro(a, b):
    if a > b:
        return a
    return b


def clamp01(v):
    if v < 0:
        return 0.0
    if v > 1:
        return 1.0
    return v


def teto(x):
    i = int(x)
    if i >= x:
        return i
    return i + 1


# ----------------------------------------------------------------------------
# Tokenização
# ----------------------------------------------------------------------------
STOP_PT = """
a o as os um uma uns umas de do da dos das em no na nos nas por para com sem sob sobre entre ate apos ante
que se mas e ou ja nao sim mais menos muito muita ser esta estao esse essa isso este isto aquele aquela aquilo
como quando onde quem qual seu sua seus suas ele ela eles elas lhe lhes foi era sao tem ter ha pelo pela pelos
pelas ao aos cada todo toda todos todas outro outra outros outras mesmo mesma tambem so apenas depois antes
durante ainda entao assim porque pois nem num numa dele dela deles delas nesse nessa neste nesta disso disto
vai vao fica ficam faz fazem cap pag sao
""".split()
STOP_EN = """
the a an and or but if of to in on at by for with from as is are was were be been being am it its he she they
them his her their him i you we me my your our us this that these those there here what which who whom when
where why how not no so than then too very can could would should will shall may might must do does did done
have has had having just into out up down over under again about after before all any each some such only own
same other one said now like off back still even get got going don didn doesn isn wasn couldn wouldn won
""".split()
STOPWORDS = set(STOP_PT) | set(STOP_EN)

RE_TOKEN = re.compile(r"[a-z]+")


def fold(s):
    s = unicodedata.normalize("NFD", s.lower())
    return "".join(c for c in s if unicodedata.category(c) != "Mn")


def tokenizar(texto):
    toks = []
    for t in RE_TOKEN.findall(fold(texto)):
        if len(t) >= 3 and t not in STOPWORDS:
            toks.append(t)
    return toks


def detectar_livro(txt):
    t = fold(txt)
    if "neuromancer" in t:
        return "Neuromancer"
    if "count zero" in t:
        return "Count Zero"
    if "mona lisa" in t or "monalisa" in t:
        return "Mona Lisa Overdrive"
    return None


# ----------------------------------------------------------------------------
# PART A - leitura do índice (LayersAboutSprawn.md), arquivo inteiro
# ----------------------------------------------------------------------------
RE_BULLET = re.compile(r"^- \*\*(.+?)\*\*\s*(?:\u2014|-)?\s*(.*)$")


def ler_inteiro(path):
    with open(path, "r", encoding="utf-8", newline="") as f:
        return f.read()


def ext_load_index(texto_indice):
    linhas = texto_indice.split("\n")
    entidades = []
    vistos = set()
    livro = None
    secao = ""
    stats = {"assunto": 0, "layer": 0, "eixo": 0, "duplicadas": 0}

    def add(titulo, corpo, livro_o, tipo):
        termos_l = tokenizar(titulo + " " + corpo)
        termos = []
        for t in termos_l:
            if t not in termos:
                termos.append(t)
        if not termos:
            return
        chave = (livro_o, tuple(sorted(termos)))
        if chave in vistos:
            stats["duplicadas"] += 1
            return
        vistos.add(chave)
        stats[tipo] += 1
        entidades.append({
            "entidade_id": "E%04d" % (len(entidades) + 1),
            "titulo": titulo.strip(),
            "termos": termos,
            "livro": livro_o,
        })

    i = 0
    n = len(linhas)
    while i < n:
        ln = linhas[i]
        if ln.startswith("# MAPA"):
            livro = detectar_livro(ln) or livro
        elif ln.startswith("## "):
            secao = ln[3:].strip()
            if secao.startswith("Assunto Principal"):
                corpo = ""
                if i + 1 < n and linhas[i + 1].startswith("*"):
                    corpo = linhas[i + 1]
                add(secao, corpo, livro, "assunto")
        else:
            m = RE_BULLET.match(ln)
            if m and (secao.startswith("Assunto Principal") or secao.startswith("EIXO")):
                rot, resto = m.group(1), m.group(2)
                if rot.startswith("Layer"):
                    corpo = [resto]
                    j = i + 1
                    while j < n and linhas[j].strip() != "" and not linhas[j].startswith("- **"):
                        corpo.append(linhas[j])
                        j += 1
                    add(rot, " ".join(corpo), livro, "layer")
                else:
                    add(rot, resto, livro, "eixo")
        i += 1
    return entidades, stats


# ----------------------------------------------------------------------------
# FASE 0 - contagem real de caracteres (wc -c)
# ----------------------------------------------------------------------------
def ext_contar_caracteres():
    paths = [caminho(i) for i in range(1, N_ARQUIVOS + 1)]
    out = subprocess.run(["wc", "-c"] + paths, capture_output=True, text=True, check=True).stdout
    chars = {}
    for ln in out.strip().split("\n"):
        partes = ln.split()
        if len(partes) == 2 and partes[1] != "total":
            idx = int(os.path.basename(partes[1])[len("context_part_"):-4])
            chars[idx] = int(partes[0])
    for i in range(1, N_ARQUIVOS + 1):
        assert chars[i] == os.path.getsize(caminho(i))
    return chars, out


# ----------------------------------------------------------------------------
# Segmentação em sentenças (com offsets absolutos)
# ----------------------------------------------------------------------------
RE_PARA = re.compile(r"\n[ \t\r]*\n")
RE_SENT = re.compile("(?<=[.!?\u2026][\"\u201d\u2019'])\\s+|(?<=[.!?\u2026])\\s+")
RE_MARK = re.compile(r"^## `\./(.+?)\.pdf`", re.M)


def nome_livro_marcador(nome):
    r = detectar_livro(nome)
    return r if r else nome


def spans_paragrafos(texto):
    ini = 0
    for m in RE_PARA.finditer(texto):
        yield ini, m.start()
        ini = m.end()
    yield ini, len(texto)


def spans_sentencas(texto, a, b):
    para = texto[a:b]
    s = 0
    for m in RE_SENT.finditer(para):
        yield a + s, a + m.start()
        s = m.end()
    yield a + s, a + len(para)


def ext_segmentar_sentencas(texto, arquivo_id, livro_inicial):
    marcadores = [(m.start(), nome_livro_marcador(m.group(1))) for m in RE_MARK.finditer(texto)]
    offs = [o for o, _ in marcadores]
    sentencas = []
    indice = 0
    for pa, pb in spans_paragrafos(texto):
        for x, y in spans_sentencas(texto, pa, pb):
            seg = texto[x:y]
            lead = len(seg) - len(seg.lstrip())
            corpo = seg.strip()
            x2 = x + lead
            y2 = x2 + len(corpo)
            norm = " ".join(corpo.split())
            if len(norm) >= MIN_SENT_CHARS:
                k = bisect_right(offs, x2) - 1
                livro = marcadores[k][1] if k >= 0 else livro_inicial
                sentencas.append({
                    "sent_id": "arquivo_%d_s%05d" % (arquivo_id, indice),
                    "texto": norm,
                    "offset": x2,
                    "fim": y2,
                    "livro": livro,
                })
                indice += 1
    livro_final = marcadores[-1][1] if marcadores else livro_inicial
    return sentencas, livro_final


# ----------------------------------------------------------------------------
# Memória
# ----------------------------------------------------------------------------
class MEM:
    pass


def ext_init():
    m = MEM()
    m.INDICE = []
    m.FONTES = {}
    m.SENTENCAS = {}
    m.TOKENS = {}
    m.IDX = {}
    m.IDX_AB = {}       # (arquivo, livro) -> termo -> [(pos_local, tf)]
    m.DF = {}
    m.SENT_LEN = {}
    m.AVGDL = 0.0
    m.N_SENTENCAS = 0
    m.CHARS = {}
    m.N_FRASES = {}
    m.LOG_EXTRACAO = []
    m.ARQUIVOS_SAIDA = {}
    m.IDF_CACHE = {}
    m.TS_CACHE = {}
    return m


def ext_load_all(mem):
    livro = None
    for i in range(1, N_ARQUIVOS + 1):
        texto = ler_inteiro(caminho(i))
        mem.FONTES[i] = texto
        sents, livro = ext_segmentar_sentencas(texto, i, livro)
        mem.SENTENCAS[i] = sents
    mem.N_SENTENCAS = sum(len(v) for v in mem.SENTENCAS.values())
    soma_len = 0
    for i in mem.SENTENCAS:
        toks_arq = []
        for s in mem.SENTENCAS[i]:
            toks = tokenizar(s["texto"])
            toks_arq.append(toks)
            mem.SENT_LEN[(i, s["sent_id"])] = len(toks)
            soma_len += len(toks)
        mem.TOKENS[i] = toks_arq
    mem.AVGDL = soma_len / mem.N_SENTENCAS
    return mem


def ext_calcular_proporcao(mem):
    for i, n_chars in mem.CHARS.items():
        total_sent = len(mem.SENTENCAS[i])
        bruto = teto(n_chars / RATIO)
        com_piso = max_puro(MIN_FRASES, bruto)
        com_teto_pct = min_puro(com_piso, teto(total_sent * MAX_RATIO))
        mem.N_FRASES[i] = min_puro(com_teto_pct, total_sent)
    return mem


def ext_build_index(mem):
    for i in mem.SENTENCAS:
        for pos, s in enumerate(mem.SENTENCAS[i]):
            tf_local = {}
            for t in mem.TOKENS[i][pos]:
                tf_local[t] = tf_local.get(t, 0) + 1
            ab = mem.IDX_AB.setdefault((i, s["livro"]), {})
            for t, tf in tf_local.items():
                mem.IDX.setdefault(t, []).append((i, s["sent_id"], tf))
                mem.DF[t] = mem.DF.get(t, 0) + 1
                ab.setdefault(t, []).append((pos, tf))
    return mem


# ----------------------------------------------------------------------------
# BM25 por sentença
# ----------------------------------------------------------------------------
def ext_idf(mem, termo):
    v = mem.IDF_CACHE.get(termo)
    if v is None:
        n_q = mem.DF.get(termo, 0)
        N = mem.N_SENTENCAS
        v = ln_puro(1.0 + (N - n_q + 0.5) / (n_q + 0.5))
        mem.IDF_CACHE[termo] = v
    return v


def ext_bm25_term(mem, termo, dl, tf):
    denom = tf + K1 * (1.0 - B + B * dl / mem.AVGDL)
    numer = tf * (K1 + 1.0)
    return ext_idf(mem, termo) * (numer / denom)


def term_scores(mem, arq, livro, termo):
    chave = (arq, livro, termo)
    r = mem.TS_CACHE.get(chave)
    if r is None:
        post = mem.IDX_AB.get((arq, livro), {}).get(termo, [])
        sents = mem.SENTENCAS[arq]
        r = []
        for pos, tf in post:
            dl = mem.SENT_LEN[(arq, sents[pos]["sent_id"])]
            r.append((pos, ext_bm25_term(mem, termo, dl, tf)))
        mem.TS_CACHE[chave] = r
    return r


def ext_bm25_query(mem, termos, arq, livro):
    scores = {}
    for t in termos:
        if t not in mem.IDX:
            continue
        for pos, s in term_scores(mem, arq, livro, t):
            scores[pos] = scores.get(pos, 0.0) + s
    return scores


def ext_top(scores):
    return sorted(scores.items(), key=lambda kv: (-kv[1], kv[0]))


# ----------------------------------------------------------------------------
# Extração por arquivo
# ----------------------------------------------------------------------------
def ext_extrair_frases_arquivo(mem, arq):
    n_alvo = mem.N_FRASES[arq]
    sents = mem.SENTENCAS[arq]
    livros_no_arq = set(s["livro"] for s in sents)
    ents = [e for e in mem.INDICE if e["livro"] in livros_no_arq]
    n_por_ent = max_puro(1, teto(n_alvo / len(ents)))

    vistos = set()
    frases = []
    gscore = {}
    contrib = set()

    for e in ents:
        livro = e["livro"]
        scores = ext_bm25_query(mem, e["termos"], arq, livro)
        for p, v in scores.items():
            gscore[p] = gscore.get(p, 0.0) + v
        tomadas = 0
        for pos, sc in ext_top(scores):
            if tomadas >= n_por_ent:
                break
            if pos in vistos:
                continue
            vistos.add(pos)
            frases.append((pos, e["entidade_id"], sc))
            contrib.add(e["entidade_id"])
            tomadas += 1
            if len(frases) >= n_alvo:
                break
        if len(frases) >= n_alvo:
            break

    n_pass1 = len(frases)
    if len(frases) < n_alvo:
        resto = [(p, gscore.get(p, 0.0)) for p in range(len(sents)) if p not in vistos]
        resto.sort(key=lambda kv: (-kv[1], kv[0]))
        for p, g in resto:
            frases.append((p, None, g))
            vistos.add(p)
            if len(frases) >= n_alvo:
                break

    frases = frases[:n_alvo]
    frases.sort(key=lambda t: sents[t[0]]["offset"])
    saida = []
    for pos, eid, sc in frases:
        s = sents[pos]
        saida.append({
            "sent_id": s["sent_id"], "texto": s["texto"], "offset": s["offset"],
            "fim": s["fim"], "livro": s["livro"], "entidade_id": eid, "score": sc,
        })
    mem.LOG_EXTRACAO.append({
        "arquivo_id": arq, "n_alvo": n_alvo, "n_extraidas": len(saida),
        "n_entidades_aplicaveis": len(ents), "n_por_entidade": n_por_ent,
        "n_pass1": n_pass1, "entidades_contribuintes": len(contrib),
    })
    return saida


def ext_gerar_arquivo_saida(mem, arq, frases):
    nome = "frases_arquivo_%d.txt" % arq
    partes = []
    for f in frases:
        partes.append("[ref: %s | %s | offset: %d | livro: %s]\n%s\n" % (
            nome_arq(arq), f["sent_id"], f["offset"], f["livro"], f["texto"]))
    conteudo = "\n".join(partes)
    os.makedirs(OUTDIR, exist_ok=True)
    with open(os.path.join(OUTDIR, nome), "w", encoding="utf-8", newline="\n") as fh:
        fh.write(conteudo)
    mem.ARQUIVOS_SAIDA[arq] = {"nome": nome, "n_frases": len(frases)}
    return mem


def verificar_verbatim(mem, arq, frases):
    src = mem.FONTES[arq]
    for f in frases:
        assert " ".join(src[f["offset"]:f["fim"]].split()) == f["texto"], f["sent_id"]
    return len(frases)


# ----------------------------------------------------------------------------
# Loop principal
# ----------------------------------------------------------------------------
def ext_run():
    t0 = time.time()
    # auto-checagem das primitivas
    import math
    for v in (0.5, 1.0, 1.7, 3.0, 10.0, 1234.5, 18000.0):
        assert abs(ln_puro(v) - math.log(v)) < 1e-9

    mem = ext_init()
    mem.INDICE, st = ext_load_index(ler_inteiro(INDEX_FILE))

    mem.CHARS, wc_out = ext_contar_caracteres()
    print("[FASE 0] wc -c executado:")
    print(wc_out.rstrip())

    mem = ext_load_all(mem)
    mem = ext_calcular_proporcao(mem)
    mem = ext_build_index(mem)
    print("[FASE 1] N_FRASES calculado:", dict(mem.N_FRASES))
    print("[INDICE] entidades unicas: %d (assunto=%d layer=%d eixo=%d, duplicadas descartadas=%d)" % (
        len(mem.INDICE), st["assunto"], st["layer"], st["eixo"], st["duplicadas"]))

    maiores = sorted(len(s["texto"]) for v in mem.SENTENCAS.values() for s in v)
    print("[DIAG] sentencas=%d | len mediana=%d | p99=%d | max=%d | >1500 chars=%d" % (
        mem.N_SENTENCAS, maiores[len(maiores) // 2], maiores[int(len(maiores) * 0.99)],
        maiores[-1], sum(1 for x in maiores if x > 1500)))

    resultado = {}
    for arq in range(1, N_ARQUIVOS + 1):
        print("[%s] extraindo %d frases..." % (nome_arq(arq), mem.N_FRASES[arq]))
        fr = ext_extrair_frases_arquivo(mem, arq)
        verificar_verbatim(mem, arq, fr)
        resultado[arq] = fr
        print("[%s] %d frases extraidas." % (nome_arq(arq), len(fr)))

    for arq, fr in resultado.items():
        mem = ext_gerar_arquivo_saida(mem, arq, fr)

    # ---------------- RELATÓRIO ----------------
    print()
    print("===== RELATORIO DE EXTRACAO PROPORCIONAL =====")
    print("Parametros:")
    print("  RATIO            = %d (1 frase / %d chars)" % (RATIO, RATIO))
    print("  MIN_FRASES       = %d" % MIN_FRASES)
    print("  MAX_RATIO        = %.2f (teto de %d%% das sentencas)" % (MAX_RATIO, int(MAX_RATIO * 100)))
    print("  k1               = %.1f" % K1)
    print("  b                = %.2f" % B)
    print()
    print("Inventario (FASE 0):")
    for i in range(1, N_ARQUIVOS + 1):
        print("  %s -> CHARS = %d, sentencas = %d, N_FRASES_ALVO = %d" % (
            nome_arq(i), mem.CHARS[i], len(mem.SENTENCAS[i]), mem.N_FRASES[i]))
    print()
    print("Resultado (FASE 4):")
    total = 0
    for i in range(1, N_ARQUIVOS + 1):
        fr = resultado[i]
        total += len(fr)
        por_livro = {}
        for f in fr:
            por_livro[f["livro"]] = por_livro.get(f["livro"], 0) + 1
        lg = [l for l in mem.LOG_EXTRACAO if l["arquivo_id"] == i][0]
        print("  %s -> N_frases_extraidas = %d | livros: %s | entidades aplicaveis = %d, contribuintes = %d, n_por_entidade = %d, via_entidade = %d, via_preenchimento = %d" % (
            nome_arq(i), len(fr), ", ".join("%s=%d" % kv for kv in sorted(por_livro.items())),
            lg["n_entidades_aplicaveis"], lg["entidades_contribuintes"], lg["n_por_entidade"],
            lg["n_pass1"], len(fr) - lg["n_pass1"]))
    print()
    print("Total:")
    print("  N_arquivos_lidos       = %d" % N_ARQUIVOS)
    print("  N_sentencas_indexadas  = %d" % mem.N_SENTENCAS)
    print("  N_entidades_no_indice  = %d" % len(mem.INDICE))
    print("  avgdl                  = %.4f" % mem.AVGDL)
    print("  N_total_frases         = %d" % total)
    print()
    print("Saida:")
    for i in range(1, N_ARQUIVOS + 1):
        print("  frases_arquivo_%d.txt  OK (%d frases)" % (i, mem.ARQUIVOS_SAIDA[i]["n_frases"]))
    print()
    print("Verificacao verbatim (texto == trecho do arquivo-fonte, so espacos normalizados): %d/%d OK" % (total, total))
    print("Tempo: %.1fs" % (time.time() - t0))


if __name__ == "__main__":
    ext_run()
