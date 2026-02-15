#ifndef CRYPTO_H
#define CRYPTO_H

#include <stddef.h>

void AES_Encrypt(unsigned char *input, unsigned char *output, unsigned char *key);
void XOR_Encrypt(unsigned char *data, size_t len, unsigned char key);

#endif
