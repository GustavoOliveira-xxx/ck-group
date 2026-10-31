/*!
 * CK · vinheta de abertura (Aurora)
 * Consciência que cria, Conhecimento que transforma.
 *
 * Arquivo gerado por marca/gerar_vinheta.py no repositório ck-group. Não edite à mão:
 * mude marca/vinheta.modelo.js e gere de novo.
 *
 * Como usar: no <head>, antes de qualquer outro script:
 *   <script src="/ck-vinheta.js"></script>
 * Atributos opcionais:
 *   data-credito="nao"   esconde "UMA PRODUÇÃO DE" (use no site da própria CK)
 *   data-modo="auto"     auto (padrão) | completa | curta | manual
 *     auto: completa na primeira abertura do dia, curta nas outras aberturas do
 *           dia, nada ao trocar de página dentro da mesma sessão.
 *     manual: não toca sozinha; chame window.CKVinheta.tocar().
 * Ao terminar, dispara o evento "ck:vinheta-fim" em document.
 */
(function () {
  'use strict';
  if (window.CKVinheta) return;
  var D = /*__DADOS__*/null;
  var script = document.currentScript;
  var ds = (script && script.dataset) || {};
  var CFG = { credito: ds.credito !== 'nao', modo: ds.modo || 'auto' };
  var SVGNS = 'http://www.w3.org/2000/svg';
  var VB = D.vb, MC = D.centro, CAM = D.camadas;
  var CHAVE_DIA = 'ck:vinheta:dia', CHAVE_SESSAO = 'ck:vinheta:sessao';

  function ler(st, k) { try { return window[st].getItem(k); } catch (e) { return null; } }
  function gravar(st, k, v) { try { window[st].setItem(k, v); } catch (e) {} }
  function hoje() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  // respeita o "reduzir movimento" do aparelho e também o do próprio app, quando ele marca
  // <html data-motion="reduced"> (caso do DynamiCK)
  function reduzMovimento() {
    if (document.documentElement.getAttribute('data-motion') === 'reduced') return true;
    try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
  }

  /* ------------------------------------------------------------------ estilos */
  var CSS =
    '#ck-vinheta{position:fixed;inset:0;z-index:2147483000;background:#06020b;overflow:hidden;contain:strict;cursor:pointer;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none}' +
    '#ck-vinheta div,#ck-vinheta canvas{position:absolute;pointer-events:none}' +
    '#ck-vinheta .ckv-tela{inset:0}' +
    '#ck-vinheta canvas{inset:0;width:100%;height:100%}' +
    '#ck-vinheta .ckv-fundo{background:radial-gradient(75vmax 60vmax at var(--mx) var(--my),#1f0a33 0%,#0c0416 55%,#06020b 100%)}' +
    '#ck-vinheta .ckv-aurora{background:radial-gradient(circle 75vmin at var(--mx) var(--my),rgba(163,8,200,.62),rgba(100,1,135,.26) 50%,transparent),radial-gradient(45vmax 30vmax at 50% 100%,rgba(252,207,2,.13),transparent 70%);opacity:0;will-change:opacity}' +
    '#ck-vinheta .ckv-clarao{background:radial-gradient(circle 46vmin at var(--fx) var(--fy),rgba(255,236,160,.9),rgba(252,207,2,.45) 35%,transparent);opacity:0;will-change:opacity}' +
    '#ck-vinheta .ckv-caixa{left:50%;top:50%;width:min(86vw,calc(86vh*' + (VB.w / VB.h).toFixed(4) + '));aspect-ratio:' + VB.w + '/' + VB.h + ';transform:translate(-50%,-50%)}' +
    '#ck-vinheta .ckv-l,#ck-vinheta .ckv-i{will-change:transform,opacity}' +
    '#ck-vinheta canvas.ckv-gr-c{opacity:0;will-change:opacity}' +
    '#ck-vinheta .ckv-i{inset:0}' +
    '#ck-vinheta svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}' +
    '#ck-vinheta .ckv-faixa{top:-20%;height:140%;width:34%;left:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.85),transparent);transform:translateX(-120%) skewX(-20deg);will-change:transform}' +
    '#ck-vinheta .ckv-pular{right:max(14px,env(safe-area-inset-right,0px));bottom:max(14px,env(safe-area-inset-bottom,0px));font:600 12px/1 system-ui,sans-serif;letter-spacing:.08em;color:rgba(230,215,250,.55);text-transform:uppercase}';

  /* ------------------------------------------------------------------ montagem */
  // Cada camada já vem pronta em SVG (gerada em Python); aqui só posicionamos.
  function pct(v, ref) { return (v / ref * 100).toFixed(4) + '%'; }
  function caixaDe(k) { return CAM[k].ext || CAM[k].caixa; }

  function montar(credito) {
    var raiz = document.createElement('div');
    raiz.id = 'ck-vinheta';
    raiz.setAttribute('role', 'img');
    raiz.setAttribute('aria-label', 'CK, Conscious Knowledge. Consciência que cria, Conhecimento que transforma.');
    var html = '<div class="ckv-tela ckv-fundo"></div><div class="ckv-tela ckv-aurora"></div><canvas class="ckv-gr-c"></canvas><div class="ckv-caixa">';
    var pos = function (c) { return 'left:' + pct(c.x - VB.x, VB.w) + ';top:' + pct(c.y - VB.y, VB.h) + ';width:' + pct(c.w, VB.w) + ';height:' + pct(c.h, VB.h); };
    D.ordem.forEach(function (k) {
      if (k === 'credito' && !credito) return;
      html += '<div class="ckv-l" data-c="' + k + '" style="' + pos(caixaDe(k)) + '"><div class="ckv-i">' + CAM[k].xml + '</div></div>';
      if (k === 'letraK') {
        // faixa de brilho que corre pelo CK, recortada no formato das letras
        var m = 'url(&quot;data:image/svg+xml,' + encodeURIComponent(D.faixaMascara) + '&quot;) 0 0/100% 100% no-repeat';
        html += '<div class="ckv-l" data-c="faixa" style="' + pos(D.ck) + ';-webkit-mask:' + m + ';mask:' + m + ';overflow:hidden"><div class="ckv-faixa"></div></div>';
      }
    });
    html += '</div><canvas class="ckv-frente"></canvas><div class="ckv-tela ckv-clarao"></div>';
    raiz.innerHTML = html;
    var L = {};
    [].forEach.call(raiz.querySelectorAll('.ckv-l'), function (el) { L[el.getAttribute('data-c')] = { o: el, i: el.firstChild }; });
    // estado de repouso das camadas de brilho
    L.olhosBrilho.i.style.opacity = '0'; L.ckBrilho.o.style.opacity = '.55';
    return { raiz: raiz, L: L, caixa: raiz.querySelector('.ckv-caixa'), aurora: raiz.querySelector('.ckv-aurora'), clarao: raiz.querySelector('.ckv-clarao'),
      gr: raiz.querySelector('.ckv-gr-c'), frente: raiz.querySelector('.ckv-frente'), faixa: raiz.querySelector('.ckv-faixa') };
  }

  /* ------------------------------------------------------------------ partículas, raios de luz e eletricidade (canvas) */
  function sprite(cor, estrela) {
    var c = document.createElement('canvas'); c.width = c.height = 64; var x = c.getContext('2d');
    var g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, '#fff'); g.addColorStop(estrela ? .08 : .18, cor); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g;
    if (estrela) {
      x.beginPath(); x.moveTo(32, 0); x.quadraticCurveTo(36, 28, 64, 32); x.quadraticCurveTo(36, 36, 32, 64); x.quadraticCurveTo(28, 36, 0, 32); x.quadraticCurveTo(28, 28, 32, 0); x.fill();
      x.globalCompositeOperation = 'lighter'; x.beginPath(); x.arc(32, 32, 9, 0, 7); x.fill();
    } else x.fillRect(0, 0, 64, 64);
    return c;
  }
  function spriteRaios() {
    var c = document.createElement('canvas'), n = 256; c.width = c.height = n; var x = c.getContext('2d');
    x.translate(n / 2, n / 2);
    for (var i = 0; i < 20; i++) {
      var a = i * Math.PI / 10, w = (i % 2 ? 3.2 : 5.5) * Math.PI / 180;
      x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, n / 2, a - w, a + w); x.closePath();
      x.fillStyle = i % 2 ? 'rgba(200,110,255,.30)' : 'rgba(255,226,120,.34)'; x.fill();
    }
    x.globalCompositeOperation = 'destination-in';
    var g = x.createRadialGradient(0, 0, 0, 0, 0, n / 2);
    g.addColorStop(0, 'rgba(0,0,0,.9)'); g.addColorStop(.18, 'rgba(0,0,0,.42)'); g.addColorStop(.45, 'rgba(0,0,0,.1)'); g.addColorStop(.75, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(-n / 2, -n / 2, n, n);
    return c;
  }
  var CORES = ['#ffd84a', '#ffd84a', '#fff1a8', '#c35cff', '#e7a6ff'];

  /* ------------------------------------------------------------------ execução */
  var E = { sai: 'cubic-bezier(.16,1,.3,1)', volta: 'cubic-bezier(.34,1.56,.64,1)', io: 'cubic-bezier(.65,0,.35,1)' };

  function Vinheta(opcoes) {
    var V = this;
    V.tipo = opcoes.tipo; V.fim = false;
    V.m = montar(opcoes.credito);
    (document.body || document.documentElement).appendChild(V.m.raiz);
    V.parts = []; V.acc = 0; V.t0 = 0;
    V.baixo = (navigator.hardwareConcurrency || 4) <= 4 || (navigator.deviceMemory || 4) <= 2;
    V.spr = { e: CORES.map(function (c) { return sprite(c); }), st: sprite('#fff6d0', true) };
    V.spr.raios = spriteRaios(); V.ctxG = V.m.gr.getContext('2d'); V.ctxF = V.m.frente.getContext('2d');
    V.medir();
    V.aoRedimensionar = function () { V.medir(); };
    window.addEventListener('resize', V.aoRedimensionar);
    V.pular = function (e) { if (e && e.type === 'keydown' && /^(Shift|Control|Alt|Meta|Tab)$/.test(e.key)) return; V.encerrar(260); };
    V.m.raiz.addEventListener('pointerdown', V.pular);
    window.addEventListener('keydown', V.pular, true);
    V.seguranca = setTimeout(function () { V.remover(); }, 9000);
    V.roteiro();
    V.raf = requestAnimationFrame(function (t) { V.quadro(t); });
  }
  Vinheta.prototype.medir = function () {
    var V = this, r = V.m.caixa.getBoundingClientRect(), W = innerWidth, H = innerHeight;
    V.k = r.width / VB.w; V.bx = r.left; V.by = r.top; V.W = W; V.H = H;
    V.dpr = V.baixo ? .75 : 1;   // partículas são brilhos suaves: resolução baixa basta e poupa a GPU
    V.m.frente.width = Math.round(W * V.dpr); V.m.frente.height = Math.round(H * V.dpr);
    // raios de luz: tela 4x menor, esticada pela GPU (são suaves, a perda de definição não aparece)
    V.gq = .25; V.m.gr.width = Math.ceil(W * V.gq); V.m.gr.height = Math.ceil(H * V.gq);
    var mc = V.pt(MC[0], MC[1]), ck = D.ck, cc = V.pt(ck.x + ck.w / 2, ck.y + ck.h / 2);
    var s = V.m.raiz.style;
    s.setProperty('--mx', mc[0] + 'px'); s.setProperty('--my', mc[1] + 'px');
    s.setProperty('--fx', cc[0] + 'px'); s.setProperty('--fy', cc[1] + 'px');
    // pivôs de cada camada, em px dentro da própria camada
    var origem = function (nome, ox, oy, interno) {
      var l = V.m.L[nome]; if (!l) return;
      var c = caixaDe(nome);
      (interno ? l.i : l.o).style.transformOrigin = ((ox - c.x) * V.k).toFixed(1) + 'px ' + ((oy - c.y) * V.k).toFixed(1) + 'px';
    };
    var grupo = ['raios', 'exc1', 'exc2', 'exc3', 'cabeca', 'olhoE', 'olhoD', 'olhosBrilho'];
    grupo.forEach(function (n) { origem(n, MC[0], MC[1], false); });
    origem('raios', MC[0], MC[1], true);
    ['exc1', 'exc2', 'exc3'].forEach(function (n) { var c = CAM[n].caixa; origem(n, c.x + c.w * .06, c.y + c.h * .94, true); });
    ['olhoE', 'olhoD'].forEach(function (n) { var c = CAM[n].caixa; origem(n, c.x + c.w / 2, c.y + c.h * .62, true); });
    var ckc = [ck.x + ck.w / 2, ck.y + ck.h / 2];
    ['letraC', 'letraK', 'ckBrilho'].forEach(function (n) { origem(n, ckc[0], ckc[1], false); });
    var nc = CAM.nome.caixa; origem('nome', nc.x + nc.w / 2, nc.y + nc.h / 2, false);
    V.ckc = cc; V.ck = { x0: V.pt(ck.x, 0)[0], x1: V.pt(ck.x + ck.w, 0)[0], cy: cc[1] };
    V.estrelas = [[ck.x + 40, ck.y + 30, 40], [ck.x + ck.w - 30, ck.y + 70, 26], [ck.x + ck.w - 90, ck.y + ck.h - 20, 16], [ck.x + 120, ck.y + ck.h - 10, 12],
      [790, 120, 16], [215, 210, 13], [830, 450, 11], [160, 470, 9]].map(function (e, i) { var p = V.pt(e[0], e[1]); return { x: p[0], y: p[1], s: e[2] * V.k, f: i * 1.7 }; });
  };
  Vinheta.prototype.pt = function (x, y) { return [this.bx + (x - VB.x) * this.k, this.by + (y - VB.y) * this.k]; };
  Vinheta.prototype.anim = function (el, quadros, o) {
    if (!el) return null;
    return el.animate(quadros, { delay: o.em || 0, duration: o.dur || 500, easing: o.ease || E.sai, fill: o.fill || 'both' });
  };
  Vinheta.prototype.estouro = function (x, y, n, vel) {
    var V = this, k = V.k * 1.3;
    for (var i = 0; i < n; i++) {
      var a = Math.random() * 6.283, v = (160 + Math.random() * 460) * vel * k;
      V.parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: 0, max: .55 + Math.random() * .8, s: (5 + Math.random() * 11) * k, c: i % 5, ar: 2.3, g: 150 * k });
    }
  };
  Vinheta.prototype.brasa = function () {
    var V = this, k = V.k * 1.3;
    V.parts.push({ x: Math.random() * V.W, y: V.H + 10, vx: (Math.random() - .5) * 20 * k, vy: -(40 + Math.random() * 80) * k, vida: 0, max: 2.5 + Math.random() * 2.5, s: (3 + Math.random() * 6) * k, c: Math.floor(Math.random() * 5), ar: 0, g: 0, pisca: Math.random() * 6 });
  };

  /* roteiro: tempos em ms */
  Vinheta.prototype.roteiro = function () {
    var V = this, L = V.m.L, a = V.anim.bind(V), H = V.m.caixa.getBoundingClientRect().height;
    var tudo = function (fn) { Object.keys(L).forEach(function (k) { fn(L[k], k); }); };
    if (V.tipo === 'reduzida') {
      a(V.m.caixa, [{ opacity: 0 }, { opacity: 1 }], { dur: 350 });
      a(V.m.gr, [{ opacity: 0 }, { opacity: 1 }], { dur: 350 });
      V.cena = { raios: [0, 0, 1], brasas: 0 };
      V.agendarFim(1500, 300); return;
    }
    if (V.tipo === 'curta') {
      a(V.m.caixa, [{ opacity: 0, transform: 'translate(-50%,-50%) scale(.97)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1)' }], { dur: 260 });
      ['olhoE', 'olhoD'].forEach(function (n) { a(L[n].i, [{ transform: 'scaleY(1)' }, { transform: 'scaleY(.06)', offset: .45 }, { transform: 'scaleY(1)' }], { em: 300, dur: 230, ease: E.io, fill: 'none' }); });
      a(L.raios.i, [{ transform: 'scale(1)' }, { transform: 'scale(1.07) rotate(5deg)', offset: .4 }, { transform: 'scale(1)' }], { em: 380, dur: 520, fill: 'none' });
      ['exc1', 'exc2', 'exc3'].forEach(function (n, i) { a(L[n].i, [{ transform: 'scale(1)' }, { transform: 'scale(1.25) rotate(6deg)', offset: .5 }, { transform: 'scale(1)' }], { em: 430 + i * 55, dur: 250, fill: 'none' }); });
      a(V.m.faixa, [{ transform: 'translateX(-120%) skewX(-20deg)' }, { transform: 'translateX(420%) skewX(-20deg)' }], { em: 450, dur: 620, ease: E.io });
      a(L.ckBrilho.o, [{ opacity: .5 }, { opacity: 1, offset: .3 }, { opacity: .55 }], { em: 420, dur: 700 });
      a(V.m.gr, [{ opacity: 0 }, { opacity: 1 }], { dur: 300 });
      V.cena = { raios: [0, 0, 1], brasas: 10, estouro: [[450, 30]], eletrico: [[450, 700]], estrelas: 300 };
      V.agendarFim(1250, 330); return;
    }
    // ---------- completa (Aurora) ----------
    var sobe = 'translateY(' + (H * .28).toFixed(0) + 'px) scale(.72)';
    a(V.m.aurora, [{ opacity: 0 }, { opacity: 1 }], { dur: 1700 });
    if (L.credito) a(L.credito.o, [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { em: 80, dur: 700 });
    ['raios', 'exc1', 'exc2', 'exc3', 'cabeca', 'olhoE', 'olhoD', 'olhosBrilho'].forEach(function (n) {
      a(L[n].o, [{ opacity: 0, transform: sobe }, { opacity: 1, transform: 'none' }], { dur: 1500 });
    });
    a(L.raios.i, [{ transform: 'rotate(-140deg) scale(.55)' }, { transform: 'none' }], { em: 60, dur: 1750 });
    ['exc1', 'exc2', 'exc3'].forEach(function (n, i) { a(L[n].i, [{ opacity: 0, transform: 'scale(.3)' }, { opacity: 1, transform: 'none' }], { em: 950 + i * 90, dur: 420, ease: E.volta }); });
    ['olhoE', 'olhoD'].forEach(function (n) {
      a(L[n].i, [{ opacity: .12 }, { opacity: .12, offset: .86 }, { opacity: 1 }], { dur: 1180, ease: 'linear' });
      // a piscadinha
      a(L[n].i, [{ transform: 'scaleY(1)' }, { transform: 'scaleY(.06)', offset: .45 }, { transform: 'scaleY(1)' }], { em: 1950, dur: 230, ease: E.io, fill: 'none' });
    });
    a(L.olhosBrilho.i, [{ opacity: 0 }, { opacity: 0, offset: .2 }, { opacity: 1, offset: .4 }, { opacity: 0 }], { em: 800, dur: 1000, ease: 'linear' });
    a(L.letraC.o, [{ opacity: 0, transform: 'scale(1.45)' }, { opacity: 1, transform: 'none' }], { em: 1100, dur: 800 });
    a(L.letraK.o, [{ opacity: 0, transform: 'scale(1.45)' }, { opacity: 1, transform: 'none' }], { em: 1210, dur: 800 });
    var hit = 1600;
    a(L.ckBrilho.o, [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1.15)', offset: .25 }, { opacity: .55, transform: 'none' }], { em: hit - 120, dur: 900, ease: 'linear' });
    a(V.m.clarao, [{ opacity: 0 }, { opacity: .9, offset: .15 }, { opacity: 0 }], { em: hit - 30, dur: 700, ease: 'linear' });
    a(L.nome.o, [{ opacity: 0, transform: 'translateY(16px) scaleX(1.25)' }, { opacity: 1, transform: 'none' }], { em: 1800, dur: 650 });
    a(V.m.faixa, [{ transform: 'translateX(-120%) skewX(-20deg)' }, { transform: 'translateX(420%) skewX(-20deg)' }], { em: 2100, dur: 720, ease: E.io });
    a(L.slogan1.o, [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { em: 2250, dur: 560 });
    a(L.slogan2.o, [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { em: 2450, dur: 560 });
    a(V.m.gr, [{ opacity: 0 }, { opacity: 1 }], { dur: 1600 });
    V.cena = { raios: [-60, 0, 1600], brasas: 18, estouro: [[hit, 70], [2150, 18]], eletrico: [[hit, hit + 650], [2950, 3150]], estrelas: 2050 };
    V.agendarFim(3650, 400);
  };
  Vinheta.prototype.agendarFim = function (em, dur) {
    var V = this; V.timerFim = setTimeout(function () { V.encerrar(dur); }, em);
  };
  Vinheta.prototype.encerrar = function (dur) {
    var V = this; if (V.fim) return; V.fim = true;
    clearTimeout(V.timerFim);
    if (V.aoTerminar) V.aoTerminar();
    var an = V.m.raiz.animate([{ opacity: 1 }, { opacity: 0 }], { duration: dur, easing: 'ease-in', fill: 'forwards' });
    V.m.caixa.animate([{ transform: 'translate(-50%,-50%) scale(1)' }, { transform: 'translate(-50%,-50%) scale(1.04)' }], { duration: dur, easing: 'ease-in', fill: 'forwards', composite: 'replace' });
    an.onfinish = function () { V.remover(); };
  };
  Vinheta.prototype.remover = function () {
    var V = this; if (V.removida) return; V.removida = true; V.fim = true;
    cancelAnimationFrame(V.raf); clearTimeout(V.timerFim); clearTimeout(V.seguranca);
    window.removeEventListener('resize', V.aoRedimensionar); window.removeEventListener('keydown', V.pular, true);
    if (V.m.raiz.parentNode) V.m.raiz.parentNode.removeChild(V.m.raiz);
    document.documentElement.classList.remove('ck-vinheta-ativa');
    ativa = null;
    try { document.dispatchEvent(new CustomEvent('ck:vinheta-fim')); } catch (e) {}
  };
  Vinheta.prototype.quadro = function (agora) {
    var V = this;
    if (!V.t0) V.t0 = agora;
    var t = agora - V.t0, dt = Math.min(.05, (agora - (V.ult || agora)) / 1000); V.ult = agora;
    // qualidade adaptativa: se os primeiros quadros vierem lentos, desliga os efeitos de fundo
    // (ignora os primeiros 400ms, quando o próprio app ainda está carregando)
    if (!V.leve && dt > 0 && t > 400 && t < 1600) {
      (V.amostras = V.amostras || []).push(dt);
      if (V.amostras.length === 24) {
        var ord = V.amostras.slice().sort(function (x, y) { return x - y; });
        if (ord[12] > .024) V.modoLeve();
      }
    }
    if (V.leve) { if (!V.removida) V.raf = requestAnimationFrame(function (tt) { V.quadro(tt); }); return; }
    var cn = V.cena || {}, dpr = V.dpr;
    // raios de luz girando atrás da máscara (tela pequena)
    if (cn.raios) {
      var p = Math.min(1, t / cn.raios[2]), e = 1 - Math.pow(1 - p, 3), gq = V.gq, cg = V.ctxG;
      var ang = (cn.raios[0] + (cn.raios[1] - cn.raios[0]) * e + t * .004) * Math.PI / 180;
      var mc = V.pt(MC[0], MC[1]), R = Math.hypot(Math.max(mc[0], V.W - mc[0]), Math.max(mc[1], V.H - mc[1])) * 1.05;
      cg.setTransform(gq, 0, 0, gq, 0, 0); cg.clearRect(0, 0, V.W, V.H);
      cg.translate(mc[0], mc[1]); cg.rotate(ang); cg.drawImage(V.spr.raios, -R, -R, R * 2, R * 2);
    }
    // frente: brasas, estouros, estrelas e eletricidade
    var cf = V.ctxF; cf.setTransform(dpr, 0, 0, dpr, 0, 0); cf.clearRect(0, 0, V.W, V.H);
    var limite = V.baixo ? 60 : 110;
    if (cn.brasas && t > 100) { V.acc += dt * cn.brasas; while (V.acc > 1) { if (V.parts.length < limite) V.brasa(); V.acc--; } }
    if (cn.estouro) cn.estouro = cn.estouro.filter(function (s) { if (t >= s[0]) { V.estouro(V.ckc[0], V.ckc[1], V.baixo ? Math.round(s[1] * .6) : s[1], s[1] > 40 ? 1 : .55); return false; } return true; });
    cf.globalCompositeOperation = 'lighter';
    var vivas = [];
    for (var i = 0; i < V.parts.length; i++) {
      var q = V.parts[i]; q.vida += dt; if (q.vida > q.max) continue;
      q.vx -= q.vx * q.ar * dt; q.vy -= q.vy * q.ar * dt; q.vy += q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt;
      var f = 1 - q.vida / q.max, pis = q.pisca != null ? .55 + .45 * Math.sin(agora / 300 + q.pisca) : 1;
      cf.globalAlpha = f * pis; var s = q.s * (q.pisca != null ? 1 : .6 + f * .6);
      cf.drawImage(V.spr.e[q.c], q.x - s, q.y - s, s * 2, s * 2); vivas.push(q);
    }
    V.parts = vivas;
    if (cn.estrelas != null && t > cn.estrelas) {
      var pe = Math.min(1, (t - cn.estrelas) / 450);
      V.estrelas.forEach(function (st, j) {
        var d = Math.min(1, Math.max(0, pe * 1.6 - j * .08)), tw = .55 + .45 * Math.sin(agora / 380 + st.f), sz = st.s * (d < 1 ? 1.6 - .6 * d : 1) * (0.85 + .15 * tw);
        cf.globalAlpha = d * tw; cf.drawImage(V.spr.st, st.x - sz, st.y - sz, sz * 2, sz * 2);
      });
    }
    var eletr = cn.eletrico && cn.eletrico.some(function (j) { return t >= j[0] && t <= j[1]; });
    cf.globalCompositeOperation = 'source-over'; cf.globalAlpha = 1;
    if (eletr) {
      if (!V.raiosE || agora - V.ultRaio > 55) { V.raiosE = V.gerarRaios(); V.ultRaio = agora; }
      cf.globalCompositeOperation = 'lighter'; cf.lineJoin = cf.lineCap = 'round';
      [[16, 'rgba(176,70,255,.16)'], [8, 'rgba(198,107,255,.45)'], [2.6, '#fff4ff']].forEach(function (w) {
        cf.lineWidth = w[0] * V.k * 1.6; cf.strokeStyle = w[1]; cf.beginPath();
        V.raiosE.forEach(function (pl) { pl.forEach(function (pp, n) { if (n === 0 || pp.m) cf.moveTo(pp[0], pp[1]); else cf.lineTo(pp[0], pp[1]); }); });
        cf.stroke();
      });
    }
    cf.globalAlpha = 1; cf.globalCompositeOperation = 'source-over';
    if (!V.removida) V.raf = requestAnimationFrame(function (tt) { V.quadro(tt); });
  };
  Vinheta.prototype.modoLeve = function () {
    var V = this; V.leve = true; V.parts = [];
    [V.m.gr, V.m.frente].forEach(function (c) { c.animate([{ opacity: getComputedStyle(c).opacity }, { opacity: 0 }], { duration: 250, fill: 'forwards' }); });
  };
  Vinheta.prototype.gerarRaios = function () {
    var V = this, c = V.ck, k = V.k, cy = c.cy;
    var segs = [[c.x0 + 40 * k, cy - 40 * k, c.x0 - 150 * k, cy - 120 * k], [c.x0 + 30 * k, cy + 50 * k, c.x0 - 170 * k, cy + 90 * k],
      [c.x1 - 40 * k, cy - 30 * k, c.x1 + 160 * k, cy - 100 * k], [c.x1 - 30 * k, cy + 60 * k, c.x1 + 170 * k, cy + 110 * k]];
    return segs.map(function (s) {
      var dx = s[2] - s[0], dy = s[3] - s[1], len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len, pts = [[s[0], s[1]]], meio;
      for (var i = 1; i < 8; i++) { var tt = i / 8, o = (Math.random() * 2 - 1) * 18 * k; var p = [s[0] + dx * tt + nx * o, s[1] + dy * tt + ny * o]; pts.push(p); if (i === 3) meio = p; }
      pts.push([s[2], s[3]]);
      if (Math.random() < .8) { var an = Math.atan2(dy, dx) + (Math.random() < .5 ? -.7 : .7); var b0 = [meio[0], meio[1]]; b0.m = 1; pts.push(b0, [meio[0] + Math.cos(an) * 40 * k, meio[1] + Math.sin(an) * 40 * k], [meio[0] + Math.cos(an + .4) * 75 * k, meio[1] + Math.sin(an + .4) * 75 * k]); }
      return pts;
    });
  };

  /* ------------------------------------------------------------------ API */
  var ativa = null, estilo = null;
  function garantirEstilo() {
    if (estilo) return;
    estilo = document.createElement('style'); estilo.id = 'ck-vinheta-estilo'; estilo.textContent = CSS;
    (document.head || document.documentElement).appendChild(estilo);
  }
  function tocar(opcoes) {
    opcoes = opcoes || {};
    if (ativa || typeof Element === 'undefined' || !Element.prototype.animate) return null;
    garantirEstilo();
    document.documentElement.classList.add('ck-vinheta-ativa');
    var tipo = reduzMovimento() ? 'reduzida' : (opcoes.tipo || 'completa');
    try { ativa = new Vinheta({ tipo: tipo, credito: opcoes.credito != null ? opcoes.credito : CFG.credito }); }
    catch (e) { var r = document.getElementById('ck-vinheta'); if (r) r.parentNode.removeChild(r); document.documentElement.classList.remove('ck-vinheta-ativa'); ativa = null; }
    return ativa;
  }
  function decidir() {
    if (CFG.modo === 'manual') return null;
    if (CFG.modo === 'completa' || CFG.modo === 'curta') return CFG.modo;
    if (ler('sessionStorage', CHAVE_SESSAO)) return null;          // trocou de página na mesma sessão
    return ler('localStorage', CHAVE_DIA) === hoje() ? 'curta' : 'completa';
  }
  window.CKVinheta = { tocar: tocar, pular: function () { if (ativa) ativa.encerrar(200); } };

  var tipo = decidir();
  if (tipo && document.visibilityState !== 'hidden') {
    var v = tocar({ tipo: tipo });
    // só marca como vista quando termina ou é pulada; se o app trocar de página no meio
    // (um redirecionamento de login, por exemplo), a próxima página toca de novo
    if (v) v.aoTerminar = function () {
      gravar('sessionStorage', CHAVE_SESSAO, '1');
      if (tipo === 'completa') gravar('localStorage', CHAVE_DIA, hoje());
    };
  }
})();
