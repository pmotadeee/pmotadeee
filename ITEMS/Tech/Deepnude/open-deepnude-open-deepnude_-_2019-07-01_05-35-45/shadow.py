# reverse engineered from shadow.pyd
trueshadow_data = [
    b'\x88\x88\x88\nl\xfc\x9dF\xf8',
    b'\x00\x00H\x00Ntq@Q',
    b'utils\n_re',
    b'\x80\x02\x8a\nl\xfc\x9cF\xf9',
    b'legits\n_re',
    b'\xff\xffH\x00Ntq@Q',
    b'\x89"\x8f\nl\xfc\x9cF\xf9',
    b'register\n_re',
    b'\x99\x99H\x00Ntq@Q'
]

def trueshadow(i):
    return trueshadow_data[i]
