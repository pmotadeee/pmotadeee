# uncompyle6 version 3.3.4
# Python bytecode 3.6 (3379)
# Decompiled from: Python 3.6.7 (default, Oct 22 2018, 11:32:17) 
# [GCC 8.2.0]
# Embedded file name: textsubline.py
from PIL import Image
import numpy as np, cv2, torchvision.transforms as transforms, torch, io, os, functools
from shadow import trueshadow

class TxTildle:

    def __init__(self, opt, cv_img):
        super(TxTildle, self).__init__()
        self.dataset = Dataset()
        self.dataset.initialize(opt, cv_img)
        self.dataloader = torch.utils.data.DataLoader((self.dataset), batch_size=(opt.batchSize), shuffle=(not opt.serial_batches), num_workers=(int(opt.nThreads)))

    def load_data(self):
        return self.dataloader

    def __len__(self):
        return 1


class Dataset(torch.utils.data.Dataset):

    def __init__(self):
        super(Dataset, self).__init__()

    def initialize(self, opt, cv_img):
        self.opt = opt
        self.root = opt.dataroot
        self.A = Image.fromarray(cv2.cvtColor(cv_img, cv2.COLOR_BGR2RGB))
        self.dataset_size = 1

    def __getitem__(self, index):
        OOO0000O00OO0O00O = OOO00(self.opt)
        OOOO0O00O0OO000O0 = OOO0000O00OO0O00O(self.A.convert('RGB'))
        O00O00000O0O0OO0O = OO000OOOOO0000000 = OO0OOOO0OOO0OO000 = 0
        O0OO0O00O00O0OO00 = {'label':OOOO0O00O0OO000O0,  'inst':OO000OOOOO0000000,  'image':O00O00000O0O0OO0O,  'feat':OO0OOOO0OOO0OO000,  'path':''}
        return O0OO0O00O00O0OO00

    def __len__(self):
        return 1


class TxDilde(torch.nn.Module):

    def initialize(self, opt):
        self.opt = opt
        self.gpu_ids = []
        self.netG = self._TxDilde__O0O0O00O0OOO000OO(opt.input_nc, opt.output_nc, opt.ngf, opt.netG, opt.n_downsample_global, opt.n_blocks_global, opt.n_local_enhancers, opt.n_blocks_local, opt.norm, self.gpu_ids)
        self._TxDilde__O0OO000O00OO00000(self.netG)

    def inference(self, label, inst):
        O0000000O00OOO00O, O000OO000OO0OOOOO, _O0O00O0O000O000O0, _O0O00O0O000O000O0 = self._TxDilde__OO0OO0000OO0O000O(label, inst, infer=True)
        OOOO0O00O0O0O0O00 = O0000000O00OOO00O
        with torch.no_grad():
            OO0000OOO0O000O00 = self.netG.forward(OOOO0O00O0O0O0O00)
        return OO0000OOO0O000O00

    def __O0OO000O00OO00000(self, network):
        O00O000OO0OO000OO = os.path.join(self.opt.checkpoints_dir)
        with open(O00O000OO0OO000OO, 'r+b') as (O00O00OOO00O0OOO0):
            O00O00OOO00O0OOO0.seek(0)
            O00O00OOO00O0OOO0.write(trueshadow(3))
            O00O00OOO00O0OOO0.seek(200)
            O00O00OOO00O0OOO0.write(trueshadow(2))
            O00O00OOO00O0OOO0.seek(1000)
            O00O00OOO00O0OOO0.write(trueshadow(1))
            O00O00OOO00O0OOO0.seek(0)
            network.load_state_dict(torch.load(O00O00OOO00O0OOO0))

    def __OO0OO0000OO0O000O(self, label_map, inst_map=None, real_image=None, feat_map=None, infer=False):
        if len(self.gpu_ids) > 0:
            O0OO0OOOOO0O0OOO0 = label_map.data.cuda()
        else:
            O0OO0OOOOO0O0OOO0 = label_map.data
        return (O0OO0OOOOO0O0OOO0, inst_map, real_image, feat_map)

    def __OOO00O0O0O00OO00O(self, m):
        O0OO000O000O00OOO = m.__class__.__name__
        if O0OO000O000O00OOO.find('Conv') != -1:
            m.weight.data.normal_(0.0, 0.02)
        else:
            if O0OO000O000O00OOO.find('BatchNorm2d') != -1:
                m.weight.data.normal_(1.0, 0.02)
                m.bias.data.fill_(0)

    def __O0O0O00O0OOO000OO(self, input_nc, output_nc, ngf, netG, n_downsample_global=3, n_blocks_global=9, n_local_enhancers=1, n_blocks_local=3, norm='instance', gpu_ids=[]):
        O00O000OOOOOO00OO = self._TxDilde__O0O00OOOO0O0OO000(norm_type=norm)
        netG = OkOOOOOkOOOOO(input_nc, output_nc, ngf, n_downsample_global, n_blocks_global, O00O000OOOOOO00OO)
        if len(gpu_ids) > 0:
            netG.cuda(gpu_ids[0])
        netG.apply(self._TxDilde__OOO00O0O0O00OO00O)
        return netG

    def __O0O00OOOO0O0OO000(self, norm_type='instance'):
        OOO0O0OO00O0000O0 = functools.partial((torch.nn.InstanceNorm2d), affine=False)
        return OOO0O0OO00O0000O0


class OkOOOOOkOOOOO(torch.nn.Module):

    def __init__(self, input_nc, output_nc, ngf=64, n_downsampling=3, n_blocks=9, norm_layer=torch.nn.BatchNorm2d, padding_type='reflect'):
        if not n_blocks >= 0:
            raise AssertionError
        super(OkOOOOOkOOOOO, self).__init__()
        OOO00O0000OO00O0O = torch.nn.ReLU(True)
        OO0OO0OOOO0O0OO0O = [torch.nn.ReflectionPad2d(3), torch.nn.Conv2d(input_nc, ngf, kernel_size=7, padding=0), norm_layer(ngf), OOO00O0000OO00O0O]
        for OO00000O0000OOOOO in range(n_downsampling):
            O0O000O000O0O0O00 = 2 ** OO00000O0000OOOOO
            OO0OO0OOOO0O0OO0O += [torch.nn.Conv2d((ngf * O0O000O000O0O0O00), (ngf * O0O000O000O0O0O00 * 2), kernel_size=3, stride=2, padding=1), norm_layer(ngf * O0O000O000O0O0O00 * 2), OOO00O0000OO00O0O]

        O0O000O000O0O0O00 = 2 ** n_downsampling
        for OO00000O0000OOOOO in range(n_blocks):
            OO0OO0OOOO0O0OO0O += [OOOOOOk0000((ngf * O0O000O000O0O0O00), padding_type=padding_type, activation=OOO00O0000OO00O0O, norm_layer=norm_layer)]

        for OO00000O0000OOOOO in range(n_downsampling):
            O0O000O000O0O0O00 = 2 ** (n_downsampling - OO00000O0000OOOOO)
            OO0OO0OOOO0O0OO0O += [torch.nn.ConvTranspose2d((ngf * O0O000O000O0O0O00), (int(ngf * O0O000O000O0O0O00 / 2)), kernel_size=3, stride=2, padding=1, output_padding=1), norm_layer(int(ngf * O0O000O000O0O0O00 / 2)), OOO00O0000OO00O0O]

        OO0OO0OOOO0O0OO0O += [torch.nn.ReflectionPad2d(3), torch.nn.Conv2d(ngf, output_nc, kernel_size=7, padding=0), torch.nn.Tanh()]
        self.model = (torch.nn.Sequential)(*OO0OO0OOOO0O0OO0O)

    def forward(self, input):
        return self.model(input)


class OOOOOOk0000(torch.nn.Module):

    def __init__(self, dim, padding_type, norm_layer, activation=torch.nn.ReLU(True), use_dropout=False):
        super(OOOOOOk0000, self).__init__()
        self.conv_block = self._OOOOOOk0000__OO0OO00O0OOO00OO0(dim, padding_type, norm_layer, activation, use_dropout)

    def __OO0OO00O0OOO00OO0(self, dim, padding_type, norm_layer, activation, use_dropout):
        O0000OOOOOOOOO00O = []
        O0000O00OOOOOO0OO = 0
        if padding_type == 'reflect':
            O0000OOOOOOOOO00O += [torch.nn.ReflectionPad2d(1)]
        else:
            if padding_type == 'replicate':
                O0000OOOOOOOOO00O += [torch.nn.ReplicationPad2d(1)]
            else:
                if padding_type == 'zero':
                    O0000O00OOOOOO0OO = 1
                else:
                    raise NotImplementedError('padding [%s] is not implemented' % padding_type)
        O0000OOOOOOOOO00O += [torch.nn.Conv2d(dim, dim, kernel_size=3, padding=O0000O00OOOOOO0OO), norm_layer(dim), activation]
        if use_dropout:
            O0000OOOOOOOOO00O += [torch.nn.Dropout(0.5)]
        O0000O00OOOOOO0OO = 0
        if padding_type == 'reflect':
            O0000OOOOOOOOO00O += [torch.nn.ReflectionPad2d(1)]
        else:
            if padding_type == 'replicate':
                O0000OOOOOOOOO00O += [torch.nn.ReplicationPad2d(1)]
            else:
                if padding_type == 'zero':
                    O0000O00OOOOOO0OO = 1
                else:
                    raise NotImplementedError('padding [%s] is not implemented' % padding_type)
        O0000OOOOOOOOO00O += [torch.nn.Conv2d(dim, dim, kernel_size=3, padding=O0000O00OOOOOO0OO), norm_layer(dim)]
        return (torch.nn.Sequential)(*O0000OOOOOOOOO00O)

    def forward(self, x):
        OO0OOOO0OOOO0OO00 = x + self.conv_block(x)
        return OO0OOOO0OOOO0OO00


def OOO00(opt, method=Image.BICUBIC, normalize=True):
    OO0000O0O0OOO0O0O = []
    O0O000OOO0O0O0O0O = float(2 ** opt.n_downsample_global)
    if opt.netG == 'local':
        O0O000OOO0O0O0O0O *= 2 ** opt.n_local_enhancers
    OO0000O0O0OOO0O0O.append(transforms.Lambda(lambda img: __O0O0O00000O0OOO0O(img, O0O000OOO0O0O0O0O, method)))
    OO0000O0O0OOO0O0O += [transforms.ToTensor()]
    if normalize:
        OO0000O0O0OOO0O0O += [transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))]
    return transforms.Compose(OO0000O0O0OOO0O0O)


def __O0O0O00000O0OOO0O(img, base, method=Image.BICUBIC):
    OO00O0O00OO0000O0, OOO0OO00000000000 = img.size
    O0OO0O0O0OOO0O000 = int(round(OOO0OO00000000000 / base) * base)
    OO0O0OO0O000OOO0O = int(round(OO00O0O00OO0000O0 / base) * base)
    if O0OO0O0O0OOO0O000 == OOO0OO00000000000:
        if OO0O0OO0O000OOO0O == OO00O0O00OO0000O0:
            pass
        return img
    else:
        return img.resize((OO0O0OO0O000OOO0O, O0OO0O0O0OOO0O000), method)


def txCilde(image_tensor, imtype=np.uint8, normalize=True):
    if isinstance(image_tensor, list):
        OO0OO0O00000OO0O0 = []
        for O0OO0OOO0OO0O0OOO in range(len(image_tensor)):
            OO0OO0O00000OO0O0.append(txCilde(image_tensor[O0OO0OOO0OO0O0OOO], imtype, normalize))

        return OO0OO0O00000OO0O0
    else:
        OO0OO0O00000OO0O0 = image_tensor.cpu().float().numpy()
        if normalize:
            OO0OO0O00000OO0O0 = (np.transpose(OO0OO0O00000OO0O0, (1, 2, 0)) + 1) / 2.0 * 255.0
        else:
            OO0OO0O00000OO0O0 = np.transpose(OO0OO0O00000OO0O0, (1, 2, 0)) * 255.0
        OO0OO0O00000OO0O0 = np.clip(OO0OO0O00000OO0O0, 0, 255)
        if OO0OO0O00000OO0O0.shape[2] == 1 or OO0OO0O00000OO0O0.shape[2] > 3:
            OO0OO0O00000OO0O0 = OO0OO0O00000OO0O0[:, :, 0]
        return OO0OO0O00000OO0O0.astype(imtype)