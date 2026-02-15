# Makefile simples para Windows (usando MinGW ou MSVC)
CC=gcc
CFLAGS=-Wall -Iinclude
SRC=$(wildcard src/**/*.c src/*.c)
OBJ=$(SRC:.c=.o)
TARGET=rabbids.exe

all: $(TARGET)

$(TARGET): $(OBJ)
	$(CC) -o $@ $^

clean:
	del /Q $(OBJ) $(TARGET)
