/* ============================================================
   FinCK · apresentação final · direção de cena
   Conscious Knowledge · Projeto Interdisciplinar 2026

   Quem decide o que aparece, onde e quando. O motor do deck
   (apresentacao.js) continua cuidando da navegação; este roteiro
   só observa qual slide está ativo e monta a vitrine:

   · capa            giroscópio em volta da marca, ampulheta e
                     pilhas de moedas nos flancos (tempo × dinheiro)
   · slides de 2 a 13  o objeto do assunto, sobre o pedestal, na
                     coluna à direita do quadro
   · agradecimento   a coleção inteira, em prateleira

   Sem WebGL nada quebra: a apresentação segue com a decoração
   em CSS e o quadro volta a ficar centralizado.
   ============================================================ */
(() => {
  "use strict";

  const C = window.FinckCena;
  const deck = document.querySelector("[data-deck]");
  const palco = document.querySelector("[data-palco]");
  const canvas = document.querySelector("[data-vitrine]");
  const slides = [...document.querySelectorAll("[data-slide]")];
  if (!C || !deck || !palco || !slides.length) return;

  const raiz = document.documentElement;
  const semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const leve = raiz.dataset.perf === "leve";
  const { M, Malha, MAT, forma, pecas, objetos, PI } = C;
  const { suave, entre, mola, dePe } = pecas;

  const cenaDe = (i) => slides[i].dataset.cena || "vitrine";
  const COLECAO = slides.map((s) => s.dataset.objeto).filter(Boolean);


  /* ---------------------------------------------------------
     01. Estado do deck — vale com ou sem 3D
     --------------------------------------------------------- */
  let atual = -1;
  let aoTrocar = () => { };

  const conferir = () => {
    const i = slides.findIndex((s) => s.classList.contains("is-ativo"));
    if (i < 0 || i === atual) return;
    const antes = atual;
    atual = i;

    deck.dataset.cena = cenaDe(i);
    raiz.dataset.cena = cenaDe(i);
    raiz.style.setProperty("--passo", String(i));

    if (antes >= 0) {
      deck.dataset.marco = slides[i].dataset.secao !== slides[antes].dataset.secao ? "sim" : "nao";
      deck.classList.remove("is-troca");
      void deck.offsetWidth;
      deck.classList.add("is-troca");
    }
    aoTrocar(i, antes);
  };

  const olheiro = new MutationObserver(conferir);
  slides.forEach((s) => olheiro.observe(s, { attributes: true, attributeFilter: ["class"] }));
  conferir();


  /* ---------------------------------------------------------
     02. Vitrine 3D
     --------------------------------------------------------- */
  const motor = canvas ? C.criarMotor(canvas) : null;
  if (!motor) {
    raiz.dataset.vitrine = "nao";
    return;
  }
  raiz.dataset.vitrine = "sim";
  let pesado = 0, ativo = true, medirDesde = Infinity;

  const modelos = {};
  const modelo = (nome) => modelos[nome] || (modelos[nome] = objetos[nome]());
  const pedestal = pecas.pedestal();
  const ID = M.id();

  const ENTRADA = 1.7, SAIDA = .42, CHAO = -1.62;

  /* Um ponto de exposição: pedestal opcional e a peça da vez.
     Quando a peça muda, a antiga afunda e some enquanto a nova
     sobe girando até assentar. */
  class Vitrine {
    constructor(o = {}) {
      this.o = o;
      this.atores = [];
      this.presenca = 0;
      this.alvo = 0;
      this.fase = o.fase || 0;
    }

    por(nome, agora, atraso = 0) {
      const vivo = this.atores.find((a) => a.sai === null);
      if (vivo && vivo.nome === nome) return;
      if (vivo) vivo.sai = agora;
      if (nome) this.atores.push({ nome, mod: modelo(nome), entra: agora + atraso, sai: null });
      this.alvo = nome ? 1 : 0;
      this.batida = agora + atraso;
    }

    get vazia() { return !this.atores.length && this.presenca < .01; }

    itens(agora, dt, t) {
      const lista = [];
      this.presenca += (this.alvo - this.presenca) * (semMovimento ? 1 : 1 - Math.exp(-dt * (this.alvo ? 5 : 9)));
      if (!this.alvo && this.presenca < .02) this.presenca = 0;

      if (this.o.pedestal && this.presenca > .01) {
        const p = this.presenca;
        const onda = Math.max(0, 1 - Math.abs(agora - this.batida - .25) * 2.4);
        const mp = M.juntar(M.mover(0, CHAO - (1 - p) * .6, 0), M.ry(-t * .14), M.escala(p));
        lista.push({ geo: pedestal.corpo, m: mp }, { geo: pedestal.luz, m: mp, brilho: .5 + onda * 1.3 });
      }

      for (const a of this.atores) {
        const idade = agora - a.entra;
        if (idade < 0) continue;
        const e = semMovimento ? 1 : Math.min(1, idade / ENTRADA);
        let k = mola(entre(e, 0, .4));
        let sobe = (1 - suave(entre(e, 0, .5))) * -.6;
        if (a.sai !== null) {
          const s = semMovimento ? 1 : Math.min(1, (agora - a.sai) / SAIDA);
          if (s >= 1) { a.fim = true; continue; }
          k *= 1 - s * s;
          sobe -= s * s * .5;
        }
        const mod = a.mod, rumo = mod.rumo || 0;
        const giro = mod.giro === "continuo"
          ? rumo + t * (mod.velocidade || .34)
          : rumo + Math.sin(t * .5 + this.fase) * (mod.amplitude || .45);
        const volta = (1 - suave(entre(e, 0, .72))) * -2.6;
        const base = M.juntar(
          M.mover(0, CHAO + (this.o.pedestal ? .24 : 0) + sobe + Math.sin(t * 1.05 + this.fase) * .035, 0),
          M.ry(giro + volta),
          M.escala(Math.max(mod.escala * k, .0001)),
          M.mover(0, -mod.base, 0),
          mod.pose ? mod.pose(t, e) : ID);
        for (const p of mod.partes) {
          lista.push({
            geo: p.geo, vidro: p.vidro,
            m: p.m ? M.juntar(base, p.m(t, e)) : base,
            brilho: p.brilho ? p.brilho(t, e) : 1,
          });
        }
      }
      this.atores = this.atores.filter((a) => !a.fim);
      return lista;
    }
  }

  const trilho = new Vitrine({ pedestal: true });
  const flancoE = new Vitrine({ pedestal: true, fase: 1.4 });
  const flancoD = new Vitrine({ pedestal: true, fase: 3.1 });
  const prateleira = COLECAO.map((_, i) => new Vitrine({ fase: i * .9 }));

  /* giroscópio da capa: três aros, duas moedas e a máscara que
     faz os aros passarem por trás da marca */
  const aros = [
    { geo: pecas.aro(1), inclina: [.34, -.2], vel: .42 },
    { geo: pecas.aro(.84, { joia: MAT.luzOuro, marcas: 60 }), inclina: [.42, .36], vel: -.34 },
    { geo: pecas.aro(1.17, { marcas: 96, larg: .012, alt: .028, joia: MAT.luzMenta }), inclina: [.24, .04], vel: .25 },
  ];
  const moedinha = pecas.malhaMoeda(.105, .03, { dentes: 36, seg: 36 });
  const mascara = new Malha().extrusao(forma.retangulo(1, 1, .42, 10), { prof: .02, chanfro: 0 });
  let capaPresenca = 0, capaAlvo = 0;
  const logo = document.querySelector(".capa__logo");


  /* ---------------------------------------------------------
     03. Troca de slide
     --------------------------------------------------------- */
  let partiu = false;

  aoTrocar = (i, antes) => {
    if (!partiu) return;
    const agora = performance.now() / 1000;
    const cena = cenaDe(i);
    const primeira = antes < 0;

    trilho.por(cena === "vitrine" ? slides[i].dataset.objeto : null, agora, primeira ? .5 : .3);
    flancoE.por(cena === "capa" ? "ampulheta" : null, agora, primeira ? .55 : .35);
    flancoD.por(cena === "capa" ? "pilhas" : null, agora, primeira ? .8 : .55);
    capaAlvo = cena === "capa" ? 1 : 0;

    const meio = (COLECAO.length - 1) / 2;
    prateleira.forEach((v, k) => v.por(cena === "final" ? COLECAO[k] : null, agora, .4 + Math.abs(k - meio) * .11));

    /* a peça do próximo slide fica pronta antes de ser chamada */
    const proximo = slides[i + 1] && slides[i + 1].dataset.objeto;
    if (proximo) setTimeout(() => modelo(proximo), 700);
  };

  const partir = () => {
    if (partiu) return;
    partiu = true;
    medirDesde = performance.now() / 1000 + 3;
    aoTrocar(atual, -1);
    /* o resto da coleção é modelado aos poucos, sem travar a fala */
    let fila = COLECAO.slice();
    const proxima = () => {
      const nome = fila.shift();
      if (!nome) return;
      modelo(nome);
      setTimeout(proxima, 450);
    };
    setTimeout(proxima, 2500);
  };

  const carga = document.querySelector("[data-carga]");
  if (carga && !carga.classList.contains("is-fim")) {
    new MutationObserver(() => { if (carga.classList.contains("is-fim")) partir(); })
      .observe(carga, { attributes: true, attributeFilter: ["class"] });
    setTimeout(partir, 4700);
  } else {
    partir();
  }


  /* ---------------------------------------------------------
     04. Medidas — tudo em pixels da janela, a partir do palco
     --------------------------------------------------------- */
  let largura = 0, altura = 0, qualidade = 1;

  const ajustarTela = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, leve ? 1.25 : 2) * qualidade;
    const w = Math.max(1, Math.round(window.innerWidth * dpr)), h = Math.max(1, Math.round(window.innerHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    largura = window.innerWidth;
    altura = window.innerHeight;
  };

  const marcado = {};
  const marcar = (nome, valor) => {
    const v = valor.toFixed(1) + "px";
    if (marcado[nome] === v) return;
    marcado[nome] = v;
    raiz.style.setProperty(nome, v);
  };


  /* ---------------------------------------------------------
     05. Quadro a quadro
     --------------------------------------------------------- */
  let ultimo = performance.now() / 1000, soma = 0, conta = 0, folga = 0, limpo = false;

  const quadro = (ms) => {
    if (!ativo) return;
    requestAnimationFrame(quadro);
    if (document.hidden) { ultimo = ms / 1000; return; }

    const agora = ms / 1000;
    const bruto = Math.min(1, Math.max(.001, agora - ultimo));
    const dt = Math.min(.1, bruto);
    ultimo = agora;

    if (deck.dataset.modo !== "palco" || !partiu) {
      if (!limpo) { ajustarTela(); motor.limpar(); limpo = true; }
      return;
    }

    ajustarTela();
    const t = semMovimento ? 6 : agora;
    const r = palco.getBoundingClientRect(), s = r.width / 1280;
    const px = (x) => r.left + x * s, py = (y) => r.top + y * s;
    const cenas = [];

    /* coluna à direita do quadro */
    const beira = r.right - 13 * s, livre = largura - beira;
    const temTrilho = livre >= 104;
    if (raiz.dataset.trilho !== (temTrilho ? "sim" : "nao")) raiz.dataset.trilho = temTrilho ? "sim" : "nao";
    if (temTrilho) {
      const un = Math.min(livre / 2.75, r.height / 5.6);
      const x = beira + livre * .5, y = r.top + r.height * .5 + un * .12;
      marcar("--vx", x);
      marcar("--vy", y - CHAO * un);
      marcar("--vu", un);
      if (!trilho.vazia) cenas.push({ x, y, un, inclina: .2, itens: trilho.itens(agora, bruto, t) });
    } else if (!trilho.vazia) {
      trilho.itens(agora, bruto, t);
    }

    /* capa */
    /* a capa sai pelo relógio de verdade: máquina lenta não deixa resto na tela */
    capaPresenca += (capaAlvo - capaPresenca) * (semMovimento ? 1 : 1 - Math.exp(-bruto * (capaAlvo ? 4 : 9)));
    if (!capaAlvo && capaPresenca < .04) capaPresenca = 0;
    if (!flancoE.vazia) cenas.push({ x: px(214), y: py(258), un: 62 * s, inclina: .2, itens: flancoE.itens(agora, bruto, t) });
    if (!flancoD.vazia) cenas.push({ x: px(1066), y: py(258), un: 62 * s, inclina: .2, itens: flancoD.itens(agora, bruto, t) });
    if (capaPresenca > .01 && logo) {
      const q = logo.getBoundingClientRect();
      if (q.width > 4) {
        const un = q.width * 1.12, k = mola(Math.min(1, capaPresenca)), itens = [];
        itens.push({ geo: mascara, mascara: true, m: M.escala(q.width / un * 1.04, q.height / un * .94, 1) });
        aros.forEach((a, i) => {
          /* os aros giram atrás da marca: aparecem só pelas laterais */
          const eixo = M.juntar(M.mover(0, 0, -1.25), M.rz(a.inclina[1] + Math.sin(t * .23 + i) * .05), M.rx(a.inclina[0] + Math.sin(t * .31 + i * 2) * .04), M.escala(k));
          itens.push({ geo: a.geo, m: M.juntar(eixo, M.ry(t * a.vel)), brilho: 1.2 });
          if (i !== 1) {
            const R = i ? 1.17 : 1, g = t * (i ? -.5 : .62) + i * 2;
            itens.push({ geo: moedinha, m: M.juntar(eixo, M.mover(Math.cos(g) * R, 0, Math.sin(g) * R), M.ry(t * 1.6 + i), dePe) });
          }
        });
        cenas.push({ x: q.left + q.width / 2, y: q.top + q.height / 2, un, inclina: 0, itens });
      }
    }

    /* agradecimento: a coleção em prateleira */
    const un = 27 * s, meio = (prateleira.length - 1) / 2;
    prateleira.forEach((v, k) => {
      if (v.vazia) return;
      const lado = k <= meio ? -1 : 1, casa = k <= meio ? meio - .5 - k : k - meio - .5;
      const x = 640 + lado * (104 + casa * 84);
      cenas.push({ x: px(x), y: py(200) + CHAO * un, un, inclina: .16, itens: v.itens(agora, bruto, t) });
    });

    const temAlgo = cenas.some((c) => c.itens.length);
    if (!temAlgo) {
      if (!limpo) { motor.limpar(); limpo = true; }
      return;
    }
    limpo = false;
    motor.quadro(cenas, largura, altura);

    /* Se a máquina não acompanha, primeiro cai a nitidez. Se nem assim
       os quadros vierem leves, o 3D se retira: a fluidez dos slides vale
       mais do que a vitrine. A conta é por tempo de relógio, não por
       número de quadros, para decidir rápido justamente na máquina lenta. */
    /* os primeiros segundos compilam e enviam as peças: não contam */
    if (agora < medirDesde) { soma = 0; conta = 0; return; }
    soma += bruto;
    conta++;
    if (soma >= 1.2 && !forcar) {
      const media = soma / conta;
      soma = 0;
      conta = 0;
      if (media > .045) {
        if (media > .25) { desligar(); return; }
        if (qualidade > .5) { qualidade = Math.max(.5, qualidade * .72); folga = 0; }
        else if (++pesado >= 2) { desligar(); return; }
      } else {
        pesado = 0;
        if (media < .0125 && qualidade < 1 && ++folga >= 3) { qualidade = Math.min(1, qualidade * 1.15); folga = 0; }
      }
    }
  };

  /* ?vitrine=sempre mantém o 3D mesmo em máquina lenta (ensaios e testes) */
  const forcar = /[?&]vitrine=sempre\b/.test(location.search);

  const desligar = () => {
    ativo = false;
    motor.limpar();
    raiz.dataset.vitrine = "nao";
    /* máquina que não segura o 3D também recebe a versão leve dos efeitos */
    raiz.dataset.perf = "leve";
    /* a coluna da vitrine sai; o palco se mede de novo na largura toda */
    window.dispatchEvent(new Event("resize"));
  };

  /* placa de vídeo emulada por software começa já na nitidez mínima */
  try {
    const info = motor.gl.getExtension("WEBGL_debug_renderer_info");
    const nome = info ? String(motor.gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    if (/swiftshader|llvmpipe|software|basic render/i.test(nome)) qualidade = .5;
  } catch (_) { /* sem informação do driver: segue o regulador */ }

  requestAnimationFrame(quadro);
})();
