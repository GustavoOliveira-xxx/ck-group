/* ============================================================
   FinCK · apresentação final · fundo vivo
   Conscious Knowledge · Projeto Interdisciplinar 2026

   Um sombreador de tela cheia, desenhado em resolução reduzida
   (o fundo é macio por natureza) e esticado pelo navegador:
   nebulosa com distorção de domínio, três fitas de seda, poeira
   de estrelas em duas profundidades e um piso em perspectiva.

   Ele acompanha a apresentação: a cada troca de slide a câmera
   desliza no sentido da troca, o piso dá um passo à frente, uma
   onda de luz atravessa a tela, e a paleta muda conforme a parte
   da defesa (problemática, local, solução...). Escuta o evento
   "finck:slide" que a direção de cena dispara.
   ============================================================ */
(() => {
  "use strict";

  const canvas = document.querySelector("[data-fundo]");
  if (!canvas) return;

  const raiz = document.documentElement;
  const semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let gl = null;
  try {
    gl = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: "low-power" });
  } catch (_) { gl = null; }
  if (!gl) { raiz.dataset.fundo = "nao"; return; }

  const VERT = `
attribute vec2 aP;
void main() { gl_Position = vec4(aP, 0.0, 1.0); }`;

  const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uT, uOnda, uSentido, uDesvio, uAvanco, uForca;
uniform vec3 uTomA, uTomB;

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float ruido(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 4; i++) { v += a * ruido(p); p = r * p * 2.03 + 11.7; a *= 0.5; }
  return v;
}

/* fita de seda: uma faixa macia ao longo de uma curva, com fios finos dentro */
vec3 fita(vec2 p, float fase, float alt, float larg, float vel, vec3 cor) {
  float x = p.x + uDesvio;
  float y = alt + 0.16 * sin(x * 1.6 + uT * vel + fase) + 0.07 * sin(x * 3.7 - uT * vel * 1.4 + fase * 2.0);
  float d = p.y - y;
  float corpo = exp(-d * d / (larg * larg));
  float fios = 0.55 + 0.45 * sin(d / larg * 26.0 + x * 2.0 + uT * 0.6 + fase);
  float borda = exp(-pow(abs(d) - larg * 0.9, 2.0) / (larg * larg * 0.02));
  return cor * (corpo * (0.18 + 0.22 * fios) + borda * 0.22);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float asp = uRes.x / uRes.y;
  vec2 p = vec2((uv.x - 0.5) * asp, uv.y - 0.5);

  /* céu: violeta profundo em cima, quase preto embaixo */
  vec3 c = mix(vec3(0.012, 0.008, 0.024), vec3(0.05, 0.022, 0.085), smoothstep(-0.5, 0.6, p.y));

  /* nebulosa com distorção de domínio, em paralaxe lenta */
  vec2 q = p * 1.35 + vec2(uDesvio * 0.45, 0.0);
  vec2 w = vec2(fbm(q + uT * 0.035), fbm(q + vec2(5.2, 1.3) - uT * 0.03));
  float n = fbm(q + 1.8 * w + uT * 0.02);
  float massa = smoothstep(0.38, 0.95, n);
  vec3 neb = mix(uTomA, uTomB, smoothstep(0.35, 0.9, w.x));
  float onde = 0.55 + 0.45 * smoothstep(-0.2, 0.55, p.y + 0.25 * sin(p.x * 1.3 + 1.0));
  c += neb * massa * 0.26 * onde;
  c += uTomA * 0.06 * smoothstep(0.9, 0.0, length(p - vec2(-0.75 * asp * 0.6, 0.48)));
  c += uTomB * 0.035 * smoothstep(0.8, 0.0, length(p - vec2(0.7 * asp * 0.6, -0.1)));

  /* estrelas, duas profundidades */
  for (int k = 0; k < 2; k++) {
    float esc = k == 0 ? 70.0 : 140.0;
    vec2 g = (p + vec2(uDesvio * (k == 0 ? 0.12 : 0.06), 0.0)) * esc;
    vec2 cel = floor(g), f = fract(g) - 0.5;
    float h = hash(cel + float(k) * 17.0);
    if (h > 0.93) {
      vec2 o = vec2(hash(cel + 3.1), hash(cel + 7.7)) - 0.5;
      float d = length(f - o * 0.6);
      float pisca = 0.55 + 0.45 * sin(uT * (1.0 + h * 3.0) + h * 40.0);
      vec3 cs = mix(vec3(0.85, 0.8, 1.0), uTomB, step(0.985, h));
      c += cs * smoothstep(0.09, 0.0, d) * pisca * (k == 0 ? 0.9 : 0.5);
    }
  }

  /* fitas de seda */
  c += fita(p, 0.0, 0.16, 0.05, 0.22, mix(uTomA, vec3(1.0), 0.15));
  c += fita(p, 2.1, -0.02, 0.035, 0.17, mix(uTomA, uTomB, 0.55));
  c += fita(p, 4.4, 0.3, 0.025, 0.28, uTomB * 0.8);

  /* piso em perspectiva abaixo do horizonte */
  float horiz = -0.17;
  if (p.y < horiz) {
    float z = 0.32 / (horiz - p.y);
    float x = (p.x + uDesvio * 0.25) * z;
    float zz = z + uAvanco;
    float lz = abs(fract(zz) - 0.5);
    float lx = abs(fract(x * 1.2) - 0.5);
    float esp = 0.015 * z;
    float linha = smoothstep(esp + 0.02, esp, 0.5 - lz) + smoothstep(esp * 0.7 + 0.02, esp * 0.7, 0.5 - lx);
    float some = exp(-z * 0.16) * smoothstep(horiz, horiz - 0.06, p.y);
    vec3 cl = mix(uTomA, uTomB, 0.5 + 0.5 * sin(x * 0.4 + uT * 0.2));
    c += cl * min(linha, 1.0) * some * 0.4;
    c += uTomA * 0.06 * exp(-pow((p.y - horiz) * 18.0, 2.0));
  }
  /* brilho do horizonte */
  c += mix(uTomA, uTomB, 0.4) * 0.12 * exp(-pow((p.y - horiz) * 9.0, 2.0)) * (0.7 + 0.3 * sin(p.x * 2.0 + uT * 0.3));

  /* onda de luz da troca de slide */
  if (uOnda < 1.6) {
    float pos = mix(-1.2, 1.2, uOnda / 1.1) * uSentido * asp * 0.5;
    float d = p.x - pos + p.y * 0.25 * uSentido;
    float fade = smoothstep(1.6, 0.2, uOnda);
    c += mix(uTomB, vec3(1.0, 0.95, 0.85), 0.4) * exp(-d * d * 60.0) * 0.32 * fade * uForca;
    c += uTomA * exp(-d * d * 6.0) * 0.08 * fade * uForca;
  }

  /* vinheta suave e granulação mínima contra bandas no projetor */
  c *= 1.0 - 0.45 * pow(length(uv - 0.5) * 1.3, 2.4);
  c += (hash(gl_FragCoord.xy + fract(uT)) - 0.5) / 255.0 * 2.0;
  c = c / (1.0 + c * 0.35);
  gl_FragColor = vec4(c, 1.0);
}`;

  const compilar = (tipo, fonte) => {
    const s = gl.createShader(tipo);
    gl.shaderSource(s, fonte);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "fundo");
    return s;
  };

  let prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, compilar(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compilar(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error("fundo");
  } catch (e) {
    raiz.dataset.fundo = "nao";
    return;
  }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aP = gl.getAttribLocation(prog, "aP");
  gl.enableVertexAttribArray(aP);
  gl.vertexAttribPointer(aP, 2, gl.FLOAT, false, 0, 0);

  const u = {};
  for (const n of ["uRes", "uT", "uOnda", "uSentido", "uDesvio", "uAvanco", "uForca", "uTomA", "uTomB"]) u[n] = gl.getUniformLocation(prog, n);
  raiz.dataset.fundo = "sim";


  /* ---------- paleta por parte da defesa ---------- */
  const PALETA = {
    "Abertura": [[0.5, 0.18, 0.92], [1.0, 0.72, 0.22]],
    "Introdução": [[0.58, 0.2, 1.0], [0.95, 0.42, 0.85]],
    "Problemática": [[0.72, 0.16, 0.6], [1.0, 0.56, 0.2]],
    "Aplicabilidade local": [[0.28, 0.3, 1.0], [0.22, 0.92, 0.72]],
    "Fundamentação": [[0.52, 0.22, 0.9], [1.0, 0.78, 0.32]],
    "Solução": [[0.42, 0.22, 1.0], [0.28, 0.86, 0.95]],
    "Conclusão": [[0.55, 0.2, 0.95], [1.0, 0.74, 0.28]],
    "Encerramento": [[0.58, 0.24, 1.0], [1.0, 0.78, 0.38]],
  };
  const tom = { a: PALETA.Abertura[0].slice(), b: PALETA.Abertura[1].slice() };
  let alvoTom = PALETA.Abertura;

  /* ---------- estado que a troca de slide move ---------- */
  let desvio = 0, alvoDesvio = 0, avanco = 0, alvoAvanco = 0;
  let onda = 9, sentido = 1, forca = 1;

  document.addEventListener("finck:slide", (e) => {
    const d = e.detail || {};
    alvoTom = PALETA[d.secao] || PALETA.Abertura;
    alvoDesvio = d.indice * 0.38;
    if (d.antes >= 0) {
      sentido = d.indice >= d.antes ? 1 : -1;
      alvoAvanco += 1.6 * sentido;
      onda = 0;
      forca = d.marco ? 1.6 : 1;
    } else {
      desvio = alvoDesvio;
      tom.a = alvoTom[0].slice();
      tom.b = alvoTom[1].slice();
    }
  });


  /* ---------- resolução: macia de propósito, com teto de pixels ---------- */
  let escala = 0.5, largura = 0, altura = 0;
  const ajustar = () => {
    const w = window.innerWidth, h = window.innerHeight;
    const k = Math.min(escala, 1100 / Math.max(w, h) * (window.devicePixelRatio > 1.5 ? 1.2 : 1));
    const W = Math.max(2, Math.round(w * k)), H = Math.max(2, Math.round(h * k));
    if (W !== largura || H !== altura) {
      largura = canvas.width = W;
      altura = canvas.height = H;
      gl.viewport(0, 0, W, H);
    }
  };

  const desenhar = (t) => {
    ajustar();
    gl.uniform2f(u.uRes, largura, altura);
    gl.uniform1f(u.uT, t);
    gl.uniform1f(u.uOnda, onda);
    gl.uniform1f(u.uSentido, sentido);
    gl.uniform1f(u.uDesvio, desvio);
    gl.uniform1f(u.uAvanco, avanco);
    gl.uniform1f(u.uForca, forca);
    gl.uniform3fv(u.uTomA, tom.a);
    gl.uniform3fv(u.uTomB, tom.b);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  if (semMovimento) {
    desenhar(12);
    window.addEventListener("resize", () => desenhar(12));
    document.addEventListener("finck:slide", () => requestAnimationFrame(() => {
      tom.a = alvoTom[0].slice();
      tom.b = alvoTom[1].slice();
      desenhar(12);
    }));
    return;
  }

  let ultimo = performance.now() / 1000, soma = 0, conta = 0;
  const quadro = (ms) => {
    requestAnimationFrame(quadro);
    if (document.hidden) { ultimo = ms / 1000; return; }
    const agora = ms / 1000;
    const dt = Math.min(0.1, Math.max(0.001, agora - ultimo));
    ultimo = agora;

    const k = 1 - Math.exp(-dt * 2.2);
    desvio += (alvoDesvio - desvio) * k;
    avanco += (alvoAvanco - avanco) * (1 - Math.exp(-dt * 2.8));
    for (let i = 0; i < 3; i++) {
      tom.a[i] += (alvoTom[0][i] - tom.a[i]) * k;
      tom.b[i] += (alvoTom[1][i] - tom.b[i]) * k;
    }
    onda += dt;
    avanco += dt * 0.05;
    desenhar(agora);

    /* placa fraca: o fundo encolhe a resolução antes de pesar nos slides */
    soma += dt;
    if (++conta >= 90) {
      const media = soma / conta;
      soma = 0;
      conta = 0;
      if (media > 0.026 && escala > 0.3) escala = Math.max(0.3, escala * 0.8);
    }
  };
  requestAnimationFrame(quadro);
})();
