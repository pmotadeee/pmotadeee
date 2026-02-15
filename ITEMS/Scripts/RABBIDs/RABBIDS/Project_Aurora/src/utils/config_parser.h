#ifndef CONFIG_PARSER_H
#define CONFIG_PARSER_H

typedef struct {
    int sandbox_check;
    int amsi_bypass;
} Config;

Config ParseConfig(const char *filename);

#endif
