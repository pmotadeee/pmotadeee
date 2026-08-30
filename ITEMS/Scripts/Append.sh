#!/bin/sh
# script_context.sh - Percorre recursivamente um diretório,
# lê arquivos e diretórios, e salva tudo em context.md

BASE_DIR="${1:-.}"          # Diretório base (padrão: atual)
OUTPUT_FILE="context.md"    # Nome do arquivo de saída

# Limpa (ou cria) o arquivo de saída
> "$OUTPUT_FILE"

# Percorre todos os itens (arquivos e diretórios)
find "$BASE_DIR" -print | while IFS= read -r item; do
    # Escreve o cabeçalho com o caminho do item
    echo "========================================" >> "$OUTPUT_FILE"
    echo ">>> $item" >> "$OUTPUT_FILE"
    echo "========================================" >> "$OUTPUT_FILE"
    
    # Se for um arquivo comum, lê e anexa o conteúdo
    if [ -f "$item" ]; then
        cat "$item" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"  # quebra de linha extra
    else
        # Se for diretório (ou outro tipo), apenas indica
        echo "[Diretório ou item especial]" >> "$OUTPUT_FILE"
    fi
    
    echo "" >> "$OUTPUT_FILE"   # linha em branco entre itens
done

echo "Pronto! Dados salvos em $OUTPUT_FILE"