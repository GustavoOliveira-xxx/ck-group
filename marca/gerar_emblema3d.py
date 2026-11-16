"""Modelo 3D da logo CK (a mascara), feito a partir das camadas do SVG.

Entrada: camadas.json (gerado por polir_logo.py).
Gera:    ../ck-emblema.js (malha pronta para o site, um arquivo so, sem dependencias).

Cada cor da logo vira uma placa com altura propria, como um broche esmaltado:
o contorno preto e a base, os roxos sobem em degraus, o ouro fica por cima e
os olhos saltam em branco. As bordas sao arredondadas para pegar a luz.

Uso: pip install shapely numpy mapbox_earcut && python3 gerar_emblema3d.py
"""
import base64, json, math, os, re
import numpy as np
import mapbox_earcut as earcut
from shapely.geometry import Polygon
from shapely.geometry.polygon import orient
from shapely.ops import unary_union
from shapely.validation import make_valid

os.chdir(os.path.dirname(os.path.abspath(__file__)))

LADO = 1254.0          # viewBox da logo
MEIO = LADO / 2
TOL = 0.55             # simplificacao do contorno, em px da logo
AREA_MIN = 40          # ilhas menores que isso sao ruido
VINCO = math.radians(42)   # acima disso a aresta fica viva

# ---------- cores (indice = material no shader) ----------
PALETA = ['#050407', '#190222', '#420161', '#640187', '#7D03A0', '#A308C8', '#B210D6',
          '#FCCF02', '#DAA602', '#FAF482', '#F7F1B5', '#FBF9FC']
MAT = {c: i for i, c in enumerate(PALETA)}

PARTES = ['verso', 'raios-base', 'raios-ouro', 'bang1', 'bang2', 'bang3',
          'contorno', 'rosto', 'ouro', 'olho-esq', 'olho-dir', 'brilho']
PARTE = {n: i for i, n in enumerate(PARTES)}

# altura do topo de cada tom do rosto (px da logo); a base do rosto e o contorno
TOPO_ROSTO = {'#190222': 45, '#420161': 49, '#640187': 53, '#7D03A0': 56, '#A308C8': 59, '#B210D6': 62,
              '#FCCF02': 73, '#DAA602': 69, '#FAF482': 75.5, '#F7F1B5': 76.5}
OURO_ROSTO = {'#FCCF02', '#DAA602', '#FAF482', '#F7F1B5'}


# ---------- leitura dos caminhos ----------
def aneis(d):
    """Subcaminhos de um 'd' (M, L, Q, Z absolutos) como listas de pontos, com y para cima."""
    out, atual, pos = [], [], None
    for cmd, args in re.findall(r'([MLQZ])([^MLQZ]*)', d):
        n = [float(x) for x in re.findall(r'-?\d+\.?\d*', args)]
        if cmd == 'M':
            if len(atual) >= 3: out.append(atual)
            pos = (n[0], n[1]); atual = [pos]
            for i in range(2, len(n), 2):
                pos = (n[i], n[i + 1]); atual.append(pos)
        elif cmd == 'L':
            for i in range(0, len(n), 2):
                pos = (n[i], n[i + 1]); atual.append(pos)
        elif cmd == 'Q':
            for i in range(0, len(n), 4):
                c = (n[i], n[i + 1]); f = (n[i + 2], n[i + 3])
                corda = math.dist(pos, f)
                passos = 2 if corda < 14 else 3 if corda < 40 else 5
                for k in range(1, passos + 1):
                    t = k / passos
                    atual.append(((1 - t) ** 2 * pos[0] + 2 * (1 - t) * t * c[0] + t * t * f[0],
                                  (1 - t) ** 2 * pos[1] + 2 * (1 - t) * t * c[1] + t * t * f[1]))
                pos = f
        elif cmd == 'Z':
            if len(atual) >= 3: out.append(atual)
            atual = []
    if len(atual) >= 3: out.append(atual)
    return [[(x - MEIO, MEIO - y) for x, y in r] for r in out]


def forma(d):
    """Poligono (regra par-impar) de um caminho."""
    g = None
    for r in aneis(d):
        p = make_valid(Polygon(r)).buffer(0)
        g = p if g is None else g.symmetric_difference(p)
    return limpar(g)


def limpar(g):
    if g is None or g.is_empty: return None
    g = g.buffer(0).simplify(TOL, preserve_topology=True)
    ps = [p for p in poligonos(g) if p.area >= AREA_MIN]
    return unary_union(ps) if ps else None


def poligonos(g):
    if g is None or g.is_empty: return []
    if g.geom_type == 'Polygon': return [g]
    return [p for p in getattr(g, 'geoms', []) if p.geom_type == 'Polygon' and not p.is_empty]


def caminhos(svg):
    return [(m.group(1), m.group(2)) for m in
            re.finditer(r'<path[^>]*?fill="([^"]+)"[^>]*?d="([^"]+)"', svg)]


# ---------- construcao da malha ----------
TRIS = []   # (p0, p1, p2, material, parte, (ao0, ao1, ao2), grupo de suavizacao)


def tri(a, b, c, sentido, mat, parte, ao=(1, 1, 1), grupo=1):
    a, b, c = np.asarray(a, float), np.asarray(b, float), np.asarray(c, float)
    n = np.cross(b - a, c - a)
    if np.linalg.norm(n) < 1e-9: return
    if np.dot(n, sentido) < 0:
        b, c = c, b; ao = (ao[0], ao[2], ao[1])
    TRIS.append((a, b, c, mat, parte, ao, grupo))


def triangular(p):
    p = orient(p, 1.0)
    an = [np.asarray(p.exterior.coords)[:-1]] + [np.asarray(h.coords)[:-1] for h in p.interiors]
    v = np.concatenate(an).astype(np.float64)
    fim = np.cumsum([len(a) for a in an]).astype(np.uint32)
    idx = earcut.triangulate_float64(v, fim)
    return v, idx.reshape(-1, 3)


def tampa(g, z, mat, parte, cima=True):
    for p in poligonos(g):
        v, t = triangular(p)
        for i, j, k in t:
            tri((*v[i], z), (*v[j], z), (*v[k], z), (0, 0, 1 if cima else -1), mat, parte, grupo=0)


def deslocar(anel, d):
    """Empurra um contorno 'd' para fora, vertice a vertice (mitra limitada). Como cada ponto
    continua sendo o mesmo ponto, as faixas do chanfro saem continuas, sem fresta."""
    p = np.asarray(anel, float)
    e = np.roll(p, -1, 0) - p
    e /= np.maximum(np.linalg.norm(e, axis=1, keepdims=True), 1e-9)
    n_sai = np.stack([e[:, 1], -e[:, 0]], 1)        # normal da aresta que sai do vertice
    n_chega = np.roll(n_sai, 1, 0)                  # normal da aresta que chega
    k = 1 + (n_sai * n_chega).sum(1, keepdims=True)
    return p + (n_sai + n_chega) / np.maximum(k, 0.5) * d


def tira(ra, za, rb, zb, mat, parte, ao=(1, 1)):
    """Faixa entre dois contornos com os mesmos vertices (ra em cima, rb embaixo/fora)."""
    n = len(ra)
    for i in range(n):
        j = (i + 1) % n
        ex, ey = ra[j][0] - ra[i][0], ra[j][1] - ra[i][1]
        if abs(ex) + abs(ey) < 1e-9: continue
        fora = (ey, -ex, 0.35 * math.hypot(ex, ey))      # para fora e um pouco para cima
        a, b, c, d = (*ra[i], za), (*rb[i], zb), (*rb[j], zb), (*ra[j], za)
        tri(a, b, c, fora, mat, parte, (ao[0], ao[1], ao[1]))
        tri(a, c, d, fora, mat, parte, (ao[0], ao[1], ao[0]))


# perfil da borda: (fracao do chanfro para fora, fracao do chanfro para baixo)
BORDA = [(0.34, 0.14), (1.0, 1.0)]
BORDA_OLHO = [(0.10, 0.02), (0.30, 0.10), (0.58, 0.32), (0.84, 0.64), (1.0, 1.0)]


def placa(g, base, topo, chanfro, mat, parte, ao_base=0.5, borda=BORDA):
    """Placa com borda arredondada: a tampa fica no contorno original e o corpo cresce 'chanfro'
    para fora enquanto desce, entao nunca ha recuo que se cruze em detalhe fino."""
    if g is None: return
    for p in poligonos(g):
        p = orient(p, 1.0)
        for anel in [p.exterior] + list(p.interiors):
            r0 = np.asarray(anel.coords)[:-1]
            aneis_ = [(r0, topo)] + [(deslocar(r0, chanfro * fo), topo - chanfro * fz) for fo, fz in borda]
            for (ra, za), (rb, zb) in zip(aneis_, aneis_[1:]):
                tira(ra, za, rb, zb, mat, parte)
            ult, z_ult = aneis_[-1]
            tira(ult, z_ult, ult, base, mat, parte, (1, ao_base))
    tampa(g, topo, mat, parte)


def crescer(g, d):
    return g if d == 0 else g.buffer(d, join_style=2, mitre_limit=2.2)


def espelhar_desde(n0):
    """Vira para tras (z negativo) tudo que foi criado a partir de TRIS[n0]."""
    for i in range(n0, len(TRIS)):
        a, b, c, mat, parte, ao, grupo = TRIS[i]
        m = np.array([1, 1, -1.0])
        TRIS[i] = (a * m, c * m, b * m, mat, parte, (ao[0], ao[2], ao[1]), grupo)


camadas = json.load(open('camadas.json'))
INK = MAT['#050407']

# raios: base preta + ouro
raios = caminhos(camadas['rays'])
raios_base = forma(raios[0][1])
raios_ouro = unary_union([forma(d) for f, d in raios[1:]])
placa(raios_base, 0, 20, 4.5, INK, PARTE['raios-base'])
tampa(raios_base, 0, INK, PARTE['raios-base'], cima=False)
placa(raios_ouro, 17, 30, 4, MAT['#FCCF02'], PARTE['raios-ouro'])

# exclamacoes
for nome in ('bang1', 'bang2', 'bang3'):
    (_, d_preto), (_, d_ouro) = caminhos(camadas[nome])
    g = forma(d_preto)
    placa(g, 0, 27, 4.5, INK, PARTE[nome])
    tampa(g, 0, INK, PARTE[nome], cima=False)
    placa(forma(d_ouro), 24, 39, 3.5, MAT['#FCCF02'], PARTE[nome])

# contorno da cabeca
contorno = forma(caminhos(camadas['outline'])[0][1])
placa(contorno, 0, 41, 5, INK, PARTE['contorno'])

# rosto: cada tom em seu degrau
for cor, d in caminhos(camadas['head']):
    cor = cor.upper()
    ouro = cor in OURO_ROSTO
    chanfro = {'#FCCF02': 4, '#DAA602': 3, '#FAF482': 1.6, '#F7F1B5': 1.6}.get(cor, 2.6)
    placa(forma(d), 39, TOPO_ROSTO[cor], chanfro, MAT[cor], PARTE['ouro' if ouro else 'rosto'], 0.42)

# olhos e brilho
PIVOS = {}
for m in re.finditer(r'<path class="(eye-[rl])"[^>]*?d="([^"]+)"', camadas['eyes']):
    nome = 'olho-dir' if m.group(1) == 'eye-r' else 'olho-esq'
    g = forma(m.group(2))
    placa(g, 39, 66, 8, MAT['#FBF9FC'], PARTE[nome], 0.45, BORDA_OLHO)
    PIVOS[nome] = round(g.centroid.y / MEIO, 4)
placa(forma(caminhos(camadas['shine'])[0][1]), 57, 61.5, 1.6, MAT['#FBF9FC'], PARTE['brilho'])

# verso: o clarao em ouro e a silhueta da cabeca em roxo, como o verso de uma medalha
n0 = len(TRIS)
placa(raios_ouro, 0, 9, 3.5, MAT['#FCCF02'], PARTE['verso'])
placa(contorno, 0, 15, 5, MAT['#640187'], PARTE['verso'])
placa(crescer(contorno, -26), 13, 21, 4, MAT['#A308C8'], PARTE['verso'])
espelhar_desde(n0)

# ---------- normais com vinco, solda e quantizacao ----------
P = np.array([[t[0], t[1], t[2]] for t in TRIS])            # (n, 3, 3)
FN = np.cross(P[:, 1] - P[:, 0], P[:, 2] - P[:, 0])
AREA = np.linalg.norm(FN, axis=1)
FN /= AREA[:, None]
chave = lambda p: (round(p[0] * 50), round(p[1] * 50), round(p[2] * 50))
vizinhos = {}
for i, t in enumerate(TRIS):
    if t[6] == 0: continue                                    # tampas ficam planas
    for k in range(3):
        vizinhos.setdefault((chave(P[i, k]), t[4], t[3]), []).append(i)

cos_vinco = math.cos(VINCO)
vert, indices, mapa = [], [], {}
for i, t in enumerate(TRIS):
    for k in range(3):
        if t[6] == 0: n = FN[i]
        else:
            n = np.zeros(3)
            for j in vizinhos[(chave(P[i, k]), t[4], t[3])]:
                if np.dot(FN[i], FN[j]) >= cos_vinco: n += FN[j] * AREA[j]
            n /= np.linalg.norm(n)
        p = P[i, k] / MEIO
        reg = (int(round(p[0] * 32767)), int(round(p[1] * 32767)), int(round(p[2] * 32767)),
               int(round(t[5][k] * 255)), t[4],
               int(round(n[0] * 127)), int(round(n[1] * 127)), int(round(n[2] * 127)), t[3])
        if reg not in mapa:
            mapa[reg] = len(vert); vert.append(reg)
        indices.append(mapa[reg])

assert len(vert) < 65536, len(vert)
buf = np.zeros(len(vert), dtype=[('p', '<i2', 3), ('ao', 'u1'), ('parte', 'u1'), ('n', 'i1', 3), ('mat', 'u1')])
for i, r in enumerate(vert):
    buf[i] = ((r[0], r[1], r[2]), r[3], r[4], (r[5], r[6], r[7]), r[8])
idx = np.asarray(indices, dtype='<u2')

rgb = lambda h: [round(int(h[i:i + 2], 16) / 255, 4) for i in (1, 3, 5)]
dados = {
    'v': base64.b64encode(buf.tobytes()).decode(),
    'i': base64.b64encode(idx.tobytes()).decode(),
    'paleta': [rgb(c) for c in PALETA],
    'partes': PARTES,
    'pivos': PIVOS,
}
js = ('/* Conscious Knowledge: modelo 3D da logo. Gerado por marca/gerar_emblema3d.py; nao edite a mao. */\n'
      'window.CK_EMBLEMA=' + json.dumps(dados, separators=(',', ':')) + ';\n'
      'window.dispatchEvent(new Event("ck:emblema"));\n')
open('../ck-emblema.js', 'w').write(js)
print('vertices', len(vert), 'triangulos', len(idx) // 3, 'arquivo', round(len(js) / 1024), 'KB')
