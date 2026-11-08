#!/usr/bin/env bash
# monolito.sh — varre ./ recursivamente, converte PDFs e gera context.md
set -euo pipefail

OUTPUT="context.md"

# ---------- 1) instala poppler-utils se faltar pdftotext ----------
if ! command -v pdftotext >/dev/null 2>&1; then
    echo "[*] instalando poppler-utils..."
    if   command -v apt-get >/dev/null 2>&1; then sudo apt-get update -qq && sudo apt-get install -y poppler-utils
    elif command -v dnf     >/dev/null 2>&1; then sudo dnf install -y poppler-utils
    elif command -v yum     >/dev/null 2>&1; then sudo yum install -y poppler-utils
    elif command -v pacman  >/dev/null 2>&1; then sudo pacman -Sy --noconfirm poppler
    elif command -v brew    >/dev/null 2>&1; then brew install poppler
    else echo "[!] instale poppler-utils manualmente" >&2; exit 1; fi
fi

# ---------- 2) começa o monolito ----------
: > "$OUTPUT"

# ---------- 3) varre ./ recursivamente e anexa cada PDF ----------
find . -type f -iname '*.pdf' -print0 | sort -z | while IFS= read -r -d '' pdf; do
    echo "[+] $pdf"
    {
        echo "## \`$pdf\`"
        echo
        pdftotext -layout "$pdf" - 2>/dev/null || echo "_(falha ao converter)_"
        echo
        echo "---"
        echo
    } >> "$OUTPUT"
done

# ---------- 4) resumo ----------
echo
echo "[✓] gerado: $OUTPUT"
echo "[✓] tamanho: $(du -h "$OUTPUT" | cut -f1)"
echo "[✓] pdfs: $(find . -type f -iname '*.pdf' | wc -l)"