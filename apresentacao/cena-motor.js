/* ============================================================
   FinCK · apresentação final · motor 3D da vitrine
   Conscious Knowledge · Projeto Interdisciplinar 2026

   WebGL puro, sem biblioteca, para abrir até de um pen drive.
   Duas metades:

   1. Oficina — um construtor de malhas que trabalha como um
      torneiro: torneia perfis, extruda contornos com chanfro,
      varre seções ao longo de curvas. Toda aresta tem chanfro e
      normal própria, porque é o brilho correndo no chanfro que
      faz uma peça parecer usinada.

   2. Estúdio — o sombreador. Não existe luz pontual: a peça é
      iluminada por painéis de estúdio (softbox, faixas, contra-
      luz) calculados na hora, e o metal reflete esses painéis.
      Ouro polido, laca com verniz, preto piano e vidro saem do
      mesmo modelo, variando metal, rugosidade e verniz.

   Expõe window.FinckCena = { M, Malha, MAT, forma, criarMotor }.
   ============================================================ */
(() => {
  "use strict";

  const PI = Math.PI, TAU = PI * 2;
  const rad = (g) => g * PI / 180;
  const limitar = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------------------------------------------------------
     Matrizes 4×4 em coluna
     --------------------------------------------------------- */
  const mul = (a, b) => {
    const o = new Array(16);
    for (let c = 0; c < 4; c++)
      for (let l = 0; l < 4; l++)
        o[c * 4 + l] = a[l] * b[c * 4] + a[4 + l] * b[c * 4 + 1] + a[8 + l] * b[c * 4 + 2] + a[12 + l] * b[c * 4 + 3];
    return o;
  };

  const M = {
    id: () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    mover: (x = 0, y = 0, z = 0) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1],
    escala: (x, y = x, z = x) => [x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1],
    rx: (a) => { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]; },
    ry: (a) => { const c = Math.cos(a), s = Math.sin(a); return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]; },
    rz: (a) => { const c = Math.cos(a), s = Math.sin(a); return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]; },
    juntar: (...ms) => ms.reduce(mul),
    perspectiva: (f, perto, longe) => {
      const d = 1 / (perto - longe);
      return [f, 0, 0, 0, 0, f, 0, 0, 0, 0, (longe + perto) * d, -1, 0, 0, 2 * longe * perto * d, 0];
    },
  };

  /* matriz das normais: cofatores do bloco 3×3 (vale para escala desigual) */
  const cofatores = (m) => {
    const a = m[0], b = m[4], c = m[8], d = m[1], e = m[5], f = m[9], g = m[2], h = m[6], i = m[10];
    const C = [e * i - f * h, -(d * i - f * g), d * h - e * g,
      -(b * i - c * h), a * i - c * g, -(a * h - b * g),
      b * f - c * e, -(a * f - c * d), a * e - b * d];
    const det = a * C[0] + b * C[1] + c * C[2];
    if (det < 0) for (let k = 0; k < 9; k++) C[k] = -C[k];
    return C;
  };


  /* ---------------------------------------------------------
     Materiais — cor em sRGB, metal, rugosidade, verniz, emissão
     --------------------------------------------------------- */
  const cor = (hex) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  const mat = (hex, metal, rug, verniz = 0, emis = 0) => ({ c: cor(hex), m: metal, r: rug, v: verniz, e: emis });

  const MAT = {
    ouro: mat("#ffcf6a", 1, .2),
    ouroFosco: mat("#e9b650", 1, .42),
    ouroEscuro: mat("#b98a2e", 1, .3),
    cromo: mat("#dfe3ee", 1, .14),
    aco: mat("#aab0c2", 1, .34),
    grafite: mat("#34303f", .85, .42),
    laca: mat("#6220c8", 0, .3, 1),
    lacaClara: mat("#8f44ea", 0, .3, 1),
    lacaFunda: mat("#2d1058", 0, .3, 1),
    piano: mat("#100d16", 0, .22, 1),
    esmalte: mat("#f4f0fa", 0, .34, .7),
    papel: mat("#efe8da", 0, .92),
    areia: mat("#ffc94a", .35, .62),
    verde: mat("#0f9a5e", 0, .32, 1),
    verdeFundo: mat("#0c4a36", 0, .36, 1),
    rubi: mat("#e23a56", 0, .3, 1),
    vidro: mat("#c9b4ff", 0, .04),
    luzOuro: mat("#ffcf5a", 0, .5, 0, 1),
    luzRoxa: mat("#9d4dff", 0, .5, 0, 1),
    luzMenta: mat("#64ffc1", 0, .5, 0, 1),
    luzBranca: mat("#f1e9ff", 0, .5, 0, 1),
    painel: mat("#4a2c8f", 0, .5, 0, .42),
    feltro: mat("#1b1724", 0, .8),
  };


  /* ---------------------------------------------------------
     Formas 2D — contornos anti-horários para extrudar
     --------------------------------------------------------- */
  const forma = {
    circulo(r, n = 48) {
      const p = [];
      for (let i = 0; i < n; i++) p.push([Math.cos(i / n * TAU) * r, Math.sin(i / n * TAU) * r]);
      return p;
    },

    arco(cx, cy, r, a0, a1, n = 16) {
      const p = [];
      for (let i = 0; i <= n; i++) {
        const a = a0 + (a1 - a0) * i / n;
        p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
      }
      return p;
    },

    retangulo(l, a, r = 0, n = 6) {
      const x = l / 2, y = a / 2;
      if (r <= 0) return [[-x, -y], [x, -y], [x, y], [-x, y]];
      r = Math.min(r, x, y);
      return [
        ...forma.arco(x - r, -y + r, r, -PI / 2, 0, n),
        ...forma.arco(x - r, y - r, r, 0, PI / 2, n),
        ...forma.arco(-x + r, y - r, r, PI / 2, PI, n),
        ...forma.arco(-x + r, -y + r, r, PI, PI * 1.5, n),
      ];
    },

    /* curva de Bézier cúbica amostrada (sem repetir o ponto final) */
    bezier(p0, p1, p2, p3, n = 12, comFim = false) {
      const p = [];
      const fim = comFim ? n : n - 1;
      for (let i = 0; i <= fim; i++) {
        const t = i / n, u = 1 - t;
        p.push([
          u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
          u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
        ]);
      }
      return p;
    },

    /* linha com espessura → contorno fechado, pontas redondas */
    traco(pts, larg, o = {}) {
      const n = pts.length, h = larg / 2, esq = [], dir = [];
      const tang = (i) => {
        const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
        const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
        return [dx / l, dy / l];
      };
      for (let i = 0; i < n; i++) {
        const t = tang(i), w = o.afina ? h * o.afina(i / (n - 1)) : h;
        esq.push([pts[i][0] - t[1] * w, pts[i][1] + t[0] * w]);
        dir.push([pts[i][0] + t[1] * w, pts[i][1] - t[0] * w]);
      }
      const saida = [...dir];
      const ponta = (i, sentido) => {
        const t = tang(i), base = Math.atan2(t[1], t[0]) + (sentido > 0 ? -PI / 2 : PI / 2);
        const k = o.pontas === "reta" ? 0 : 7;
        const w = o.afina ? h * o.afina(i / (n - 1)) : h;
        for (let j = 1; j < k; j++) {
          const a = base + PI * j / k;
          saida.push([pts[i][0] + Math.cos(a) * w, pts[i][1] + Math.sin(a) * w]);
        }
      };
      ponta(n - 1, 1);
      for (let i = n - 1; i >= 0; i--) saida.push(esq[i]);
      ponta(0, -1);
      return saida;
    },

    area(p) {
      let s = 0;
      for (let i = 0; i < p.length; i++) {
        const a = p[i], b = p[(i + 1) % p.length];
        s += a[0] * b[1] - b[0] * a[1];
      }
      return s / 2;
    },

    mover: (p, dx, dy) => p.map(([x, y]) => [x + dx, y + dy]),
    escalar: (p, sx, sy = sx) => p.map(([x, y]) => [x * sx, y * sy]),
    girar: (p, a) => { const c = Math.cos(a), s = Math.sin(a); return p.map(([x, y]) => [x * c - y * s, x * s + y * c]); },
  };

  /* triangulação por corte de orelhas (contorno simples, anti-horário) */
  const triangular = (p) => {
    const idx = p.map((_, i) => i), tri = [];
    const cruz = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const dentro = (q, a, b, c) => cruz(a, b, q) >= 0 && cruz(b, c, q) >= 0 && cruz(c, a, q) >= 0;
    let guarda = 0;
    while (idx.length > 3 && guarda++ < 20000) {
      let achou = false;
      for (let i = 0; i < idx.length; i++) {
        const a = idx[(i + idx.length - 1) % idx.length], b = idx[i], c = idx[(i + 1) % idx.length];
        if (cruz(p[a], p[b], p[c]) <= 1e-10) continue;
        let ocupado = false;
        for (const j of idx) {
          if (j === a || j === b || j === c) continue;
          if (dentro(p[j], p[a], p[b], p[c])) { ocupado = true; break; }
        }
        if (ocupado) continue;
        tri.push(a, b, c);
        idx.splice(i, 1);
        achou = true;
        break;
      }
      if (!achou) {
        tri.push(idx[0], idx[1], idx[2]);
        idx.splice(1, 1);
      }
    }
    if (idx.length === 3) tri.push(idx[0], idx[1], idx[2]);
    return tri;
  };


  /* ---------------------------------------------------------
     Oficina — construtor de malhas
     --------------------------------------------------------- */
  class Malha {
    constructor() {
      this.pos = [];
      this.atr = [];
      this.idx = [];
      this.qtd = 0;
      this.pilha = [M.id()];
      this.normais = [cofatores(M.id())];
      this.m = MAT.ouro;
      this.oclusao = 255;
    }

    usar(m) { this.m = m; return this; }

    /* escurece os vértices seguintes: frestas, fundos, encaixes */
    sombra(v) { this.oclusao = Math.round(limitar(v, 0, 1) * 255); return this; }

    /* tudo o que for construído dentro de fn sai transformado por T */
    em(T, fn) {
      const topo = mul(this.pilha[this.pilha.length - 1], T);
      this.pilha.push(topo);
      this.normais.push(cofatores(topo));
      fn(this);
      this.pilha.pop();
      this.normais.pop();
      return this;
    }

    v(x, y, z, nx, ny, nz) {
      const t = this.pilha[this.pilha.length - 1], c = this.normais[this.normais.length - 1];
      let ax = c[0] * nx + c[1] * ny + c[2] * nz;
      let ay = c[3] * nx + c[4] * ny + c[5] * nz;
      let az = c[6] * nx + c[7] * ny + c[8] * nz;
      const l = Math.hypot(ax, ay, az) || 1;
      ax /= l; ay /= l; az /= l;
      this.pos.push(
        t[0] * x + t[4] * y + t[8] * z + t[12],
        t[1] * x + t[5] * y + t[9] * z + t[13],
        t[2] * x + t[6] * y + t[10] * z + t[14],
        ax, ay, az);
      const m = this.m;
      this.atr.push(m.c[0], m.c[1], m.c[2], this.oclusao,
        Math.round(m.m * 255), Math.round(m.r * 255), Math.round(m.v * 255), Math.round(m.e * 255));
      return this.qtd++;
    }

    tri(a, b, c) { this.idx.push(a, b, c); }
    quad(a, b, c, d) { this.idx.push(a, b, c, a, c, d); }

    /* ---- torno: gira um perfil [raio, altura] em volta do eixo Y ----
       O perfil corre no sentido anti-horário do plano (raio, altura):
       por baixo de dentro para fora, sobe pela lateral, volta por cima.
       Quina acima do limite "suave" vira aresta viva. */
    torno(perfil, o = {}) {
      const seg = o.seg || 56, a0 = o.de || 0, a1 = o.ate === undefined ? TAU : o.ate;
      const lim = Math.cos(rad(o.suave === undefined ? 38 : o.suave));
      const n = perfil.length, ns = [];
      for (let i = 0; i < n - 1; i++) {
        const dr = perfil[i + 1][0] - perfil[i][0], dy = perfil[i + 1][1] - perfil[i][1];
        const l = Math.hypot(dr, dy) || 1;
        ns.push([dy / l, -dr / l]);
      }
      const aneis = [], sai = [], entra = [];
      const anel = (i, nr, ny) => {
        const base = this.qtd;
        for (let k = 0; k <= seg; k++) {
          const a = a0 + (a1 - a0) * k / seg, c = Math.cos(a), s = Math.sin(a);
          this.v(perfil[i][0] * c, perfil[i][1], perfil[i][0] * s, nr * c, ny, nr * s);
        }
        aneis.push(base);
        return base;
      };
      for (let i = 0; i < n; i++) {
        const antes = i > 0 ? ns[i - 1] : (o.fechado ? ns[n - 2] : null);
        const depois = i < n - 1 ? ns[i] : (o.fechado ? ns[0] : null);
        if (antes && depois && antes[0] * depois[0] + antes[1] * depois[1] >= lim) {
          const x = antes[0] + depois[0], y = antes[1] + depois[1], l = Math.hypot(x, y) || 1;
          entra[i] = sai[i] = anel(i, x / l, y / l);
        } else {
          if (antes) entra[i] = anel(i, antes[0], antes[1]);
          if (depois) sai[i] = anel(i, depois[0], depois[1]);
        }
      }
      for (let i = 0; i < n - 1; i++) {
        if (perfil[i][0] < 1e-9 && perfil[i + 1][0] < 1e-9) continue;
        const A = sai[i], B = entra[i + 1];
        for (let k = 0; k < seg; k++) {
          this.tri(A + k, B + k, A + k + 1);
          this.tri(B + k, B + k + 1, A + k + 1);
        }
      }
      return this;
    }

    /* cilindro com chanfro nas duas bordas, de pé no eixo Y */
    cilindro(r, alt, o = {}) {
      const c = Math.min(o.chanfro === undefined ? Math.min(r, alt) * .12 : o.chanfro, r, alt / 2);
      const h = alt / 2, p = [[0, -h]];
      if (c > 0) p.push([r - c, -h], [r, -h + c], [r, h - c], [r - c, h]);
      else p.push([r, -h], [r, h]);
      p.push([0, h]);
      return this.torno(p, { seg: o.seg || 40, suave: o.suave === undefined ? 30 : o.suave });
    }

    esfera(r, o = {}) {
      const n = o.aneis || 20, p = [];
      const de = o.latDe === undefined ? -PI / 2 : o.latDe, ate = o.latAte === undefined ? PI / 2 : o.latAte;
      for (let i = 0; i <= n; i++) {
        const a = de + (ate - de) * i / n;
        p.push([Math.cos(a) * r * (o.achata || 1), Math.sin(a) * r]);
      }
      return this.torno(p, { seg: o.seg || 36, suave: 180 });
    }

    toro(R, r, o = {}) {
      const n = o.segr || 14, p = [];
      for (let i = 0; i <= n; i++) {
        const a = -PI / 2 + TAU * i / n;
        p.push([R + Math.cos(a) * r, Math.sin(a) * r * (o.achata || 1)]);
      }
      return this.torno(p, { seg: o.seg || 64, suave: 180, fechado: true, de: o.de, ate: o.ate });
    }

    /* ---- extrusão: contorno no plano XY, espessura em Z, chanfro nas bordas ---- */
    extrusao(cont, o = {}) {
      if (forma.area(cont) < 0) cont = [...cont].reverse();
      const D = o.prof === undefined ? .1 : o.prof;
      const c = Math.min(o.chanfro || 0, D / 2);
      const k = o.passos === undefined ? 3 : o.passos;
      const lim = Math.cos(rad(o.suave === undefined ? 32 : o.suave));
      const n = cont.length, h = D / 2;

      const borda = [];
      for (let i = 0; i < n; i++) {
        const a = cont[i], b = cont[(i + 1) % n];
        const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
        borda.push([dy / l, -dx / l]);
      }
      const vert = [];
      for (let i = 0; i < n; i++) {
        const antes = borda[(i + n - 1) % n], depois = borda[i];
        let mx = antes[0] + depois[0], my = antes[1] + depois[1];
        const l = Math.hypot(mx, my) || 1;
        mx /= l; my /= l;
        const alcance = 1 / Math.max(.34, mx * depois[0] + my * depois[1]);
        const liso = antes[0] * depois[0] + antes[1] * depois[1] >= lim;
        vert.push({ mx: mx * alcance, my: my * alcance, ns: liso ? [[mx, my]] : [antes, depois] });
      }

      /* anéis da borda de trás até a borda da frente */
      const aneis = [];
      const faixas = [];
      const anel = (recuo, z, ang) => {
        const ca = Math.cos(ang), sa = Math.sin(ang), tab = [];
        for (let i = 0; i < n; i++) {
          const q = vert[i], x = cont[i][0] - q.mx * recuo, y = cont[i][1] - q.my * recuo;
          const ids = q.ns.map((nn) => this.v(x, y, z, nn[0] * ca, nn[1] * ca, sa));
          tab.push(ids.length === 1 ? [ids[0], ids[0]] : ids);
        }
        aneis.push(tab);
        return aneis.length - 1;
      };
      if (c <= 0) {
        faixas.push([anel(0, -h, 0), anel(0, h, 0)]);
      } else if (k <= 1) {
        faixas.push([anel(c, -h, -PI / 4), anel(0, -h + c, -PI / 4)]);
        faixas.push([anel(0, -h + c, 0), anel(0, h - c, 0)]);
        faixas.push([anel(0, h - c, PI / 4), anel(c, h, PI / 4)]);
      } else {
        let ant = -1;
        for (let j = 0; j <= k; j++) {
          const a = -PI / 2 + j / k * PI / 2;
          const id = anel(c * (1 - Math.cos(a)), -h + c * (1 + Math.sin(a)), a);
          if (ant >= 0) faixas.push([ant, id]);
          ant = id;
        }
        for (let j = 0; j <= k; j++) {
          const a = j / k * PI / 2;
          const id = anel(c * (1 - Math.cos(a)), h - c * (1 - Math.sin(a)), a);
          faixas.push([ant, id]);
          ant = id;
        }
      }
      for (const [A, B] of faixas) {
        const ta = aneis[A], tb = aneis[B];
        for (let i = 0; i < n; i++) {
          const j = (i + 1) % n;
          this.quad(ta[i][1], ta[j][0], tb[j][0], tb[i][1]);
        }
      }

      /* tampas */
      const topo = cont.map((p, i) => [p[0] - vert[i].mx * c, p[1] - vert[i].my * c]);
      const tris = triangular(topo);
      const tampa = (z, nz) => {
        const base = this.qtd;
        for (const p of topo) this.v(p[0], p[1], z, 0, 0, nz);
        for (let i = 0; i < tris.length; i += 3) this.tri(base + tris[i], base + tris[i + 1], base + tris[i + 2]);
      };
      if (!o.semFrente) tampa(h, 1);
      if (!o.semTras) tampa(-h, -1);
      return this;
    }

    /* placa de cantos arredondados no plano XY */
    caixa(l, a, p, o = {}) {
      return this.extrusao(forma.retangulo(l, a, o.r || 0, o.n || 6), {
        prof: p, chanfro: o.chanfro === undefined ? Math.min(l, a, p) * .12 : o.chanfro,
        passos: o.passos === undefined ? 2 : o.passos, suave: o.suave,
      });
    }

    /* ---- varredura: leva uma seção 2D ao longo de uma curva 3D ---- */
    varrer(pts, sec, o = {}) {
      const n = pts.length, fechado = !!o.fechado;
      const lim = Math.cos(rad(o.suave === undefined ? 32 : o.suave));
      const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
      const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
      const ponto = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
      const vetorial = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

      const T = [];
      for (let i = 0; i < n; i++) {
        const a = pts[fechado ? (i + n - 1) % n : Math.max(0, i - 1)];
        const b = pts[fechado ? (i + 1) % n : Math.min(n - 1, i + 1)];
        T.push(norm(sub(b, a)));
      }
      const N = [];
      for (let i = 0; i < n; i++) {
        let ref;
        if (o.cima) ref = typeof o.cima === "function" ? o.cima(i / (n - 1), i) : o.cima;
        else if (i === 0) ref = Math.abs(T[0][1]) < .9 ? [0, 1, 0] : [1, 0, 0];
        else ref = N[i - 1];
        const k = ponto(ref, T[i]);
        N.push(norm([ref[0] - T[i][0] * k, ref[1] - T[i][1] * k, ref[2] - T[i][2] * k]));
      }

      if (forma.area(sec) < 0) sec = [...sec].reverse();
      const m = sec.length, bordas = [];
      for (let i = 0; i < m; i++) {
        const a = sec[i], b = sec[(i + 1) % m];
        const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
        bordas.push([dy / l, -dx / l]);
      }
      const quinas = [];
      for (let i = 0; i < m; i++) {
        const antes = bordas[(i + m - 1) % m], depois = bordas[i];
        if (antes[0] * depois[0] + antes[1] * depois[1] >= lim) {
          const x = antes[0] + depois[0], y = antes[1] + depois[1], l = Math.hypot(x, y) || 1;
          quinas.push([[x / l, y / l]]);
        } else quinas.push([antes, depois]);
      }

      const aneis = [];
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1), B = vetorial(T[i], N[i]);
        const e = o.escala ? o.escala(t) : 1, g = o.torcer ? o.torcer(t) : 0;
        const cg = Math.cos(g), sg = Math.sin(g), tab = [];
        for (let j = 0; j < m; j++) {
          const u = (sec[j][0] * cg - sec[j][1] * sg) * e, w = (sec[j][0] * sg + sec[j][1] * cg) * e;
          const ids = quinas[j].map((q) => {
            const nu = q[0] * cg - q[1] * sg, nw = q[0] * sg + q[1] * cg;
            return this.v(
              pts[i][0] + B[0] * u + N[i][0] * w, pts[i][1] + B[1] * u + N[i][1] * w, pts[i][2] + B[2] * u + N[i][2] * w,
              B[0] * nu + N[i][0] * nw, B[1] * nu + N[i][1] * nw, B[2] * nu + N[i][2] * nw);
          });
          tab.push(ids.length === 1 ? [ids[0], ids[0]] : ids);
        }
        aneis.push(tab);
      }
      const ultimo = fechado ? n : n - 1;
      for (let i = 0; i < ultimo; i++) {
        const ta = aneis[i], tb = aneis[(i + 1) % n];
        for (let j = 0; j < m; j++) {
          const p = (j + 1) % m;
          this.quad(ta[j][1], ta[p][0], tb[p][0], tb[j][1]);
        }
      }
      if (!fechado && o.tampas !== false) {
        const tris = triangular(sec);
        for (const i of [0, n - 1]) {
          const t = i / (n - 1), B = vetorial(T[i], N[i]), e = o.escala ? o.escala(t) : 1;
          if (e < 1e-4) continue;
          const g = o.torcer ? o.torcer(t) : 0, cg = Math.cos(g), sg = Math.sin(g);
          const s = i === 0 ? -1 : 1, base = this.qtd;
          for (let j = 0; j < m; j++) {
            const u = (sec[j][0] * cg - sec[j][1] * sg) * e, w = (sec[j][0] * sg + sec[j][1] * cg) * e;
            this.v(pts[i][0] + B[0] * u + N[i][0] * w, pts[i][1] + B[1] * u + N[i][1] * w, pts[i][2] + B[2] * u + N[i][2] * w,
              T[i][0] * s, T[i][1] * s, T[i][2] * s);
          }
          for (let j = 0; j < tris.length; j += 3) this.tri(base + tris[j], base + tris[j + 1], base + tris[j + 2]);
        }
      }
      return this;
    }

    tubo(pts, r, o = {}) {
      return this.varrer(pts, forma.circulo(r, o.seg || 10), Object.assign({ suave: 180 }, o));
    }

    /* repete fn em volta do eixo Y: serrilhas, marcações, colunas */
    emVolta(vezes, fn, o = {}) {
      const inicio = o.de || 0, total = o.ate === undefined ? TAU : o.ate - inicio;
      for (let i = 0; i < vezes; i++) {
        const a = inicio + total * i / (o.ate === undefined ? vezes : Math.max(1, vezes - 1));
        this.em(M.ry(a), () => fn(i, a));
      }
      return this;
    }
  }


  /* ---------------------------------------------------------
     Estúdio — painéis de luz e sombreador
     --------------------------------------------------------- */
  const PAINEIS = [
    /* direção até a luz, meia-largura e meia-altura, cor, força */
    { d: [-.5, .6, .62], t: [.62, .44], c: [1, .95, .88], f: 3.4 },   // softbox principal
    { d: [.92, .12, .36], t: [.11, .95], c: [.8, .66, 1], f: 3.4 },   // faixa lilás à direita
    { d: [-.7, .25, -.66], t: [.16, .8], c: [1, .76, .36], f: 2.8 },  // contraluz dourada
    { d: [.6, .45, -.66], t: [.3, .5], c: [.64, .32, 1], f: 2.4 },    // contraluz roxa
    { d: [0, 1, .12], t: [.75, .75], c: [1, .95, .9], f: 1.35 },      // teto
    { d: [.1, -.05, 1], t: [1.5, 1.1], c: [1, .9, .82], f: .3 },      // preenchimento frontal
    { d: [.25, .45, .86], t: [.05, .05], c: [1, 1, 1], f: 9 },        // ponto de brilho
    { d: [0, -1, .1], t: [1.2, 1.2], c: [.62, .42, .6], f: .6 },      // rebatida do chão
  ];


  const glsl = (v) => `vec3(${v.map((x) => x.toFixed(4)).join(",")})`;
  const unit = (v) => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
  const vet = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

  let linhasEspelho = "", linhasDifusa = "";
  for (const p of PAINEIS) {
    const d = unit(p.d);
    const u = unit(vet(Math.abs(d[1]) > .95 ? [0, 0, 1] : [0, 1, 0], d));
    const w = vet(d, u);
    const cor3 = p.c.map((x) => x * p.f);
    linhasEspelho += `  c += ${glsl(cor3)} * ganho * painel(d, ${glsl(d)}, ${glsl(u)}, ${glsl(w)}, vec2(${p.t[0].toFixed(3)},${p.t[1].toFixed(3)}), sua);\n`;
    const peso = Math.min(p.t[0] * p.t[1] * 1.7, .55);
    linhasDifusa += `  c += ${glsl(cor3.map((x) => x * peso))} * max(dot(n, ${glsl(d)}), 0.0);\n`;
  }

  const VERT = `
attribute vec3 aPos;
attribute vec3 aNor;
attribute vec4 aCor;
attribute vec4 aProp;
uniform mat4 uVP, uM;
uniform vec2 uTela, uCentro;
varying vec3 vN, vP;
varying vec4 vCor, vProp;
void main() {
  vec4 m = uM * vec4(aPos, 1.0);
  vP = m.xyz;
  vN = (uM * vec4(aNor, 0.0)).xyz;
  vCor = aCor;
  vProp = aProp;
  vec4 c = uVP * m;
  c.xy = c.xy * uTela + uCentro * c.w;
  gl_Position = c;
}`;

  const FRAG = `
precision highp float;
varying vec3 vN, vP;
varying vec4 vCor, vProp;
uniform vec3 uCam;
uniform float uPasse, uBrilho, uLuz;

float painel(vec3 d, vec3 c, vec3 u, vec3 v, vec2 s, float sua) {
  float k = dot(d, c);
  vec2 q = vec2(dot(d, u), dot(d, v)) / max(k, 0.001);
  vec2 e = 1.0 - smoothstep(s - sua, s + sua, abs(q));
  return e.x * e.y * smoothstep(0.0, 0.25, k);
}

/* o que a peça "vê" em cada direção: o estúdio inteiro */
vec3 ambiente(vec3 d, float rug) {
  float sua = 0.03 + rug * 0.3 + rug * rug * 1.1;
  float ganho = 1.0 / (1.0 + rug * 2.2);
  vec3 c = mix(vec3(0.034, 0.026, 0.046), vec3(0.17, 0.14, 0.22), smoothstep(-0.3, 1.0, d.y));
  c += vec3(0.19, 0.15, 0.25) * exp(-abs(d.y + 0.05) * 4.0) * (1.0 - rug * 0.6);
${linhasEspelho}  return c;
}

vec3 difusa(vec3 n) {
  vec3 c = mix(vec3(0.022, 0.013, 0.045), vec3(0.11, 0.075, 0.18), n.y * 0.5 + 0.5);
${linhasDifusa}  return c;
}

vec3 tom(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

void main() {
  vec3 N = normalize(vN);
  vec3 V = normalize(uCam - vP);
  float frente = dot(N, V);
  if (frente < 0.0) N = -N;
  float nv = max(dot(N, V), 0.0);
  vec3 R = reflect(-V, N);
  vec3 base = pow(vCor.rgb, vec3(2.2));

  if (uPasse > 0.5) {
    /* vidro: primeiro as faces de trás, depois as da frente */
    if ((uPasse < 1.5) == (frente > 0.0)) discard;
    float f = 0.045 + 0.955 * pow(1.0 - nv, 3.6);
    vec3 cor = ambiente(R, 0.035) * f * (uPasse < 1.5 ? 0.55 : 1.0) + base * 0.035;
    cor = pow(tom(cor * uLuz), vec3(1.0 / 2.2));
    gl_FragColor = vec4(cor, clamp(f * 0.75 + 0.05, 0.0, 1.0));
    return;
  }

  float ao = vCor.a;
  float metal = vProp.x, rug = max(vProp.y, 0.04), verniz = vProp.z, emis = vProp.w;
  vec3 f0 = mix(vec3(0.04), base, metal);
  vec3 fres = f0 + (max(vec3(1.0 - rug), f0) - f0) * pow(1.0 - nv, 5.0);
  vec3 cor = base * (1.0 - metal) * difusa(N) * 0.64 * ao + ambiente(R, rug) * fres * mix(1.0, ao, 0.75);
  float fv = (0.04 + 0.96 * pow(1.0 - nv, 5.0)) * verniz;
  cor = cor * (1.0 - fv) + ambiente(R, 0.05) * fv;
  cor += base * emis * uBrilho * 1.25;
  cor = pow(tom(cor * uLuz), vec3(1.0 / 2.2));
  gl_FragColor = vec4(cor, 1.0);
}`;

  const criarMotor = (canvas) => {
    const opcoes = { alpha: true, antialias: true, premultipliedAlpha: true, depth: true, stencil: false, powerPreference: "high-performance" };
    let gl = null;
    try {
      gl = canvas.getContext("webgl", opcoes) || canvas.getContext("experimental-webgl", opcoes);
    } catch (_) { gl = null; }
    if (!gl || !gl.getExtension("OES_element_index_uint")) return null;

    const compilar = (tipo, fonte) => {
      const s = gl.createShader(tipo);
      gl.shaderSource(s, fonte);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "sombreador");
      return s;
    };

    let prog;
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, compilar(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compilar(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || "programa");
    } catch (erro) {
      if (window.console) console.warn("FinCK 3D indisponível:", erro.message);
      return null;
    }

    gl.useProgram(prog);
    const at = {}, un = {};
    for (const nome of ["aPos", "aNor", "aCor", "aProp"]) at[nome] = gl.getAttribLocation(prog, nome);
    for (const nome of ["uVP", "uM", "uTela", "uCentro", "uCam", "uPasse", "uBrilho", "uLuz"]) un[nome] = gl.getUniformLocation(prog, nome);
    for (const k in at) gl.enableVertexAttribArray(at[k]);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.disable(gl.CULL_FACE);
    gl.clearColor(0, 0, 0, 0);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    /* envia a malha para a placa e guarda só o que o desenho precisa */
    const enviar = (malha) => {
      const g = {
        pos: gl.createBuffer(), atr: gl.createBuffer(), idx: gl.createBuffer(),
        qtd: malha.idx.length, vertices: malha.qtd,
      };
      gl.bindBuffer(gl.ARRAY_BUFFER, g.pos);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(malha.pos), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, g.atr);
      gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(malha.atr), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g.idx);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(malha.idx), gl.STATIC_DRAW);
      return g;
    };

    let ligado = null;
    const ligar = (g) => {
      if (ligado === g) return;
      ligado = g;
      gl.bindBuffer(gl.ARRAY_BUFFER, g.pos);
      gl.vertexAttribPointer(at.aPos, 3, gl.FLOAT, false, 24, 0);
      gl.vertexAttribPointer(at.aNor, 3, gl.FLOAT, false, 24, 12);
      gl.bindBuffer(gl.ARRAY_BUFFER, g.atr);
      gl.vertexAttribPointer(at.aCor, 4, gl.UNSIGNED_BYTE, true, 8, 0);
      gl.vertexAttribPointer(at.aProp, 4, gl.UNSIGNED_BYTE, true, 8, 4);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g.idx);
    };

    const DIST = 15, FOCO = 1 / Math.tan(rad(8.5));
    const PROJ = M.perspectiva(FOCO, DIST - 9, DIST + 9);

    const tracar = (item) => {
      if (!item.geo.gl) item.geo.gl = enviar(item.geo);
      ligar(item.geo.gl);
      gl.uniformMatrix4fv(un.uM, false, item.m);
      gl.uniform1f(un.uBrilho, item.brilho === undefined ? 1 : item.brilho);
      gl.drawElements(gl.TRIANGLES, item.geo.gl.qtd, gl.UNSIGNED_INT, 0);
    };

    /* cada cena tem a própria câmera, presa a um ponto da tela:
       x, y em pixels CSS, un = pixels por unidade do modelo */
    const quadro = (cenas, largura, altura) => {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      let primeira = true;
      for (const cena of cenas) {
        if (!cena.itens.length) continue;
        if (!primeira) gl.clear(gl.DEPTH_BUFFER_BIT);
        primeira = false;

        const incl = cena.inclina || 0;
        const vista = mul(M.mover(0, 0, -DIST), M.rx(incl));
        const k = cena.un * DIST / FOCO;
        gl.uniformMatrix4fv(un.uVP, false, mul(PROJ, vista));
        gl.uniform2f(un.uTela, k / (largura / 2), k / (altura / 2));
        gl.uniform2f(un.uCentro, cena.x / largura * 2 - 1, 1 - cena.y / altura * 2);
        gl.uniform3f(un.uCam, 0, DIST * Math.sin(incl), DIST * Math.cos(incl));
        gl.uniform1f(un.uLuz, cena.luz === undefined ? 1 : cena.luz);

        /* quem só esconde: escreve profundidade, não escreve cor */
        let temVidro = false, temMascara = false;
        for (const it of cena.itens) { if (it.mascara) temMascara = true; if (it.vidro) temVidro = true; }
        gl.uniform1f(un.uPasse, 0);
        if (temMascara) {
          gl.colorMask(false, false, false, false);
          for (const it of cena.itens) if (it.mascara) tracar(it);
          gl.colorMask(true, true, true, true);
        }
        for (const it of cena.itens) if (!it.mascara && !it.vidro) tracar(it);

        if (temVidro) {
          gl.enable(gl.BLEND);
          gl.depthMask(false);
          for (const passe of [1, 2]) {
            gl.uniform1f(un.uPasse, passe);
            for (const it of cena.itens) if (it.vidro) tracar(it);
          }
          gl.depthMask(true);
          gl.disable(gl.BLEND);
        }
      }
    };

    return { gl, quadro, limpar: () => { gl.viewport(0, 0, canvas.width, canvas.height); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); } };
  };

  window.FinckCena = { M, Malha, MAT, forma, criarMotor, PI, TAU, rad, limitar };
})();
