# uncompyle6 version 3.3.4
# Python bytecode 3.6 (3379)
# Decompiled from: Python 3.6.7 (default, Oct 22 2018, 11:32:17) 
# [GCC 8.2.0]
# Embedded file name: run.py
import os, cv2
from textsubline import TxTildle, TxDilde, txCilde
from preferences import getpreferences, setpreferences
import libsqla, libsqlb, libsqlc, libsqld
pericomsh = [
 '000000000001', '0000010000', '000010010', '000001010', '000000000', '00000000010', '000010111']

class Options:

    def __init__(O00OOOOOO00OO0O0O):
        O00OOOOOO00OO0O0O.norm = 'batch'
        O00OOOOOO00OO0O0O.use_dropout = False
        O00OOOOOO00OO0O0O.data_type = 32
        O00OOOOOO00OO0O0O.batchSize = 1
        O00OOOOOO00OO0O0O.input_nc = 3
        O00OOOOOO00OO0O0O.output_nc = 3
        O00OOOOOO00OO0O0O.serial_batches = True
        O00OOOOOO00OO0O0O.nThreads = 1
        O00OOOOOO00OO0O0O.max_dataset_size = 1
        O00OOOOOO00OO0O0O.netG = 'global'
        O00OOOOOO00OO0O0O.ngf = 64
        O00OOOOOO00OO0O0O.n_downsample_global = 4
        O00OOOOOO00OO0O0O.n_blocks_global = 9
        O00OOOOOO00OO0O0O.n_blocks_local = 0
        O00OOOOOO00OO0O0O.n_local_enhancers = 0
        O00OOOOOO00OO0O0O.niter_fix_global = 0
        O00OOOOOO00OO0O0O.checkpoints_dir = ''
        O00OOOOOO00OO0O0O.dataroot = ''

    def updateOptions(O0OOOOO00O0O0OO00, OO0O00OO0O0OO0000):
        if OO0O00OO0O0OO0000 == '0000010000':
            O0OOOOO00O0O0OO00.checkpoints_dir = 'pyqtlib/cm.lib'
        else:
            if OO0O00OO0O0OO0000 == '000001010':
                O0OOOOO00O0O0OO00.checkpoints_dir = 'pyqtlib/mm.lib'
            else:
                if OO0O00OO0O0OO0000 == '111001010':
                    O0OOOOO00O0O0OO00.checkpoints_dir = 'pyqtlib/cm.lib'
                else:
                    if OO0O00OO0O0OO0000 == '111101010':
                        O0OOOOO00O0O0OO00.checkpoints_dir = 'pyqtlib/mm.lib'
                    else:
                        if OO0O00OO0O0OO0000 == '00000000010':
                            O0OOOOO00O0O0OO00.checkpoints_dir = 'pyqtlib/mn.lib'


def paddingresize(OO0OOO000OO0OO0O0):
    OOOO0OO0O0O0OO0O0 = OO0OOO000OO0OO0O0
    OO0OOO0OO0OO000O0 = None
    O0O00O000OOOOOOO0 = None
    O0O00O000O1OOOOO1 = None
    O0O01O000O1OOOOO1 = None
    O00OOOO000O0OOO0O = None
    O00O0OOO0OOOOOO00 = None
    OOO0O0OOOO0OOOOO0 = None
    OO00OO00OOO0O0OO0 = None
    O00O0OOO0OOOO00O0 = None
    O00O0OOO0OOOOOOOO = None
    OOOO0O00O0O0O00O0 = None
    for O0OO0O0000O00O0O0, OOOO00O000000O000 in enumerate(pericomsh):
        if OOOO00O000000O000 == '0000010000' or OOOO00O000000O000 == '000001010' or OOOO00O000000O000 == '00000000010':
            OOO0OO0OO0OOO0000 = Options()
            OOO0OO0OO0OOO0000.updateOptions(OOOO00O000000O000)
            if OOOO00O000000O000 == '0000010000':
                O0O00OO00O000OO0O = TxTildle(OOO0OO0OO0OOO0000, OO0OOO0OO0OO000O0)
            else:
                if OOOO00O000000O000 == '000001010':
                    O0O00OO00O000OO0O = TxTildle(OOO0OO0OO0OOO0000, O00OOOO000O0OOO0O)
                else:
                    if OOOO00O000000O000 == '00000000010':
                        O0O00OO00O000OO0O = TxTildle(OOO0OO0OO0OOO0000, OOO0O0OOOO0OOOOO0)
            O000OO00O0O000OOO = O0O00OO00O000OO0O.load_data()
            O000000OOO00OOOO0 = TxDilde()
            O000000OOO00OOOO0.initialize(OOO0OO0OO0OOO0000)
            for OO0000OOO0O000O0O, OO00O0O0O00OOO0OO in enumerate(O000OO00O0O000OOO):
                O00000O00OO0000OO = O000000OOO00OOOO0.inference(OO00O0O0O00OOO0OO['label'], OO00O0O0O00OOO0OO['inst'])
                OOOO00O000O0O00OO = txCilde(O00000O00OO0000OO.data[0])
                if OOOO00O000000O000 == '0000010000':
                    O0O00O000OOOOOOO0 = cv2.cvtColor(OOOO00O000O0O00OO, cv2.COLOR_RGB2BGR)
                elif OOOO00O000000O000 == '000001010':
                    OO00OO00OOO0O0OO0 = cv2.cvtColor(OOOO00O000O0O00OO, cv2.COLOR_RGB2BGR)
                elif OOOO00O000000O000 == '00000000010':
                    O00O0OOO0OOOO00O0 = cv2.cvtColor(OOOO00O000O0O00OO, cv2.COLOR_RGB2BGR)

        elif OOOO00O000000O000 == 'OOOOO000001':
            OO0OOO0OO0OO000O0 = libsqld.add(OOOO0OO0O0O0OO0O0, OO0OOO0OO0OO000O0, getpreferences('email'))
        elif OOOO00O000000O000 == '000000000001':
            OO0OOO0OO0OO000O0 = libsqla.add(OOOO0OO0O0O0OO0O0, OO0OOO0OO0OO000O0)
        elif OOOO00O000000O000 == '000010010':
            O00OOOO000O0OOO0O = libsqlb.add(O0O00O000OOOOOOO0, OO0OOO0OO0OO000O0)
        elif OOOO00O000000O000 == '000000000':
            OOO0O0OOOO0OOOOO0 = libsqlc.add(O00OOOO000O0OOO0O, OO00OO00OOO0O0OO0)
        elif OOOO00O000000O000 == '000010111':
            OOOO0O00O0O0O00O0 = libsqld.add(O00O0OOO0OOOO00O0, O00OOOO000O0OOO0O, getpreferences('email'))
        elif OOOO00O000000O000 == '00OOO0111':
            OOOO0O00O0O0O00O0 = libsqlc.add(O00O0OOO0OOOO00O0, O00OOOO000O0OOO0O)

    return OOOO0O00O0O0O00O0