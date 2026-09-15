/* ============================================================
   FinCK — motor da apresentação
   Conscious Knowledge · Projeto Interdisciplinar 2026

   Tudo é progressivo: sem JavaScript a apresentação continua
   legível (os slides viram um documento rolável). O que o
   script acrescenta é navegação, demonstração ao vivo e o
   apoio de quem está apresentando.
   ============================================================ */

(() => {
  "use strict";

  const raiz = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const limitar = (v, mi, ma) => Math.min(ma, Math.max(mi, v));
  const emCampo = (alvo) =>
    !!alvo && (alvo.tagName === "INPUT" || alvo.tagName === "TEXTAREA" || alvo.isContentEditable);

  const perfLeve = raiz.dataset.perf === "leve";
  const semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const temHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const deck = $("[data-deck]");
  const palco = $("[data-palco]");
  const palcoCaixa = $("[data-palco-caixa]");
  const slides = $$("[data-slide]");
  if (!deck || !palco || !slides.length) return;

  const TOTAL = slides.length;
  let atual = 0;


  /* ---------------------------------------------------------
     01. Escala do palco e escolha do modo de exibição

     No projetor e no computador o slide é um palco fixo de
     1280×720 reduzido por transform — assim o que a equipe vê
     ensaiando é exatamente o que a banca vê. Em tela estreita
     essa redução deixaria o texto ilegível, então o deck troca
     para um modo fluido e rolável.
     --------------------------------------------------------- */
  const PALCO_L = 1280;
  const PALCO_A = 720;
  const LIMIAR_FLUIDO = 0.62;

  let modo = "";

  const medir = () => {
    const larg = palcoCaixa.clientWidth;
    const alt = palcoCaixa.clientHeight;
    if (!larg || !alt) return;

    const escala = Math.min(larg / PALCO_L, alt / PALCO_A);
    const novoModo = escala < LIMIAR_FLUIDO ? "fluido" : "palco";

    if (novoModo !== modo) {
      modo = novoModo;
      deck.dataset.modo = modo;
    }

    palco.style.setProperty("--escala", modo === "palco" ? escala.toFixed(4) : "1");
  };

  medir();

  let medindo;
  const remedir = () => {
    clearTimeout(medindo);
    medindo = setTimeout(() => {
      medir();
      resolverDensidades();
    }, 180);
  };
  window.addEventListener("resize", remedir, { passive: true });
  window.addEventListener("orientationchange", remedir);


  /* ---------------------------------------------------------
     02. Contadores animados
     --------------------------------------------------------- */
  const formatar = (valor, decimais, milhar) => {
    if (milhar) {
      return valor.toLocaleString("pt-BR", {
        minimumFractionDigits: decimais,
        maximumFractionDigits: decimais,
      });
    }
    return decimais > 0 ? valor.toFixed(decimais).replace(".", ",") : String(Math.round(valor));
  };

  const rodarContador = (el) => {
    const alvo = parseFloat(el.dataset.contador);
    if (!isFinite(alvo)) return;

    const decimais = parseInt(el.dataset.decimais || "0", 10);
    const milhar = el.dataset.milhar === "1";
    const sufixo = el.dataset.sufixo || "";

    if (semMovimento) {
      el.textContent = formatar(alvo, decimais, milhar) + sufixo;
      return;
    }

    const duracao = 1100;
    const inicio = performance.now();

    const passo = (agora) => {
      const t = limitar((agora - inicio) / duracao, 0, 1);
      // desaceleração suave: o número "assenta" no valor final
      const e = 1 - Math.pow(1 - t, 3);
      el.textContent = formatar(alvo * e, decimais, milhar) + sufixo;
      if (t < 1) requestAnimationFrame(passo);
    };

    requestAnimationFrame(passo);
  };

  const contadoresDoSlide = (slide) => $$("[data-contador]", slide);


  /* ---------------------------------------------------------
     02b. Ajuste automático de densidade

     O palco tem altura fixa (720 px de projeto). Um título que
     quebra em duas linhas, ou um parágrafo que cresce numa
     revisão de texto, empurraria o conteúdo para fora do quadro.
     Em vez de calibrar cada slide à mão, o deck mede o transbordo
     e reduz a densidade daquele slide — tipografia, respiros e
     peças 3D — até tudo caber. Quem editar o texto depois não
     precisa saber que isso existe.
     --------------------------------------------------------- */
  const CAIXAS = ".quadro, .duo, .trio, .grade-tres, .pilha, .modulos, .acoes," +
    " .confronto, .confronto__lado, .tabela-quadro, .fluxo, .entregas," +
    " .coluna-direita, .motor, .painel, .cartao-tec, .ficha, .entrega, .modulo," +
    " .cadeia, .cadeia__elo, .ranque, .ranque__item";

  // folga de alguns pixels: enfeites posicionados de forma absoluta podem
  // sobrar uma fração da caixa sem que nada fique cortado de fato
  const transborda = (slide) =>
    $$(CAIXAS, slide).some((el) => el.scrollHeight > el.clientHeight + 6);

  const ajustarDensidade = (slide) => {
    if (modo !== "palco") {
      slide.style.removeProperty("--densidade");
      return;
    }

    // mede com os blocos já na posição final, sem o deslocamento de entrada
    slide.classList.add("is-medindo");

    try {
      slide.style.setProperty("--densidade", "1");
      if (!transborda(slide)) return;

      for (let d = 0.97; d >= 0.70; d -= 0.03) {
        slide.style.setProperty("--densidade", d.toFixed(2));
        if (!transborda(slide)) return;
      }
    } finally {
      slide.classList.remove("is-medindo");
    }
  };

  /* A densidade de TODOS os slides é resolvida de uma vez, ainda atrás
     da tela de carga, e depois não se mexe mais. Ajustar durante a
     entrada fazia o texto mudar de tamanho na frente de quem assiste —
     o slide parecia se redesenhar. Slide oculto tem layout: dá para
     medir os catorze sem mostrar nenhum. A única coisa que refaz a
     conta é redimensionar a janela, porque aí a altura útil mudou. */
  const resolverDensidades = () => {
    if (modo !== "palco") {
      slides.forEach((s) => s.style.removeProperty("--densidade"));
      return;
    }
    slides.forEach(ajustarDensidade);
  };


  /* ---------------------------------------------------------
     03. Navegação entre slides
     --------------------------------------------------------- */
  const elAtual = $("[data-atual]");
  const elTotal = $("[data-total]");
  const elNome = $("[data-hud-nome]");
  const notasPalco = $("[data-notas-palco]");
  const barraProgresso = $("[data-progresso] span");
  const btnAnterior = $("[data-anterior]");
  const btnProximo = $("[data-proximo]");

  if (elTotal) elTotal.textContent = String(TOTAL).padStart(2, "0");

  const trilha = $("[data-trilha]");
  const itensTrilha = [];

  if (trilha) {
    slides.forEach((slide, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "trilha__item";
      b.setAttribute("role", "tab");
      b.setAttribute("aria-label", `Slide ${i + 1}: ${slide.dataset.titulo || ""}`);

      // marca o início da fala de cada integrante
      const falaAnterior = i > 0 ? slides[i - 1].dataset.fala : null;
      if (i > 0 && slide.dataset.fala !== falaAnterior) b.dataset.marco = "1";

      const dica = document.createElement("span");
      dica.className = "trilha__dica";
      dica.textContent = `${String(i + 1).padStart(2, "0")} · ${slide.dataset.titulo || ""}`;
      b.appendChild(dica);

      b.addEventListener("click", () => irPara(i));
      trilha.appendChild(b);
      itensTrilha.push(b);
    });
  }

  const mapaGrade = $("[data-mapa-grade]");
  const itensMapa = [];

  if (mapaGrade) {
    slides.forEach((slide, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "mapa__item";
      b.innerHTML =
        `<span class="mapa__n">${String(i + 1).padStart(2, "0")}</span>` +
        `<span class="mapa__t"></span>` +
        `<span class="mapa__f"></span>`;
      b.querySelector(".mapa__t").textContent = slide.dataset.titulo || `Slide ${i + 1}`;
      b.querySelector(".mapa__f").textContent = slide.dataset.fala || "";
      b.addEventListener("click", () => {
        irPara(i);
        fecharSobreposicoes();
      });
      mapaGrade.appendChild(b);
      itensMapa.push(b);
    });
  }

  let travado = false;

  const irPara = (indice, { silencioso = false } = {}) => {
    const destino = limitar(indice, 0, TOTAL - 1);
    if (destino === atual && !silencioso) return;
    if (travado) return;

    const anterior = slides[atual];
    const proximo = slides[destino];

    // ao sair do slide da demonstração o campo não fica segurando o teclado
    if (emCampo(document.activeElement)) document.activeElement.blur();

    deck.dataset.sentido = destino > atual ? "frente" : "tras";

    if (anterior !== proximo) {
      anterior.classList.remove("is-ativo");
      anterior.classList.add("is-saindo");
      travado = true;
      setTimeout(() => {
        anterior.classList.remove("is-saindo");
        travado = false;
      }, semMovimento ? 60 : 680);
    }

    proximo.classList.remove("is-saindo");
    proximo.classList.add("is-ativo");
    proximo.scrollTop = 0;

    atual = destino;
    atualizarHud();
    contadoresDoSlide(proximo).forEach(rodarContador);

    if (history.replaceState) {
      history.replaceState(null, "", `#s${atual + 1}`);
    }
  };

  const atualizarHud = () => {
    const slide = slides[atual];

    if (elAtual) elAtual.textContent = String(atual + 1).padStart(2, "0");
    if (elNome) elNome.textContent = slide.dataset.fala || "—";

    if (notasPalco) {
      const fonte = slide.querySelector(".notas");
      notasPalco.innerHTML = fonte ? fonte.innerHTML : "";
      notasPalco.scrollTop = 0;
    }
    if (barraProgresso) {
      barraProgresso.style.width = `${((atual + 1) / TOTAL) * 100}%`;
    }

    itensTrilha.forEach((b, i) => {
      b.classList.toggle("is-ativo", i === atual);
      b.classList.toggle("is-visto", i < atual);
      b.setAttribute("aria-selected", String(i === atual));
    });

    itensMapa.forEach((b, i) => b.classList.toggle("is-ativo", i === atual));

    if (btnAnterior) btnAnterior.disabled = atual === 0;
    if (btnProximo) btnProximo.disabled = atual === TOTAL - 1;

    slides.forEach((s, i) => s.setAttribute("aria-hidden", String(i !== atual)));
  };

  const proximo = () => irPara(atual + 1);
  const anterior = () => irPara(atual - 1);

  btnProximo?.addEventListener("click", proximo);
  btnAnterior?.addEventListener("click", anterior);


  /* ---------------------------------------------------------
     04. Sobreposições (mapa, referências, atalhos)
     --------------------------------------------------------- */
  const sobreposicoes = {
    mapa: $("[data-mapa]"),
    refs: $("[data-refs]"),
    ajuda: $("[data-ajuda]"),
  };

  const fecharSobreposicoes = () => {
    Object.values(sobreposicoes).forEach((el) => {
      if (el) el.hidden = true;
    });
  };

  const alternarSobreposicao = (chave) => {
    const alvo = sobreposicoes[chave];
    if (!alvo) return;
    const abrindo = alvo.hidden;
    fecharSobreposicoes();
    alvo.hidden = !abrindo;
    if (abrindo) $(".sobreposicao__fechar", alvo)?.focus();
  };

  $$("[data-fechar]").forEach((b) => b.addEventListener("click", fecharSobreposicoes));

  Object.values(sobreposicoes).forEach((el) => {
    el?.addEventListener("click", (e) => {
      if (e.target === el) fecharSobreposicoes();
    });
  });

  $("[data-toggle-mapa]")?.addEventListener("click", () => alternarSobreposicao("mapa"));
  $("[data-toggle-ajuda]")?.addEventListener("click", () => alternarSobreposicao("ajuda"));
  $("[data-abrir-refs]")?.addEventListener("click", () => alternarSobreposicao("refs"));


  /* ---------------------------------------------------------
     05. Notas do apresentador
     --------------------------------------------------------- */
  const btnNotas = $("[data-toggle-notas]");

  const alternarNotas = () => {
    const ativo = deck.classList.toggle("is-notas");
    btnNotas?.classList.toggle("is-ativo", ativo);
    btnNotas?.setAttribute("aria-pressed", String(ativo));
    // a faixa tira altura do palco; o slide reescala para caber no que sobrou
    requestAnimationFrame(medir);
    try {
      localStorage.setItem("ck-notas", ativo ? "1" : "0");
    } catch (_) { /* modo privado: segue sem lembrar */ }
  };

  btnNotas?.addEventListener("click", alternarNotas);

  try {
    if (localStorage.getItem("ck-notas") === "1") alternarNotas();
  } catch (_) { /* sem armazenamento disponível */ }


  /* ---------------------------------------------------------
     06. Cronômetro da apresentação
     --------------------------------------------------------- */
  const btnCrono = $("[data-cronometro]");
  const txtCrono = $("[data-cronometro-texto]");
  let cronoInicio = 0;
  let cronoAcumulado = 0;
  let cronoRodando = false;
  let cronoTick = 0;

  const pintarCrono = () => {
    const ms = cronoAcumulado + (cronoRodando ? Date.now() - cronoInicio : 0);
    const s = Math.floor(ms / 1000);
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    if (txtCrono) txtCrono.textContent = `${mm}:${ss}`;
  };

  const alternarCrono = () => {
    if (cronoRodando) {
      cronoAcumulado += Date.now() - cronoInicio;
      cronoRodando = false;
      clearInterval(cronoTick);
    } else {
      cronoInicio = Date.now();
      cronoRodando = true;
      cronoTick = setInterval(pintarCrono, 500);
    }
    btnCrono?.classList.toggle("is-ativo", cronoRodando);
    pintarCrono();
  };

  btnCrono?.addEventListener("click", alternarCrono);
  btnCrono?.addEventListener("dblclick", () => {
    cronoAcumulado = 0;
    cronoInicio = Date.now();
    pintarCrono();
  });


  /* ---------------------------------------------------------
     07. Teclado, toque e roda
     --------------------------------------------------------- */
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    if (e.key === "Escape") {
      fecharSobreposicoes();
      // solta o campo da demonstração: sem isso os atalhos ficariam presos nele
      if (emCampo(document.activeElement)) document.activeElement.blur();
      return;
    }

    /* Teclas de controle remoto e de salto sempre passam, mesmo com o foco
       dentro da calculadora ao vivo — é o que o apresentador usa no palco.
       As setas e o espaço continuam pertencendo ao campo, porque lá elas
       movem o cursor e ajustam o número. */
    const noCampo = emCampo(e.target);

    switch (e.key) {
      case "PageDown":
        e.preventDefault();
        proximo();
        return;
      case "PageUp":
        e.preventDefault();
        anterior();
        return;
      case "Home":
        if (noCampo) break;
        e.preventDefault();
        irPara(0);
        return;
      case "End":
        if (noCampo) break;
        e.preventDefault();
        irPara(TOTAL - 1);
        return;
    }

    if (noCampo) return;

    switch (e.key) {
      case "ArrowRight":
      case " ":
        e.preventDefault();
        proximo();
        break;
      case "ArrowLeft":
        e.preventDefault();
        anterior();
        break;
      case "n":
      case "N":
        alternarNotas();
        break;
      case "o":
      case "O":
        alternarSobreposicao("mapa");
        break;
      case "r":
      case "R":
        alternarSobreposicao("refs");
        break;
      case "t":
      case "T":
        alternarCrono();
        break;
      case "?":
        alternarSobreposicao("ajuda");
        break;
      case "f":
      case "F":
        if (document.fullscreenElement) document.exitFullscreen?.();
        else document.documentElement.requestFullscreen?.().catch(() => { });
        break;
      default:
        if (/^[1-9]$/.test(e.key)) irPara(parseInt(e.key, 10) - 1);
    }
  });

  /* deslizar no celular — só conta se o gesto for claramente horizontal */
  let toqueX = 0;
  let toqueY = 0;
  let toqueValido = false;

  palco.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) return;
    toqueX = e.touches[0].clientX;
    toqueY = e.touches[0].clientY;
    toqueValido = !e.target.closest("[data-prisma], input");
  }, { passive: true });

  palco.addEventListener("touchend", (e) => {
    if (!toqueValido) return;
    const dx = e.changedTouches[0].clientX - toqueX;
    const dy = e.changedTouches[0].clientY - toqueY;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.6) return;
    if (dx < 0) proximo();
    else anterior();
  }, { passive: true });

  /* clique nas laterais avança e volta, como em um controle remoto */
  palco.addEventListener("click", (e) => {
    if (modo !== "palco") return;
    if (e.target.closest("a, button, input, label, [data-prisma], .notas")) return;
    const r = palcoCaixa.getBoundingClientRect();
    const rel = (e.clientX - r.left) / r.width;
    if (rel > 0.82) proximo();
    else if (rel < 0.18) anterior();
  });


  /* ---------------------------------------------------------
     08. Motor FinCK of Reality — cálculo ao vivo
     --------------------------------------------------------- */
  const calc = $("[data-calc]");

  if (calc) {
    const campos = {
      renda: $("[data-calc-renda]"),
      dias: $("[data-calc-dias]"),
      horas: $("[data-calc-horas]"),
      preco: $("[data-calc-preco]"),
    };

    const saida = $("[data-calc-resumo]");
    const faces = {
      reais: $("[data-prisma-reais]"),
      horas: $("[data-prisma-horas]"),
      dias: $("[data-prisma-dias]"),
      percent: $("[data-prisma-percent]"),
    };

    const luzes = $$("[data-luz]");
    const txtSemaforo = $("[data-semaforo-texto]");

    // os elos 02, 03 e 04 da cadeia acompanham o cálculo ao vivo
    const cadeia = {
      tempo: $("[data-cadeia-tempo]"),
      risco: $("[data-cadeia-risco]"),
      alt: $("[data-cadeia-alt]"),
    };

    const moeda = (v) =>
      v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    const num = (v, d = 1) =>
      v.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });

    const ler = (el, padrao) => {
      const v = parseFloat(el?.value);
      return isFinite(v) && v > 0 ? v : padrao;
    };

    const recalcular = () => {
      const renda = ler(campos.renda, 1800);
      const dias = limitar(ler(campos.dias, 22), 1, 31);
      const horas = limitar(ler(campos.horas, 8), 1, 24);
      const preco = Math.max(0, parseFloat(campos.preco?.value) || 0);

      const valorDia = renda / dias;
      const valorHora = valorDia / horas;
      const custoHoras = valorHora > 0 ? preco / valorHora : 0;
      const custoDias = valorDia > 0 ? preco / valorDia : 0;
      const percent = renda > 0 ? (preco / renda) * 100 : 0;

      if (faces.reais) faces.reais.textContent = moeda(preco);
      if (faces.horas) faces.horas.textContent = `${num(custoHoras)} h`;
      if (faces.dias) faces.dias.textContent = `${num(custoDias)} dias`;
      if (faces.percent) faces.percent.textContent = `${num(percent)}%`;

      if (saida) {
        saida.innerHTML =
          `Sua hora vale <strong>${moeda(valorHora)}</strong> · ` +
          `seu dia vale <strong>${moeda(valorDia)}</strong>.`;
      }

      // o semáforo lê a fatia da renda que a compra consome
      let cor = "verde";
      let texto = "Impacto baixo no mês";
      if (percent >= 25) {
        cor = "vermelho";
        texto = "Compromete o mês";
      } else if (percent >= 10) {
        cor = "amarelo";
        texto = "Impacto moderado no mês";
      }

      luzes.forEach((l) => l.classList.toggle("is-on", l.dataset.luz === cor));
      if (txtSemaforo) txtSemaforo.textContent = texto;

      // a cadeia repete o que o app de verdade faz depois do número: o peso da
      // alternativa muda com o tamanho do impacto, mas ela nunca some — no
      // FinCK as quatro alternativas aparecem em qualquer resultado.
      if (cadeia.tempo) cadeia.tempo.textContent = `${num(custoHoras)} h de trabalho`;
      if (cadeia.risco) cadeia.risco.textContent = texto.toLowerCase();
      if (cadeia.alt) {
        cadeia.alt.textContent =
          cor === "vermelho"
            ? "adiar 30 dias · reparar · usado"
            : cor === "amarelo"
              ? "reparar · usado · alugar"
              : "comparar durabilidade e uso";
      }
    };

    Object.values(campos).forEach((el) => el?.addEventListener("input", recalcular));
    calc.addEventListener("submit", (e) => e.preventDefault());
    recalcular();
  }


  /* ---------------------------------------------------------
     09. Prisma — arrastar para girar
     --------------------------------------------------------- */
  const prismaPalco = $("[data-prisma]");
  const prismaOrbita = prismaPalco && $(".prisma-orbita", prismaPalco);

  if (prismaPalco && prismaOrbita && !semMovimento) {
    let arrastando = false;
    let inicioX = 0;
    let giroInicial = -24;
    let giro = -24;

    const aplicar = () => prismaOrbita.style.setProperty("--giro", `${giro}deg`);

    prismaPalco.addEventListener("pointerdown", (e) => {
      arrastando = true;
      inicioX = e.clientX;
      giroInicial = giro;
      prismaPalco.classList.add("is-manual");
      prismaPalco.setPointerCapture?.(e.pointerId);
    });

    prismaPalco.addEventListener("pointermove", (e) => {
      if (!arrastando) return;
      giro = giroInicial + (e.clientX - inicioX) * 0.45;
      aplicar();
    });

    const soltar = () => {
      arrastando = false;
    };

    prismaPalco.addEventListener("pointerup", soltar);
    prismaPalco.addEventListener("pointercancel", soltar);
    prismaPalco.addEventListener("pointerleave", soltar);

    aplicar();
  }



  /* ---------------------------------------------------------
     11. Constelação de fundo
     Densidade proporcional à área, com teto. As linhas entre
     vizinhos (o trecho caro) só existem no perfil pleno.
     --------------------------------------------------------- */
  const canvas = $("[data-canvas]");

  if (canvas && !semMovimento) {
    const ctx = canvas.getContext("2d", { alpha: true });
    const CORES = ["168, 85, 247", "192, 132, 252", "254, 200, 0", "120, 239, 248"];
    const LIGA = perfLeve ? 0 : 118;
    const LIGA2 = LIGA * LIGA;

    let particulas = [];
    let larg = 0;
    let alt = 0;
    let animando = true;
    let quadro = 0;

    const dimensionar = () => {
      const dpr = limitar(window.devicePixelRatio || 1, 1, perfLeve ? 1.5 : 2);
      larg = canvas.clientWidth;
      alt = canvas.clientHeight;
      canvas.width = Math.floor(larg * dpr);
      canvas.height = Math.floor(alt * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const teto = perfLeve ? 34 : 78;
      const qtd = limitar(Math.round((larg * alt) / 19000), 18, teto);

      particulas = Array.from({ length: qtd }, () => ({
        x: Math.random() * larg,
        y: Math.random() * alt,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.5 + 0.5,
        cor: CORES[Math.random() < 0.14 ? 2 : Math.random() < 0.2 ? 3 : Math.random() < 0.6 ? 0 : 1],
        brilho: Math.random() * 0.38 + 0.22,
      }));
    };

    const desenhar = () => {
      if (!animando) return;
      quadro = requestAnimationFrame(desenhar);

      ctx.clearRect(0, 0, larg, alt);

      for (let i = 0; i < particulas.length; i++) {
        const p = particulas[i];

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -20) p.x = larg + 20;
        if (p.x > larg + 20) p.x = -20;
        if (p.y < -20) p.y = alt + 20;
        if (p.y > alt + 20) p.y = -20;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.cor}, ${p.brilho})`;
        ctx.fill();

        if (!LIGA) continue;

        for (let j = i + 1; j < particulas.length; j++) {
          const q = particulas[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > LIGA2) continue;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `rgba(${p.cor}, ${(1 - Math.sqrt(d2) / LIGA) * 0.13})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }
    };

    dimensionar();
    desenhar();

    let redim;
    window.addEventListener("resize", () => {
      clearTimeout(redim);
      redim = setTimeout(dimensionar, 200);
    }, { passive: true });

    // aba escondida não gasta bateria
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        animando = false;
        cancelAnimationFrame(quadro);
      } else if (!animando) {
        animando = true;
        desenhar();
      }
    });
  }


  /* ---------------------------------------------------------
     12. Partida
     --------------------------------------------------------- */
  const carga = $("[data-carga]");

  const encerrarCarga = () => {
    carga?.classList.add("is-fim");
    setTimeout(() => carga?.remove(), 700);
  };

  const primeiroSlide = () => {
    const alvo = parseInt((location.hash.match(/^#s(\d+)$/) || [])[1], 10);
    return isFinite(alvo) ? limitar(alvo - 1, 0, TOTAL - 1) : 0;
  };

  atual = primeiroSlide();
  slides[atual].classList.add("is-ativo");
  atualizarHud();

  window.addEventListener("hashchange", () => {
    const alvo = primeiroSlide();
    if (alvo !== atual) irPara(alvo);
  });

  let iniciado = false;

  const iniciar = () => {
    if (iniciado) return;
    iniciado = true;

    medir();
    resolverDensidades();
    encerrarCarga();
    contadoresDoSlide(slides[atual]).forEach(rodarContador);

    // dica de deslizar, uma única vez por aparelho
    if (modo === "fluido") {
      let jaViu = false;
      try {
        jaViu = localStorage.getItem("ck-dica-toque") === "1";
      } catch (_) { /* sem armazenamento */ }

      if (!jaViu) {
        const dica = document.createElement("div");
        dica.className = "dica-toque";
        dica.textContent = "Deslize para trocar de slide";
        document.body.appendChild(dica);
        setTimeout(() => dica.remove(), 5000);
        try {
          localStorage.setItem("ck-dica-toque", "1");
        } catch (_) { /* sem armazenamento */ }
      }
    }
  };

  /* As fontes definem a altura de cada bloco, então a conta de densidade
     precisa delas. Espera enquanto a tela de carga está no ar, mas com
     prazo: rede ruim não pode segurar a apresentação. */
  const partir = () => {
    const fontes = document.fonts && document.fonts.ready
      ? document.fonts.ready
      : Promise.resolve();

    Promise.race([fontes, new Promise((r) => setTimeout(r, 1800))]).then(() => {
      setTimeout(iniciar, semMovimento ? 0 : 160);
    });
  };

  if (document.readyState === "complete") {
    partir();
  } else {
    window.addEventListener("load", partir);
    setTimeout(iniciar, 4200);
  }
})();
