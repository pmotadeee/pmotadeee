param(
    [Parameter(Mandatory=$true)]
    [string]$InputFile,

    [int]$Parts = 10
)

# 1. Configurações e Verificação
# Obtém o diretório onde o script está sendo executado
$ScriptDir = Get-Item $MyInvocation.MyCommand.Path | Select-Object -ExpandProperty DirectoryName

# Verifica se o arquivo de entrada existe
if (-not (Test-Path -Path $InputFile)) {
    Write-Error "Erro: Arquivo de entrada não encontrado: '$InputFile'"
    exit 1
}

# 2. Leitura e Cálculo
Write-Host "Processando arquivo: $($InputFile)" -ForegroundColor Yellow
$Content = Get-Content -Path $InputFile -Raw -Encoding UTF8
$TotalLength = $Content.Length

Write-Host "Total de caracteres encontrados: $($TotalLength)" -ForegroundColor Green

# Cálculo do tamanho base de cada parte (divisão inteira)
$ChunkSize = [int]($TotalLength / $Parts)
$FileBaseName = [System.IO.Path]::GetFileNameWithoutExtension($InputFile)

Write-Host "Tamanho base de cada parte (exceto a última): $($ChunkSize) caracteres." -ForegroundColor Cyan

# 3. Divisão e Distribuição
$StartIndex = 0

for ($i = 1; $i -le $Parts; $i++) {
    
    # Define o tamanho da parte atual
    if ($i -eq $Parts) {
        # A última parte pega o restante dos caracteres para garantir que nada seja perdido
        $Length = $TotalLength - $StartIndex
    } else {
        $Length = $ChunkSize
    }
    
    # Verifica se há conteúdo para esta parte
    if ($Length -le 0) {
        Write-Host "Aviso: Nenhuma parte de conteúdo restante para a parte $($i). Finalizando." -ForegroundColor Magenta
        break
    }
    
    # Extrai o substring
    $Chunk = $Content.Substring($StartIndex, $Length)
    
    # Define o nome do arquivo de saída (ex: 1_part_01.txt, 1_part_10.txt)
    $OutputFile = Join-Path -Path $ScriptDir -ChildPath "$($FileBaseName)_part_$($i.ToString('00')).txt"
    
    # Salva o conteúdo no novo arquivo
    $Chunk | Out-File -FilePath $OutputFile -Encoding UTF8
    
    Write-Host "  -> Criado: $($OutputFile) (Tamanho: $($Chunk.Length) caracteres)"
    
    # Atualiza o índice inicial para a próxima iteração
    $StartIndex += $Length
}

Write-Host "Processo concluído. Arquivos distribuídos em $($Parts) partes." -ForegroundColor Green