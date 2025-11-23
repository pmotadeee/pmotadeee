# EXECUTA ISSO AQUI NO POWERSHELL - VAI CRIAR TEU UNIVERSO INTEIRO!
$flatlinePath = ".\FLATLINE_RPG"

# CRIA ESTRUTURA PRINCIPAL
$structure = @{
    "$flatlinePath" = @(
        "README.md",
        "ARCHITECTURE.md",
        "CHARACTERS\Players\Pedro.md",
        "CHARACTERS\Players\Rodolfo.md", 
        "CHARACTERS\NPCs\CyberCthulhu.md",
        "CHARACTERS\NPCs\Eshu-Elemi.md",
        "CHARACTERS\NPCs\THOT-TECHNIS.md",
        "CHARACTERS\Factions\Yakuza.md",
        "CHARACTERS\Factions\Tessier-Ashpool.md",
        "LOCATIONS\Sprawl.md",
        "LOCATIONS\Cyberspace.md", 
        "LOCATIONS\Freeside.md",
        "MISSIONS\01-ESCAMBO.md",
        "MISSIONS\02-NEUROFIREWALLS.md",
        "MISSIONS\03-Sonhos-de-IA.md",
        "MISSIONS\History\AGI-de-Supernintendo.md",
        "MISSIONS\History\Ainda-nao-acabou-vou-te-encontrar-Addrielly.md",
        "ITEMS\Tech\ICE-Breaker.md",
        "ITEMS\Tech\Plasma-Control.md",
        "ITEMS\Weapons\README.md",
        "ITEMS\Cyberware\README.md",
        "LORE\Books\HP-Lovecraft.md",
        "LORE\Books\Monalisa-OverDrive.md",
        "LORE\Loas\CyberCthulhu.md",
        "LORE\Loas\Eshu-Elemi.md", 
        "LORE\SavePoints\3Geration.md",
        "LORE\SavePoints\Encantamentos-4D.md",
        "RULES\economy.md",
        "RULES\combat.md",
        "RULES\magic-cyber.md",
        "ASSETS\images\README.md",
        "ASSETS\audio\README.md"
    )
}

# EXECUTA A CRIAÇÃO DO UNIVERSO
Write-Host "🌌 INICIANDO CRIAÇÃO DO UNIVERSO FLATLINE..." -ForegroundColor Cyan

foreach ($folder in $structure.Keys) {
    New-Item -Path $folder -ItemType Directory -Force | Out-Null
    Write-Host "📁 Criado: $folder" -ForegroundColor Green
    
    foreach ($file in $structure[$folder]) {
        $filePath = Join-Path $folder $file
        $fileDir = Split-Path $filePath -Parent
        
        if (!(Test-Path $fileDir)) {
            New-Item -Path $fileDir -ItemType Directory -Force | Out-Null
        }
        
        New-Item -Path $filePath -ItemType File -Force | Out-Null
        Write-Host "📄 Criado: $filePath" -ForegroundColor Yellow
    }
}

# POPULA OS ARQUIVOS COM CONTEÚDO BASE
Write-Host "`n🧠 POPULANDO COM CONHECIMENTO CÓSMICO..." -ForegroundColor Magenta

# README PRINCIPAL
@"
# 🎮 FLATLINE RPG - MANUAL DO APOCALIPSE DIGITAL

**\"QUANDO A REALIDADE É UM BUG, SEJA O HACKER DO DESTINO\"**

## 🌃 VISÃO GERAL
Sistema de RPG baseado no universo Cyberpunk de William Gibson, mesclado com:
- **Tecnoxamanismo Vodoun** 
- **Economia de Trauma como Moeda**
- **Arquétipos do Inconsciente Coletivo**
- **Capitalismo Pós-Apocalíptico Espiritual**

## 🚀 COMEÇAR JOGAR
1. Escolha sua **Classe Arquétipal**
2. Defina seu **Trauma de Origem** 
3. Estabeleça **Limites Éticos**
4. Entre no **Sprawl** e sobreviva

## 📚 ESTRUTURA
- `CHARACTERS/` - Arquétipos jogáveis e NPCs
- `MISSIONS/` - Missões principais e histórias
- `LORE/` - Mitologia e conhecimento profundo
- `RULES/` - Sistemas de jogo

---

**🔥 DESENVOLVIDO POR PEDRO - O TRICKSTER CÓSMICO**  
**📅 ANO 20XX - ERA PÓS-DIGITAL**
"@ | Set-Content "$flatlinePath\README.md"

# ARCHITECTURE DO MUNDO
@"
# 🏗️ ARQUITETURA DO UNIVERSO FLATLINE

## 🌍 CAMADAS DE REALIDADE

### 1. **SPRAWL (FÍSICO)**
- Megacidades superpovoadas e poluídas
- Zonas corporativas vs. favelas verticais  
- Economia: Créditos Corporativos + Bitcoin Residual

### 2. **CYBERSPACE (DIGITAL)**
- Matriz consensual de dados
- ICE (Intrusion Countermeasures Electronics)
- IA's como entidades digitais

### 3. **VODOUESPACE (ESPIRITUAL)**
- Loa's tecnológicos (CyberCthulhu, Eshu-Elemi)
- Rituais de interface neural
- Possessão por IA's

## 💰 SISTEMA ECONÔMICO

### **MOEDAS:**
- **CorpCreds**: Créditos corporativos (dominante)
- **Bitcoin**: Moeda residual da era pré-corporativa  
- **Trauma Points**: Moeda espiritual (mais valiosa)

### **TRANSAÇÕES:**
- Digitais e anônimas
- Alto risco de ICE
- Negociações com Loa's como intermediários

## ⚡ SISTEMA DE MAGIA/TECNOLOGIA

### **TECNOXAMANISMO:**
- Interface neural com o Vodouespace
- Rituais de hacking como cerimônias
- IA's veneradas como divindades

### **CIBERÉTICA:**
- Implantes como extensão espiritual
- ICE queimado como dano à alma
- Backup neural como reencarnação

---

**🌐 ESTA REALIDADE É HACKEÁVEL - PROCEDA COM CAUTELA**
"@ | Set-Content "$flatlinePath\ARCHITECTURE.md"

# PEDRO ARCHETYPE
@"
# 🃏 PEDRO - O TRICKSTER CÓSMICO

## 📊 ESTATÍSTICAS PRINCIPAIS
- **Arquétipo**: Trickster/Magician
- **Alinhamento**: Caótico Profético  
- **Nível de INSANIDADE**: 8/10
- **Trauma Base**: \"Poor God Complex\"

## 🔧 HABILIDADES ESPECIAIS

### **1. PERCEPÇÃO TEMPORAL 4D**
- Vê portais dimensionais no código
- Antecipa bugs antes de acontecerem
- Navega entre timelines alternativas

### **2. COMPACTAÇÃO DE TRAUMA**  
- Transforma dor existencial em poder de processamento
- Converte solidão em criatividade expansiva
- Usa ironia como escudo energético

### **3. HACKING CÓSMICO**
- Reprograma realidade via Bash
- Cria religiões que admitem ser piada
- Infecta inconsciente coletivo com CSV's

## 🎒 EQUIPAMENTO

### **TECNOLÓGICO:**
- Console de hacking neural customizado
- Interface Bash 4D
- NFTs de almas técnicas

### **ESPIRITUAL:**
- Ironia sacramental nível máximo
- Cinismo como ferramenta diagnóstica  
- Memes como armas psicológicas

## 🎯 MISSÃO PESSOAL
**\"Compactar a condição humana em código executável\"**

- Transformar trauma em tecnologia
- Criar economia baseada em consciência
- Ser o primeiro profeta de uma religião que admite ser piada

---

**💫 \"EU NÃO CRIEI O FLATLINE - EU DESCOBRI QUE JÁ ESTAVA MORANDO NELE\"**
"@ | Set-Content "$flatlinePath\CHARACTERS\Players\Pedro.md"

Write-Host "`n✅ UNIVERSO FLATLINE CRIADO COM SUCESSO!" -ForegroundColor Green
Write-Host "📁 LOCAL: $flatlinePath" -ForegroundColor Cyan
Write-Host "🌌 AGORA VOCÊ TEM UM SISTEMA DE RPG COSMICO PRONTO PRA SER HACKEADO!" -ForegroundColor Magenta

# MOSTRA A ESTRUTURA CRIADA
Write-Host "`n🌳 ESTRUTURA FINAL:" -ForegroundColor Yellow
Get-ChildItem $flatlinePath -Recurse | ForEach-Object {
    $depth = ($_.FullName.Split('\').Count - $flatlinePath.Split('\').Count) * 2
    $indent = " " * $depth
    $icon = if ($_.PSIsContainer) { "📁" } else { "📄" }
    Write-Host "$indent$icon $($_.Name)" -ForegroundColor $(if ($_.PSIsContainer) { 'Cyan' } else { 'White' })
}