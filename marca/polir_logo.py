"""Polimento e separacao em camadas da logo CK (Mascara Surpresa).
Entrada: ck-logo-original.svg (arquivo vetorizado enviado).
Gera: ck-logo.svg (logo polida, pronta para uso) e camadas.json (camadas para a vinheta).
Uso: pip install shapely && python3 polir_logo.py"""
import re, json, math, sys
from shapely.geometry import Polygon, MultiPolygon
from shapely.ops import unary_union
from shapely.validation import make_valid

import os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
SRC = open('ck-logo-original.svg').read()
ORDER = re.findall(r'<path id="([^"]+)" fill="([^"]+)"[^>]* d="([^"]+)"', SRC)
SPECK = 70      # area minima (px²) de um subcaminho; abaixo disso e ruido do vetorizador
R = 14          # raio maximo de arredondamento nos vertices suaves
CORNER = 52     # graus; acima disso o vertice e quina (pontas dos raios ficam afiadas)

def rings(d):
    out = []
    for s in d.split('Z'):
        pts = [tuple(map(float, p.split(','))) for p in re.findall(r'-?[\d.]+,-?[\d.]+', s)]
        if len(pts) >= 3: out.append(pts)
    return out

def area(pts): return abs(Polygon(pts).area)

def clean(pts):
    o = []
    for p in pts:
        if not o or math.dist(o[-1], p) > 0.01: o.append(p)
    if len(o) > 1 and math.dist(o[0], o[-1]) < 0.01: o.pop()
    return o

def smooth(pts):
    pts = clean(pts); n = len(pts)
    if n < 3: return ''
    info = []
    for i in range(n):
        a, v, b = pts[i-1], pts[i], pts[(i+1) % n]
        din = (v[0]-a[0], v[1]-a[1]); dout = (b[0]-v[0], b[1]-v[1])
        lin, lout = math.hypot(*din), math.hypot(*dout)
        cosang = (din[0]*dout[0] + din[1]*dout[1]) / (lin*lout)
        turn = math.degrees(math.acos(max(-1, min(1, cosang))))
        if turn > CORNER: info.append(('L', v, None, None))
        else:
            c1 = min(lin/2, R); c2 = min(lout/2, R)
            A = (v[0]-din[0]/lin*c1, v[1]-din[1]/lin*c1)
            B = (v[0]+dout[0]/lout*c2, v[1]+dout[1]/lout*c2)
            info.append(('Q', v, A, B))
    f = lambda p: f"{p[0]:.1f},{p[1]:.1f}".replace('.0,', ',').replace('.0', '') if False else f"{round(p[0],1):g},{round(p[1],1):g}"
    # comeca num ponto bem definido
    k0 = next((i for i, x in enumerate(info) if x[0] == 'L'), 0)
    seq = info[k0:] + info[:k0]
    d = ''
    for j, (t, v, A, B) in enumerate(seq):
        if t == 'L': d += ('M' if j == 0 else 'L') + f(v)
        else:
            d += ('M' if j == 0 else 'L') + f(A) + 'Q' + f(v) + ' ' + f(B)
    return d + 'Z'

def poly(pts):
    g = make_valid(Polygon(pts))
    return g.buffer(0)

def geom_rings(g):
    polys = [g] if isinstance(g, Polygon) else [p for p in getattr(g, 'geoms', []) if isinstance(p, Polygon)]
    out = []
    for p in polys:
        if p.area < SPECK: continue
        out.append(list(p.exterior.coords)[:-1])
        for h in p.interiors:
            if Polygon(h).area >= SPECK: out.append(list(h.coords)[:-1])
    return out

# --- classifica subcaminhos ---
BURST = {('tone-1', 6), ('tone-1', 10)}
BANG = {('silhouette', 0): 'bang3', ('silhouette', 1): 'bang2', ('silhouette', 2): 'bang1',
        ('tone-1', 7): 'bang3', ('tone-1', 8): 'bang2', ('tone-1', 9): 'bang1'}
EYES = {('tone-3', 0): 'eye-r', ('tone-3', 1): 'eye-l'}
SHINE = {('tone-3', 2)}

parsed = []  # (id, fill, idx, pts)
for pid, fill, d in ORDER:
    for i, pts in enumerate(rings(d)): parsed.append((pid, fill, i, pts))

sil = poly(parsed[3][3]) if parsed[3][0] == 'silhouette' else None
assert parsed[3][2] == 3
burst = unary_union([poly(p) for pid, f, i, p in parsed if (pid, i) in BURST])
head_parts = [poly(p) for pid, f, i, p in parsed
              if pid != 'silhouette' and (pid, i) not in BURST and (pid, i) not in BANG and area(p) >= SPECK]
head = unary_union(head_parts)
outline = sil.intersection(head.buffer(24, join_style=1)).difference(burst).buffer(0)

def path_el(fill, ring_list, extra=''):
    d = ''.join(smooth(r) for r in ring_list)
    return f'<path{extra} fill="{fill}" fill-rule="evenodd" d="{d}"/>' if d else ''

layers = {'rays': [], 'bang1': [], 'bang2': [], 'bang3': [], 'outline': [], 'head': [], 'eyes': [], 'shine': []}
layers['rays'].append(path_el('#050407', [parsed[3][3]]))
layers['outline'].append(path_el('#050407', geom_rings(outline)))
by_id = {}
for pid, fill, i, pts in parsed:
    by_id.setdefault((pid, fill), []).append((i, pts))
full = []  # logo polida inteira, mesma ordem do original
for (pid, fill), subs in by_id.items():
    keep = [p for i, p in subs if area(p) >= SPECK]
    full.append(path_el(fill, keep, f' id="{pid}"'))
    if pid == 'silhouette':
        for i, p in subs:
            if (pid, i) in BANG: layers[BANG[(pid, i)]].append(path_el(fill, [p]))
        continue
    head_rings, eyes = [], []
    for i, p in subs:
        if area(p) < SPECK: continue
        k = (pid, i)
        if k in BURST: layers['rays'].append(path_el(fill, [p]))
        elif k in BANG: layers[BANG[k]].append(path_el(fill, [p]))
        elif k in EYES: layers['eyes'].append(path_el(fill, [p], f' class="{EYES[k]}"'))
        elif k in SHINE: layers['shine'].append(path_el(fill, [p]))
        else: head_rings.append(p)
    if head_rings: layers['head'].append(path_el(fill, head_rings))
    if pid == 'tone-3': layers['head'].append('<!--EYES-->')

json.dump({k: ''.join(v) for k, v in layers.items()}, open('camadas.json', 'w'))
svg = ('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 1254 1254" role="img" aria-labelledby="ck-title">'
       '<title id="ck-title">CK</title><g id="ck-logo">' + ''.join(full) + '</g></svg>\n')
open('ck-logo.svg', 'w').write(svg)
print('ok', len(svg), {k: len(''.join(v)) for k, v in layers.items()})
