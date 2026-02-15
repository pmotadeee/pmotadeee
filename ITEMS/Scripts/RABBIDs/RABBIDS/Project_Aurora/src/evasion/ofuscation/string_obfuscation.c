// string_obfuscation.c – Ofuscação de strings via XOR
#include <string.h>

void xor_encrypt(char *str, char key) {
    size_t len = strlen(str);
    for (size_t i = 0; i < len; i++) {
        // Simple XOR against key. In a real scenario, use a rolling key or more complex algo.
        str[i] ^= key;
    }
}
