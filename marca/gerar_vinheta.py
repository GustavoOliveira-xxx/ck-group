"""Gera a vinheta de abertura da CK (versao Aurora).

Entradas (nesta pasta):
  camadas.json   camadas da mascara, geradas por polir_logo.py
  russo.woff     Russo One (CK e CONSCIOUS KNOWLEDGE)
  grotesk.woff   Space Grotesk 600 (slogan e "UMA PRODUCAO DE")
  vinheta.modelo.js  codigo da vinheta, com o marcador /*__DADOS__*/

Saidas:
  ck-vinheta.js        arquivo unico para os apps web (FinCK, DynamiCK, site, AutoniCK)
  vinheta-dados.json   mesmas camadas, para o SynCK (React Native)

Todo texto vira curva vetorial: a vinheta nao depende de fonte instalada.
Uso: pip install fonttools && python3 gerar_vinheta.py
Depois copie ck-vinheta.js para a raiz de cada app web e vinheta-dados.json para
synck-app/app-mobile/src/components/brand/vinheta/dados.json.
"""
import json, math, re, os
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

AQUI = os.path.dirname(os.path.abspath(__file__))
P = lambda f: os.path.join(AQUI, f)

# Sistema de coordenadas da composicao
VB = dict(x=0, y=-120, w=1000, h=1300)
MASK = dict(x=230, y=10, s=540 / 1254)          # posicao da mascara
MC = (497, 286)                                   # centro da mascara
SKEW_Y0 = 770                                     # eixo da inclinacao do CK
K_SKEW = math.tan(math.radians(-12))

class Fonte:
    def __init__(self, arq):
        self.f = TTFont(P(arq))
        self.gs = self.f.getGlyphSet()
        self.cmap = self.f.getBestCmap()
        self.upm = self.f['head'].unitsPerEm
        self.hmtx = self.f['hmtx']

    def avanco(self, ch, size):
        return self.hmtx[self.cmap[ord(ch)]][0] * size / self.upm

    def glifo(self, ch, x, base, size, skew=False):
        s = size / self.upm
        nome = self.cmap[ord(ch)]
        pen = SVGPathPen(self.gs, ntos=lambda v: f"{round(v, 1):g}")
        if skew:   # inclinacao embutida nas coordenadas
            t = (s, 0, -K_SKEW * s, -s, x + K_SKEW * (base - SKEW_Y0), base)
        else:
            t = (s, 0, 0, -s, x, base)
        self.gs[nome].draw(TransformPen(pen, t))
        bp = BoundsPen(self.gs)
        self.gs[nome].draw(TransformPen(bp, t))
        return pen.getCommands(), bp.bounds

    def linha(self, texto, cx, base, size, espaco=0, skew=False):
        """Centraliza o texto em cx. Devolve [(char, d, bounds)]."""
        avs = [self.avanco(c, size) for c in texto]
        total = sum(avs) + espaco * (len(texto) - 1)
        x = cx - total / 2
        out = []
        for c, a in zip(texto, avs):
            if c != ' ':
                d, b = self.glifo(c, x, base, size, skew)
                out.append((c, d, b))
            x += a + espaco
        return out

russo, grot = Fonte('russo.woff'), Fonte('grotesk.woff')

def uniao(bs, pad=0):
    bs = [b for b in bs if b]
    return [min(b[0] for b in bs) - pad, min(b[1] for b in bs) - pad,
            max(b[2] for b in bs) + pad, max(b[3] for b in bs) + pad]

def caixa(b):
    return dict(x=round(b[0], 1), y=round(b[1], 1), w=round(b[2] - b[0], 1), h=round(b[3] - b[1], 1))

def bounds_d(svg):
    nums = [tuple(map(float, m)) for m in re.findall(r'(-?[\d.]+),(-?[\d.]+)', svg)]
    xs, ys = [n[0] for n in nums], [n[1] for n in nums]
    return [min(xs), min(ys), max(xs), max(ys)]

def mascara_para_lockup(b, pad=6):
    s = MASK['s']
    return [MASK['x'] + b[0] * s - pad, MASK['y'] + b[1] * s - pad, MASK['x'] + b[2] * s + pad, MASK['y'] + b[3] * s + pad]

# ---------------- camadas da mascara ----------------
cam = json.load(open(P('camadas.json')))
olhos = re.findall(r'<path class="(eye-[lr])"([^>]*)/>', cam['eyes'])
cabeca = cam['outline'] + cam['head'].replace('<!--EYES-->', '') + cam['shine']
mask_layers = {
    'raios': cam['rays'],
    'exc1': cam['bang1'], 'exc2': cam['bang2'], 'exc3': cam['bang3'],
    'cabeca': cabeca,
}
for cls, attrs in olhos:
    mask_layers['olhoE' if cls == 'eye-l' else 'olhoD'] = f'<path{attrs}/>'

camadas = {}
for nome, svg in mask_layers.items():
    b = mascara_para_lockup(bounds_d(svg), pad=4)
    svg = re.sub(r'\s+class="[^"]*"', '', svg)
    camadas[nome] = dict(caixa=caixa(b), mascara=True, svg=svg)

# ---------------- tipografia ----------------
def svg_texto(glifos):
    return ''.join(d for _, d, _ in glifos)

ck = russo.linha('CK', 500, 880, 372, espaco=-8, skew=True)
sub = russo.linha('CONSCIOUS KNOWLEDGE', 500, 990, 46, espaco=9)
sl1 = grot.linha('Consciência que cria,', 500, 1088, 40, espaco=0.5)
sl2 = grot.linha('Conhecimento que transforma.', 500, 1142, 40, espaco=0.5)
cred = grot.linha('UMA PRODUÇÃO DE', 500, -44, 32, espaco=10)

for (c, d, b), nome in zip(ck, ['letraC', 'letraK']):
    camadas[nome] = dict(caixa=caixa(uniao([b], pad=0)), letra=True, d=d,
                         ext=caixa(uniao([b, [b[0] + 12 * 1.9, b[1], b[2] + 12 * 1.9, b[3] + 12 * 2.7]], pad=26)))
sb = uniao([b for _, _, b in sub])
camadas['nome'] = dict(caixa=caixa(uniao([sb, [sb[0] - 100, sb[1], sb[2] + 100, sb[3]]], pad=8)), d=svg_texto(sub),
                       tracos=[[sb[0] - 96, sb[1] + 17, sb[0] - 26], [sb[2] + 26, sb[1] + 17, sb[2] + 96]])
camadas['slogan1'] = dict(caixa=caixa(uniao([b for _, _, b in sl1], pad=4)), d=svg_texto(sl1))
camadas['slogan2'] = dict(caixa=caixa(uniao([b for _, _, b in sl2], pad=4)), d=svg_texto(sl2))
cb = uniao([b for _, _, b in cred])
camadas['credito'] = dict(caixa=caixa(uniao([cb, [cb[0] - 90, cb[1], cb[2] + 90, cb[3]]], pad=4)), d=svg_texto(cred),
                          tracos=[[cb[0] - 84, (cb[1] + cb[3]) / 2, cb[0] - 24], [cb[2] + 24, (cb[1] + cb[3]) / 2, cb[2] + 84]])

ckb = uniao([b for _, _, b in ck])

# ---------------- cada camada vira um SVG completo ----------------
# (o mesmo desenho serve para a web e para o SynCK; nada de paint-order, que o
# react-native-svg nao entende: contorno e preenchimento sao dois caminhos)
XL = 'xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"'
def svg(c, corpo, defs=''):
    return (f'<svg {XL} viewBox="{c["x"]} {c["y"]} {c["w"]} {c["h"]}" preserveAspectRatio="none">'
            + (f'<defs>{defs}</defs>' if defs else '') + corpo + '</svg>')
MG = f'<g transform="translate({MASK["x"]} {MASK["y"]}) scale({MASK["s"]:.6f})">'
def tracos(t, cor, larg):
    return ''.join(f'<path d="M{s[0]:.1f},{s[1]:.1f}L{s[2]:.1f},{s[1]:.1f}" stroke="{cor}" stroke-width="{larg}" stroke-linecap="round" fill="none"/>' for s in t)

for k in ['raios', 'exc1', 'exc2', 'exc3', 'cabeca', 'olhoE', 'olhoD']:
    camadas[k]['xml'] = svg(camadas[k]['caixa'], MG + camadas[k]['svg'] + '</g>')
    del camadas[k]['svg']

OURO = '<stop offset="0" stop-color="#fff7c2"/><stop offset=".28" stop-color="#ffd84a"/><stop offset=".55" stop-color="#f2b200"/><stop offset=".8" stop-color="#b87900"/><stop offset="1" stop-color="#ffe27a"/>'
ROXO = '<stop offset="0" stop-color="#fbe9ff"/><stop offset=".26" stop-color="#e199ff"/><stop offset=".47" stop-color="#b53ff0"/><stop offset=".5" stop-color="#8611c9"/><stop offset=".78" stop-color="#5a0a96"/><stop offset="1" stop-color="#36045f"/>'
REFLEXO = '<stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset=".42" stop-color="#fff" stop-opacity=".08"/><stop offset=".43" stop-color="#fff" stop-opacity="0"/>'
for k, n in (('letraC', 'c'), ('letraK', 'k')):
    L = camadas[k]
    ids = dict(o=f'ckv{n}o', r=f'ckv{n}r', b=f'ckv{n}b', p=f'ckv{n}p')
    defs = (f'<linearGradient id="{ids["o"]}" x1="0" y1="0" x2="0" y2="1">{OURO}</linearGradient>'
            f'<linearGradient id="{ids["r"]}" x1="0" y1="0" x2="0" y2="1">{ROXO}</linearGradient>'
            f'<linearGradient id="{ids["b"]}" x1="0" y1="0" x2="0" y2="1">{REFLEXO}</linearGradient>'
            f'<path id="{ids["p"]}" d="{L["d"]}"/>')
    u = lambda a: f'<use xlink:href="#{ids["p"]}" href="#{ids["p"]}" {a}/>'
    fill = ['#5a1690', '#4a1179', '#3b0c63', '#2d0849']; edge = ['#7a2bb8', '#5a1690', '#3b0c63', '#2d0849']
    corpo = '<g stroke-linejoin="round">'
    for i in range(12, 0, -1):   # bloco 3D em degraus
        t = min(3, i // 3)
        corpo += u(f'transform="translate({i*1.9:.1f} {i*2.7:.1f})" fill="{fill[t]}" stroke="{"#07020c" if i == 12 else edge[t]}" stroke-width="{52 if i == 12 else 44}"')
    corpo += (u('fill="#07020c" stroke="#07020c" stroke-width="46"') + u(f'fill="none" stroke="url(#{ids["o"]})" stroke-width="28"')
              + u('fill="none" stroke="#fff8e0" stroke-width="7"') + u(f'fill="url(#{ids["r"]})"') + u(f'fill="url(#{ids["b"]})"') + '</g>')
    L['xml'] = svg(L['ext'], corpo, defs)

N = camadas['nome']
N['xml'] = svg(N['caixa'], tracos(N['tracos'], '#f5c400', 7)
               + f'<path d="{N["d"]}" fill="#07020c" stroke="#07020c" stroke-width="11" stroke-linejoin="round"/>'
               + f'<path d="{N["d"]}" fill="url(#ckvsb)"/>',
               '<linearGradient id="ckvsb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#f1e4ff"/><stop offset="1" stop-color="#bf8cf0"/></linearGradient>')
for k, cor in (('slogan1', '#f4edfb'), ('slogan2', '#fccf02')):
    S_ = camadas[k]
    S_['xml'] = svg(S_['caixa'], f'<path d="{S_["d"]}" fill="#06020b" fill-opacity=".6" stroke="#06020b" stroke-opacity=".6" stroke-width="5" stroke-linejoin="round"/><path d="{S_["d"]}" fill="{cor}"/>')
C_ = camadas['credito']
C_['xml'] = svg(C_['caixa'], tracos(C_['tracos'], '#f5c400', 3) + f'<path d="{C_["d"]}" fill="#d6c4f2"/>')

# brilho roxo atras do CK
ckc = caixa(ckb)
gl = dict(x=round(ckc['x'] - 170, 1), y=round(ckc['y'] - 140, 1), w=round(ckc['w'] + 340, 1), h=round(ckc['h'] + 280, 1))
camadas['ckBrilho'] = dict(caixa=gl, xml=svg(gl,
    f'<ellipse cx="{ckc["x"] + ckc["w"]/2:.1f}" cy="{ckc["y"] + ckc["h"]/2:.1f}" rx="{gl["w"]/2:.1f}" ry="{gl["h"]/2:.1f}" fill="url(#ckvgl)"/>',
    '<radialGradient id="ckvgl"><stop offset="0" stop-color="#b03cff" stop-opacity=".62"/><stop offset=".55" stop-color="#7a1fc0" stop-opacity=".22"/><stop offset="1" stop-color="#7a1fc0" stop-opacity="0"/></radialGradient>'))
# brilho dos olhos acendendo
oe, od = camadas['olhoE']['caixa'], camadas['olhoD']['caixa']
y0 = min(oe['y'], od['y']); y1 = max(oe['y'] + oe['h'], od['y'] + od['h'])
ob = dict(x=round(oe['x'] - 60, 1), y=round(y0 - 60, 1), w=round(od['x'] + od['w'] - oe['x'] + 120, 1), h=round(y1 - y0 + 120, 1))
camadas['olhosBrilho'] = dict(caixa=ob, xml=svg(ob,
    f'<circle cx="{oe["x"] + oe["w"]/2:.1f}" cy="{oe["y"] + oe["h"]*.55:.1f}" r="{oe["w"]*.85:.1f}" fill="url(#ckvog)"/>'
    f'<circle cx="{od["x"] + od["w"]/2:.1f}" cy="{od["y"] + od["h"]*.55:.1f}" r="{od["w"]*1.1:.1f}" fill="url(#ckvog)"/>',
    '<radialGradient id="ckvog"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#e7c6ff" stop-opacity="0"/></radialGradient>'))
# raios de luz do fundo (SynCK; a web desenha os mesmos raios em canvas)
cunhas = ''
for i in range(20):
    a0 = i * math.pi / 10; w = (3.2 if i % 2 else 5.5) * math.pi / 180
    p1 = (100 + 100 * math.cos(a0 - w), 100 + 100 * math.sin(a0 - w)); p2 = (100 + 100 * math.cos(a0 + w), 100 + 100 * math.sin(a0 + w))
    cor = '#c86eff' if i % 2 else '#ffe278'
    cunhas += f'<path d="M100,100L{p1[0]:.2f},{p1[1]:.2f}L{p2[0]:.2f},{p2[1]:.2f}Z" fill="{cor}" fill-opacity="{0.30 if i % 2 else 0.34}"/>'
LUZ = dict(x=0, y=0, w=200, h=200)
luz_xml = (f'<svg {XL} viewBox="0 0 200 200"><defs><radialGradient id="ckvlz" gradientUnits="userSpaceOnUse" cx="100" cy="100" r="100">'
           '<stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".18" stop-color="#fff" stop-opacity=".42"/><stop offset=".45" stop-color="#fff" stop-opacity=".1"/><stop offset=".75" stop-color="#fff" stop-opacity="0"/></radialGradient>'
           f'<mask id="ckvlm"><rect width="200" height="200" fill="url(#ckvlz)"/></mask></defs><g mask="url(#ckvlm)">{cunhas}</g></svg>')
faixa_mascara = svg(ckc, f'<path fill="#fff" d="{camadas["letraC"]["d"]}{camadas["letraK"]["d"]}"/>')

ORDEM = ['ckBrilho', 'raios', 'exc1', 'exc2', 'exc3', 'cabeca', 'olhoE', 'olhoD', 'olhosBrilho', 'letraC', 'letraK', 'nome', 'slogan1', 'slogan2', 'credito']
for k in ('nome', 'slogan1', 'slogan2', 'credito'):
    camadas[k].pop('tracos', None); camadas[k].pop('d', None)
for k in camadas.values():
    k.pop('mascara', None); k.pop('letra', None)
dados = dict(ordem=ORDEM, luz=luz_xml, faixaMascara=faixa_mascara,
             estrelas=[[ckc['x'] + 40, ckc['y'] + 30, 40], [ckc['x'] + ckc['w'] - 30, ckc['y'] + 70, 26], [ckc['x'] + ckc['w'] - 90, ckc['y'] + ckc['h'] - 20, 16],
                       [ckc['x'] + 120, ckc['y'] + ckc['h'] - 10, 12], [790, 120, 16], [215, 210, 13], [830, 450, 11], [160, 470, 9]],
             vb=VB, mascara=MASK, centro=MC, ck=caixa(ckb), camadas=camadas,
             olhos={k: camadas[k]['caixa'] for k in ('olhoE', 'olhoD')})

json.dump(dados, open(P('vinheta-dados.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
modelo = open(P('vinheta.modelo.js'), encoding='utf-8').read()
js = modelo.replace('/*__DADOS__*/null', json.dumps(dados, ensure_ascii=False, separators=(',', ':')))
open(P('ck-vinheta.js'), 'w', encoding='utf-8').write(js)
print('ck-vinheta.js', len(js.encode()), 'bytes;', 'camadas:', ', '.join(camadas))
