$root = "Project_Aurora"

# Function to create file with optional content
function Create-File {
    param (
        [string]$Path,
        [string]$Content = ""
    )
    $dir = Split-Path -Parent $Path
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
        Write-Host "Created Dir: $dir"
    }
    if (-not (Test-Path $Path)) {
        if ($Content -ne "") {
            Set-Content -Path $Path -Value $Content -Encoding UTF8
            Write-Host "Created: $Path"
        } else {
            New-Item -ItemType File -Force -Path $Path | Out-Null
            Write-Host "Created empty: $Path"
        }
    } else {
        Write-Host "Exists: $Path"
    }
}

# Directories (explicit empty dirs needed)
$directories = @(
    "$root/resources/payloads",
    "$root/resources/certificates",
    "$root/third_party"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
        Write-Host "Created Dir: $dir"
    }
}

# Files
$files = @{
    "$root/.gitignore" = ""
    "$root/README.md" = ""
    "$root/LICENSE" = ""
    "$root/Makefile" = ""
    "$root/CMakeLists.txt" = ""
    "$root/config/build_settings.ini" = ""
    "$root/config/evasion_rules.json" = ""
    "$root/docs/architecture.md" = ""
    "$root/docs/evasion_techniques.md" = ""
    "$root/docs/communication_protocol.md" = ""
    "$root/docs/testing_procedure.md" = ""
    "$root/resources/payloads/placeholder.txt" = ""
    "$root/resources/certificates/placeholder.txt" = ""
    "$root/resources/scripts/build.bat" = ""
    "$root/resources/scripts/clean.bat" = ""
    "$root/resources/scripts/run_tests.bat" = ""
    "$root/resources/scripts/deploy.ps1" = ""
    "$root/src/core/perception.c" = "// perception.c - Modulo de percepcao do sistema (coleta de metricas)"
    "$root/src/core/perception.h" = ""
    "$root/src/core/inference.c" = "// inference.c - Modulo de inferencia"
    "$root/src/core/inference.h" = ""
    "$root/src/core/action.c" = "// action.c - Modulo de acao"
    "$root/src/core/action.h" = ""
    "$root/src/core/memory.c" = "// memory.c - Modulo de memoria"
    "$root/src/core/memory.h" = ""
    "$root/src/core/core_main.c" = "// core_main.c - Main do core"
    "$root/src/modules/propagation/propagation.c" = "// propagation.c"
    "$root/src/modules/propagation/propagation.h" = ""
    "$root/src/modules/propagation/smb_exploit.c" = "// smb_exploit.c"
    "$root/src/modules/propagation/rdp_bruteforce.c" = "// rdp_bruteforce.c"
    "$root/src/modules/propagation/ssh_scanner.c" = "// ssh_scanner.c"
    "$root/src/modules/camouflage/camouflage.c" = "// camouflage.c"
    "$root/src/modules/camouflage/camouflage.h" = ""
    "$root/src/modules/camouflage/process_hollowing.c" = "// process_hollowing.c"
    "$root/src/modules/camouflage/dll_injection.c" = "// dll_injection.c"
    "$root/src/modules/camouflage/polymorph.c" = "// polymorph.c"
    "$root/src/modules/resource_control/resource_control.c" = "// resource_control.c"
    "$root/src/modules/resource_control/resource_control.h" = ""
    "$root/src/modules/resource_control/cgroup_sim.c" = "// cgroup_sim.c"
    "$root/src/modules/resource_control/priority_stealing.c" = "// priority_stealing.c"
    "$root/src/modules/resource_control/kill_process.c" = "// kill_process.c"
    "$root/src/modules/network_isolation/network_isolation.c" = "// network_isolation.c"
    "$root/src/modules/network_isolation/network_isolation.h" = ""
    "$root/src/modules/network_isolation/firewall_block.c" = "// firewall_block.c"
    "$root/src/modules/network_isolation/dns_tunneling.c" = "// dns_tunneling.c"
    "$root/src/modules/network_isolation/p2p_comm.c" = "// p2p_comm.c"
    "$root/src/modules/communication/communication.c" = "// communication.c"
    "$root/src/modules/communication/communication.h" = ""
    "$root/src/modules/communication/https_beacon.c" = "// https_beacon.c"
    "$root/src/modules/communication/dns_beacon.c" = "// dns_beacon.c"
    "$root/src/modules/communication/pipe_comm.c" = "// pipe_comm.c"
    "$root/src/evasion/amsi/amsi_bypass.c" = "// amsi_bypass.c"
    "$root/src/evasion/amsi/amsi_patch.c" = "// amsi_patch.c"
    "$root/src/evasion/etw/etw_patch.c" = "// etw_patch.c"
    "$root/src/evasion/etw/etw_hook.c" = "// etw_hook.c"
    "$root/src/evasion/sandbox/sandbox_detection.c" = "// sandbox_detection.c"
    "$root/src/evasion/sandbox/vm_detection.c" = "// vm_detection.c"
    "$root/src/evasion/sandbox/debugger_check.c" = "// debugger_check.c"
    "$root/src/evasion/ofuscation/string_obfuscation.c" = "// string_obfuscation.c"
    "$root/src/evasion/ofuscation/api_resolver.c" = "// api_resolver.c"
    "$root/src/evasion/ofuscation/code_encryption.c" = "// code_encryption.c"
    "$root/src/evasion/ofuscation/control_flow_flattening.c" = "// control_flow_flattening.c"
    "$root/src/evasion/evasion.h" = ""
    "$root/src/persistence/scheduled_task.c" = "// scheduled_task.c"
    "$root/src/persistence/service.c" = "// service.c"
    "$root/src/persistence/registry_run.c" = "// registry_run.c"
    "$root/src/persistence/startup_folder.c" = "// startup_folder.c"
    "$root/src/persistence/com_hijack.c" = "// com_hijack.c"
    "$root/src/persistence/persistence.h" = ""
    "$root/src/utils/crypto/aes.c" = "// aes.c"
    "$root/src/utils/crypto/xor.c" = "// xor.c"
    "$root/src/utils/crypto/crypto.h" = ""
    "$root/src/utils/logger.c" = "// logger.c"
    "$root/src/utils/logger.h" = ""
    "$root/src/utils/config_parser.c" = "// config_parser.c"
    "$root/src/utils/config_parser.h" = ""
    "$root/src/utils/winapi_helpers.c" = "// winapi_helpers.c"
    "$root/src/utils/winapi_helpers.h" = ""
    "$root/src/main.c" = "// main.c"
    "$root/include/core.h" = ""
    "$root/include/modules.h" = ""
    "$root/include/evasion.h" = ""
    "$root/include/persistence.h" = ""
    "$root/include/utils.h" = ""
    "$root/tests/unit/test_perception.c" = "// test_perception.c"
    "$root/tests/unit/test_inference.c" = "// test_inference.c"
    "$root/tests/unit/test_propagation.c" = "// test_propagation.c"
    "$root/tests/unit/test_evasion.c" = "// test_evasion.c"
    "$root/tests/integration/test_full_chain.c" = "// test_full_chain.c"
    "$root/tests/integration/test_c2_comms.c" = "// test_c2_comms.c"
    "$root/tests/mocks/mock_winapi.c" = "// mock_winapi.c"
    "$root/tools/obfuscator/obfuscate.py" = ""
    "$root/tools/obfuscator/config.yaml" = ""
    "$root/tools/packer/packer.c" = "// packer.c"
    "$root/tools/packer/Makefile" = ""
    "$root/tools/payload_generator/gen_payload.py" = ""
    "$root/third_party/README.txt" = ""
}

foreach ($file in $files.Keys) {
    Create-File -Path $file -Content $files[$file]
}
Write-Host "Success"
