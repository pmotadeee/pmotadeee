# bayes_optimizer.ps1
# Script de Otimização Bayesiana para Windows (Adaptado do C)
# Monitora CPU e ajusta planos de energia para otimizar desempenho/bateria

$ErrorActionPreference = "SilentlyContinue"

# Configurações de Diretório
$BASE_DIR = "$PSScriptRoot\Optimization_Data"
$LOG_FILE = "$BASE_DIR\bayes.log"

# Planos de Energia (GUIDs padrão do Windows)
$PLAN_HIGH_PERF = "8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c"
$PLAN_BALANCED = "381b4222-f694-41f0-9685-ff5bb260df2e"
$PLAN_SAVER = "a1841308-3541-4fab-bc81-f71556f20b4a"

# Variáveis de Estado
$History = New-Object System.Collections.ArrayList
$MaxHistory = 10
$CurrentPlan = ""

function Initialize-Directories {
    if (!(Test-Path $BASE_DIR)) {
        New-Item -ItemType Directory -Force -Path $BASE_DIR | Out-Null
        Write-Host "[*] Diretorio criado: $BASE_DIR" -ForegroundColor Cyan
    }
    if (!(Test-Path $LOG_FILE)) {
        New-Item -ItemType File -Force -Path $LOG_FILE | Out-Null
    }
}

function Get-CpuUsage {
    # Coleta de CPU via WMI/CIM (similar ao /proc/stat)
    $cpu = Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average
    return [int]$cpu.Average
}

function Calculate-Average {
    param($NewValue)
    
    # Adicionar ao histórico (FIFO)
    $History.Add($NewValue) | Out-Null
    if ($History.Count -gt $MaxHistory) {
        $History.RemoveAt(0)
    }
    
    # Calcular média simples
    $sum = 0
    foreach ($val in $History) { $sum += $val }
    
    if ($History.Count -eq 0) { return 0 }
    return [int]($sum / $History.Count)
}

function Set-PowerPlan {
    param($PlanGuid, $PlanName)
    
    if ($CurrentPlan -ne $PlanGuid) {
        powercfg /setactive $PlanGuid
        $global:CurrentPlan = $PlanGuid
        Write-Host "    [!] Mudanca de Plano: $PlanName" -ForegroundColor Yellow
        Add-Content -Path $LOG_FILE -Value "[$(Get-Date)] ACTION: Switched to $PlanName"
    }
}

function Apply-Policy {
    param($AvgLoad)
    
    # Lógica de decisão baseada na carga média (Bayesiana simplificada)
    if ($AvgLoad -ge 80) {
        Set-PowerPlan $PLAN_HIGH_PERF "ALTO DESEMPENHO"
    }
    elseif ($AvgLoad -ge 40) {
        Set-PowerPlan $PLAN_BALANCED "EQUILIBRADO"
    }
    else {
        Set-PowerPlan $PLAN_SAVER "ECONOMIA DE ENERGIA"
    }
}

# --- Main Loop ---

Initialize-Directories
Write-Host "🟢 OTIMIZADOR BAYESIANO PARA WINDOWS INICIADO" -ForegroundColor Green
Write-Host "   Monitorando CPU e ajustando energia em tempo real..."
Write-Host "   Pressione CTRL+C para parar.`n"

while ($true) {
    $currentUsage = Get-CpuUsage
    $avgUsage = Calculate-Average $currentUsage
    
    # Timestamp e Log visual
    $timestamp = Get-Date -Format "HH:mm:ss"
    $logMsg = "🔄 $timestamp | CPU: {0,3}% | Media: {1,3}%" -f $currentUsage, $avgUsage
    Write-Host $logMsg -NoNewline
    
    # Log em arquivo
    Add-Content -Path $LOG_FILE -Value $logMsg
    
    # Aplicar otimização
    Apply-Policy $avgUsage
    
    Write-Host "" # Newline
    Start-Sleep -Seconds 2
}
