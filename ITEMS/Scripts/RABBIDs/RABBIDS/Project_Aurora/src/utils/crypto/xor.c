// xor.c â€“ Cifra XOR
#include "crypto.h"

void XOR_Encrypt(unsigned char *data, size_t len, unsigned char key) {
    for (size_t i = 0; i < len; i++)
        data[i] ^= key;
}
