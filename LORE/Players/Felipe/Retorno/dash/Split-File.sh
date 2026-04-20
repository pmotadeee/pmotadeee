#!/usr/bin/env bash
# Uso: ./split_file.sh -i "1.md" -p 10

set -euo pipefail

# 1. Parâmetros
INPUT_FILE=""
PARTS=4

while getopts "i:p:" opt; do
    case $opt in
        i) INPUT_FILE="$OPTARG" ;;
        p) PARTS="$OPTARG" ;;
        *) echo "Uso: $0 -i <arquivo> -p <partes>" >&2; exit 1 ;;
    esac
done

# 2. Verificação
if [[ -z "$INPUT_FILE" ]]; then
    echo "Erro: Arquivo de entrada obrigatório. Use -i <arquivo>" >&2
    exit 1
fi

if [[ ! -f "$INPUT_FILE" ]]; then
    echo "Erro: Arquivo de entrada não encontrado: '$INPUT_FILE'" >&2
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 3. Leitura e Cálculo
echo "Processando arquivo: $INPUT_FILE"
CONTENT=$(cat "$INPUT_FILE")
TOTAL_LENGTH=${#CONTENT}
echo "Total de caracteres encontrados: $TOTAL_LENGTH"

CHUNK_SIZE=$(( TOTAL_LENGTH / PARTS ))
FILE_BASE="${INPUT_FILE%.*}"
FILE_BASE="$(basename "$FILE_BASE")"

echo "Tamanho base de cada parte (exceto a última): $CHUNK_SIZE caracteres."

# 4. Divisão e Distribuição
START=0
for (( i=1; i<=PARTS; i++ )); do

    if (( i == PARTS )); then
        LENGTH=$(( TOTAL_LENGTH - START ))
    else
        LENGTH=$CHUNK_SIZE
    fi

    if (( LENGTH <= 0 )); then
        echo "Aviso: Nenhum conteúdo restante para a parte $i. Finalizando."
        break
    fi

    CHUNK="${CONTENT:$START:$LENGTH}"
    OUTPUT_FILE="$SCRIPT_DIR/${FILE_BASE}_part_$(printf '%02d' $i).txt"

    printf '%s' "$CHUNK" > "$OUTPUT_FILE"

    echo "  -> Criado: $OUTPUT_FILE (Tamanho: ${#CHUNK} caracteres)"

    START=$(( START + LENGTH ))
done

echo "Processo concluído. Arquivos distribuídos em $PARTS partes."