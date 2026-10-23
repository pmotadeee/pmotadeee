# uncompyle6 version 3.3.4
# Python bytecode 3.6 (3379)
# Decompiled from: Python 3.6.7 (default, Oct 22 2018, 11:32:17) 
# [GCC 8.2.0]
# Embedded file name: preferences.py
import json

def getpreferences(item):
    with open('preferences.json', 'r') as (f):
        data = json.load(f)
    return data[item]


def setpreferences(item, value):
    with open('preferences.json', 'r') as (f):
        data = json.load(f)
    data[item] = value
    with open('preferences.json', 'w') as (f):
        json.dump(data, f)