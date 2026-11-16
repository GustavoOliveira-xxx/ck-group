/* ============================================================
   Conscious Knowledge · motor 3D do site
   WebGL puro, sem biblioteca. Cada "palco" é um <canvas> que só
   existe enquanto está perto da tela e só desenha enquanto está
   visível. A resolução se ajusta sozinha ao aparelho: se os
   quadros vierem lentos, o palco diminui a nitidez antes de
   deixar a página travar.

   Uso no HTML:  <div data-palco="emblema|anatomia|moeda|no|elos|giroscopio">
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
  const limitar = (v, a, b) => Math.min(b, Math.max(a, v));
  const saida = (t) => 1 - Math.pow(1 - t, 4);

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

// estúdio de luz procedural: uma caixa de luz no alto, três faixas na linha do
// horizonte e um contraluz roxo por baixo. Gira devagar, e é isso que faz o ouro
// "passar brilho" mesmo com a peça parada.
vec3 estudio(vec3 r) {
  float a = uTempo * 0.22;
  float c = cos(a), s = sin(a);
  r.xz = mat2(c, -s, s, c) * r.xz;
  vec3 cor = mix(vec3(0.02, 0.008, 0.045), vec3(0.10, 0.045, 0.17), smoothstep(-1.0, 1.0, r.y));
  cor += vec3(1.0, 0.95, 0.88) * smoothstep(0.62, 0.9, r.y) * 1.5;
  float az = atan(r.z, r.x);
  float faixa = smoothstep(0.985, 1.0, sin(az * 2.0 + 0.6 + r.y * 1.3)) * smoothstep(0.95, 0.0, abs(r.y));
  cor += vec3(1.0, 0.9, 0.72) * faixa * faixa * 2.8;
  cor += vec3(0.62, 0.12, 1.0) * smoothstep(0.15, 0.95, -r.y) * 0.6;
  return cor;
}

void main() {
  vec3 N = normalize(vN);
  vec3 V = normalize(uOlho - vMundo);
  if (!gl_FrontFacing) N = -N;
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
    // ouro polido: a cor da marca por baixo, o reflexo do estúdio por cima
    cor = vCor * (0.38 + d1 * 0.5 + d2 * 0.3 + amb * 0.6);
    cor += vec3(1.0, 0.93, 0.7) * (e1 * 0.9 + e2 * 0.8) + amb * fresnel * 0.3;
  } else if (vTipo > 1.5) {
    // branco dos olhos: porcelana, quase sem sombra
    cor = vCor * (0.95 + d1 * 0.45 + d2 * 0.2) + amb * (0.02 + fresnel * 0.2) + e1 * 0.4;
  } else {
    // laca: cor cheia por baixo de um verniz que reflete o estúdio
    float claro = 0.36 + d1 * 0.66 + d2 * 0.36;
    cor = vCor * claro + amb * (0.008 + fresnel * 0.5) + vec3(1.0, 0.95, 1.0) * (e1 * 0.55 + e2 * 0.4);
  }
  cor *= mix(0.5, 1.0, vOclusao);
  // compressão dos brilhos pela luminância: clareia sem lavar a cor da marca
  float lum = dot(cor, vec3(0.3, 0.55, 0.15));
  cor = mix(cor / (1.0 + lum * 0.5), cor / (1.0 + cor * 0.5), 0.25);
  gl_FragColor = vec4(pow(cor, vec3(0.4545)), 1.0);
}`;

  const VERT_PONTO = `
attribute vec4 aPonto;     // xyz + fase
uniform mat4 uModelo, uCamera;
uniform float uTempo, uEscala;
varying float vBrilho;
void main() {
  vec4 m = uModelo * vec4(aPonto.xyz, 1.0);
  gl_Position = uCamera * m;
  float pisca = 0.5 + 0.5 * sin(uTempo * (1.2 + fract(aPonto.w * 7.3) * 1.6) + aPonto.w * 40.0);
  vBrilho = pisca;
  gl_PointSize = uEscala * (0.6 + fract(aPonto.w * 3.7)) * (0.55 + pisca * 0.6) / gl_Position.w;
}`;
  const FRAG_PONTO = `
precision mediump float;
varying float vBrilho;
uniform vec3 uCorPonto;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float r = length(d);
  float nucleo = smoothstep(0.5, 0.0, r);
  float cruz = max(smoothstep(0.06, 0.0, abs(d.x)) , smoothstep(0.06, 0.0, abs(d.y))) * smoothstep(0.5, 0.05, r);
  float a = (nucleo * nucleo * 0.9 + cruz * 0.55) * (0.35 + vBrilho * 0.65);
  gl_FragColor = vec4(uCorPonto * a, 0.0);
}`;

  /* ---------- geometrias procedurais (posição + normal intercaladas) ---------- */
  const malha = (pos, nor, idx) => {
    const v = new Float32Array(pos.length * 2);
    for (let i = 0; i < pos.length / 3; i++) {
      v.set(pos.slice(i * 3, i * 3 + 3), i * 6);
      v.set(nor.slice(i * 3, i * 3 + 3), i * 6 + 3);
    }
    return { v, i: new Uint16Array(idx) };
  };

  const toro = (R, r, voltas = 72, lados = 10) => {
    const pos = [], nor = [], idx = [];
    for (let a = 0; a <= voltas; a++) {
      const u = (a / voltas) * Math.PI * 2, cu = Math.cos(u), su = Math.sin(u);
      for (let b = 0; b <= lados; b++) {
        const w = (b / lados) * Math.PI * 2, cw = Math.cos(w), sw = Math.sin(w);
        pos.push((R + r * cw) * cu, (R + r * cw) * su, r * sw);
        nor.push(cw * cu, cw * su, sw);
      }
    }
    for (let a = 0; a < voltas; a++)
      for (let b = 0; b < lados; b++) {
        const p = a * (lados + 1) + b, q = p + lados + 1;
        idx.push(p, q, p + 1, q, q + 1, p + 1);
      }
    return malha(pos, nor, idx);
  };

  /* tubo ao longo de um nó tórico (p, q) */
  const no = (p, q, R, r, passos = 150, lados = 9) => {
    const curva = (u) => {
      const cu = Math.cos(u), su = Math.sin(u), qu = (q / p) * u, cs = Math.cos(qu);
      return [R * (2 + cs) * 0.5 * cu, R * (2 + cs) * 0.5 * su, R * Math.sin(qu) * 0.5];
    };
    const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    const cruz = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
    const pos = [], nor = [], idx = [];
    for (let a = 0; a <= passos; a++) {
      const u = (a / passos) * p * Math.PI * 2;
      const P1 = curva(u), P2 = curva(u + 0.01);
      const T = sub(P2, P1), B = norm(cruz(T, [P1[0] + P2[0], P1[1] + P2[1], P1[2] + P2[2]]));
      const N = norm(cruz(B, T));
      for (let b = 0; b <= lados; b++) {
        const w = (b / lados) * Math.PI * 2, cx = -Math.cos(w), cy = Math.sin(w);
        const n = [cx * N[0] + cy * B[0], cx * N[1] + cy * B[1], cx * N[2] + cy * B[2]];
        pos.push(P1[0] + r * n[0], P1[1] + r * n[1], P1[2] + r * n[2]);
        nor.push(n[0], n[1], n[2]);
      }
    }
    for (let a = 0; a < passos; a++)
      for (let b = 0; b < lados; b++) {
        const i0 = a * (lados + 1) + b, i1 = i0 + lados + 1;
        idx.push(i0, i1, i0 + 1, i1, i1 + 1, i0 + 1);
      }
    const m = malha(pos, nor, idx);
    m.curva = curva;
    m.voltas = p;
    return m;
  };

  /* sólido de revolução em torno de Y, com cada lance do perfil facetado */
  const torno = (perfil, gomos = 64) => {
    const pos = [], nor = [], idx = [];
    for (let s = 0; s < perfil.length - 1; s++) {
      const [r0, y0] = perfil[s], [r1, y1] = perfil[s + 1];
      const dr = r1 - r0, dy = y1 - y0, l = Math.hypot(dr, dy) || 1;
      const nr = dy / l, ny = -dr / l, base = pos.length / 3;
      for (let g = 0; g <= gomos; g++) {
        const a = (g / gomos) * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a);
        pos.push(r0 * c, y0, r0 * sn, r1 * c, y1, r1 * sn);
        nor.push(nr * c, ny, nr * sn, nr * c, ny, nr * sn);
      }
      for (let g = 0; g < gomos; g++) {
        const p = base + g * 2;
        idx.push(p, p + 1, p + 2, p + 1, p + 3, p + 2);
      }
    }
    return malha(pos, nor, idx);
  };

  const caixa = (lx, ly, lz) => {
    const pos = [], nor = [], idx = [];
    const faces = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
    faces.forEach((n, f) => {
      const u = [n[1], n[2], n[0]], w = [n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]];
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([a, b]) => {
        pos.push((n[0] + a * u[0] + b * w[0]) * lx / 2, (n[1] + a * u[1] + b * w[1]) * ly / 2, (n[2] + a * u[2] + b * w[2]) * lz / 2);
        nor.push(n[0], n[1], n[2]);
      });
      idx.push(f * 4, f * 4 + 1, f * 4 + 2, f * 4, f * 4 + 2, f * 4 + 3);
    });
    return malha(pos, nor, idx);
  };

  const octaedro = (r, alto = 1.5) => {
    const v = [[r, 0, 0], [-r, 0, 0], [0, r * alto, 0], [0, -r * alto, 0], [0, 0, r], [0, 0, -r]];
    const f = [[0, 2, 4], [4, 2, 1], [1, 2, 5], [5, 2, 0], [4, 3, 0], [1, 3, 4], [5, 3, 1], [0, 3, 5]];
    const pos = [], nor = [], idx = [];
    f.forEach(([a, b, c], i) => {
      const A = v[a], B = v[b], C = v[c];
      const n = [(B[1] - A[1]) * (C[2] - A[2]) - (B[2] - A[2]) * (C[1] - A[1]),
        (B[2] - A[2]) * (C[0] - A[0]) - (B[0] - A[0]) * (C[2] - A[2]),
        (B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0])];
      const l = Math.hypot(...n);
      [A, B, C].forEach((p) => { pos.push(...p); nor.push(n[0] / l, n[1] / l, n[2] / l); });
      idx.push(i * 3, i * 3 + 1, i * 3 + 2);
    });
    return malha(pos, nor, idx);
  };

  const esfera = (r, faixas = 20, gomos = 28) => {
    const pos = [], nor = [], idx = [];
    for (let a = 0; a <= faixas; a++) {
      const t = (a / faixas) * Math.PI, st = Math.sin(t), ct = Math.cos(t);
      for (let b = 0; b <= gomos; b++) {
        const f = (b / gomos) * Math.PI * 2, n = [st * Math.cos(f), ct, st * Math.sin(f)];
        pos.push(n[0] * r, n[1] * r, n[2] * r); nor.push(...n);
      }
    }
    for (let a = 0; a < faixas; a++)
      for (let b = 0; b < gomos; b++) {
        const p = a * (gomos + 1) + b, q = p + gomos + 1;
        idx.push(p, p + 1, q, q, p + 1, q + 1);
      }
    return malha(pos, nor, idx);
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
  let laco = 0, ultimo = 0;
  const ponteiro = { x: 0, y: 0, alvoX: 0, alvoY: 0 };

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
      const precisaEmblema = this.cena.emblema;
      if (precisaEmblema && !lerEmblema()) return;       // tenta de novo quando os dados chegarem
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
      this.u = this.uniformes(this.prog, ["uModelo", "uCamera", "uPaleta", "uRecuo", "uExplodir", "uOlhos", "uOlho", "uLuz", "uTempo"]);
      this.up = this.uniformes(this.progPonto, ["uModelo", "uCamera", "uTempo", "uEscala", "uCorPonto"]);
      this.geos = {};
      if (precisaEmblema) {
        const d = lerEmblema();
        this.geos.emblema = { vb: this.buffer(gl.ARRAY_BUFFER, d.v), ib: this.buffer(gl.ELEMENT_ARRAY_BUFFER, d.i), n: d.i.length, compacta: true };
      }
      const formas = this.cena.formas ? this.cena.formas() : {};
      for (const nome in formas) {
        const f = formas[nome];
        this.geos[nome] = { vb: this.buffer(gl.ARRAY_BUFFER, f.v), ib: this.buffer(gl.ELEMENT_ARRAY_BUFFER, f.i), n: f.i.length, fonte: f };
      }
      if (this.cena.pontos) {
        const p = this.cena.pontos();
        this.geos.pontos = { vb: this.buffer(gl.ARRAY_BUFFER, p), n: p.length / 4 };
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

    /* desenha uma geometria com uma matriz e (para as formas simples) um material */
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
        gl.disableVertexAttribArray(2); gl.disableVertexAttribArray(3);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
        gl.vertexAttrib2f(2, 255, 0);
        gl.vertexAttrib1f(3, material);
      }
      gl.uniformMatrix4fv(this.u.uModelo, false, modelo);
      gl.drawElements(gl.TRIANGLES, g.n, gl.UNSIGNED_SHORT, 0);
    }

    quadro(t, dt) {
      const gl = this.gl;
      if (!gl) return;
      if (!this.nascimento) this.nascimento = t;
      const idade = t - this.nascimento;
      const e = this.estado;

      // câmera: enquadra um raio "campo" em qualquer proporção de tela
      const aspecto = this.largura / this.altura;
      const dist = 6, campo = this.cena.campo || 1.5;
      const tanMeio = (campo / dist) / Math.min(1, aspecto);
      const camera = multiplicar(perspectiva(tanMeio, aspecto, 1, 20), mover(0, 0, -dist));

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(this.prog);
      gl.enableVertexAttribArray(0); gl.enableVertexAttribArray(1);
      gl.disable(gl.BLEND); gl.depthMask(true);
      gl.uniformMatrix4fv(this.u.uCamera, false, camera);
      gl.uniform3f(this.u.uOlho, 0, 0, dist);
      gl.uniform1f(this.u.uTempo, semMovimento ? 2.4 : t);
      const lx = this.cena.luzFixa ? 0.35 : ponteiro.x, ly = this.cena.luzFixa ? 0.3 : ponteiro.y;
      gl.uniform3f(this.u.uLuz, 0.25 + lx * 1.5, 0.2 + ly * 1.3, 0.9);
      const d = lerEmblema();
      gl.uniform3fv(this.u.uPaleta, d ? d.paleta : PALETA_RESERVA);
      gl.uniform1f(this.u.uExplodir, 0);

      this.cena.desenhar(this, t, dt, idade, camera);

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

  /* materiais (índices da paleta da marca) */
  const TINTA = 0, ROXO_FUNDO = 3, ROXO = 5, ROXO_CLARO = 6, OURO = 7, OURO_ESCURO = 8, BRANCO = 11;

  /* ---------- cenas ---------- */
  const sorteio = (semente) => { let s = semente; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };

  const desenharEmblema = (p, modelo, recuos, olhos) => {
    const gl = p.gl, d = lerEmblema();
    gl.uniform1fv(p.u.uRecuo, recuos);
    gl.uniform1f(p.u.uExplodir, 1);
    gl.uniform4f(p.u.uOlhos, d.pivos[0], d.pivos[1], olhos[0], olhos[1]);
    p.desenhar("emblema", modelo);
    gl.uniform1f(p.u.uExplodir, 0);
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

  const recuosMontagem = new Float32Array(12);
  const desenharPontos = (p, t, modelo, camera, cor, escala) => {
    const gl = p.gl, g = p.geos.pontos;
    if (!g) return;
    gl.useProgram(p.progPonto);
    gl.disableVertexAttribArray(1); gl.disableVertexAttribArray(2); gl.disableVertexAttribArray(3);
    gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ZERO, gl.ONE); gl.depthMask(false);
    gl.bindBuffer(gl.ARRAY_BUFFER, g.vb);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 16, 0);
    gl.uniformMatrix4fv(p.up.uModelo, false, modelo);
    gl.uniformMatrix4fv(p.up.uCamera, false, camera);
    gl.uniform1f(p.up.uTempo, t);
    gl.uniform1f(p.up.uEscala, escala * p.canvas.height / 22);
    gl.uniform3fv(p.up.uCorPonto, cor);
    gl.drawArrays(gl.POINTS, 0, g.n);
    gl.depthMask(true); gl.disable(gl.BLEND);
  };

  const nuvem = (qtd, raioMin, raioMax, achatar, semente) => {
    const r = sorteio(semente), o = new Float32Array(qtd * 4);
    for (let i = 0; i < qtd; i++) {
      const a = r() * Math.PI * 2, d = raioMin + r() * (raioMax - raioMin);
      o.set([Math.cos(a) * d, (r() - 0.5) * achatar, Math.sin(a) * d, r()], i * 4);
    }
    return o;
  };

  const CENAS = {
    /* ---- topo do site: a máscara se monta, flutua e segue o ponteiro ---- */
    emblema: {
      emblema: true,
      campo: 1.8,
      formas: () => ({ anel: toro(1.42, 0.011, 110, 6), anel2: toro(1.63, 0.007, 110, 6), lasca: octaedro(0.05), conta: esfera(0.034, 10, 12) }),
      pontos: () => nuvem(46, 1.15, 1.95, 1.5, 7),
      preparar(p) {
        const r = sorteio(11);
        p.lascas = Array.from({ length: 9 }, (_, i) => ({
          raio: 1.3 + r() * 0.55, fase: r() * 6.28, vel: (0.1 + r() * 0.16) * (i % 2 ? 1 : -1), alt: (r() - 0.5) * 1.5,
          mat: [OURO, ROXO, OURO, ROXO_CLARO, BRANCO][i % 5], tam: 0.6 + r() * 1.1, giro: r() * 6,
        }));
      },
      desenhar(p, t, dt, idade, camera) {
        const e = p.estado;
        // montagem de abertura: as camadas chegam uma atrás da outra
        const dur = 1.9;
        let aberto = 1;
        for (let i = 0; i < 12; i++) {
          const k = semMovimento ? 1 : limitar((idade - ORDEM[i] * 1.1) / (dur - ORDEM[i] * 0.9), 0, 1);
          recuosMontagem[i] = (1 - saida(k)) * (AFASTAR[i] * 2.6 + (i > 2 ? 1.1 : -0.6));
          if (i === 11) aberto = k;
        }
        const entrada = semMovimento ? 1 : saida(limitar(idade / 1.6, 0, 1));
        const role = e.rolagem;                                   // 0 no topo, 1 quando o hero saiu
        const gy = Math.sin(t * 0.42) * 0.3 + ponteiro.x * 0.5 + (1 - entrada) * -1.5 + role * 1.5;
        const gx = Math.sin(t * 0.33 + 1) * 0.07 - ponteiro.y * 0.3 + 0.04 - role * 0.35;
        const sobe = Math.sin(t * 0.8) * 0.03;
        const escala = (0.55 + 0.45 * entrada) * (1 - role * 0.16);
        const modelo = compor(mover(0, sobe + 0.03, 0), rotY(gy), rotX(gx), rotZ(Math.sin(t * 0.27) * 0.025), escalar(escala), mover(0, 0, -0.06));
        desenharEmblema(p, modelo, recuosMontagem, aberto < 1 ? [1, 1] : piscar(p, t));

        // anéis orbitais finos
        const orb = compor(rotY(gy * 0.35), rotX(1.18 + Math.sin(t * 0.2) * 0.08 + gx), escalar(entrada));
        p.desenhar("anel", compor(orb, rotZ(t * 0.12)), OURO);
        p.desenhar("anel2", compor(rotY(gy * 0.35 + 0.5), rotX(1.42 + gx), rotY(0.5), rotZ(-t * 0.08), escalar(entrada)), ROXO_CLARO);
        // contas que correm pelos anéis
        for (let i = 0; i < 3; i++) {
          const a = t * (0.5 + i * 0.13) + i * 2.1;
          p.desenhar("conta", compor(orb, mover(Math.cos(a) * 1.42, Math.sin(a) * 1.42, 0)), i === 1 ? BRANCO : OURO);
        }
        // lascas flutuando em volta
        p.lascas.forEach((l) => {
          const a = l.fase + t * l.vel;
          p.desenhar("lasca", compor(rotY(gy * 0.3), mover(Math.cos(a) * l.raio, l.alt + Math.sin(t * 0.6 + l.fase) * 0.06, Math.sin(a) * l.raio * 0.8),
            rotY(t * 0.7 + l.giro), rotX(t * 0.45 + l.giro), escalar(l.tam * entrada)), l.mat);
        });
        desenharPontos(p, t, compor(rotY(t * 0.05 + gy * 0.3), escalar(entrada)), camera, [1.0, 0.78, 0.25], 1);
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
        for (let i = 0; i < 12; i++) recuosMontagem[i] = AFASTAR[i] * e.explodir * 1.25;
        const escala = 1.12 - e.explodir * 0.2;
        const modelo = compor(rotY(e.giroY), rotX(e.giroX), escalar(escala), mover(0, 0, -0.06 - e.explodir * 0.12));
        desenharEmblema(p, modelo, recuosMontagem, e.explodir > 0.05 ? [1, 1] : piscar(p, t));
      },
    },

    /* ---- FinCK: a moeda que é também um relógio (preço em tempo) ---- */
    moeda: {
      campo: 1.45,
      formas: () => ({
        aro: torno([[0.78, 0.085], [0.97, 0.085], [1.0, 0.055], [1.0, -0.055], [0.97, -0.085], [0.78, -0.085], [0.78, 0.085]], 72),
        disco: torno([[0, 0.045], [0.79, 0.045], [0.79, -0.045], [0, -0.045]], 72),
        marca: caixa(0.035, 0.03, 0.13), marcaG: caixa(0.055, 0.03, 0.2),
        hora: caixa(0.06, 0.035, 0.42), minuto: caixa(0.04, 0.035, 0.64), pino: esfera(0.07, 10, 14),
        anel: toro(1.3, 0.009, 96, 6), lasca: octaedro(0.045),
      }),
      pontos: () => nuvem(22, 1.1, 1.6, 1.6, 21),
      desenhar(p, t, dt, idade, camera) {
        const entra = semMovimento ? 1 : saida(limitar(idade / 1.2, 0, 1));
        const gy = Math.sin(t * 0.5) * 0.75 + ponteiro.x * 0.3 + (1 - entra) * 2;
        const base = compor(rotY(gy), rotX(1.25 + Math.sin(t * 0.4) * 0.12 - ponteiro.y * 0.2), escalar(entra));
        p.desenhar("aro", base, OURO);
        p.desenhar("disco", base, ROXO_FUNDO);
        for (const lado of [1, -1]) {
          for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2;
            p.desenhar(i % 3 ? "marca" : "marcaG", compor(base, rotY(a), mover(0, 0.05 * lado, i % 3 ? 0.68 : 0.64)), i % 3 ? OURO_ESCURO : OURO);
          }
          p.desenhar("hora", compor(base, rotY(-t * 0.25 * lado), mover(0, 0.06 * lado, 0.17)), OURO);
          p.desenhar("minuto", compor(base, rotY(-t * 1.6 * lado), mover(0, 0.075 * lado, 0.27)), BRANCO);
          p.desenhar("pino", compor(base, mover(0, 0.06 * lado, 0)), OURO);
        }
        p.desenhar("anel", compor(rotY(gy * 0.4), rotX(0.5), rotZ(t * 0.2), escalar(entra)), ROXO_CLARO);
        for (let i = 0; i < 5; i++) {
          const a = t * 0.3 + i * 1.256;
          p.desenhar("lasca", compor(rotX(0.5), mover(Math.cos(a) * 1.3, Math.sin(a) * 1.3, 0), rotY(t + i), escalar(entra * (0.8 + (i % 3) * 0.3))), i % 2 ? OURO : ROXO);
        }
        desenharPontos(p, t, rotY(t * 0.06), camera, [1.0, 0.78, 0.25], 1.2);
      },
    },

    /* ---- DynamiCK: o ciclo que não termina, com o estudante percorrendo o nó ---- */
    no: {
      campo: 1.45,
      formas: () => ({ no: no(2, 3, 0.86, 0.13, 170, 10), conta: esfera(0.09, 12, 16), lasca: octaedro(0.045) }),
      pontos: () => nuvem(22, 1.1, 1.6, 1.6, 33),
      desenhar(p, t, dt, idade, camera) {
        const entra = semMovimento ? 1 : saida(limitar(idade / 1.2, 0, 1));
        const base = compor(rotY(t * 0.25 + ponteiro.x * 0.4 + (1 - entra) * 2), rotX(0.5 + Math.sin(t * 0.3) * 0.2 - ponteiro.y * 0.2), escalar(entra * 0.84));
        p.desenhar("no", base, ROXO);
        const g = p.geos.no.fonte;
        for (let i = 0; i < 3; i++) {
          const u = ((t * 0.16 + i / 3) % 1) * g.voltas * Math.PI * 2, c = g.curva(u), c2 = g.curva(u + 0.01);
          // empurra a conta para fora do tubo, na direção da normal da curva
          const T = [c2[0] - c[0], c2[1] - c[1], c2[2] - c[2]], S = [c[0] + c2[0], c[1] + c2[1], c[2] + c2[2]];
          let B = [T[1] * S[2] - T[2] * S[1], T[2] * S[0] - T[0] * S[2], T[0] * S[1] - T[1] * S[0]];
          const lb = Math.hypot(...B); B = B.map((x) => x / lb);
          p.desenhar("conta", compor(base, mover(c[0] + B[0] * 0.2, c[1] + B[1] * 0.2, c[2] + B[2] * 0.2)), i ? OURO : BRANCO);
        }
        for (let i = 0; i < 5; i++) {
          const a = -t * 0.25 + i * 1.256;
          p.desenhar("lasca", compor(rotX(1.2), mover(Math.cos(a) * 1.42, Math.sin(a) * 1.42, 0), rotY(t + i), escalar(entra)), i % 2 ? OURO : ROXO_CLARO);
        }
        desenharPontos(p, t, rotY(-t * 0.06), camera, [1.0, 0.78, 0.25], 1.2);
      },
    },

    /* ---- SynCK: dois elos que giram juntos, em sincronia ---- */
    elos: {
      campo: 1.45,
      formas: () => ({ elo: toro(0.62, 0.12, 80, 14), fino: toro(1.28, 0.008, 96, 6), conta: esfera(0.06, 10, 14), lasca: octaedro(0.045) }),
      pontos: () => nuvem(22, 1.1, 1.6, 1.6, 47),
      desenhar(p, t, dt, idade, camera) {
        const entra = semMovimento ? 1 : saida(limitar(idade / 1.2, 0, 1));
        const base = compor(rotY(Math.sin(t * 0.4) * 0.6 + ponteiro.x * 0.4 + (1 - entra) * 2), rotX(0.25 - ponteiro.y * 0.2), escalar(entra));
        const giro = t * 0.9;
        p.desenhar("elo", compor(base, mover(-0.36, 0, 0), rotX(giro)), OURO);
        p.desenhar("elo", compor(base, mover(0.36, 0, 0), rotY(Math.PI / 2), rotX(giro)), ROXO);
        p.desenhar("fino", compor(base, rotX(1.35), rotZ(t * 0.15)), ROXO_CLARO);
        for (let i = 0; i < 4; i++) {
          const a = t * 0.5 + i * 1.5708;
          p.desenhar("conta", compor(base, rotX(1.35), mover(Math.cos(a) * 1.28, Math.sin(a) * 1.28, 0)), i % 2 ? BRANCO : OURO);
        }
        for (let i = 0; i < 4; i++) {
          const a = -t * 0.2 + i * 1.57 + 0.6;
          p.desenhar("lasca", compor(rotX(-0.4), mover(Math.cos(a) * 1.5, Math.sin(a) * 1.1, 0), rotY(t + i), escalar(entra)), i % 2 ? OURO : ROXO_CLARO);
        }
        desenharPontos(p, t, rotY(t * 0.06), camera, [1.0, 0.78, 0.25], 1.2);
      },
    },

    /* ---- AutoniCK: giroscópio, a peça que se mantém de pé sozinha ---- */
    giroscopio: {
      campo: 1.45,
      formas: () => ({ a: toro(1.18, 0.045, 90, 10), b: toro(0.96, 0.04, 80, 10), c: toro(0.74, 0.036, 70, 10), nucleo: octaedro(0.3, 1.25), eixo: caixa(0.03, 1.5, 0.03), lasca: octaedro(0.045) }),
      pontos: () => nuvem(22, 1.1, 1.6, 1.6, 59),
      desenhar(p, t, dt, idade, camera) {
        const entra = semMovimento ? 1 : saida(limitar(idade / 1.2, 0, 1));
        const base = compor(rotY(ponteiro.x * 0.4 + 0.5 + (1 - entra) * 2), rotX(0.3 - ponteiro.y * 0.2), escalar(entra));
        const A = compor(base, rotY(t * 0.5));
        const B = compor(A, rotX(t * 0.8));
        const C = compor(B, rotY(t * 1.1));
        p.desenhar("a", A, ROXO);
        p.desenhar("b", B, OURO);
        p.desenhar("c", C, ROXO_CLARO);
        p.desenhar("eixo", compor(C, rotX(Math.PI / 2)), OURO_ESCURO);
        p.desenhar("nucleo", compor(C, rotX(Math.PI / 2), rotY(t * 2.2)), OURO);
        for (let i = 0; i < 5; i++) {
          const a = t * 0.22 + i * 1.256;
          p.desenhar("lasca", compor(rotX(1.1), mover(Math.cos(a) * 1.5, Math.sin(a) * 1.5, 0), rotY(t + i), escalar(entra)), i % 2 ? OURO : ROXO_CLARO);
        }
        desenharPontos(p, t, rotY(t * 0.06), camera, [1.0, 0.78, 0.25], 1.2);
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
    ponteiro.x += (ponteiro.alvoX - ponteiro.x) * Math.min(1, dt * 4);
    ponteiro.y += (ponteiro.alvoY - ponteiro.y) * Math.min(1, dt * 4);
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
        ponteiro.alvoX = (ev.clientX / innerWidth) * 2 - 1;
        ponteiro.alvoY = -((ev.clientY / innerHeight) * 2 - 1);
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
