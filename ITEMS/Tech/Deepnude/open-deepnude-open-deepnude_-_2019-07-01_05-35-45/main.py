# uncompyle6 version 3.3.4
# Python bytecode 3.6 (3379)
# Decompiled from: Python 3.6.7 (default, Oct 22 2018, 11:32:17) 
# [GCC 8.2.0]
# Embedded file name: main.py
import sys, os, urllib.request, multiprocessing, cv2, numpy as np
from PIL import Image, PngImagePlugin
from io import BytesIO
import rsa, subprocess, json, base64, encodings.idna
from PyQt5 import QtCore, QtWidgets
from PyQt5.QtCore import QRectF
from PyQt5.QtGui import QImage, QPixmap, QMovie
from QtImageCropper import QtImageCropper
from color import checkcolor, newcolor
from preferences import getpreferences, setpreferences
from run import paddingresize

class Home(QtWidgets.QWidget):
    home_activate_signal = QtCore.pyqtSignal()
    home_upload_signal = QtCore.pyqtSignal()

    def __init__(O0O00OOOOO0O00000, OOO00O0O0OO00OOOO):
        QtWidgets.QWidget.__init__(O0O00OOOOO0O00000)
        O0O00OOOOO0O00000.setWindowTitle('DeepNude')
        O0O00OOOOO0O00000.setFixedSize(800, 800)
        O0O00OOOOO0O00000._Home__O0OO000OOOO00OO00 = QtWidgets.QVBoxLayout()
        O0O00OOOOO0O00000._Home__O0OO000OOOO00OO00.addStretch(1)
        O0O00OOOOO0O00000._Home__OOO0000O00O0O00OO = QtWidgets.QLabel()
        O0O00OOOOO0O00000._Home__OOO0000O00O0O00OO.setText('Welcome to DeepNude (v2.0.0)')
        O0O00OOOOO0O00000._Home__OOO0000O00O0O00OO.setAlignment(QtCore.Qt.AlignCenter)
        O0O00OOOOO0O00000._Home__O0OO000OOOO00OO00.addWidget(O0O00OOOOO0O00000._Home__OOO0000O00O0O00OO)
        O0O00OOOOO0O00000._Home__OOOOOOOO00O0O0O0O = QtWidgets.QLabel()
        O0O00OOOOO0O00000._Home__OOOOOOOO00O0O0O0O.setPixmap(QPixmap('qtbin/logo.png'))
        O0O00OOOOO0O00000._Home__OOOOOOOO00O0O0O0O.setAlignment(QtCore.Qt.AlignCenter)
        O0O00OOOOO0O00000._Home__OOOOOOOO00O0O0O0O.show()
        O0O00OOOOO0O00000._Home__O0OO000OOOO00OO00.addWidget(O0O00OOOOO0O00000._Home__OOOOOOOO00O0O0O0O)
        if OOO00O0O0OO00OOOO == [33, 33, 33]:
            O0O00OOOOO0O00000._Home__O0O0O00O0OOO0OO0O = QtWidgets.QPushButton('Upgrade to Premium')
            O0O00OOOOO0O00000._Home__O0O0O00O0OOO0OO0O.clicked.connect(O0O00OOOOO0O00000._Home__O0O00OO0O000OOOO0)
            O0O00OOOOO0O00000._Home__O0OO000OOOO00OO00.addStretch(1)
            O0O00OOOOO0O00000._Home__O0OO000OOOO00OO00.addWidget(O0O00OOOOO0O00000._Home__O0O0O00O0OOO0OO0O)
        else:
            if OOO00O0O0OO00OOOO == [255, 240, 255]:
                O0O00OOOOO0O00000._Home__O0000O00O0O00OO00 = QtWidgets.QLabel()
                O0O00OOOOO0O00000._Home__O0000O00O0O00OO00.setText('Premium Version')
                O0O00OOOOO0O00000._Home__O0000O00O0O00OO00.setAlignment(QtCore.Qt.AlignCenter)
                O0O00OOOOO0O00000._Home__O0OO000OOOO00OO00.addWidget(O0O00OOOOO0O00000._Home__O0000O00O0O00OO00)
                O0O00OOOOO0O00000._Home__O0OO000OOOO00OO00.addStretch(1)
        O0O00OOOOO0O00000._Home__O00OO00OO00O00O0O = QtWidgets.QPushButton('Upload a Photo')
        O0O00OOOOO0O00000._Home__O00OO00OO00O00O0O.clicked.connect(O0O00OOOOO0O00000._Home__OO0OOOOO0OO0O0OOO)
        O0O00OOOOO0O00000._Home__O0OO000OOOO00OO00.addWidget(O0O00OOOOO0O00000._Home__O00OO00OO00O00O0O)
        O0O00OOOOO0O00000.setLayout(O0O00OOOOO0O00000._Home__O0OO000OOOO00OO00)

    def __O0O00OO0O000OOOO0(OOO00O00O0OOO000O):
        OOO00O00O0OOO000O.home_activate_signal.emit()

    def __OO0OOOOO0OO0O0OOO(O00OO00OOOO00OOOO):
        O00OO00OOOO00OOOO.home_upload_signal.emit()


class Transform(QtWidgets.QWidget):
    back_signal = QtCore.pyqtSignal()

    def __init__(O0O0OO0OOOOOO0O00, OO0OOOO0OOOOO000O, O0O0000OO0O00OO00):
        QtWidgets.QWidget.__init__(O0O0OO0OOOOOO0O00)
        O0O0OO0OOOOOO0O00._Transform__O000OO0OO000OO0O0 = OO0OOOO0OOOOO000O
        O0O0OO0OOOOOO0O00._Transform__OOOO0O0O0OOOOOO0O = O0O0000OO0O00OO00
        O0O0OO0OOOOOO0O00.setWindowTitle('DeepNude')
        O0O0OO0OOOOOO0O00.setFixedSize(1200, 800)
        O0O0OO0OOOOOO0O00._Transform__OOOO00OOO0OO00000 = QtWidgets.QVBoxLayout()
        O0O0OO0OOOOOO0O00._Transform__OOO0OOOOOOOO00O0O = QtWidgets.QVBoxLayout()
        O0O0OO0OOOOOO0O00._Transform__OOOOO00OO000O000O = QtWidgets.QHBoxLayout()
        O0O0OO0OOOOOO0O00._Transform__O0OO00O0000OOOOO0 = QtWidgets.QHBoxLayout()
        O0O0OO0OOOOOO0O00._Transform__O00OOO00O0O000O0O = QtWidgets.QHBoxLayout()
        O0O0OO0OOOOOO0O00._Transform__OOO00OO0OO0O0OO0O = QtImageCropper()
        O0O0OO0OOOOOO0O00._Transform__OOO00OO0OO0O0OO0O.setImage(QImage(O0O0OO0OOOOOO0O00._Transform__OOOO0O0O0OOOOOO0O))
        O0O0OO0OOOOOO0O00._Transform__O000OOO0O0O0OOOO0 = QtWidgets.QLabel()
        O0O0OO0OOOOOO0O00._Transform__O000OOO0O0O0OOOO0.setAlignment(QtCore.Qt.AlignCenter)
        O0O0OO0OOOOOO0O00._Transform__O000OOO0O0O0OOOO0.setText('HOW TO \n \n [1] Use summer photos: the more skin that is exposed, the better the result. \n \n [2] - Set an optimal zoom level using the zoom bar. \n Use the illustration above as a reference. \n \n [3] - Move the image (click-drag) centering the person.')
        O0O0OO0OOOOOO0O00._Transform__O000OOO0O0O0OOOO0.setWordWrap(True)
        O0O0OO0OOOOOO0O00._Transform__O00OOOOOOO00O0000 = QtWidgets.QLabel()
        O0O0OO0OOOOOO0O00._Transform__O00OOOOOOO00O0000.setPixmap(QPixmap('qtbin/instructiongui.png').scaledToWidth(300))
        O0O0OO0OOOOOO0O00._Transform__O00OOOOOOO00O0000.setAlignment(QtCore.Qt.AlignCenter)
        O0O0OO0OOOOOO0O00._Transform__O00OOOOOOO00O0000.show()
        O0O0OO0OOOOOO0O00._Transform__O0O00OO0OOOO00OOO = QtWidgets.QLabel()
        O0O0OO0OOOOOO0O00._Transform__O0O00OO0OOOO00OOO.setText('Zoom:')
        O0O0OO0OOOOOO0O00._Transform__OO0O00O0O0OOO0OOO = QtWidgets.QSlider(QtCore.Qt.Horizontal)
        O0O0OO0OOOOOO0O00._Transform__OO0O00O0O0OOO0OOO.setMinimum(-50)
        O0O0OO0OOOOOO0O00._Transform__OO0O00O0O0OOO0OOO.setMaximum(100)
        O0O0OO0OOOOOO0O00._Transform__OO0O00O0O0OOO0OOO.setValue(50)
        O0O0OO0OOOOOO0O00._Transform__OO0O00O0O0OOO0OOO.setTickPosition(QtWidgets.QSlider.TicksBelow)
        O0O0OO0OOOOOO0O00._Transform__OO0O00O0O0OOO0OOO.setTickInterval(1)
        O0O0OO0OOOOOO0O00._Transform__OO0O00O0O0OOO0OOO.valueChanged.connect(O0O0OO0OOOOOO0O00._Transform__OOO00OO0OO0O0OO0O.zoomChanged)
        O0O0OO0OOOOOO0O00._Transform__OO0O00O0O0OOO0OOO.setFixedSize(512, 50)
        O0O0OO0OOOOOO0O00._Transform__OO0O0OOO00OOOO0OO = QtWidgets.QPushButton('Back')
        O0O0OO0OOOOOO0O00._Transform__OO0O0OOO00OOOO0OO.clicked.connect(O0O0OO0OOOOOO0O00._Transform__OOOOOOOO00OOO00O0)
        O0O0OO0OOOOOO0O00._Transform__OO0O0OOO00OOOO0OO.setStyleSheet('QPushButton:disabled {background-color: #acacac;}')
        O0O0OO0OOOOOO0O00._Transform__OOOO00O0OOO00O000 = QtWidgets.QPushButton('Transform')
        O0O0OO0OOOOOO0O00._Transform__OOOO00O0OOO00O000.clicked.connect(O0O0OO0OOOOOO0O00._Transform__OOO0000O0O00O0OO0)
        O0O0OO0OOOOOO0O00._Transform__OOOO00O0OOO00O000.setStyleSheet('QPushButton:disabled {background-color: #acacac;}')
        O0O0OO0OOOOOO0O00._Transform__OO0OO0O0OOO0OO0OO = QtWidgets.QPushButton('Save')
        O0O0OO0OOOOOO0O00._Transform__OO0OO0O0OOO0OO0OO.hide()
        if O0O0OO0OOOOOO0O00._Transform__O000OO0OO000OO0O0 == [33, 33, 33]:
            O0O0OO0OOOOOO0O00._Transform__OO0OO0O0OOO0OO0OO.setEnabled(False)
        O0O0OO0OOOOOO0O00._Transform__OO0OO0O0OOO0OO0OO.clicked.connect(O0O0OO0OOOOOO0O00._Transform__O0000OOOO000OOOOO)
        O0O0OO0OOOOOO0O00._Transform__OO0OO0O0OOO0OO0OO.setStyleSheet('QPushButton:disabled {background-color: #acacac;}')
        O0O0OO0OOOOOO0O00._Transform__OOO0OOOOOOOO00O0O.addStretch(1)
        O0O0OO0OOOOOO0O00._Transform__OOO0OOOOOOOO00O0O.addWidget(O0O0OO0OOOOOO0O00._Transform__O00OOOOOOO00O0000)
        O0O0OO0OOOOOO0O00._Transform__OOO0OOOOOOOO00O0O.addStretch(2)
        O0O0OO0OOOOOO0O00._Transform__OOO0OOOOOOOO00O0O.addWidget(O0O0OO0OOOOOO0O00._Transform__O000OOO0O0O0OOOO0)
        O0O0OO0OOOOOO0O00._Transform__OOO0OOOOOOOO00O0O.addStretch(3)
        O0O0OO0OOOOOO0O00._Transform__OOOOO00OO000O000O.addWidget(O0O0OO0OOOOOO0O00._Transform__OOO00OO0OO0O0OO0O)
        O0O0OO0OOOOOO0O00._Transform__OOOOO00OO000O000O.addLayout(O0O0OO0OOOOOO0O00._Transform__OOO0OOOOOOOO00O0O)
        O0O0OO0OOOOOO0O00._Transform__O0OO00O0000OOOOO0.addWidget(O0O0OO0OOOOOO0O00._Transform__O0O00OO0OOOO00OOO)
        O0O0OO0OOOOOO0O00._Transform__O0OO00O0000OOOOO0.addWidget(O0O0OO0OOOOOO0O00._Transform__OO0O00O0O0OOO0OOO)
        O0O0OO0OOOOOO0O00._Transform__O0OO00O0000OOOOO0.addStretch(1)
        O0O0OO0OOOOOO0O00._Transform__O00OOO00O0O000O0O.addWidget(O0O0OO0OOOOOO0O00._Transform__OO0O0OOO00OOOO0OO)
        O0O0OO0OOOOOO0O00._Transform__O00OOO00O0O000O0O.addWidget(O0O0OO0OOOOOO0O00._Transform__OOOO00O0OOO00O000)
        O0O0OO0OOOOOO0O00._Transform__O00OOO00O0O000O0O.addWidget(O0O0OO0OOOOOO0O00._Transform__OO0OO0O0OOO0OO0OO)
        O0O0OO0OOOOOO0O00._Transform__OOOO00OOO0OO00000.addLayout(O0O0OO0OOOOOO0O00._Transform__OOOOO00OO000O000O)
        O0O0OO0OOOOOO0O00._Transform__OOOO00OOO0OO00000.addStretch(4)
        O0O0OO0OOOOOO0O00._Transform__OOOO00OOO0OO00000.addLayout(O0O0OO0OOOOOO0O00._Transform__O0OO00O0000OOOOO0)
        O0O0OO0OOOOOO0O00._Transform__OOOO00OOO0OO00000.addStretch(5)
        O0O0OO0OOOOOO0O00._Transform__OOOO00OOO0OO00000.addLayout(O0O0OO0OOOOOO0O00._Transform__O00OOO00O0O000O0O)
        O0O0OO0OOOOOO0O00.setLayout(O0O0OO0OOOOOO0O00._Transform__OOOO00OOO0OO00000)

    def __OOO0000O0O00O0OO0(OO0OOOOOOO0OOO0OO):
        OO0OOOOOOO0OOO0OO._Transform__OOOO00O0OOO00O000.setEnabled(False)
        OO0OOOOOOO0OOO0OO._Transform__OO0O0OOO00OOOO0OO.setEnabled(False)
        O0O0O0O0OO00O0O00 = cv2.imread(OO0OOOOOOO0OOO0OO._Transform__OOOO0O0O0OOOOOO0O)
        OO000OOO0O0O00O00, O00OOOO0OOO000000, O00OOO00000O00O00 = O0O0O0O0OO00O0O00.shape
        O0O0000OO0O0OO0O0 = OO0OOOOOOO0OOO0OO._Transform__OOO00OO0OO0O0OO0O.mapToScene(OO0OOOOOOO0OOO0OO._Transform__OOO00OO0OO0O0OO0O.viewport().geometry()).boundingRect()
        OO0O0O000OO000OO0 = int(O0O0000OO0O0OO0O0.left())
        O00OOO00O0OO00OO0 = int(O0O0000OO0O0OO0O0.top())
        OO00O00OOO0OOO000 = int(O0O0000OO0O0OO0O0.width())
        O0OO0OOOO000OOOO0 = int(O0O0000OO0O0OO0O0.height())
        if OO00O00OOO0OOO000 < O00OOOO0OOO000000:
            if O0OO0OOOO000OOOO0 < OO000OOO0O0O00O00:
                O0000O0O0OOOOOO0O = cv2.resize(O0O0O0O0OO00O0O00[O00OOO00O0OO00OO0:O00OOO00O0OO00OO0 + O0OO0OOOO000OOOO0, OO0O0O000OO000OO0:OO0O0O000OO000OO0 + OO00O00OOO0OOO000], (512,
                                                                                                                                                                                     512))
            if OO00O00OOO0OOO000 > O00OOOO0OOO000000 and O0OO0OOOO000OOOO0 > OO000OOO0O0O00O00:
                O000OO00O000OO0OO = np.zeros((O0OO0OOOO000OOOO0, OO00O00OOO0OOO000, 3), np.uint8)
                O000OO00O000OO0OO[:, :, :] = (255, 255, 255)
                O000OO00O000OO0OO[abs(O00OOO00O0OO00OO0):abs(O00OOO00O0OO00OO0) + OO000OOO0O0O00O00, abs(OO0O0O000OO000OO0):abs(OO0O0O000OO000OO0) + O00OOOO0OOO000000] = O0O0O0O0OO00O0O00
                O0000O0O0OOOOOO0O = cv2.resize(O000OO00O000OO0OO, (512, 512))
            else:
                if OO00O00OOO0OOO000 < O00OOOO0OOO000000:
                    if O0OO0OOOO000OOOO0 > OO000OOO0O0O00O00:
                        O000OO00O000OO0OO = np.zeros((O0OO0OOOO000OOOO0, OO00O00OOO0OOO000, 3), np.uint8)
                        O000OO00O000OO0OO[:, :, :] = (255, 255, 255)
                        O000OO00O000OO0OO[abs(O00OOO00O0OO00OO0):abs(O00OOO00O0OO00OO0) + OO000OOO0O0O00O00, 0:OO00O00OOO0OOO000] = O0O0O0O0OO00O0O00[0:OO000OOO0O0O00O00, abs(OO0O0O000OO000OO0):abs(OO0O0O000OO000OO0) + OO00O00OOO0OOO000]
                        O0000O0O0OOOOOO0O = cv2.resize(O000OO00O000OO0OO, (512, 512))
                    if OO00O00OOO0OOO000 > O00OOOO0OOO000000:
                        if O0OO0OOOO000OOOO0 < OO000OOO0O0O00O00:
                            O000OO00O000OO0OO = np.zeros((O0OO0OOOO000OOOO0, OO00O00OOO0OOO000, 3), np.uint8)
                            O000OO00O000OO0OO[:, :, :] = (255, 255, 255)
                            O000OO00O000OO0OO[0:O0OO0OOOO000OOOO0, abs(OO0O0O000OO000OO0):abs(OO0O0O000OO000OO0) + O00OOOO0OOO000000] = O0O0O0O0OO00O0O00[abs(O00OOO00O0OO00OO0):abs(O00OOO00O0OO00OO0) + O0OO0OOOO000OOOO0, 0:O00OOOO0OOO000000]
                            O0000O0O0OOOOOO0O = cv2.resize(O000OO00O000OO0OO, (512,
                                                                               512))
        OO0OOOOOOO0OOO0OO._Transform__O00O00O0O0O00OO00 = Lomcellular(O0000O0O0OOOOOO0O)
        OO0OOOOOOO0OOO0OO._Transform__O00O00O0O0O00OO00.lasppppp.connect(OO0OOOOOOO0OOO0OO._Transform__OO000O0OO00000OOO)
        OO0OOOOOOO0OOO0OO._Transform__O00O00O0O0O00OO00.mmmmsksx.connect(OO0OOOOOOO0OOO0OO._Transform__OOOOO00OOO0000000)
        OO0OOOOOOO0OOO0OO._Transform__O00O00O0O0O00OO00.start()
        OO0OOOOOOO0OOO0OO._Transform__OOO00OO0OO0O0OO0O.hide()
        OO0OOOOOOO0OOO0OO._Transform__O00OOOOOOO00O0000.hide()
        OO0OOOOOOO0OOO0OO._Transform__OO0O00O0O0OOO0OOO.hide()
        OO0OOOOOOO0OOO0OO._Transform__O0O00OO0OOOO00OOO.hide()
        OO0OOOOOOO0OOO0OO._Transform__O000OOO0O0O0OOOO0.setText('\n \n \n \n \nLoading. Please be patient. \n \n The transformation can last from 30 seconds to a few minutes, depending on your computer.')
        OO0OOOOOOO0OOO0OO._Transform__OOO0O00OO000O0OO0 = QMovie('qtbin/loading.gif')
        OO0OOOOOOO0OOO0OO._Transform__OOOO0000O00O0O000 = QtWidgets.QLabel()
        OO0OOOOOOO0OOO0OO._Transform__OOOO0000O00O0O000.setMovie(OO0OOOOOOO0OOO0OO._Transform__OOO0O00OO000O0OO0)
        OO0OOOOOOO0OOO0OO._Transform__OOOO0000O00O0O000.setAlignment(QtCore.Qt.AlignCenter)
        OO0OOOOOOO0OOO0OO._Transform__OOO0OOOOOOOO00O0O.addWidget(OO0OOOOOOO0OOO0OO._Transform__OOOO0000O00O0O000)
        OO0OOOOOOO0OOO0OO._Transform__OOO0O00OO000O0OO0.start()

    def __OO000O0OO00000OOO(OOOO000OOOO00O0OO, O00OOOO000OO0000O):
        if getpreferences('transform') == 'no':
            setpreferences('transform', 'yes')
        OOOO000OOOO00O0OO._Transform__O0O0OO00O0OOOOO0O = Image.fromarray(cv2.cvtColor(O00OOOO000OO0000O, cv2.COLOR_BGR2RGB))
        O0OO000O00O000000 = BytesIO()
        OOOO000OOOO00O0OO._Transform__O0O0OO00O0OOOOO0O.save(O0OO000O00O000000, format='PNG')
        O0OO000O00O000000.seek(0)
        OO0OOOOO00O0OO000 = QImage()
        OO0OOOOO00O0OO000.loadFromData(O0OO000O00O000000.read())
        OOOO000OOOO00O0OO._Transform__OOO00OO0OO0O0OO0O.setImage(OO0OOOOO00O0OO000)
        OOOO000OOOO00O0OO._Transform__OOO00OO0OO0O0OO0O.zoomStack.append(QRectF(0, 0, 560, 560))
        OOOO000OOOO00O0OO._Transform__OOO00OO0OO0O0OO0O.updateViewer()
        OOOO000OOOO00O0OO._Transform__OOO00OO0OO0O0OO0O.show()
        OOOO000OOOO00O0OO._Transform__OO0O0OOO00OOOO0OO.setEnabled(True)
        OOOO000OOOO00O0OO._Transform__OOOO0000O00O0O000.hide()
        if OOOO000OOOO00O0OO._Transform__O000OO0OO000OO0O0 == [33, 33, 33]:
            OOOO000OOOO00O0OO._Transform__O000OOO0O0O0OOOO0.setText('Do you want to remove the <b>Watermarks</b> and be able to <b>export</b> the image in full resolution? Upgrade to <a href="https://www.deepnude.com/premium"> DeepNude Premium! </a>')
            OOOO000OOOO00O0OO._Transform__O000OOO0O0O0OOOO0.setOpenExternalLinks(True)
            OOOO000OOOO00O0OO._Transform__O00OOOOOOO00O0000.show()
            OOOO000OOOO00O0OO._Transform__O00OOOOOOO00O0000.setPixmap(QPixmap('qtbin/premium.jpg').scaledToWidth(500))
        else:
            OOOO000OOOO00O0OO._Transform__O000OOO0O0O0OOOO0.hide()
            OOOO000OOOO00O0OO._Transform__O00OOOOOOO00O0000.hide()
            OOOO000OOOO00O0OO._Transform__OO0O00O0O0OOO0OOO.show()
            OOOO000OOOO00O0OO._Transform__O0O00OO0OOOO00OOO.show()
        OOOO000OOOO00O0OO._Transform__OOOO00O0OOO00O000.hide()
        OOOO000OOOO00O0OO._Transform__OO0OO0O0OOO0OO0OO.show()

    def __OOOOO00OOO0000000(O0000O0O000O00O0O, OO0O0000OO00O0OOO):
        O0000O0O000O00O0O.error_dialog = QtWidgets.QErrorMessage()
        O0000O0O000O00O0O.error_dialog.showMessage('<p>This error occurred while transforming the image:</p><p><b>' + str(OO0O0000OO00O0OOO) + '</b></p> <p>Please retry, if the problem persist contact the support (support@deepnude.com).</p>')
        O0000O0O000O00O0O._Transform__OO0O0OOO00OOOO0OO.setEnabled(True)
        O0000O0O000O00O0O._Transform__O000OOO0O0O0OOOO0.hide()
        O0000O0O000O00O0O._Transform__OOO0O00OO000O0OO0.stop()

    def __OOOOOOOO00OOO00O0(O0O0OOO00O00000O0):
        if not hasattr(O0O0OOO00O00000O0, 'process_thread'):
            O0O0OOO00O00000O0.back_signal.emit()
        else:
            if not O0O0OOO00O00000O0._Transform__O00O00O0O0O00OO00.isRunning():
                O0O0OOO00O00000O0.back_signal.emit()

    def __O0000OOOO000OOOOO(O00OOOO0OO0OO00O0):
        OO00000OO0OOO0O0O = QtWidgets.QFileDialog.getSaveFileName(O00OOOO0OO0OO00O0, 'Select Image to Save', 'deepnude.png', 'PNG Image (*.png)')
        metadata = PngImagePlugin.PngInfo()
        metadata.add_text('crusr', getpreferences('email'))
        O00OOOO0OO0OO00O0._Transform__O0O0OO00O0OOOOO0O.save((OO00000OO0OOO0O0O[0]), 'PNG', pnginfo=metadata)
        O00OOOO0OO0OO00O0.back_signal.emit()


class Position(QtWidgets.QWidget):
    back_signal = QtCore.pyqtSignal()

    def __init__(O00OO0OO00OOO000O):
        QtWidgets.QWidget.__init__(O00OO0OO00OOO000O)
        O00OO0OO00OOO000O.setWindowTitle('DeepNude')
        O00OO0OO00OOO000O.setFixedSize(800, 800)
        O00OO0OO00OOO000O._Position__OOOOO0O000OOOO0OO = QtWidgets.QVBoxLayout()
        O00OO0OO00OOO000O._Position__OOO00O0O0OO0O0O0O = QtWidgets.QHBoxLayout()
        O00OO0OO00OOO000O._Position__OO00000OO0OO0000O = QtWidgets.QLabel()
        O00OO0OO00OOO000O._Position__OO00000OO0OO0000O.setText('Visit <a href="https://www.deepnude.com/premium"> www.deepnude.com/premium </a> to get your upgrade code.')
        O00OO0OO00OOO000O._Position__OO00000OO0OO0000O.setOpenExternalLinks(True)
        O00OO0OO00OOO000O._Position__O000O0OO0O00O0000 = QtWidgets.QLabel()
        O00OO0OO00OOO000O._Position__O000O0OO0O00O0000.setText('\n \nUpgrading require an internet connection. After that you could use DeepNude offline, without limitations and forever.')
        O00OO0OO00OOO000O._Position__O000O0OO0O00O0000.setWordWrap(True)
        O00OO0OO00OOO000O._Position__OOO0O00OO00OO000O = QtWidgets.QLineEdit()
        O00OO0OO00OOO000O._Position__OOO0O00OO00OO000O.setPlaceholderText('upgrade code')
        O00OO0OO00OOO000O._Position__O0OO0O000OO0OOOOO = QtWidgets.QLineEdit()
        O00OO0OO00OOO000O._Position__O0OO0O000OO0OOOOO.setPlaceholderText('email')
        O00OO0OO00OOO000O._Position__OOO0OOO0OOO0O0OOO = QtWidgets.QPushButton('Back')
        O00OO0OO00OOO000O._Position__OOO0OOO0OOO0O0OOO.clicked.connect(O00OO0OO00OOO000O._Position__OO0O000O000O000O0)
        O00OO0OO00OOO000O._Position__O00OO0OO00OO0O0O0 = QtWidgets.QPushButton('Send')
        O00OO0OO00OOO000O._Position__O00OO0OO00OO0O0O0.clicked.connect(O00OO0OO00OOO000O._Position__O00OOOOO00OO0O000)
        O00OO0OO00OOO000O._Position__O000OOO0OO0OOOO0O = QtWidgets.QLabel()
        O00OO0OO00OOO000O._Position__O000OOO0OO0OOOO0O.setStyleSheet(".QLabel {color: 'red';}")
        O00OO0OO00OOO000O._Position__O000OOO0OO0OOOO0O.setWordWrap(True)
        O00OO0OO00OOO000O._Position__O0OO0OO00O00OO000 = QtWidgets.QLabel()
        O00OO0OO00OOO000O._Position__O0OO0OO00O00OO000.setStyleSheet(".QLabel {color: 'green';}")
        O00OO0OO00OOO000O._Position__OOOOO0O000OOOO0OO.addStretch(1)
        O00OO0OO00OOO000O._Position__OOOOO0O000OOOO0OO.addWidget(O00OO0OO00OOO000O._Position__OO00000OO0OO0000O)
        O00OO0OO00OOO000O._Position__OOOOO0O000OOOO0OO.addWidget(O00OO0OO00OOO000O._Position__O000O0OO0O00O0000)
        O00OO0OO00OOO000O._Position__OOOOO0O000OOOO0OO.addStretch(2)
        O00OO0OO00OOO000O._Position__OOOOO0O000OOOO0OO.addWidget(O00OO0OO00OOO000O._Position__OOO0O00OO00OO000O)
        O00OO0OO00OOO000O._Position__OOOOO0O000OOOO0OO.addWidget(O00OO0OO00OOO000O._Position__O0OO0O000OO0OOOOO)
        O00OO0OO00OOO000O._Position__OOO00O0O0OO0O0O0O.addWidget(O00OO0OO00OOO000O._Position__OOO0OOO0OOO0O0OOO)
        O00OO0OO00OOO000O._Position__OOO00O0O0OO0O0O0O.addWidget(O00OO0OO00OOO000O._Position__O00OO0OO00OO0O0O0)
        O00OO0OO00OOO000O._Position__OOOOO0O000OOOO0OO.addWidget(O00OO0OO00OOO000O._Position__O000OOO0OO0OOOO0O)
        O00OO0OO00OOO000O._Position__OOOOO0O000OOOO0OO.addWidget(O00OO0OO00OOO000O._Position__O0OO0OO00O00OO000)
        O00OO0OO00OOO000O._Position__OOOOO0O000OOOO0OO.addStretch(3)
        O00OO0OO00OOO000O._Position__OOOOO0O000OOOO0OO.addLayout(O00OO0OO00OOO000O._Position__OOO00O0O0OO0O0O0O)
        O00OO0OO00OOO000O.setLayout(O00OO0OO00OOO000O._Position__OOOOO0O000OOOO0OO)

    def __OO0O000O000O000O0(O0OO00OO00O000OOO):
        O0OO00OO00O000OOO.back_signal.emit()

    def __O00OOOOO00OO0O000(O0OO0OO0OO0OOOOOO):
        O0OOO00O0OOO0O000 = O0OO0OO0OO0OOOOOO._Position__OOO0O00OO00OO000O.text()
        O0O000OOO00000000 = O0OO0OO0OO0OOOOOO._Position__O0OO0O000OO0OOOOO.text()
        if O0O000OOO00000000 and O0OOO00O0OOO0O000:
            O00OO0OOOOO00O00O = newcolor(O0O000OOO00000000, O0OOO00O0OOO0O000)
            if O00OO0OOOOO00O00O == 255:
                O0OO0OO0OO0OOOOOO._Position__O000OOO0OO0OOOO0O.hide()
                O0OO0OO0OO0OOOOOO._Position__O0OO0OO00O00OO000.setText('Upgrading was succesfull! To make it active, please close and reopen the app.')
                O0OO0OO0OO0OOOOOO._Position__OOO0OOO0OOO0O0OOO.setEnabled(False)
                O0OO0OO0OO0OOOOOO._Position__O00OO0OO00OO0O0O0.setEnabled(False)
                O0OO0OO0OO0OOOOOO._Position__OOO0OOO0OOO0O0OOO.setStyleSheet('QPushButton:disabled {background-color: #acacac;}')
                O0OO0OO0OO0OOOOOO._Position__O00OO0OO00OO0O0O0.setStyleSheet('QPushButton:disabled {background-color: #acacac;}')
            else:
                if O00OO0OOOOO00O00O == 99:
                    O0OO0OO0OO0OOOOOO._Position__O000OOO0OO0OOOO0O.setText('Error during license request. Make sure you are connected to the internet. If the problem persist please contact the support: support@deepnude.com</p>')
                else:
                    if O00OO0OOOOO00O00O == 100:
                        O0OO0OO0OO0OOOOOO._Position__O000OOO0OO0OOOO0O.setText('Upgrade Code or Email are missing or wrong.')
                    else:
                        if O00OO0OOOOO00O00O == 101:
                            O0OO0OO0OO0OOOOOO._Position__O000OOO0OO0OOOO0O.setText('Server Error 101, Please contact the support: support@deepnude.com')
                        else:
                            if O00OO0OOOOO00O00O == 102:
                                O0OO0OO0OO0OOOOOO._Position__O000OOO0OO0OOOO0O.setText('You upgrade code is wrong. Please retry.')
                            else:
                                if O00OO0OOOOO00O00O == 103:
                                    O0OO0OO0OO0OOOOOO._Position__O000OOO0OO0OOOO0O.setText('Your email is wrong. Please retry.')
                                else:
                                    if O00OO0OOOOO00O00O == 104:
                                        O0OO0OO0OO0OOOOOO._Position__O000OOO0OO0OOOO0O.setText('This upgrade code has been already used. You can use it only once.')
                                    else:
                                        if O00OO0OOOOO00O00O == 110:
                                            O0OO0OO0OO0OOOOOO._Position__O000OOO0OO0OOOO0O.setText('Unknow error. Please retry. If the problem persist please contact the support: support@deepnude.com')


class Library(QtWidgets.QWidget):
    back_signal = QtCore.pyqtSignal()

    def __init__(OOOOO00O0O00OO0O0):
        QtWidgets.QWidget.__init__(OOOOO00O0O00OO0O0)
        OOOOO00O0O00OO0O0.setWindowTitle('DeepNude')
        OOOOO00O0O00OO0O0.setFixedSize(800, 800)
        OOOOO00O0O00OO0O0._Library__O000O00OOOO00OO00 = 0
        OOOOO00O0O00OO0O0._Library__OO0OO0OOOO0O0OOO0 = QtWidgets.QVBoxLayout()
        OOOOO00O0O00OO0O0._Library__OO00O00000O0OOOOO = QtWidgets.QLabel('Welcome to DeepNude! \n \nWe are almost there. To complete the setup I need to download some missing libraries. Make sure you have a good internet connection and click on the download button. \n \nYou have to do this only once.')
        OOOOO00O0O00OO0O0._Library__OO00O00000O0OOOOO.setWordWrap(True)
        OOOOO00O0O00OO0O0._Library__imginvitation = QtWidgets.QLabel()
        OOOOO00O0O00OO0O0._Library__imginvitation.setPixmap(QPixmap('qtbin/invitation.png').scaledToWidth(800))
        OOOOO00O0O00OO0O0._Library__imginvitation.setAlignment(QtCore.Qt.AlignCenter)
        OOOOO00O0O00OO0O0._Library__imginvitation.show()
        OOOOO00O0O00OO0O0._Library__OOO00O000O00OOOOO = QtWidgets.QProgressBar(OOOOO00O0O00OO0O0)
        OOOOO00O0O00OO0O0._Library__OOO00O000O00OOOOO.setValue(0)
        OOOOO00O0O00OO0O0._Library__OOOO0OO000OO00O0O = QtWidgets.QProgressBar(OOOOO00O0O00OO0O0)
        OOOOO00O0O00OO0O0._Library__OOOO0OO000OO00O0O.setValue(0)
        OOOOO00O0O00OO0O0._Library__OOOOO0000000OOOOO = QtWidgets.QProgressBar(OOOOO00O0O00OO0O0)
        OOOOO00O0O00OO0O0._Library__OOOOO0000000OOOOO.setValue(0)
        OOOOO00O0O00OO0O0._Library__O000O0O0OOOO00O0O = QtWidgets.QPushButton('Start Download (2.1 GB)')
        OOOOO00O0O00OO0O0._Library__O000O0O0OOOO00O0O.clicked.connect(OOOOO00O0O00OO0O0._Library__O0OO0000OOOO00OO0)
        OOOOO00O0O00OO0O0._Library__OOOO00OOO000OOO00 = QtWidgets.QPushButton('Continue')
        OOOOO00O0O00OO0O0._Library__OOOO00OOO000OOO00.clicked.connect(OOOOO00O0O00OO0O0._Library__O00O0OOOOOOOO0O0O)
        OOOOO00O0O00OO0O0._Library__OOOO00OOO000OOO00.hide()
        OOOOO00O0O00OO0O0._Library__OO0OO0OOOO0O0OOO0.addWidget(OOOOO00O0O00OO0O0._Library__imginvitation)
        OOOOO00O0O00OO0O0._Library__OO0OO0OOOO0O0OOO0.addStretch(1)
        OOOOO00O0O00OO0O0._Library__OO0OO0OOOO0O0OOO0.addWidget(OOOOO00O0O00OO0O0._Library__OO00O00000O0OOOOO)
        OOOOO00O0O00OO0O0._Library__OO0OO0OOOO0O0OOO0.addStretch(2)
        OOOOO00O0O00OO0O0._Library__OO0OO0OOOO0O0OOO0.addWidget(OOOOO00O0O00OO0O0._Library__OOO00O000O00OOOOO)
        OOOOO00O0O00OO0O0._Library__OO0OO0OOOO0O0OOO0.addWidget(OOOOO00O0O00OO0O0._Library__OOOO0OO000OO00O0O)
        OOOOO00O0O00OO0O0._Library__OO0OO0OOOO0O0OOO0.addWidget(OOOOO00O0O00OO0O0._Library__OOOOO0000000OOOOO)
        OOOOO00O0O00OO0O0._Library__OO0OO0OOOO0O0OOO0.addStretch(3)
        OOOOO00O0O00OO0O0._Library__OO0OO0OOOO0O0OOO0.addWidget(OOOOO00O0O00OO0O0._Library__O000O0O0OOOO00O0O)
        OOOOO00O0O00OO0O0._Library__OO0OO0OOOO0O0OOO0.addWidget(OOOOO00O0O00OO0O0._Library__OOOO00OOO000OOO00)
        OOOOO00O0O00OO0O0.setLayout(OOOOO00O0O00OO0O0._Library__OO0OO0OOOO0O0OOO0)

    def __O0OO0000OOOO00OO0(O0O00OOO00O000O0O):
        O0O00OOO00O000O0O._Library__O000O0O0OOOO00O0O.setStyleSheet('QPushButton:disabled {background-color: #acacac;}')
        O0O00OOO00O000O0O._Library__O000O0O0OOOO00O0O.setEnabled(False)
        if not os.path.exists('pyqtlib'):
            os.makedirs('pyqtlib')
        O0O00OOO00O000O0O._Library__O0O0OO0O0OO0OO0O0 = Lomcella2('cm.lib')
        O0O00OOO00O000O0O._Library__O0O0OO0O0OO0OO0O0.pqweiiiqwei.connect(O0O00OOO00O000O0O._Library__OO0OO00OO0O00OOO0)
        O0O00OOO00O000O0O._Library__O0O0OO0O0OO0OO0O0.podnwdolpoo.connect(O0O00OOO00O000O0O._Library__OOOO00O000O00O00O)
        O0O00OOO00O000O0O._Library__O0O0OO0O0OO0OO0O0.podnwdownwd.connect(O0O00OOO00O000O0O._Library__O0000000OO0OO00OO)
        O0O00OOO00O000O0O._Library__O0O0OO0O0OO0OO0O0.start()
        O0O00OOO00O000O0O._Library__OOO0OOOOO000OO0OO = Lomcella2('mm.lib')
        O0O00OOO00O000O0O._Library__OOO0OOOOO000OO0OO.pqweiiiqwei.connect(O0O00OOO00O000O0O._Library__O000OO0OO0OOOOO00)
        O0O00OOO00O000O0O._Library__OOO0OOOOO000OO0OO.podnwdolpoo.connect(O0O00OOO00O000O0O._Library__OOOO00O000O00O00O)
        O0O00OOO00O000O0O._Library__OOO0OOOOO000OO0OO.podnwdownwd.connect(O0O00OOO00O000O0O._Library__O0000000OO0OO00OO)
        O0O00OOO00O000O0O._Library__OOO0OOOOO000OO0OO.start()
        O0O00OOO00O000O0O._Library__O00O00O0O0OOOO0OO = Lomcella2('mn.lib')
        O0O00OOO00O000O0O._Library__O00O00O0O0OOOO0OO.pqweiiiqwei.connect(O0O00OOO00O000O0O._Library__O0000000OOO0O0OO0)
        O0O00OOO00O000O0O._Library__O00O00O0O0OOOO0OO.podnwdolpoo.connect(O0O00OOO00O000O0O._Library__OOOO00O000O00O00O)
        O0O00OOO00O000O0O._Library__O00O00O0O0OOOO0OO.podnwdownwd.connect(O0O00OOO00O000O0O._Library__O0000000OO0OO00OO)
        O0O00OOO00O000O0O._Library__O00O00O0O0OOOO0OO.start()

    def __OO0OO00OO0O00OOO0(O00OOOO0OOOO000OO, OO0OOO00O0000O0O0):
        O00OOOO0OOOO000OO._Library__OOO00O000O00OOOOO.setValue(OO0OOO00O0000O0O0)

    def __O000OO0OO0OOOOO00(OO00000000O00O000, OOOO0000O00000OOO):
        OO00000000O00O000._Library__OOOO0OO000OO00O0O.setValue(OOOO0000O00000OOO)

    def __O0000000OOO0O0OO0(OOO00OO0000000OOO, OO00OOO0O000OO0O0):
        OOO00OO0000000OOO._Library__OOOOO0000000OOOOO.setValue(OO00OOO0O000OO0O0)

    def __OOOO00O000O00O00O(O0O00OOOOOOOO000O):
        O0O00OOOOOOOO000O._Library__O000O00OOOO00OO00 += 1
        if O0O00OOOOOOOO000O._Library__O000O00OOOO00OO00 == 3:
            setpreferences('library', 'yes')
            O0O00OOOOOOOO000O._Library__OO00O00000O0OOOOO.setText('Download Completed! \n \n Click on Continue.')
            O0O00OOOOOOOO000O._Library__O000O0O0OOOO00O0O.hide()
            O0O00OOOOOOOO000O._Library__OOOO00OOO000OOO00.show()

    def __O0000000OO0OO00OO(OOOO0O00O0O00O000, OO0OO0O0OOO00O0OO):
        OOOO0O00O0O00O000.error_dialog = QtWidgets.QErrorMessage()
        OOOO0O00O0O00O000.error_dialog.showMessage('<p>This error occurred while downloading library files:</p><p><b>' + str(OO0OO0O0OOO00O0OO) + '</b></p> <p> To continue, close the app, make sure you have a good connection and try again. If the problem persist contact the support (support@deepnude.com).</p>')
        OOOO0O00O0O00O000._Library__OOO00O000O00OOOOO.hide()
        OOOO0O00O0O00O000._Library__OOOO0OO000OO00O0O.hide()
        OOOO0O00O0O00O000._Library__OOOOO0000000OOOOO.hide()
        OOOO0O00O0O00O000._Library__O000O0O0OOOO00O0O.hide()
        OOOO0O00O0O00O000._Library__OOOO00OOO000OOO00.hide()

    def __O00O0OOOOOOOO0O0O(OO000O00OO0OO0O0O):
        OO000O00OO0OO0O0O.back_signal.emit()


class Terms(QtWidgets.QWidget):
    accept_signal = QtCore.pyqtSignal()

    def __init__(O0O00OO00000OO000):
        QtWidgets.QWidget.__init__(O0O00OO00000OO000)
        O0O00OO00000OO000.setWindowTitle('DeepNude')
        O0O00OO00000OO000.setFixedSize(800, 800)
        O0O0O0O00000OOOO0 = open('terms.html', 'r', encoding='utf8')
        O0O00OO00000OO000._Terms__OO000O0OO000OOOO0 = QtWidgets.QVBoxLayout()
        O0O00OO00000OO000._Terms__OOO000O0000OOO00O = QtWidgets.QTextEdit(O0O0O0O00000OOOO0.read())
        O0O00OO00000OO000._Terms__OOO000O0000OOO00O.setReadOnly(True)
        O0O00OO00000OO000._Terms__OOOOOO0OO00O0OO00 = QtWidgets.QPushButton('I am of age and I accept the Terms')
        O0O00OO00000OO000._Terms__OOOOOO0OO00O0OO00.clicked.connect(O0O00OO00000OO000.acceptbutton_clicked)
        O0O00OO00000OO000._Terms__OO000O0OO000OOOO0.addWidget(O0O00OO00000OO000._Terms__OOO000O0000OOO00O)
        O0O00OO00000OO000._Terms__OO000O0OO000OOOO0.addWidget(O0O00OO00000OO000._Terms__OOOOOO0OO00O0OO00)
        O0O00OO00000OO000.setLayout(O0O00OO00000OO000._Terms__OO000O0OO000OOOO0)

    def acceptbutton_clicked(O0000O0O00OOO0000):
        setpreferences('init', 'yes')
        O0000O0O00OOO0000.accept_signal.emit()


class Controller:

    def __init__(OOOO00000O0O0OOOO):
        OOOO00000O0O0OOOO._Controller__O00OO0OO00O00O000 = checkcolor()

    def show_library(O00O00O00OOO0OO00):
        if hasattr(O00O00O00OOO0OO00, 'terms'):
            O00O00O00OOO0OO00.terms.hide()
        O00O00O00OOO0OO00.library = Library()
        O00O00O00OOO0OO00.library.back_signal.connect(O00O00O00OOO0OO00.show_home)
        O00O00O00OOO0OO00.library.show()

    def show_terms(O00O0OO00000O0O0O):
        O00O0OO00000O0O0O.terms = Terms()
        O00O0OO00000O0O0O.terms.accept_signal.connect(O00O0OO00000O0O0O.show_library)
        O00O0OO00000O0O0O.terms.show()

    def show_home(O0O000O0O0OOOO0O0):
        if hasattr(O0O000O0O0OOOO0O0, 'terms'):
            O0O000O0O0OOOO0O0.terms.hide()
        if hasattr(O0O000O0O0OOOO0O0, 'library'):
            O0O000O0O0OOOO0O0.library.hide()
        if hasattr(O0O000O0O0OOOO0O0, 'position'):
            O0O000O0O0OOOO0O0.position.hide()
        if hasattr(O0O000O0O0OOOO0O0, 'transform'):
            O0O000O0O0OOOO0O0.transform.hide()
        O0O000O0O0OOOO0O0.home = Home(O0O000O0O0OOOO0O0._Controller__O00OO0OO00O00O000)
        O0O000O0O0OOOO0O0.home.home_activate_signal.connect(O0O000O0O0OOOO0O0._Controller__OOO00O0OO0OO0O000)
        O0O000O0O0OOOO0O0.home.home_upload_signal.connect(O0O000O0O0OOOO0O0._Controller__O00O00O0000000O0O)
        O0O000O0O0OOOO0O0.home.show()

    def __OOO00O0OO0OO0O000(OO0OOO0000O0OOO00):
        OO0OOO0000O0OOO00.home.hide()
        OO0OOO0000O0OOO00.position = Position()
        OO0OOO0000O0OOO00.position.back_signal.connect(OO0OOO0000O0OOO00.show_home)
        OO0OOO0000O0OOO00.position.show()

    def __O00O00O0000000O0O(O0O0O000OOOO0OOOO):
        O00OOO0O000O0O0OO, O0OO0OOOOO0O00O0O = QtWidgets.QFileDialog.getOpenFileName(None, 'Open image file...')
        if O00OOO0O000O0O0OO:
            if os.path.isfile(O00OOO0O000O0O0OO):
                if O00OOO0O000O0O0OO.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp',
                                                       '.gif')):
                    if not QImage(O00OOO0O000O0O0OO).isNull():
                        O0O0O000OOOO0OOOO.home.hide()
                        O0O0O000OOOO0OOOO.transform = Transform(O0O0O000OOOO0OOOO._Controller__O00OO0OO00O00O000, O00OOO0O000O0O0OO)
                        O0O0O000OOOO0OOOO.transform.back_signal.connect(O0O0O000OOOO0OOOO.show_home)
                        O0O0O000OOOO0OOOO.transform.show()
                    else:
                        O0O0O000OOOO0OOOO.error_dialog = QtWidgets.QErrorMessage()
                        O0O0O000OOOO0OOOO.error_dialog.showMessage('<p>Error. The image is not valid. Please use image with 24 bit color depth.</p>')
                O0O0O000OOOO0OOOO.error_dialog = QtWidgets.QErrorMessage()
                O0O0O000OOOO0OOOO.error_dialog.showMessage('<p>Error. The file is not an image. Please upload an image [png,jpg,jpeg,bmp,gif].</p>')


class Lomcellular(QtCore.QThread):
    lasppppp = QtCore.pyqtSignal(type(np.zeros((512, 512, 3), np.uint8)))
    mmmmsksx = QtCore.pyqtSignal(Exception)

    def __init__(OO0OOO0OOO0OOOO00, OOO000O0O0O00OOOO, OOO0OOOOO000O0000=None):
        super(Lomcellular, OO0OOO0OOO0OOOO00).__init__(OOO0OOOOO000O0000)
        OO0OOO0OOO0OOOO00._Lomcellular__O0OO00O00OOOOO0O0 = OOO000O0O0O00OOOO

    def run(OO00O0O000O0O000O):
        try:
            O0O00O0O0OOO0O00O = paddingresize(OO00O0O000O0O000O._Lomcellular__O0OO00O00OOOOO0O0)
            if O0O00O0O0OOO0O00O is None:
                OO00O0O000O0O000O.mmmmsksx.emit(Exception('The uploaded image is not suitable. Try again with another image.'))
            else:
                OO00O0O000O0O000O.lasppppp.emit(O0O00O0O0OOO0O00O)
        except Exception as OOO0O0OO0OO0O00OO:
            OO00O0O000O0O000O.mmmmsksx.emit(OOO0O0OO0OO0O00OO)


class Lomcella2(QtCore.QThread):
    pqweiiiqwei = QtCore.pyqtSignal(int)
    podnwdolpoo = QtCore.pyqtSignal()
    podnwdownwd = QtCore.pyqtSignal(Exception)

    def __init__(OOOOO00OO0O0OOOOO, O000O000OOOO0O0O0, OOO000O0OOO000O00=None):
        super(Lomcella2, OOOOO00OO0O0OOOOO).__init__(OOO000O0OOO000O00)
        OOOOO00OO0O0OOOOO._Lomcella2__O000OO0O00O0OO0O0 = O000O000OOOO0O0O0

    def run(OO0O0O0OOO000OO00):

        def OO0000OO0OOOO0OOO(OOOO0O0O0OOOO00OO, O0O0O00OO0OO0OOO0, O0OOOO0O00O0OOO0O):
            O00O000O0OOO0OO0O = OOOO0O0O0OOOO00OO * O0O0O00OO0OO0OOO0
            if O00O000O0OOO0OO0O < O0OOOO0O00O0OOO0O:
                O000OO00000O0O00O = O00O000O0OOO0OO0O / O0OOOO0O00O0OOO0O * 100
                OO0O0O0OOO000OO00.pqweiiiqwei.emit(O000OO00000O0O00O)
            else:
                OO0O0O0OOO000OO00.pqweiiiqwei.emit(100)

        OO0O0O0OOO000OO00.pqweiiiqwei.emit(0)
        OO0OOO0OO000O0O0O = 'https://s3-eu-west-1.amazonaws.com/deepnudepublicmodels/' + OO0O0O0OOO000OO00._Lomcella2__O000OO0O00O0OO0O0
        try:
            urllib.request.urlretrieve(OO0OOO0OO000O0O0O, 'pyqtlib/' + OO0O0O0OOO000OO00._Lomcella2__O000OO0O00O0OO0O0, OO0000OO0OOOO0OOO)
            OO0O0O0OOO000OO00.podnwdolpoo.emit()
        except Exception as OOO00000O0OO0OOOO:
            OO0O0O0OOO000OO00.podnwdownwd.emit(OOO00000O0OO0OOOO)


def main():
    O0O00OO00OOO0O0O0 = QtWidgets.QApplication(sys.argv)
    O0O00OO00OOO0O0O0.setStyleSheet('\n\t\t.QLabel {\n\t\t\tfont-size: 22px;\n\t\t\tcolor: #727272;\n\t\t\ttext-align: justify;\n\t\t}\n\t\t.QCheckBox {\n\t\t\tfont-size: 22px;\n\t\t\tcolor: #727272;\n\t\t}\n\t\t.QLineEdit {\n\t\t\tfont-size: 20px;\n\t\t\theight: 50px;\n\t\t\tpadding: 10px;\n\t\t\tbackground-color: white;\n\t\t}\n\t\t.QPushButton {\n\t\t\theight: 50px;\n\t\t\tpadding: 10px;\n\t\t\tfont-size: 20px;\n\t\t\tborder-radius: 0;\n\t\t\tcolor: white;\n\t\t\tbackground-color: #d35050;\n\t\t}\n\t\tQWidget {\n\t\t\tbackground: rgb(244, 244, 244);\n\t\t}\n\t\tQGraphicsView {\n\t\t\tborder-style: solid;\n\t\t\tborder-width: 6px;\n\t\t\tborder-color: gray;\n\t\t}\n\t\t')
    OO00000O0O00O0O00 = Controller()
    if getpreferences('init') == 'yes':
        if getpreferences('library') == 'yes':
            OO00000O0O00O0O00.show_home()
        else:
            OO00000O0O00O0O00.show_library()
    else:
        OO00000O0O00O0O00.show_terms()
    sys.exit(O0O00OO00OOO0O0O0.exec_())


if __name__ == '__main__':
    multiprocessing.freeze_support()
    main()