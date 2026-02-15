cmake_minimum_required(VERSION 3.10)
project(RABBIDS C)

set(CMAKE_C_STANDARD 11)

include_directories(include)

file(GLOB_RECURSE SOURCES "src/*.c")
add_executable(rabbids ${SOURCES})
