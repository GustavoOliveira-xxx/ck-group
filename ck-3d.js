/* ============================================================
   Conscious Knowledge · motor 3D do site
   WebGL puro, sem biblioteca. Cada "palco" é um <canvas> que só
   existe enquanto está perto da tela e só desenha enquanto está
   visível. A resolução se ajusta sozinha ao aparelho: se os
   quadros vierem lentos, o palco diminui a nitidez antes de
   deixar a página travar.

   Os objetos dos produtos são montados peça a peça, como em
   relojoaria: chanfros, serrilhas, engrenagens e ponteiros
   facetados, em ouro polido, laca roxa e tinta preta.

   Uso no HTML:  <div data-palco="emblema|anatomia|relogio|escada|agenda|giroscopio">
   ============================================================ */
(() => {
  "use strict";

  const raiz = document.documentElement;
  const semMovimento = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const nav = navigator;
  const modesto =
    (nav.deviceMemory && nav.deviceMemory <= 4) ||
    (nav.hardwareConcurrency && nav.hardwareConcurrency <= 4) ||
    (nav.connection && nav.connection.saveData);
  const TETO_DPR = modesto ? 1.5 : 2;
  const PI = Math.PI, TAU = PI * 2;

  /* ---------- matemática mínima (matrizes 4x4 em coluna) ---------- */
  const perspectiva = (tanMeio, aspecto, perto, longe) => {
    const f = 1 / tanMeio, d = 1 / (perto - longe);
    return [f / aspecto, 0, 0, 0, 0, f, 0, 0, 0, 0, (longe + perto) * d, -1, 0, 0, 2 * longe * perto * d, 0];
  };
  const multiplicar = (a, b) => {
    const o = new Array(16);
    for (let c = 0; c < 4; c++)
      for (let l = 0; l < 4; l++)
        o[c * 4 + l] = a[l] * b[c * 4] + a[4 + l] * b[c * 4 + 1] + a[8 + l] * b[c * 4 + 2] + a[12 + l] * b[c * 4 + 3];
    return o;
  };
  const rotX = (a) => { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]; };
  const rotY = (a) => { const c = Math.cos(a), s = Math.sin(a); return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]; };
  const rotZ = (a) => { const c = Math.cos(a), s = Math.sin(a); return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]; };
  const mover = (x, y, z) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];
  const escalar = (x, y = x, z = x) => [x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1];
  const compor = (...ms) => ms.reduce(multiplicar);
  const IDENT = mover(0, 0, 0);
  const limitar = (v, a, b) => Math.min(b, Math.max(a, v));
  const saida = (t) => 1 - Math.pow(1 - t, 4);
  const vaivem = (t) => t * t * (3 - 2 * t);
  const mola = (t) => 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2);     // passa um pouco do ponto e volta

  /* ---------- shaders ---------- */
  const VERT = `
attribute vec3 aPos;
attribute vec3 aNormal;
attribute vec2 aMeta;      // oclusão (0..255), parte
attribute float aMat;
uniform mat4 uModelo, uCamera;
uniform vec3 uPaleta[12];
uniform float uRecuo[12];
uniform float uExplodir;
uniform vec4 uOlhos;       // pivô esq, pivô dir, abertura esq, abertura dir
varying vec3 vN, vMundo, vCor;
varying float vOclusao, vTipo;
void main() {
  vec3 p = aPos;
  int parte = int(aMeta.y + 0.5);
  if (uExplodir > 0.0) {
    p.z += uRecuo[parte] * uExplodir;
    if (parte == 9) p.y = uOlhos.x + (p.y - uOlhos.x) * uOlhos.z;
    if (parte == 10) p.y = uOlhos.y + (p.y - uOlhos.y) * uOlhos.w;
  }
  vec4 m = uModelo * vec4(p, 1.0);
  vMundo = m.xyz;
  vN = mat3(uModelo) * aNormal;
  int mat = int(aMat + 0.5);
  vCor = uPaleta[mat];
  vTipo = (mat >= 7 && mat <= 10) ? 1.0 : (mat == 11 ? 2.0 : 0.0);
  vOclusao = aMeta.x / 255.0;
  gl_Position = uCamera * m;
}`;

  const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec3 vN, vMundo, vCor;
varying float vOclusao, vTipo;
uniform vec3 uOlho;        // posição da câmera
uniform vec3 uLuz;         // luz que segue o ponteiro
uniform float uTempo;
uniform float uVivo;       // 0: emblema (cor chapada da marca) · 1: objetos (acabamento de joalheria)

// Estúdio de luz procedural. O que faz metal parecer metal é contraste: caixas de luz de
// borda nítida contra um ambiente escuro. Teto claro, três faixas verticais, um horizonte
// magenta fino e um rebatedor dourado no chão. Gira devagar, e por isso o brilho "passa".
vec3 estudio(vec3 r) {
  float frente = smoothstep(0.3, 0.96, r.z);       // caixa de luz atrás de quem olha: não gira
  float a = uTempo * 0.2;
  float c = cos(a), s = sin(a);
  r.xz = mat2(c, -s, s, c) * r.xz;
  float az = atan(r.z, r.x);
  vec3 suave = mix(vec3(0.02, 0.008, 0.045), vec3(0.10, 0.045, 0.17), smoothstep(-1.0, 1.0, r.y));
  suave += vec3(1.0, 0.95, 0.88) * smoothstep(0.62, 0.9, r.y) * 1.5;
  float fina = smoothstep(0.985, 1.0, sin(az * 2.0 + 0.6 + r.y * 1.3)) * smoothstep(0.95, 0.0, abs(r.y));
  suave += vec3(1.0, 0.9, 0.72) * fina * fina * 2.8;
  suave += vec3(0.62, 0.12, 1.0) * smoothstep(0.15, 0.95, -r.y) * 0.6;
  if (uVivo < 0.5) return suave;

  vec3 cor = mix(vec3(0.085, 0.04, 0.012), vec3(0.028, 0.012, 0.07), smoothstep(-0.07, 0.07, r.y));
  cor += vec3(0.95, 0.3, 1.0) * exp(-abs(r.y) * 30.0) * 0.55;
  cor += vec3(1.0, 0.96, 0.9) * smoothstep(0.56, 0.62, r.y) * 1.9;
  float faixa = smoothstep(0.86, 0.9, cos(az * 3.0 + 0.6)) * smoothstep(0.52, 0.46, abs(r.y - 0.04));
  cor += vec3(1.0, 0.9, 0.74) * faixa * 2.6;
  cor += vec3(1.0, 0.66, 0.16) * smoothstep(-0.3, -0.72, r.y) * 0.5;
  cor += vec3(1.0, 0.97, 0.93) * frente * 1.05;
  return cor;
}

void main() {
  vec3 N = normalize(vN);
  vec3 V = normalize(uOlho - vMundo);
  vec3 R = reflect(-V, N);
  float nv = max(dot(N, V), 0.0);
  float fresnel = pow(1.0 - nv, 5.0);
  vec3 amb = estudio(R);

  vec3 L1 = normalize(vec3(-0.45, 0.75, 0.62));
  vec3 L2 = normalize(uLuz);
  float d1 = max(dot(N, L1), 0.0);
  float d2 = max(dot(N, L2), 0.0);
  // o brilho pontual só aparece onde a superfície curva (bordas arredondadas, anéis, esferas).
  // Numa face plana ele cobriria a face inteira de branco e lavaria a cor da marca.
#ifdef DERIVADAS
  float curvo = clamp(length(fwidth(N)) * 36.0, 0.0, 1.0);
#else
  float curvo = 0.3;
#endif
  float e1 = pow(max(dot(N, normalize(L1 + V)), 0.0), 70.0) * curvo;
  float e2 = pow(max(dot(N, normalize(L2 + V)), 0.0), 46.0) * curvo;

  vec3 cor;
  if (vTipo > 0.5 && vTipo < 1.5) {
    // ouro. No emblema, a cor da marca manda e o reflexo só passa por cima.
    // Nos objetos, é metal polido de verdade: quase tudo que se vê é o estúdio refletido.
    vec3 chapado = vCor * (0.38 + d1 * 0.5 + d2 * 0.3 + amb * 0.6) + amb * fresnel * 0.3;
    vec3 polido = mix(vCor, vec3(1.0), fresnel * 0.5) * (amb * 1.25 + 0.035) + vCor * (d1 * 0.1 + d2 * 0.08);
    cor = mix(chapado, polido, uVivo) + vec3(1.0, 0.93, 0.7) * (e1 * 0.9 + e2 * 0.8);
  } else if (vTipo > 1.5) {
    // branco: porcelana, quase sem sombra
    cor = vCor * (0.95 + d1 * 0.45 + d2 * 0.2) + amb * (0.02 + fresnel * 0.2) + e1 * 0.4;
  } else {
    // laca: cor cheia por baixo de um verniz que reflete o estúdio
    float claro = mix(0.36 + d1 * 0.66 + d2 * 0.36, 0.3 + d1 * 0.5 + d2 * 0.3, uVivo);
    // numa face plana o reflexo do verniz viraria um véu cinza sobre a cor; ele fica para as bordas e curvas
    float verniz = mix(0.008, 0.03 * mix(0.2, 1.0, curvo), uVivo) + fresnel * mix(0.5, 0.85, uVivo);
    cor = vCor * claro + amb * verniz + vec3(1.0, 0.95, 1.0) * (e1 * 0.55 + e2 * 0.4);
    cor += vec3(0.7, 0.22, 1.0) * pow(1.0 - nv, 3.0) * 0.2 * uVivo;      // contraluz roxo nas bordas
  }
  cor *= mix(0.42, 1.0, vOclusao);
  // compressão dos brilhos pela luminância: clareia sem lavar a cor da marca
  float lum = dot(cor, vec3(0.3, 0.55, 0.15));
  cor = mix(cor / (1.0 + lum * 0.5), cor / (1.0 + cor * 0.5), 0.25);
  gl_FragColor = vec4(pow(cor, vec3(0.4545)), 1.0);
}`;

  const VERT_PONTO = `
attribute vec4 aPonto;     // xyz + fase
uniform mat4 uModelo, uCamera;
uniform float uTempo, uEscala;
uniform mediump float uFaisca;      // mesma precisão do outro shader, senão o programa não liga
varying float vBrilho;
void main() {
  vec4 m = uModelo * vec4(aPonto.xyz, 1.0);
  gl_Position = uCamera * m;
  float onda = sin(uTempo * (1.2 + fract(aPonto.w * 7.3) * 1.6) + aPonto.w * 40.0);
  // poeira pulsa devagar; faísca fica apagada quase o tempo todo e estoura de vez em quando
  float pisca = mix(0.5 + 0.5 * onda, pow(max(onda, 0.0), 22.0), uFaisca);
  vBrilho = pisca;
  gl_PointSize = uEscala * (0.6 + fract(aPonto.w * 3.7)) * (0.55 + pisca * 0.6) / gl_Position.w;
}`;
  const FRAG_PONTO = `
precision mediump float;
varying float vBrilho;
uniform vec3 uCorPonto;
uniform float uFaisca;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float r = length(d);
  float nucleo = smoothstep(0.5, 0.0, r);
  float cruz = max(smoothstep(0.05, 0.0, abs(d.x)), smoothstep(0.05, 0.0, abs(d.y))) * smoothstep(0.5, 0.05, r);
  float a = (nucleo * nucleo * 0.9 + cruz * mix(0.55, 1.0, uFaisca)) * mix(0.35 + vBrilho * 0.65, vBrilho, uFaisca);
  gl_FragColor = vec4(uCorPonto * a, 0.0);
}`;

  /* ============================================================
     OFICINA DE PEÇAS
     Cada função devolve { p, n, i }: posições, normais e índices.
     Um "molde" junta várias peças, cada uma com seu material, num
     buffer só, para o objeto inteiro sair em poucas chamadas.
     ============================================================ */
  const G = () => ({ p: [], n: [], i: [] });
  const quad = (g, a, b, c, d, na, nb, nc, nd) => {
    const k = g.p.length / 3;
    g.p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], d[0], d[1], d[2]);
    nb = nb || na; nc = nc || na; nd = nd || na;
    g.n.push(na[0], na[1], na[2], nb[0], nb[1], nb[2], nc[0], nc[1], nc[2], nd[0], nd[1], nd[2]);
    g.i.push(k, k + 1, k + 2, k, k + 2, k + 3);
  };
  const cruzar = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const unit = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  /* face plana: a normal sai da própria geometria, virada para o lado de "ref" */
  const face = (g, pts, ref) => {
    const a = pts[0], b = pts[1], c = pts[2];
    let n = unit(cruzar([b[0] - a[0], b[1] - a[1], b[2] - a[2]], [c[0] - a[0], c[1] - a[1], c[2] - a[2]]));
    if (n[0] * ref[0] + n[1] * ref[1] + n[2] * ref[2] < 0) n = [-n[0], -n[1], -n[2]];
    const k = g.p.length / 3;
    pts.forEach((p) => { g.p.push(p[0], p[1], p[2]); g.n.push(n[0], n[1], n[2]); });
    for (let j = 1; j < pts.length - 1; j++) g.i.push(k, k + j, k + j + 1);
  };

  /* contornos 2D (sentido anti-horário) */
  const ret = (w, h) => [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]];
  const circ = (r, n, fase = 0) => Array.from({ length: n }, (_, i) => { const a = fase + (i / n) * TAU; return [Math.cos(a) * r, Math.sin(a) * r]; });
  const retArred = (w, h, r, seg = 4) => {
    const o = [];
    [[w / 2 - r, h / 2 - r, 0], [-w / 2 + r, h / 2 - r, 1], [-w / 2 + r, -h / 2 + r, 2], [w / 2 - r, -h / 2 + r, 3]].forEach(([cx, cy, q]) => {
      for (let s = 0; s <= seg; s++) { const a = (q + s / seg) * PI / 2; o.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    });
    return o;
  };
  const trapezio = (x0, l0, x1, l1) => [[x0, -l0 / 2], [x1, -l1 / 2], [x1, l1 / 2], [x0, l0 / 2]];

  /* prisma: contorno convexo extrudado em Z, com chanfro nas duas faces */
  const prisma = (pts, h, b = 0, liso = false) => {
    const g = G(), n = pts.length, z1 = h / 2, z0 = -h / 2, s = Math.SQRT1_2;
    const en = pts.map((p, i) => { const q = pts[(i + 1) % n], dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1; return [dy / l, -dx / l]; });
    const vn = (i, aresta) => {
      const a = en[(i + n - 1) % n], c = en[i];
      if (liso && a[0] * c[0] + a[1] * c[1] > 0.55) { const x = a[0] + c[0], y = a[1] + c[1], l = Math.hypot(x, y); return [x / l, y / l]; }
      return en[aresta];
    };
    const dentro = pts.map((p, i) => {
      const a = en[(i + n - 1) % n], c = en[i], k = Math.max(0.5, 1 + a[0] * c[0] + a[1] * c[1]);
      return [p[0] - (a[0] + c[0]) / k * b, p[1] - (a[1] + c[1]) / k * b];
    });
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n, A = pts[i], B = pts[j], a = dentro[i], c = dentro[j], ni = vn(i, i), nj = vn(j, i);
      quad(g, [A[0], A[1], z0 + b], [B[0], B[1], z0 + b], [B[0], B[1], z1 - b], [A[0], A[1], z1 - b], [ni[0], ni[1], 0], [nj[0], nj[1], 0], [nj[0], nj[1], 0], [ni[0], ni[1], 0]);
      if (b > 0) {
        quad(g, [A[0], A[1], z1 - b], [B[0], B[1], z1 - b], [c[0], c[1], z1], [a[0], a[1], z1], [ni[0] * s, ni[1] * s, s], [nj[0] * s, nj[1] * s, s], [nj[0] * s, nj[1] * s, s], [ni[0] * s, ni[1] * s, s]);
        quad(g, [A[0], A[1], z0 + b], [B[0], B[1], z0 + b], [c[0], c[1], z0], [a[0], a[1], z0], [ni[0] * s, ni[1] * s, -s], [nj[0] * s, nj[1] * s, -s], [nj[0] * s, nj[1] * s, -s], [ni[0] * s, ni[1] * s, -s]);
      }
    }
    face(g, dentro.map((p) => [p[0], p[1], z1]), [0, 0, 1]);
    face(g, dentro.map((p) => [p[0], p[1], z0]), [0, 0, -1]);
    return g;
  };

  /* coroa: anel entre dois contornos de mesmo número de pontos (engrenagem, serrilha, moldura) */
  const coroa = (ext, int, h, b = 0, lisoExt = false) => {
    const g = G(), n = ext.length, z1 = h / 2, z0 = -h / 2;
    const rad = (p, d) => { const l = Math.hypot(p[0], p[1]) || 1; return [p[0] + p[0] / l * d, p[1] + p[1] / l * d]; };
    const dir = (p, z = 0) => unit([p[0], p[1], z]);
    const e2 = ext.map((p) => rad(p, -b)), i2 = int.map((p) => rad(p, b));
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n, m = [(ext[i][0] + ext[j][0]) / 2, (ext[i][1] + ext[j][1]) / 2];
      face(g, [[e2[i][0], e2[i][1], z1], [e2[j][0], e2[j][1], z1], [i2[j][0], i2[j][1], z1], [i2[i][0], i2[i][1], z1]], [0, 0, 1]);
      face(g, [[e2[i][0], e2[i][1], z0], [e2[j][0], e2[j][1], z0], [i2[j][0], i2[j][1], z0], [i2[i][0], i2[i][1], z0]], [0, 0, -1]);
      const E = [[ext[i][0], ext[i][1], z0 + b], [ext[j][0], ext[j][1], z0 + b], [ext[j][0], ext[j][1], z1 - b], [ext[i][0], ext[i][1], z1 - b]];
      if (lisoExt) quad(g, E[0], E[1], E[2], E[3], dir(ext[i]), dir(ext[j]), dir(ext[j]), dir(ext[i]));
      else face(g, E, [m[0], m[1], 0]);
      const I = [[int[i][0], int[i][1], z0 + b], [int[j][0], int[j][1], z0 + b], [int[j][0], int[j][1], z1 - b], [int[i][0], int[i][1], z1 - b]];
      const ni = dir(int[i]), nj = dir(int[j]);
      quad(g, I[0], I[1], I[2], I[3], [-ni[0], -ni[1], 0], [-nj[0], -nj[1], 0], [-nj[0], -nj[1], 0], [-ni[0], -ni[1], 0]);
      if (b > 0) {
        face(g, [[ext[i][0], ext[i][1], z1 - b], [ext[j][0], ext[j][1], z1 - b], [e2[j][0], e2[j][1], z1], [e2[i][0], e2[i][1], z1]], [m[0], m[1], 1]);
        face(g, [[ext[i][0], ext[i][1], z0 + b], [ext[j][0], ext[j][1], z0 + b], [e2[j][0], e2[j][1], z0], [e2[i][0], e2[i][1], z0]], [m[0], m[1], -1]);
        face(g, [[int[i][0], int[i][1], z1 - b], [int[j][0], int[j][1], z1 - b], [i2[j][0], i2[j][1], z1], [i2[i][0], i2[i][1], z1]], [-m[0], -m[1], 1]);
        face(g, [[int[i][0], int[i][1], z0 + b], [int[j][0], int[j][1], z0 + b], [i2[j][0], i2[j][1], z0], [i2[i][0], i2[i][1], z0]], [-m[0], -m[1], -1]);
      }
    }
    return g;
  };
  /* contornos de engrenagem: 4 pontos por dente (raiz, ponta, ponta, raiz) */
  const dentes = (qtd, rRaiz, rPonta, rFuro, cortes = [0, 0.22, 0.5, 0.72]) => {
    const ext = [], int = [];
    for (let d = 0; d < qtd; d++) cortes.forEach((f, k) => {
      const a = ((d + f) / qtd) * TAU, r = k === 1 || k === 2 ? rPonta : rRaiz;
      ext.push([Math.cos(a) * r, Math.sin(a) * r]); int.push([Math.cos(a) * rFuro, Math.sin(a) * rFuro]);
    });
    return [ext, int];
  };

  /* torno: perfil (raio, altura) girado em torno de Y. Percorra o perfil de baixo para cima
     por fora e de cima para baixo por dentro; cada lance é uma faceta, salvo com liso = true. */
  const torno = (perfil, gomos = 64, liso = false) => {
    const g = G(), lances = perfil.length - 1;
    const nl = [];
    for (let s = 0; s < lances; s++) { const dr = perfil[s + 1][0] - perfil[s][0], dy = perfil[s + 1][1] - perfil[s][1], l = Math.hypot(dr, dy) || 1; nl.push([dy / l, -dr / l]); }
    const media = (a, b) => { const x = a[0] + b[0], y = a[1] + b[1], l = Math.hypot(x, y) || 1; return [x / l, y / l]; };
    for (let s = 0; s < lances; s++) {
      const [r0, y0] = perfil[s], [r1, y1] = perfil[s + 1];
      const n0 = liso && s > 0 ? media(nl[s - 1], nl[s]) : nl[s], n1 = liso && s < lances - 1 ? media(nl[s], nl[s + 1]) : nl[s];
      const base = g.p.length / 3;
      for (let k = 0; k <= gomos; k++) {
        const a = (k / gomos) * TAU, c = Math.cos(a), sn = Math.sin(a);
        g.p.push(r0 * c, y0, r0 * sn, r1 * c, y1, r1 * sn);
        g.n.push(n0[0] * c, n0[1], n0[0] * sn, n1[0] * c, n1[1], n1[0] * sn);
      }
      for (let k = 0; k < gomos; k++) { const p = base + k * 2; g.i.push(p, p + 1, p + 2, p + 1, p + 3, p + 2); }
    }
    return g;
  };
  /* aro de seção retangular chanfrada, deitado no plano XZ */
  const aro = (rInt, rExt, alt, b, gomos = 96) => torno([
    [rInt, -alt / 2 + b], [rInt + b, -alt / 2], [rExt - b, -alt / 2], [rExt, -alt / 2 + b],
    [rExt, alt / 2 - b], [rExt - b, alt / 2], [rInt + b, alt / 2], [rInt, alt / 2 - b], [rInt, -alt / 2 + b]], gomos);
  const disco = (r, y0, y1, b = 0, gomos = 64) => torno([[0, y0], [r - b, y0], [r, y0 + b], [r, y1 - b], [r - b, y1], [0, y1]], gomos);

  const toro = (R, r, voltas = 72, lados = 10) => {
    const g = G();
    for (let a = 0; a <= voltas; a++) {
      const u = (a / voltas) * TAU, cu = Math.cos(u), su = Math.sin(u);
      for (let b = 0; b <= lados; b++) {
        const w = (b / lados) * TAU, cw = Math.cos(w), sw = Math.sin(w);
        g.p.push((R + r * cw) * cu, (R + r * cw) * su, r * sw); g.n.push(cw * cu, cw * su, sw);
      }
    }
    for (let a = 0; a < voltas; a++) for (let b = 0; b < lados; b++) { const p = a * (lados + 1) + b, q = p + lados + 1; g.i.push(p, q, p + 1, q, q + 1, p + 1); }
    return g;
  };
  const esfera = (r, faixas = 14, gomos = 20) => {
    const g = G();
    for (let a = 0; a <= faixas; a++) {
      const t = (a / faixas) * PI, st = Math.sin(t), ct = Math.cos(t);
      for (let b = 0; b <= gomos; b++) { const f = (b / gomos) * TAU, n = [st * Math.cos(f), ct, st * Math.sin(f)]; g.p.push(n[0] * r, n[1] * r, n[2] * r); g.n.push(n[0], n[1], n[2]); }
    }
    for (let a = 0; a < faixas; a++) for (let b = 0; b < gomos; b++) { const p = a * (gomos + 1) + b, q = p + gomos + 1; g.i.push(p, p + 1, q, q, p + 1, q + 1); }
    return g;
  };
  /* gema: bipirâmide facetada de n lados */
  const gema = (r, alto, lados = 4) => {
    const g = G(), cintura = circ(r, lados, PI / lados);
    for (let i = 0; i < lados; i++) {
      const a = cintura[i], b = cintura[(i + 1) % lados], m = [(a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2];
      face(g, [[a[0], 0, a[1]], [b[0], 0, b[1]], [0, alto, 0]], [m[0], 0.3, m[2]]);
      face(g, [[a[0], 0, a[1]], [b[0], 0, b[1]], [0, -alto, 0]], [m[0], -0.3, m[2]]);
    }
    return g;
  };
  /* tubo ao longo de uma curva (corrimão, arco) */
  const tubo = (curva, passos, lados, r) => {
    const g = G();
    for (let a = 0; a <= passos; a++) {
      const t = a / passos, P = curva(t), Q = curva(t + 0.002), T = unit([Q[0] - P[0], Q[1] - P[1], Q[2] - P[2]]);
      let N = cruzar(T, [0, 1, 0]); if (Math.hypot(N[0], N[1], N[2]) < 0.01) N = [1, 0, 0]; N = unit(N);
      const B = cruzar(N, T);
      for (let b = 0; b <= lados; b++) {
        const w = (b / lados) * TAU, c = Math.cos(w), s = Math.sin(w), n = [c * N[0] + s * B[0], c * N[1] + s * B[1], c * N[2] + s * B[2]];
        g.p.push(P[0] + n[0] * r, P[1] + n[1] * r, P[2] + n[2] * r); g.n.push(n[0], n[1], n[2]);
      }
    }
    for (let a = 0; a < passos; a++) for (let b = 0; b < lados; b++) { const p = a * (lados + 1) + b, q = p + lados + 1; g.i.push(p, q, p + 1, q, q + 1, p + 1); }
    return g;
  };
  /* ponteiro "dauphine": losango comprido com uma aresta viva no meio, que parte a luz em duas */
  const ponteiro = (comp, larg, alt, cauda) => {
    const g = G(), T = [0, -cauda, 0], R = [larg / 2, 0, 0], P = [0, comp, 0], L = [-larg / 2, 0, 0], A = [0, 0, alt], Q = [0, comp * 0.92, alt * 0.25];
    face(g, [T, R, A], [1, -1, 2]); face(g, [L, T, A], [-1, -1, 2]);
    face(g, [R, P, Q, A], [1, 0, 2]); face(g, [P, L, A, Q], [-1, 0, 2]);
    face(g, [T, R, P, L], [0, 0, -1]);
    return g;
  };

  /* molde: junta peças, cada uma com posição, material e oclusão, num buffer intercalado */
  class Molde {
    constructor() { this.v = []; this.i = []; }
    por(g, m = IDENT, mat = 7, ao = 1) {
      const base = this.v.length / 8, v = this.v, o = ao * 255;
      for (let k = 0; k < g.p.length; k += 3) {
        const x = g.p[k], y = g.p[k + 1], z = g.p[k + 2], a = g.n[k], b = g.n[k + 1], c = g.n[k + 2];
        const nx = m[0] * a + m[4] * b + m[8] * c, ny = m[1] * a + m[5] * b + m[9] * c, nz = m[2] * a + m[6] * b + m[10] * c, l = Math.hypot(nx, ny, nz) || 1;
        v.push(m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14], nx / l, ny / l, nz / l, mat, o);
      }
      for (let k = 0; k < g.i.length; k++) this.i.push(g.i[k] + base);
      return this;
    }
    pronto() { return { v: new Float32Array(this.v), i: new Uint16Array(this.i) }; }
  }
  const peca = (g, mat = 7) => new Molde().por(g, IDENT, mat).pronto();

  /* materiais (índices da paleta da marca) */
  const TINTA = 0, BREU = 1, ROXO_NOITE = 2, ROXO_FUNDO = 3, ROXO_MEIO = 4, ROXO = 5, ROXO_CLARO = 6, OURO = 7, OURO_ESCURO = 8, OURO_CLARO = 9, CREME = 10, BRANCO = 11;
  const EM_PE = rotX(PI / 2);        // leva o eixo do torno (Y) para a frente (Z)
  const DEITAR = rotX(-PI / 2);      // leva a espessura do prisma (Z) para cima (Y)

  /* engrenagem vazada: aro dentado, cubo e raios */
  const engrenagem = (molde, m, qtd, raio, esp, matAro, matRaio, raios = 5) => {
    const [ext, int] = dentes(qtd, raio * 0.9, raio, raio * 0.7);
    molde.por(coroa(ext, int, esp, esp * 0.16), m, matAro);
    molde.por(coroa(circ(raio * 0.24, 20), circ(raio * 0.1, 20), esp * 1.5, esp * 0.2, true), m, matAro);
    for (let k = 0; k < raios; k++)
      molde.por(prisma(trapezio(raio * 0.2, raio * 0.2, raio * 0.74, raio * 0.11), esp * 0.7, esp * 0.12), compor(m, rotZ((k / raios) * TAU)), matRaio);
    molde.por(esfera(raio * 0.085, 8, 12), compor(m, mover(0, 0, esp * 0.7)), BRANCO);
    return molde;
  };

  /* ---------- emblema: decodifica a malha gerada em marca/ ---------- */
  let emblemaDados = null;
  const bytes = (b64) => {
    const s = atob(b64), o = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) o[i] = s.charCodeAt(i);
    return o;
  };
  const lerEmblema = () => {
    if (emblemaDados || !window.CK_EMBLEMA) return emblemaDados;
    const d = window.CK_EMBLEMA;
    emblemaDados = {
      v: bytes(d.v),
      i: new Uint16Array(bytes(d.i).buffer),
      paleta: new Float32Array(d.paleta.flat().map((c) => Math.pow(c, 2.2))),
      pivos: [d.pivos["olho-esq"], d.pivos["olho-dir"]],
    };
    return emblemaDados;
  };

  /* quanto cada parte se afasta quando a peça é "explodida" (unidades do modelo) */
  const AFASTAR = [-0.62, -0.34, -0.12, 0.10, 0.16, 0.22, 0.02, 0.30, 0.56, 0.80, 0.80, 0.92];
  /* ordem de chegada das partes na montagem de abertura */
  const ORDEM = [0.0, 0.0, 0.12, 0.62, 0.70, 0.78, 0.18, 0.30, 0.44, 0.56, 0.56, 0.66];

  /* ---------- palco ---------- */
  const palcos = new Set();
  const formasProntas = {};       // as peças de cada cena são modeladas uma vez só
  let laco = 0, ultimo = 0;
  const ponteiroMouse = { x: 0, y: 0, alvoX: 0, alvoY: 0 };

  class Palco {
    constructor(el) {
      this.el = el;
      this.tipo = el.dataset.palco;
      this.visivel = false;
      this.gl = null;
      this.nitidez = 1;          // multiplicador sobre o DPR; cai se o aparelho não acompanhar
      this.lentos = 0;
      this.quadros = 0;
      this.nascimento = 0;
      this.pronto = false;
      this.estado = { giroY: 0, giroX: 0, velY: 0, velX: 0, explodir: 0, alvoExplodir: 0, arrastando: false, mexeu: 0, rolagem: 0 };
      this.cena = CENAS[this.tipo] || CENAS.emblema;
      if (this.cena.preparar) this.cena.preparar(this);
    }

    montar() {
      if (this.gl || this.falhou) return;
      if (this.cena.emblema && !lerEmblema()) return;       // tenta de novo quando os dados chegarem
      const canvas = document.createElement("canvas");
      canvas.setAttribute("aria-hidden", "true");
      const gl = canvas.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: true, powerPreference: "high-performance" });
      if (!gl) { this.falhou = true; this.el.classList.add("sem-3d"); return; }
      this.canvas = canvas;
      this.gl = gl;
      canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); if (this.canvas === canvas) this.desmontar(true); });

      try {
        const derivadas = gl.getExtension("OES_standard_derivatives");
        const cabeca = derivadas ? "#extension GL_OES_standard_derivatives : enable\n#define DERIVADAS\n" : "";
        this.prog = this.programa(VERT, cabeca + FRAG, ["aPos", "aNormal", "aMeta", "aMat"]);
        this.progPonto = this.programa(VERT_PONTO, FRAG_PONTO, ["aPonto"]);
      } catch (erro) {
        this.falhou = true; this.gl = null; this.el.classList.add("sem-3d"); return;
      }
      this.u = this.uniformes(this.prog, ["uModelo", "uCamera", "uPaleta", "uRecuo", "uExplodir", "uOlhos", "uOlho", "uLuz", "uTempo", "uVivo"]);
      this.up = this.uniformes(this.progPonto, ["uModelo", "uCamera", "uTempo", "uEscala", "uCorPonto", "uFaisca"]);
      this.geos = {};
      const d = lerEmblema();
      if (d && (this.cena.emblema || this.cena.usaEmblema))
        this.geos.emblema = { vb: this.buffer(gl.ARRAY_BUFFER, d.v), ib: this.buffer(gl.ELEMENT_ARRAY_BUFFER, d.i), n: d.i.length, compacta: true };
      const formas = formasProntas[this.tipo] || (formasProntas[this.tipo] = this.cena.formas ? this.cena.formas() : {});
      for (const nome in formas) {
        const f = formas[nome];
        if (f.pontos) this.geos[nome] = { vb: this.buffer(gl.ARRAY_BUFFER, f.pontos), n: f.pontos.length / 4 };
        else if (f.v) this.geos[nome] = { vb: this.buffer(gl.ARRAY_BUFFER, f.v), ib: this.buffer(gl.ELEMENT_ARRAY_BUFFER, f.i), n: f.i.length };
      }
      gl.enable(gl.DEPTH_TEST);
      gl.clearColor(0, 0, 0, 0);
      this.el.appendChild(canvas);
      this.medir();
      this.nascimento = 0;
      this.pronto = false;
    }

    desmontar(perdido) {
      if (!this.gl) return;
      if (!perdido) {
        const ext = this.gl.getExtension("WEBGL_lose_context");
        if (ext) ext.loseContext();
      }
      this.canvas.remove();
      this.gl = this.canvas = this.geos = null;
      this.el.classList.remove("tem-3d");
    }

    programa(vs, fs, atributos) {
      const gl = this.gl, p = gl.createProgram();
      for (const [tipo, fonte] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
        const s = gl.createShader(tipo);
        gl.shaderSource(s, fonte); gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
        gl.attachShader(p, s);
      }
      atributos.forEach((a, i) => gl.bindAttribLocation(p, i, a));
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      return p;
    }
    uniformes(p, nomes) { const o = {}; nomes.forEach((n) => (o[n] = this.gl.getUniformLocation(p, n))); return o; }
    buffer(alvo, dados) { const gl = this.gl, b = gl.createBuffer(); gl.bindBuffer(alvo, b); gl.bufferData(alvo, dados, gl.STATIC_DRAW); return b; }

    medir() {
      if (!this.gl) return;
      const r = this.el.getBoundingClientRect();
      this.largura = Math.max(1, r.width); this.altura = Math.max(1, r.height);
      const dpr = Math.min(window.devicePixelRatio || 1, TETO_DPR) * this.nitidez;
      const w = Math.round(this.largura * dpr), h = Math.round(this.altura * dpr);
      if (this.canvas.width !== w || this.canvas.height !== h) { this.canvas.width = w; this.canvas.height = h; }
      this.gl.viewport(0, 0, w, h);
      this.dpr = dpr;
    }

    /* desenha uma peça. Com "material", a peça inteira sai nesse material; sem, vale o de cada vértice. */
    desenhar(nome, modelo, material) {
      const gl = this.gl, g = this.geos[nome];
      if (!g) return;
      gl.bindBuffer(gl.ARRAY_BUFFER, g.vb);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g.ib);
      if (g.compacta) {
        gl.enableVertexAttribArray(2); gl.enableVertexAttribArray(3);
        gl.vertexAttribPointer(0, 3, gl.SHORT, true, 12, 0);
        gl.vertexAttribPointer(2, 2, gl.UNSIGNED_BYTE, false, 12, 6);
        gl.vertexAttribPointer(1, 3, gl.BYTE, true, 12, 8);
        gl.vertexAttribPointer(3, 1, gl.UNSIGNED_BYTE, false, 12, 11);
      } else {
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 32, 0);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 32, 12);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 32, 28);      // só a oclusão; a "parte" fica em 0
        if (material === undefined) { gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 1, gl.FLOAT, false, 32, 24); }
        else { gl.disableVertexAttribArray(3); gl.vertexAttrib1f(3, material); }
      }
      gl.uniformMatrix4fv(this.u.uModelo, false, modelo);
      gl.drawElements(gl.TRIANGLES, g.n, gl.UNSIGNED_SHORT, 0);
    }

    /* poeira (uFaisca 0) ou faíscas presas ao objeto (uFaisca 1) */
    pontos(nome, t, modelo, cor, escala, faisca = 0) {
      const gl = this.gl, g = this.geos[nome];
      if (!g) return;
      gl.useProgram(this.progPonto);
      gl.disableVertexAttribArray(1); gl.disableVertexAttribArray(2); gl.disableVertexAttribArray(3);
      gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ZERO, gl.ONE); gl.depthMask(false);
      gl.bindBuffer(gl.ARRAY_BUFFER, g.vb);
      gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 16, 0);
      gl.uniformMatrix4fv(this.up.uModelo, false, modelo);
      gl.uniformMatrix4fv(this.up.uCamera, false, this.camera);
      gl.uniform1f(this.up.uTempo, t);
      gl.uniform1f(this.up.uEscala, escala * this.canvas.height / 22);
      gl.uniform1f(this.up.uFaisca, faisca);
      gl.uniform3fv(this.up.uCorPonto, cor);
      gl.drawArrays(gl.POINTS, 0, g.n);
      gl.depthMask(true); gl.disable(gl.BLEND);
      gl.useProgram(this.prog);
      gl.enableVertexAttribArray(1);
    }

    quadro(t, dt) {
      const gl = this.gl;
      if (!gl) return;
      if (!this.nascimento) this.nascimento = t;
      const idade = t - this.nascimento;

      // câmera: enquadra um raio "campo" em qualquer proporção de tela
      const aspecto = this.largura / this.altura;
      const dist = 6, campo = this.cena.campo || 1.5;
      const tanMeio = (campo / dist) / Math.min(1, aspecto);
      this.camera = multiplicar(perspectiva(tanMeio, aspecto, 1, 20), mover(0, 0, -dist));

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(this.prog);
      gl.enableVertexAttribArray(0); gl.enableVertexAttribArray(1);
      gl.disable(gl.BLEND); gl.depthMask(true);
      gl.uniformMatrix4fv(this.u.uCamera, false, this.camera);
      gl.uniform3f(this.u.uOlho, 0, 0, dist);
      gl.uniform1f(this.u.uTempo, semMovimento ? 2.4 : t);
      const lx = this.cena.luzFixa ? 0.35 : ponteiroMouse.x, ly = this.cena.luzFixa ? 0.3 : ponteiroMouse.y;
      gl.uniform3f(this.u.uLuz, 0.25 + lx * 1.5, 0.2 + ly * 1.3, 0.9);
      const d = lerEmblema();
      gl.uniform3fv(this.u.uPaleta, d ? d.paleta : PALETA_RESERVA);
      gl.uniform1f(this.u.uExplodir, 0);
      gl.uniform1f(this.u.uVivo, 1);

      this.cena.desenhar(this, semMovimento ? 3.2 : t, dt, semMovimento ? 99 : idade);

      if (!this.pronto) { this.pronto = true; this.el.classList.add("tem-3d"); }
    }

    /* mede o custo real do quadro e reduz a nitidez se o aparelho não der conta */
    aferir(dt) {
      if (++this.quadros < 20) return;            // ignora o aquecimento
      if (dt > 0.042) this.lentos++; else this.lentos = Math.max(0, this.lentos - 0.25);   // abaixo de ~24 quadros por segundo
      if (this.lentos > 16 && this.nitidez > 0.6) {
        this.nitidez = Math.max(0.6, this.nitidez * 0.8);
        this.lentos = 0;
        this.medir();
      }
    }
  }

  const PALETA_RESERVA = new Float32Array([
    0.02, 0.016, 0.027, 0.098, 0.008, 0.133, 0.259, 0.004, 0.38, 0.392, 0.004, 0.529, 0.49, 0.012, 0.627, 0.639, 0.031, 0.784,
    0.698, 0.063, 0.839, 0.988, 0.812, 0.008, 0.855, 0.651, 0.008, 0.98, 0.957, 0.51, 0.969, 0.945, 0.71, 0.984, 0.976, 0.988,
  ].map((c) => Math.pow(c, 2.2)));
  const COR_FAISCA = [1.0, 0.82, 0.36];

  /* ---------- peças comuns às cenas ---------- */
  const sorteio = (semente) => { let s = semente; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };
  const nuvem = (qtd, raioMin, raioMax, achatar, semente) => {
    const r = sorteio(semente), o = new Float32Array(qtd * 4);
    for (let i = 0; i < qtd; i++) {
      const a = r() * TAU, d = raioMin + r() * (raioMax - raioMin);
      o.set([Math.cos(a) * d, (r() - 0.5) * achatar, Math.sin(a) * d, r()], i * 4);
    }
    return { pontos: o };
  };
  const faiscas = (lista) => { const o = new Float32Array(lista.length * 4); lista.forEach((p, i) => o.set([p[0], p[1], p[2], (i * 0.618 + 0.11) % 1], i * 4)); return { pontos: o }; };

  const recuos = new Float32Array(12);
  const desenharEmblema = (p, modelo, olhos, vivo = 0) => {
    const gl = p.gl, d = lerEmblema();
    if (!p.geos.emblema) return;
    gl.uniform1fv(p.u.uRecuo, recuos);
    gl.uniform1f(p.u.uExplodir, 1);
    gl.uniform1f(p.u.uVivo, vivo);
    gl.uniform4f(p.u.uOlhos, d.pivos[0], d.pivos[1], olhos[0], olhos[1]);
    p.desenhar("emblema", modelo);
    gl.uniform1f(p.u.uExplodir, 0);
    gl.uniform1f(p.u.uVivo, 1);
  };

  /* piscadas: de vez em quando as duas pálpebras, às vezes só uma (a piscadinha da vinheta) */
  const piscar = (p, t) => {
    const e = p.estado;
    if (e.proxPisca === undefined) e.proxPisca = t + 2.2;
    if (t > e.proxPisca) { e.inicioPisca = t; e.sohUm = Math.random() < 0.3; e.proxPisca = t + 3.5 + Math.random() * 4; }
    const k = e.inicioPisca === undefined ? 1 : (t - e.inicioPisca) / 0.26;
    const abertura = k >= 1 ? 1 : 0.06 + 0.94 * Math.abs(1 - 2 * k) ** 1.6;
    return e.sohUm ? [1, abertura] : [abertura, abertura];
  };

  const ESCADA = { DEGRAUS: 30, SOBE: 0.053, Y0: -0.8, PASSO: PI / 6 };

  /* chegada escalonada das partes de um objeto: 0 antes, 1 no lugar */
  const chega = (idade, ordem, dur = 0.9) => saida(limitar((idade - ordem * 0.11) / dur, 0, 1));

  const CENAS = {
    /* ---- topo do site: a máscara se monta, flutua e segue o ponteiro ---- */
    emblema: {
      emblema: true,
      campo: 1.8,
      formas: () => ({
        anel: peca(aro(1.405, 1.435, 0.012, 0.003, 120), OURO),
        anel2: peca(toro(1.63, 0.006, 110, 5), ROXO_CLARO),
        gema: peca(gema(0.045, 0.085, 4), OURO),
        gema6: peca(gema(0.05, 0.07, 6), OURO),
        conta: peca(esfera(0.034, 10, 12), OURO),
        poeira: nuvem(46, 1.15, 1.95, 1.5, 7),
      }),
      preparar(p) {
        const r = sorteio(11);
        p.lascas = Array.from({ length: 9 }, (_, i) => ({
          raio: 1.3 + r() * 0.55, fase: r() * 6.28, vel: (0.1 + r() * 0.16) * (i % 2 ? 1 : -1), alt: (r() - 0.5) * 1.5,
          mat: [OURO, ROXO, OURO_CLARO, ROXO_CLARO, BRANCO][i % 5], tam: 0.6 + r() * 1.1, giro: r() * 6, forma: i % 3 ? "gema" : "gema6",
        }));
      },
      desenhar(p, t, dt, idade) {
        const e = p.estado;
        // montagem de abertura: as camadas chegam uma atrás da outra
        const dur = 1.9;
        let aberto = 1;
        for (let i = 0; i < 12; i++) {
          const k = limitar((idade - ORDEM[i] * 1.1) / (dur - ORDEM[i] * 0.9), 0, 1);
          recuos[i] = (1 - saida(k)) * (AFASTAR[i] * 2.6 + (i > 2 ? 1.1 : -0.6));
          if (i === 11) aberto = k;
        }
        const entrada = saida(limitar(idade / 1.6, 0, 1));
        const role = e.rolagem;                                   // 0 no topo, 1 quando o hero saiu
        const gy = Math.sin(t * 0.42) * 0.3 + ponteiroMouse.x * 0.5 + (1 - entrada) * -1.5 + role * 1.5;
        const gx = Math.sin(t * 0.33 + 1) * 0.07 - ponteiroMouse.y * 0.3 + 0.04 - role * 0.35;
        const sobe = Math.sin(t * 0.8) * 0.03;
        const escala = (0.55 + 0.45 * entrada) * (1 - role * 0.16);
        const modelo = compor(mover(0, sobe + 0.03, 0), rotY(gy), rotX(gx), rotZ(Math.sin(t * 0.27) * 0.025), escalar(escala), mover(0, 0, -0.06));
        desenharEmblema(p, modelo, aberto < 1 ? [1, 1] : piscar(p, t));

        // anéis orbitais finos
        const orb = compor(rotY(gy * 0.35), rotX(1.18 + Math.sin(t * 0.2) * 0.08 + gx), escalar(entrada));
        p.desenhar("anel", compor(orb, rotX(PI / 2), rotY(t * 0.12)));
        p.desenhar("anel2", compor(rotY(gy * 0.35 + 0.5), rotX(1.42 + gx), rotY(0.5), rotZ(-t * 0.08), escalar(entrada)));
        // contas que correm pelos anéis
        for (let i = 0; i < 3; i++) {
          const a = t * (0.5 + i * 0.13) + i * 2.1;
          p.desenhar("conta", compor(orb, mover(Math.cos(a) * 1.42, Math.sin(a) * 1.42, 0)), i === 1 ? BRANCO : OURO);
        }
        // gemas facetadas flutuando em volta
        p.lascas.forEach((l) => {
          const a = l.fase + t * l.vel;
          p.desenhar(l.forma, compor(rotY(gy * 0.3), mover(Math.cos(a) * l.raio, l.alt + Math.sin(t * 0.6 + l.fase) * 0.06, Math.sin(a) * l.raio * 0.8),
            rotY(t * 0.7 + l.giro), rotX(0.5 + Math.sin(t * 0.45 + l.giro) * 0.4), escalar(l.tam * entrada)), l.mat);
        });
        p.pontos("poeira", t, compor(rotY(t * 0.05 + gy * 0.3), escalar(entrada)), COR_FAISCA, 1);
      },
    },

    /* ---- identidade: a peça na mão do visitante, com as camadas separáveis ---- */
    anatomia: {
      emblema: true,
      campo: 1.5,
      luzFixa: true,
      preparar(p) {
        const e = p.estado, el = p.el;
        e.giroY = -0.5; e.giroX = 0.12;
        let px = 0, py = 0;
        el.addEventListener("pointerdown", (ev) => {
          e.arrastando = true; px = ev.clientX; py = ev.clientY; e.velY = e.velX = 0;
          el.setPointerCapture && el.setPointerCapture(ev.pointerId);
          el.classList.add("arrastando");
        });
        el.addEventListener("pointermove", (ev) => {
          if (!e.arrastando) return;
          const dx = ev.clientX - px, dy = ev.clientY - py; px = ev.clientX; py = ev.clientY;
          e.velY = dx * 0.011; e.velX = dy * 0.008;
          e.giroY += e.velY; e.giroX = limitar(e.giroX + e.velX, -1.1, 1.1);
          e.mexeu = performance.now();
          acordar();
        });
        const soltar = () => { e.arrastando = false; el.classList.remove("arrastando"); };
        el.addEventListener("pointerup", soltar);
        el.addEventListener("pointercancel", soltar);
        el.addEventListener("keydown", (ev) => {
          const passo = { ArrowLeft: [-0.25, 0], ArrowRight: [0.25, 0], ArrowUp: [0, -0.15], ArrowDown: [0, 0.15] }[ev.key];
          if (!passo) return;
          ev.preventDefault();
          e.giroY += passo[0]; e.giroX = limitar(e.giroX + passo[1], -1.1, 1.1); e.mexeu = performance.now();
          acordar();
        });
      },
      desenhar(p, t, dt) {
        const e = p.estado;
        e.explodir += (e.alvoExplodir - e.explodir) * Math.min(1, dt * 7);
        if (!e.arrastando) {
          e.giroY += e.velY; e.giroX = limitar(e.giroX + e.velX, -1.1, 1.1);
          e.velY *= 0.94; e.velX *= 0.9;
          const parado = performance.now() - e.mexeu > 2600;
          if (parado && !semMovimento) { e.giroY += dt * 0.32; e.giroX += (0.12 - e.giroX) * dt * 0.8; }
        }
        for (let i = 0; i < 12; i++) recuos[i] = AFASTAR[i] * e.explodir * 1.25;
        const escala = 1.12 - e.explodir * 0.2;
        const modelo = compor(rotY(e.giroY), rotX(e.giroX), escalar(escala), mover(0, 0, -0.06 - e.explodir * 0.12));
        desenharEmblema(p, modelo, e.explodir > 0.05 ? [1, 1] : piscar(p, t));
      },
    },

    /* ============================================================
       FinCK · relógio de bolso com borda de moeda
       De um lado, o tempo: mostrador, índices, ponteiros e a máquina
       à mostra. Do outro, a moeda: a máscara da CK cunhada no centro.
       ============================================================ */
    relogio: {
      campo: 1.34,
      usaEmblema: true,
      formas: () => {
        const corpo = new Molde();
        // caixa com serrilha de moeda
        const serr = 104, ext = [], int = [];
        for (let k = 0; k < serr * 2; k++) { const a = (k / (serr * 2)) * TAU, r = k % 2 ? 1.0 : 0.972; ext.push([Math.cos(a) * r, Math.sin(a) * r]); int.push([Math.cos(a) * 0.81, Math.sin(a) * 0.81]); }
        corpo.por(coroa(ext, int, 0.2, 0.014), IDENT, OURO);
        // aros polidos em degrau, na frente e atrás
        for (const lado of [1, -1]) {
          const m = compor(EM_PE, escalar(1, lado, 1));
          corpo.por(torno([[0.955, 0.1], [0.945, 0.126], [0.865, 0.126], [0.85, 0.1]], 96), m, OURO_CLARO);
          corpo.por(torno([[0.85, 0.1], [0.84, 0.112], [0.815, 0.112], [0.81, 0.09]], 96), m, OURO);
        }
        // mostrador: anel de horas em laca roxa, com filete de ouro por dentro
        corpo.por(torno([[0.815, 0.078], [0.5, 0.078], [0.5, 0.02]], 96), EM_PE, ROXO_FUNDO);
        corpo.por(torno([[0.655, 0.078], [0.655, 0.083], [0.64, 0.083], [0.64, 0.078]], 96), EM_PE, OURO_ESCURO);
        corpo.por(torno([[0.515, 0.078], [0.515, 0.094], [0.47, 0.094], [0.47, 0.02]], 96), EM_PE, OURO);
        for (let k = 0; k < 60; k++) {
          const m = compor(rotZ(-(k / 60) * TAU), mover(0, 0.765, 0.082));
          if (k % 5) corpo.por(prisma(ret(0.011, 0.045), 0.01), m, CREME);
          else if (k) corpo.por(prisma(trapezio(-0.085, 0.034, 0.085, 0.06), 0.03, 0.009), compor(rotZ(-(k / 60) * TAU), mover(0, 0.735, 0.09), rotZ(PI / 2)), OURO);
          else for (const dx of [-0.036, 0.036]) corpo.por(prisma(trapezio(-0.085, 0.028, 0.085, 0.046), 0.03, 0.009), compor(mover(dx, 0.735, 0.09), rotZ(PI / 2)), OURO);
        }
        // platina da máquina, vista pela abertura central, com ponte, parafusos e rubis
        corpo.por(disco(0.5, -0.03, -0.012, 0, 72), EM_PE, ROXO_NOITE, 0.75);
        for (let k = 0; k < 3; k++) corpo.por(torno([[0.44 - k * 0.12, -0.012], [0.44 - k * 0.12, -0.006], [0.43 - k * 0.12, -0.006], [0.43 - k * 0.12, -0.012]], 72), EM_PE, ROXO_FUNDO, 0.8);
        corpo.por(prisma(retArred(0.56, 0.1, 0.05, 4), 0.022, 0.006, true), compor(mover(-0.08, 0.3, 0.052), rotZ(0.5)), TINTA);
        for (const [x, y] of [[-0.3, 0.19], [0.12, 0.42]]) {
          corpo.por(disco(0.03, 0.062, 0.072, 0.004, 14), compor(mover(x, y, 0), EM_PE), OURO);
          corpo.por(prisma(ret(0.045, 0.007), 0.004), mover(x, y, 0.073), TINTA);
        }
        corpo.por(esfera(0.026, 8, 12), mover(-0.08, 0.3, 0.064), ROXO_CLARO);
        // coroa de dar corda e argola
        corpo.por(torno([[0, 0.98], [0.07, 0.98], [0.07, 1.06], [0.05, 1.075], [0, 1.075]], 20), IDENT, OURO_ESCURO);
        const [ce, ci] = dentes(18, 0.118, 0.135, 0.02, [0, 0.3, 0.5, 0.8]);
        corpo.por(coroa(ce, ci, 0.12, 0.012), compor(mover(0, 1.135, 0), DEITAR), OURO);
        corpo.por(torno([[0.118, 1.195], [0.09, 1.212], [0, 1.218]], 20, true), IDENT, OURO_CLARO);
        corpo.por(toro(0.15, 0.02, 40, 10), mover(0, 1.34, 0), OURO);
        // verso: face de moeda, com orla perolada e filetes
        corpo.por(torno([[0, -0.086], [0.815, -0.086]], 96), EM_PE, OURO_ESCURO, 0.85);
        corpo.por(torno([[0.635, -0.086], [0.635, -0.098], [0.66, -0.098], [0.66, -0.086]], 96), EM_PE, OURO);
        for (let k = 0; k < 44; k++) { const a = (k / 44) * TAU; corpo.por(esfera(0.021, 6, 8), mover(Math.cos(a) * 0.74, Math.sin(a) * 0.74, -0.088), OURO_CLARO); }

        return {
          corpo: corpo.pronto(),
          roda1: engrenagem(new Molde(), IDENT, 26, 0.31, 0.03, OURO, OURO_ESCURO, 5).pronto(),
          roda2: engrenagem(new Molde(), IDENT, 16, 0.2, 0.03, OURO_CLARO, OURO, 4).pronto(),
          roda3: engrenagem(new Molde(), IDENT, 11, 0.14, 0.03, OURO_ESCURO, OURO_CLARO, 3).pronto(),
          horas: peca(ponteiro(0.36, 0.085, 0.024, 0.09), OURO),
          minutos: peca(ponteiro(0.6, 0.062, 0.022, 0.11), OURO_CLARO),
          segundos: new Molde().por(prisma(trapezio(-0.2, 0.02, 0.7, 0.007), 0.008), rotZ(PI / 2), BRANCO)
            .por(prisma(circ(0.04, 14), 0.008), mover(0, -0.15, 0), BRANCO).pronto(),
          pino: new Molde().por(disco(0.05, 0, 0.03, 0.008, 20), EM_PE, OURO).por(torno([[0.03, 0.03], [0.018, 0.042], [0, 0.045]], 14, true), EM_PE, OURO_CLARO).pronto(),
          orbita: peca(aro(1.245, 1.257, 0.008, 0.002, 120), ROXO_CLARO),
          conta: peca(esfera(0.04, 10, 12), OURO),
          brilho: faiscas([[0.7, 0.7, 0.12], [-0.92, 0.3, 0.1], [0.3, -0.95, 0.1], [-0.5, -0.82, 0.12], [0, 1.34, 0.03], [0.98, -0.1, 0.05], [-0.2, 0.73, 0.12]]),
          poeira: nuvem(20, 1.2, 1.75, 1.7, 21),
        };
      },
      desenhar(p, t, dt, idade) {
        // a cada 14 s o relógio vira e mostra o verso de moeda por alguns segundos
        const c = t % 14, vira = PI * (vaivem(limitar((c - 8.6) / 1.3, 0, 1)) + vaivem(limitar((c - 12.4) / 1.3, 0, 1)));
        const gy = Math.sin(t * 0.45) * 0.42 + ponteiroMouse.x * 0.35 + vira + (1 - chega(idade, 0, 1.3)) * -2.4;
        const base = compor(mover(0, -0.13 + Math.sin(t * 0.7) * 0.025, 0), rotY(gy), rotX(-0.1 + Math.sin(t * 0.36) * 0.08 - ponteiroMouse.y * 0.2), rotZ(-0.12), escalar(0.82 * chega(idade, 0, 1.1)));
        p.desenhar("corpo", base);

        // a máquina: três rodas engrenadas (a relação de giro segue o número de dentes)
        const g = t * 0.55, entra = (o) => mover(0, 0, (1 - chega(idade, o)) * 1.4);
        p.desenhar("roda1", compor(base, entra(2), mover(0.02, -0.06, 0.012), rotZ(g)));
        p.desenhar("roda2", compor(base, entra(3), mover(0.43, 0.2, 0.022), rotZ(-g * 26 / 16 + 0.2)));
        p.desenhar("roda3", compor(base, entra(4), mover(-0.33, -0.3, 0.03), rotZ(-g * 26 / 11 + 0.1)));

        // ponteiros: horas e minutos correm devagar, o de segundos anda aos saltos
        const seg = Math.floor(t) + mola(limitar((t % 1) * 5, 0, 1));
        p.desenhar("horas", compor(base, entra(5), mover(0, 0, 0.098), rotZ(-(1.9 + t * 0.012))));
        p.desenhar("minutos", compor(base, entra(6), mover(0, 0, 0.112), rotZ(-(0.35 + t * 0.1))));
        p.desenhar("segundos", compor(base, entra(7), mover(0, 0, 0.128), rotZ(-seg * TAU / 60)));
        p.desenhar("pino", compor(base, entra(7), mover(0, 0, 0.1)));

        // verso: a máscara da CK cunhada na moeda
        for (let i = 0; i < 12; i++) recuos[i] = 0;
        desenharEmblema(p, compor(base, rotY(PI), mover(0, -0.02, 0.092), escalar(0.6)), [1, 1], 0.55);

        const orb = compor(rotX(1.2 + Math.sin(t * 0.2) * 0.06), rotZ(0.35), escalar(chega(idade, 3, 1.2)));
        p.desenhar("orbita", compor(orb, rotY(t * 0.1)));
        p.desenhar("conta", compor(orb, rotY(-t * 0.5), mover(1.251, 0, 0)));
        p.desenhar("conta", compor(orb, rotY(-t * 0.5 + 2.6), mover(1.251, 0, 0), escalar(0.6)), BRANCO);
        p.pontos("brilho", t, base, COR_FAISCA, 3.4, 1);
        p.pontos("poeira", t, rotY(t * 0.06), COR_FAISCA, 1.1);
      },
    },

    /* ============================================================
       DynamiCK · a escada em espiral
       Os degraus sobem em torno de uma coluna canelada e vão
       clareando de tom; a cada volta, um degrau de ouro. Uma conta
       sobe sem parar: sempre existe um próximo passo.
       ============================================================ */
    escada: {
      campo: 1.34,
      formas: () => {
        const { DEGRAUS, SOBE, Y0, PASSO } = ESCADA;
        const torre = new Molde();
        const tons = [ROXO_NOITE, ROXO_NOITE, ROXO_FUNDO, ROXO_FUNDO, ROXO_MEIO, ROXO_MEIO, ROXO];
        for (let k = 0; k < DEGRAUS; k++) {
          const m = compor(mover(0, Y0 + k * SOBE, 0), rotY(-k * PASSO));
          const ouro = k % 12 === 11;
          torre.por(prisma(trapezio(0.15, 0.09, 0.78, 0.46), 0.05, 0.012), compor(m, DEITAR), ouro ? OURO : tons[Math.floor(k / DEGRAUS * tons.length)]);
          // focinho do degrau em ouro; a cada dois degraus, um balaústre
          torre.por(prisma(ret(0.026, 0.47), 0.062, 0.008), compor(m, mover(0.778, 0, 0), DEITAR), ouro ? OURO_CLARO : OURO);
          if (k % 2 === 0) {
            torre.por(torno([[0.011, 0.025], [0.011, 0.25]], 6), compor(m, mover(0.76, 0, 0)), CREME);
            torre.por(esfera(0.021, 6, 8), compor(m, mover(0.76, 0.262, 0)), OURO_CLARO);
          }
        }
        // corrimão: um fio de ouro que acompanha a subida
        torre.por(tubo((u) => { const k = u * (DEGRAUS - 1), a = k * PASSO; return [Math.cos(a) * 0.76, Y0 + k * SOBE + 0.262, Math.sin(a) * 0.76]; }, 180, 6, 0.014), IDENT, OURO);
        // coluna central canelada, com colares de ouro, base e capitel torneados
        const can = 18, ce = [], ci = [];
        for (let k = 0; k < can * 2; k++) { const a = (k / (can * 2)) * TAU, r = k % 2 ? 0.15 : 0.128; ce.push([Math.cos(a) * r, Math.sin(a) * r]); ci.push([Math.cos(a) * 0.02, Math.sin(a) * 0.02]); }
        torre.por(coroa(ce, ci, 1.7, 0), compor(mover(0, -0.02, 0), DEITAR), TINTA);
        for (const y of [-0.46, 0.0, 0.46]) torre.por(aro(0.14, 0.168, 0.03, 0.007, 40), mover(0, y, 0), OURO);
        torre.por(torno([[0, -1.0], [0.4, -1.0], [0.41, -0.985], [0.41, -0.955], [0.33, -0.94], [0.33, -0.915], [0.23, -0.895], [0.23, -0.875], [0.16, -0.86], [0, -0.86]], 56), IDENT, OURO);
        torre.por(aro(0.406, 0.42, 0.018, 0.004, 56), mover(0, -0.97, 0), ROXO);
        torre.por(torno([[0, 0.82], [0.16, 0.82], [0.21, 0.85], [0.21, 0.875], [0.13, 0.9], [0.07, 0.9], [0.045, 0.95], [0, 0.95]], 36), IDENT, OURO);
        return {
          torre: torre.pronto(),
          remate: peca(gema(0.085, 0.14, 6), OURO_CLARO),
          conta: peca(esfera(0.072, 14, 18), BRANCO),
          halo: peca(aro(0.1, 0.118, 0.012, 0.003, 28), OURO_CLARO),
          orbita: peca(toro(1.2, 0.006, 100, 5), ROXO_CLARO),
          brilho: faiscas([[0, 1.1, 0], [0.41, -0.97, 0], [-0.41, -0.97, 0], [0, -0.97, 0.41], [0.2, 0.86, 0], [0, 0, 0.17]]),
          poeira: nuvem(20, 1.1, 1.6, 1.9, 33),
        };
      },
      desenhar(p, t, dt, idade) {
        const { DEGRAUS, SOBE, Y0, PASSO } = ESCADA;
        const u = (t * 1.7) % DEGRAUS, k = Math.floor(u), f = u - k;
        // a escada gira no ritmo da subida, então a conta fica sempre de frente para quem olha
        const gira = u * PASSO - PI / 2 + 0.4;
        const entra = chega(idade, 0, 1.2);
        const base = compor(mover(0, Math.sin(t * 0.6) * 0.02, 0), rotX(0.36 - ponteiroMouse.y * 0.14), rotY(ponteiroMouse.x * 0.3), escalar(0.93 * entra));
        const torre = compor(base, rotY(gira + (1 - entra) * 3));
        p.desenhar("torre", torre);
        p.desenhar("remate", compor(torre, mover(0, 1.1 + Math.sin(t * 1.4) * 0.02, 0), rotY(t * 1.1)));

        // a conta pula de degrau em degrau; no último ela some e recomeça embaixo
        const passo = vaivem(limitar(f * 1.5, 0, 1)), arco = Math.sin(passo * PI) * 0.13;
        const ang = (k + passo) * PASSO, r = 0.5;
        const some = Math.min(1, u * 2.5, (DEGRAUS - u) * 2.5);
        const esmaga = f < 0.16 ? 0.8 + f * 1.25 : 1;
        const pos = compor(torre, mover(Math.cos(ang) * r, Y0 + (k + passo) * SOBE + 0.097 + arco, Math.sin(ang) * r));
        p.desenhar("conta", compor(pos, escalar(some, some * esmaga, some)));
        // um anel de ouro marca o degrau em que ela acabou de pisar
        const pulso = limitar(f * 2.2, 0, 1);
        if (pulso < 1 && some > 0.9)
          p.desenhar("halo", compor(torre, mover(Math.cos(k * PASSO) * r, Y0 + k * SOBE + 0.032, Math.sin(k * PASSO) * r), escalar(1 + pulso * 1.6, 1 - pulso, 1 + pulso * 1.6)));

        p.desenhar("orbita", compor(base, rotX(PI / 2 + 0.25), rotZ(t * 0.1)));
        p.pontos("brilho", t, torre, COR_FAISCA, 3.2, 1);
        p.pontos("poeira", t, rotY(-t * 0.06), COR_FAISCA, 1.1);
      },
    },

    /* ============================================================
       SynCK · duas agendas, um mesmo compromisso
       Um evento marcado numa agenda viaja até a outra e aparece
       lá no mesmo dia. O marcador de "hoje" anda junto nas duas.
       ============================================================ */
    agenda: {
      campo: 1.34,
      formas: () => {
        const COL = 7, LIN = 4, CEL = 0.146, VAO = 0.022, X0 = -((COL - 1) * (CEL + VAO)) / 2, Y0 = 0.19;
        const folha = (matFaixa) => {
          const m = new Molde();
          m.por(prisma(retArred(1.36, 1.2, 0.14, 5), 0.04, 0.012, true), mover(0, 0, -0.03), OURO);                // moldura de ouro por trás
          m.por(prisma(retArred(1.3, 1.14, 0.12, 5), 0.07, 0.014, true), IDENT, TINTA);
          m.por(prisma(retArred(1.2, 0.2, 0.06, 4), 0.03, 0.008, true), mover(0, 0.4, 0.04), matFaixa);              // cabeçalho do mês
          m.por(prisma(retArred(0.36, 0.045, 0.02, 3), 0.012, 0.003, true), mover(-0.36, 0.4, 0.06), matFaixa === OURO ? TINTA : CREME);
          for (let k = 0; k < 3; k++) m.por(prisma(circ(0.024, 12), 0.012, 0.003, true), mover(0.5 - k * 0.075, 0.4, 0.06), matFaixa === OURO ? TINTA : OURO);
          for (let l = 0; l < LIN; l++) for (let c = 0; c < COL; c++)                                                 // os dias
            m.por(prisma(retArred(CEL, CEL, 0.03, 2), 0.018, 0.005, true), mover(X0 + c * (CEL + VAO), Y0 - l * (CEL + VAO), 0.04), (l + c) % 2 ? ROXO_NOITE : BREU, 0.9);
          for (const x of [-0.36, 0.36]) {                                                                           // argolas do bloco
            m.por(toro(0.075, 0.015, 28, 8), compor(mover(x, 0.565, 0), rotY(PI / 2)), CREME);
            m.por(prisma(circ(0.032, 12), 0.075, 0.004, true), mover(x, 0.5, 0), BREU);
          }
          return m.pronto();
        };
        const quadro = retArred(CEL + 0.03, CEL + 0.03, 0.04, 3), miolo = retArred(CEL - 0.012, CEL - 0.012, 0.025, 3);
        return {
          folhaA: folha(ROXO), folhaB: folha(OURO),
          dia: peca(prisma(retArred(CEL, CEL, 0.03, 3), 0.034, 0.009, true), OURO),
          hoje: peca(coroa(quadro, miolo, 0.024, 0.005), OURO_CLARO),
          sinal: peca(esfera(0.034, 10, 12), OURO_CLARO),
          orbita: peca(toro(1.27, 0.006, 110, 5), ROXO_CLARO),
          conta: peca(esfera(0.04, 10, 12), OURO),
          brilho: faiscas([[0.62, 0.55, 0.06], [-0.62, 0.55, 0.06], [0.6, -0.52, 0.06], [-0.6, -0.5, 0.06]]),
          poeira: nuvem(20, 1.2, 1.7, 1.7, 47),
          grade: { COL, LIN, CEL, VAO, X0, Y0 },
        };
      },
      preparar(p) {
        // os compromissos: dia (coluna, linha), material e a hora em que entram no ciclo de 9 s
        p.eventos = [[1, 0, OURO, 0.0], [4, 1, BRANCO, 1.5], [2, 2, ROXO_CLARO, 3.0], [5, 3, OURO, 4.5], [6, 0, CREME, 6.0], [0, 3, ROXO, 7.5]];
      },
      desenhar(p, t, dt, idade) {
        const { COL, CEL, VAO, X0, Y0 } = formasProntas.agenda.grade;
        const base = compor(mover(0, -0.1 + Math.sin(t * 0.6) * 0.02, 0), rotY(Math.sin(t * 0.4) * 0.28 + ponteiroMouse.x * 0.35), rotX(-0.08 - ponteiroMouse.y * 0.18), escalar(0.84));
        const A = compor(base, mover(-0.42 - (1 - chega(idade, 0)) * 1.6, -0.14, 0.24), rotY(0.42), rotZ(-0.05), escalar(chega(idade, 0)));
        const B = compor(base, mover(0.42 + (1 - chega(idade, 2)) * 1.6, 0.16, -0.24), rotY(-0.3), rotZ(0.04), escalar(chega(idade, 2)));
        p.desenhar("folhaA", A);
        p.desenhar("folhaB", B);

        const ciclo = t % 9, ATRASO = 0.55;                       // tempo que o aviso leva de uma agenda à outra
        const salto = (x) => (x < 0 || x > 6.2 ? 0 : x < 0.35 ? mola(x / 0.35) : x > 5.8 ? 1 - vaivem((x - 5.8) / 0.4) : 1);
        p.eventos.forEach(([c, l, mat, hora]) => {
          const idadeEv = (ciclo - hora + 9) % 9, cel = mover(X0 + c * (CEL + VAO), Y0 - l * (CEL + VAO), 0.05);
          const a = salto(idadeEv), b = salto(idadeEv - ATRASO);
          if (a > 0.01) p.desenhar("dia", compor(A, cel, mover(0, 0, a * 0.03), escalar(a, a, 1)), mat);
          if (b > 0.01) p.desenhar("dia", compor(B, cel, mover(0, 0, b * 0.03), escalar(b, b, 1)), mat);
          // o aviso: uma conta sai da agenda da frente e pousa na de trás
          if (idadeEv > 0.05 && idadeEv < ATRASO) {
            const k = vaivem(idadeEv / ATRASO);
            p.desenhar("sinal", compor(base, mover(-0.42 + k * 0.84, 0.72 + Math.sin(k * PI) * 0.3, 0.3 - k * 0.5), escalar(0.6 + Math.sin(k * PI) * 0.7)), mat);
          }
        });
        // o marcador de "hoje" anda um dia por vez, igual nas duas
        const dia = Math.floor(t / 1.5) % (COL * 4), frac = mola(limitar(((t / 1.5) % 1) * 4, 0, 1));
        const hoje = mover(X0 + (dia % COL) * (CEL + VAO), Y0 - Math.floor(dia / COL) * (CEL + VAO), 0.062);
        p.desenhar("hoje", compor(A, hoje, escalar(1.25 - frac * 0.25, 1.25 - frac * 0.25, 1)));
        p.desenhar("hoje", compor(B, hoje, escalar(1.25 - frac * 0.25, 1.25 - frac * 0.25, 1)));

        const orb = compor(rotX(1.25), rotZ(-0.3), escalar(chega(idade, 3, 1.2)));
        p.desenhar("orbita", compor(orb, rotZ(t * 0.1)));
        for (const f of [0, PI]) p.desenhar("conta", compor(orb, rotZ(t * 0.45 + f), mover(1.27, 0, 0)), f ? BRANCO : OURO);
        p.pontos("brilho", t, A, COR_FAISCA, 3, 1);
        p.pontos("brilho", t + 1.7, B, COR_FAISCA, 3, 1);
        p.pontos("poeira", t, rotY(t * 0.06), COR_FAISCA, 1.1);
      },
    },

    /* ============================================================
       AutoniCK · o giroscópio
       A peça que se mantém de pé sozinha. Gaiola de três aros,
       volante dentado girando no eixo e o conjunto todo em
       precessão, apoiado na ponta.
       ============================================================ */
    giroscopio: {
      campo: 1.36,
      formas: () => {
        const gaiola = new Molde();
        const anel = aro(0.93, 1.0, 0.07, 0.012, 96);
        gaiola.por(anel, rotX(PI / 2), OURO).por(anel, rotZ(PI / 2), OURO);
        gaiola.por(aro(0.86, 0.925, 0.05, 0.01, 96), IDENT, ROXO);                                    // aro do equador em laca
        for (let k = 0; k < 48; k++)
          gaiola.por(prisma(ret(k % 4 ? 0.008 : 0.014, k % 4 ? 0.03 : 0.045), 0.006), compor(rotY((k / 48) * TAU), mover(0.8925, 0.027, 0), DEITAR, rotZ(PI / 2)), k % 4 ? CREME : OURO_CLARO);
        for (let k = 0; k < 4; k++)                                                                   // mancais onde os aros se cruzam
          gaiola.por(prisma(retArred(0.13, 0.13, 0.03, 3), 0.1, 0.014, true), compor(rotY(k * PI / 2), mover(0.965, 0, 0), rotY(PI / 2)), OURO_ESCURO);
        // eixo com pontas de apoio, mancais de rubi e botão no topo
        gaiola.por(torno([[0, -1.16], [0.03, -1.03], [0.03, 1.0], [0.075, 1.03], [0.075, 1.075], [0.035, 1.105], [0, 1.115]], 20), IDENT, OURO_ESCURO);
        for (const y of [-0.965, 0.965]) {
          gaiola.por(disco(0.12, y - 0.045, y + 0.045, 0.014, 28), IDENT, OURO);
          gaiola.por(esfera(0.045, 8, 12), mover(0, y + (y > 0 ? -0.07 : 0.07), 0), ROXO_CLARO);
        }
        // volante: aro pesado e dentado, filete de laca, cubo torneado e seis raios
        const volante = new Molde();
        const [ve, vi] = dentes(44, 0.615, 0.65, 0.5);
        volante.por(coroa(ve, vi, 0.15, 0.016), DEITAR, OURO);
        for (const lado of [1, -1]) volante.por(torno([[0.6, 0.075], [0.6, 0.083], [0.525, 0.083], [0.525, 0.075]], 80), escalar(1, lado, 1), ROXO_FUNDO);
        for (let k = 0; k < 6; k++)
          volante.por(prisma(trapezio(0.1, 0.085, 0.52, 0.05), 0.05, 0.01), compor(rotY((k / 6) * TAU), DEITAR), k % 2 ? OURO_ESCURO : OURO_CLARO);
        volante.por(torno([[0.03, -0.11], [0.1, -0.11], [0.145, -0.07], [0.145, 0.07], [0.1, 0.11], [0.03, 0.11]], 28), IDENT, OURO);
        volante.por(aro(0.085, 0.15, 0.03, 0.006, 28), IDENT, ROXO);
        return {
          gaiola: gaiola.pronto(), volante: volante.pronto(),
          apoio: new Molde().por(torno([[0, -0.07], [0.3, -0.07], [0.31, -0.06], [0.31, -0.035], [0.22, -0.02], [0.22, 0], [0.07, 0.02], [0.05, 0.035], [0, 0.03]], 40), IDENT, TINTA)
            .por(aro(0.235, 0.3, 0.012, 0.003, 40), mover(0, -0.02, 0), OURO).pronto(),
          orbita: peca(toro(1.27, 0.006, 110, 5), ROXO_CLARO),
          conta: peca(esfera(0.04, 10, 12), OURO),
          brilho: faiscas([[0, 1.11, 0], [1, 0, 0], [-1, 0, 0], [0, 0.6, 0.78], [0.65, 0.08, 0], [0, -0.6, -0.78]]),
          poeira: nuvem(20, 1.2, 1.7, 1.8, 59),
        };
      },
      desenhar(p, t, dt, idade) {
        const entra = chega(idade, 0, 1.2);
        const base = compor(mover(0, 0.05, 0), rotX(0.5 - ponteiroMouse.y * 0.16), rotY(ponteiroMouse.x * 0.3), escalar(0.9 * entra));
        // precessão: o eixo inclina e descreve um cone, com a ponta de baixo parada no apoio
        const psi = t * 0.55, tomba = 0.3 + Math.sin(t * 1.3) * 0.03;
        const corpo = compor(base, mover(0, -1.16, 0), rotY(psi), rotX(tomba), rotY(-psi * 0.6 + (1 - entra) * 4), mover(0, 1.16, 0));
        p.desenhar("apoio", compor(base, mover(0, -1.2, 0)));
        p.desenhar("gaiola", corpo);
        p.desenhar("volante", compor(corpo, rotY(t * 4.2), escalar(chega(idade, 3))));

        const orb = compor(rotX(PI / 2 - 0.25), rotY(0.3), escalar(chega(idade, 4, 1.2)));
        p.desenhar("orbita", compor(orb, rotZ(t * 0.1)));
        p.desenhar("conta", compor(orb, rotZ(-t * 0.5), mover(1.27, 0, 0)));
        p.pontos("brilho", t, corpo, COR_FAISCA, 3.2, 1);
        p.pontos("poeira", t, rotY(t * 0.06), COR_FAISCA, 1.1);
      },
    },
  };

  /* ---------- laço único de animação ---------- */
  const emPausa = () => document.hidden || raiz.classList.contains("ck-vinheta-ativa");
  const passo = (agora) => {
    laco = 0;
    const t = agora / 1000;
    const dt = Math.min(0.05, ultimo ? t - ultimo : 0.016);
    const bruto = ultimo ? t - ultimo : 0.016;
    ultimo = t;
    if (emPausa()) { ultimo = 0; return; }
    ponteiroMouse.x += (ponteiroMouse.alvoX - ponteiroMouse.x) * Math.min(1, dt * 4);
    ponteiroMouse.y += (ponteiroMouse.alvoY - ponteiroMouse.y) * Math.min(1, dt * 4);
    let ativos = 0;
    palcos.forEach((p) => {
      if (!p.visivel || !p.gl) return;
      ativos++;
      p.quadro(t, dt);
    });
    if (ativos === 1) palcos.forEach((p) => p.visivel && p.gl && p.aferir(bruto));
    else if (ativos > 1) palcos.forEach((p) => p.visivel && p.gl && bruto > 0.042 && p.aferir(bruto));
    if (ativos && !semMovimento) laco = requestAnimationFrame(passo);
    else ultimo = 0;
  };
  const acordar = () => { if (!laco) laco = requestAnimationFrame(passo); };

  /* ---------- quem entra e quem sai de cena ---------- */
  const iniciar = () => {
    const els = [...document.querySelectorAll("[data-palco]")];
    if (!els.length) return;
    const teste = document.createElement("canvas");
    if (!(window.WebGLRenderingContext && (teste.getContext("webgl")))) {
      els.forEach((el) => el.classList.add("sem-3d"));
      return;
    }
    teste.getContext("webgl").getExtension("WEBGL_lose_context")?.loseContext();

    const porEl = new Map();
    els.forEach((el) => { const p = new Palco(el); palcos.add(p); porEl.set(el, p); });

    // perto da tela: cria o contexto. Longe: devolve a memória da placa de vídeo.
    const perto = new IntersectionObserver((entradas) => {
      entradas.forEach((en) => {
        const p = porEl.get(en.target);
        p.perto = en.isIntersecting;
        if (en.isIntersecting) { p.montar(); acordar(); } else p.desmontar();
      });
    }, { rootMargin: "120% 0px 120% 0px" });
    const visivel = new IntersectionObserver((entradas) => {
      entradas.forEach((en) => {
        const p = porEl.get(en.target);
        p.visivel = en.isIntersecting;
        if (en.isIntersecting) { p.montar(); p.medir(); acordar(); }
      });
    }, { rootMargin: "8% 0px 8% 0px" });
    els.forEach((el) => { perto.observe(el); visivel.observe(el); });

    if ("ResizeObserver" in window) {
      const ro = new ResizeObserver((entradas) => entradas.forEach((en) => { porEl.get(en.target)?.medir(); acordar(); }));
      els.forEach((el) => ro.observe(el));
    } else addEventListener("resize", () => { palcos.forEach((p) => p.medir()); acordar(); }, { passive: true });

    // a malha do emblema pode chegar depois do script
    addEventListener("ck:emblema", () => { palcos.forEach((p) => p.perto && p.montar()); acordar(); });
    document.addEventListener("visibilitychange", acordar);
    addEventListener("ck:vinheta-fim", () => { palcos.forEach((p) => (p.nascimento = 0)); acordar(); });

    if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
      addEventListener("pointermove", (ev) => {
        ponteiroMouse.alvoX = (ev.clientX / innerWidth) * 2 - 1;
        ponteiroMouse.alvoY = -((ev.clientY / innerHeight) * 2 - 1);
      }, { passive: true });
    }
  };

  /* controles expostos para o resto do site */
  window.CK3D = {
    palco: (el) => [...palcos].find((p) => p.el === el),
    explodir(el, valor) { const p = this.palco(el); if (p) { p.estado.alvoExplodir = limitar(valor, 0, 1); p.estado.mexeu = performance.now(); acordar(); } },
    rolagem(el, valor) { const p = this.palco(el); if (p) p.estado.rolagem = valor; },
    acordar,
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
