## 🎯 INSTRUÇÕES PARA A IA ANALISTA: (PROMPT V2.0 - Otimizado para Coleta)

**OBJETIVO:** Analisar detalhadamente a *única* imagem de gráfico fornecida, extraindo o estado do mercado e da conta de negociação, e estruturando os dados em um histórico CSV acumulado e um JSON de estado presente.

-----

## 📊 ESTRUTURAS SOLICITADAS:

### 1\. TABELA CSV - HISTÓRICO ACUMULATIVO (Estrutura Revisada)

A tabela foi expandida para incluir o estado da conta/operação no momento da captura e o sentimento de mercado, melhorando a rastreabilidade do histórico.

```csv
timestamp,preco_atual,direcao_curto_prazo,forca_tendencia,sentimento_venda_percent,resultado_operacao_atual,saldo_conta,setup_identificado
[preencher com dados de TODAS as imagens anteriores analisadas]
```

### 2\. JSON ATUAL - ESTADO PRESENTE (CAMPOS VAZIOS / ESTRUTURA REVISADA)

O template JSON foi refinado para refletir com maior precisão o que pode ser inferido do *screenshot* e padronizar valores.

```json
{
  "analise_timestamp": null,
  "humor_trades": {
    "baixo_percentual": null,
    "cima_percentual": null
  },
  "mudanca_periodos": {
    "2min": {"min": null, "max": null},
  },
  "contexto_mercado": {
    "plataforma": "IQ Option",
    "ativo": null,
    "tipo_negociacao": "Binária",
    "periodicidade_vela": "1s",
    "preco_atual": null,
    "tendencia_geral": null,
    "forca_tendencia": null,
    "faixa_negociacao": {"suporte": null, "resistencia": null},
    "indicadores": {
      "medias_moveis": {
        "laranja": {"valor": null, "tendencia": null},
        "amarela": {"valor": null, "tendencia": null},
        "vermelha": {"valor": null, "tendencia": null}
      },
      "sinal_geral": null
    },
    "niveis_chave": {
      "suportes": [null, null, null],
      "resistencias": [null, null, null],
      "pivot": null
    }
  },
  "situacao_conta": {
    "tipo_conta": "Prática",
    "saldo": null,
    "total_operado_dia": null,
    "risco_por_trade": null
  },
  "analise_estrategica": {
    "setup_identificado": null,
    "confianca_setup": null,
    "proximo_gatilho": null,
    "timeframe_entrada_sugerido": "M1"
  }
}
```

-----

## 🔍 INSTRUÇÕES CLARAS:

### PARA A TABELA CSV:

  * ✅ **ACUMULAR** a história completa (incluindo a nova linha).
  * ✅ **CAMPOS NOVOS (CSV):** Preencha `sentimento_venda_percent` (ex: 74), `resultado_operacao_atual` (ex: +25.80, -29.44 ou 0.00 se N/A), e `saldo_conta`.

### PARA O JSON ATUAL:

  * ✅ **PREENCHER** todos os campos `null` com dados da imagem atual.
  * ✅ **`ativo`:** Extrair o ativo do cabeçalho da imagem (ex: AUD/CAD (OTC)).
  * ✅ **`situacao_conta` & `operacao_atual`:** Deduzir o status atual, mesmo que a operação tenha acabado de fechar. Se houver o valor em 'LUCRO APÓS VENDA (L/P)' ele deve ser o `resultado_atual`.
  * ✅ **`setup_identificado`:** Deve ser o mesmo da nova linha CSV.

### FLUXO CORRETO:

1.  **IA analista preenche JSON com dados da imagem atual.**
2.  **IA analista atualiza CSV com nova linha (usando a estrutura V2.0).**
3.  **Retorna ambos preenchidos.**

-----

## 🎯 OUTPUT ESPERADO DA IA ANALISTA:

**APÓS PROCESSAR A IMAGEM, A IA DEVE RETORNAR:**

```
📈 TABELA_CSV_ATUALIZADA.csv (com todas as linhas históricas + nova, usando o novo formato)
📊 JSON_ESTADO_ATUAL.json (preenchido com dados da imagem atual, usando o novo template)
```

**IMPORTANTE:** A IA que recebe este prompt é responsável por preencher os campos com base na análise da imagem fornecida.

-----

**PRONTO PARA ANÁLISE DA PRÓXIMA IMAGEM** 🚀