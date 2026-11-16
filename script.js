/* ============================================================
   Conscious Knowledge · interações do site
   Tudo é progressivo: se o JS falhar, o conteúdo continua
   legível e navegável. O 3D mora em ck-3d.js; aqui ficam o
   menu, as entradas ao rolar e as duas demonstrações.
   ============================================================ */
(() => {
  "use strict";

  const semMovimento = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const temMouse = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const limitar = (v, min, max) => Math.min(max, Math.max(min, v));
  const temIO = "IntersectionObserver" in window;

  /* ---------- vinheta de abertura ---------- */
  $$("[data-assistir-vinheta]").forEach((botao) => {
    botao.addEventListener("click", () => window.CKVinheta?.tocar({ tipo: "completa", credito: false }));
  });

  /* ---------- topo, menu do celular e seção atual ---------- */
  const topo = $("[data-topo]");
  const menu = $("#menu");
  const menuBotao = $("[data-menu-botao]");

  const fecharMenu = () => {
    if (!menu?.classList.contains("is-aberto")) return;
    menu.classList.remove("is-aberto");
    menuBotao.setAttribute("aria-expanded", "false");
    menuBotao.setAttribute("aria-label", "Abrir menu");
    document.documentElement.style.overflow = "";
  };
  menuBotao?.addEventListener("click", () => {
    if (menu.classList.contains("is-aberto")) return fecharMenu();
    menu.classList.add("is-aberto");
    menuBotao.setAttribute("aria-expanded", "true");
    menuBotao.setAttribute("aria-label", "Fechar menu");
    document.documentElement.style.overflow = "hidden";
  });
  menu?.addEventListener("click", (e) => e.target.closest("a") && fecharMenu());
  addEventListener("keydown", (e) => e.key === "Escape" && fecharMenu());
  matchMedia("(min-width: 1061px)").addEventListener?.("change", fecharMenu);

  const linksMenu = $$(".menu > ul:first-child a");
  if (temIO) {
    const espia = new IntersectionObserver((entradas) => {
      entradas.forEach((en) => {
        if (!en.isIntersecting) return;
        linksMenu.forEach((a) => a.classList.toggle("is-atual", a.getAttribute("href") === `#${en.target.id}`));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    linksMenu.forEach((a) => { const alvo = $(a.getAttribute("href")); if (alvo) espia.observe(alvo); });
    const inicio = $("#inicio");
    if (inicio) espia.observe(inicio);
  }

  /* ---------- rolagem: barra de progresso, topo e giro do emblema ---------- */
  const barra = $("[data-progresso]");
  const heroi = $("[data-inicio]");
  const palcoHeroi = heroi && $("[data-palco]", heroi);
  let alturaHeroi = heroi ? heroi.offsetHeight : 1;
  let alturaPagina = 1;
  let rolando = false;

  const medir = () => {
    alturaHeroi = heroi ? heroi.offsetHeight : 1;
    alturaPagina = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  };
  const aoRolar = () => {
    rolando = false;
    const y = scrollY;
    topo?.classList.toggle("is-rolado", y > 24);
    if (barra) barra.style.transform = `scaleX(${limitar(y / alturaPagina, 0, 1)})`;
    if (palcoHeroi && window.CK3D) window.CK3D.rolagem(palcoHeroi, limitar(y / alturaHeroi, 0, 1));
  };
  addEventListener("scroll", () => { if (!rolando) { rolando = true; requestAnimationFrame(aoRolar); } }, { passive: true });
  addEventListener("resize", () => { medir(); aoRolar(); }, { passive: true });
  addEventListener("load", () => { medir(); aoRolar(); });
  medir(); aoRolar();

  /* ---------- entradas ao rolar e pausa do que está fora da tela ---------- */
  const revelaveis = $$("[data-revelar]");
  if (temIO && !semMovimento) {
    const revela = new IntersectionObserver((entradas) => {
      entradas.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add("visto");
        revela.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revelaveis.forEach((el) => revela.observe(el));
  } else revelaveis.forEach((el) => el.classList.add("visto"));

  if (temIO) {
    const cena = new IntersectionObserver((entradas) => {
      entradas.forEach((en) => en.target.classList.toggle("fora", !en.isIntersecting));
    }, { rootMargin: "10% 0px 10% 0px" });
    $$("main > section, main > div, .produto, .rodape").forEach((el) => cena.observe(el));
  }

  /* ---------- palavras que tombam no título ---------- */
  const gira = $("[data-gira]");
  if (gira && !semMovimento) {
    const palavras = $$(".gira__palavra", gira);
    let atual = 0;
    setInterval(() => {
      if (document.hidden || heroi?.classList.contains("fora")) return;
      const sai = palavras[atual];
      atual = (atual + 1) % palavras.length;
      sai.classList.remove("is-ativa");
      sai.classList.add("is-saindo");
      palavras[atual].classList.add("is-ativa");
      setTimeout(() => sai.classList.remove("is-saindo"), 650);
    }, 2600);
  }

  /* ---------- cartões que inclinam em 3D sob o ponteiro ---------- */
  if (temMouse && !semMovimento) {
    $$("[data-inclinar]").forEach((el) => {
      let quadro = 0, rx = 0, ry = 0;
      const aplicar = () => { quadro = 0; el.style.setProperty("--rx", `${rx}deg`); el.style.setProperty("--ry", `${ry}deg`); };
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        ry = ((e.clientX - r.left) / r.width - 0.5) * 12;
        rx = -((e.clientY - r.top) / r.height - 0.5) * 10;
        if (!quadro) quadro = requestAnimationFrame(aplicar);
      });
      el.addEventListener("pointerleave", () => { rx = ry = 0; if (!quadro) quadro = requestAnimationFrame(aplicar); });
    });
  }

  /* ---------- números que contam ---------- */
  const contadores = $$("[data-contar]");
  if (temIO && !semMovimento && contadores.length) {
    const conta = new IntersectionObserver((entradas) => {
      entradas.forEach((en) => {
        if (!en.isIntersecting) return;
        conta.unobserve(en.target);
        const alvo = Number(en.target.dataset.contar), inicio = performance.now(), dur = 900 + alvo * 12;
        const passo = (agora) => {
          const k = limitar((agora - inicio) / dur, 0, 1);
          en.target.textContent = Math.round(alvo * (1 - Math.pow(1 - k, 3)));
          if (k < 1) requestAnimationFrame(passo);
        };
        requestAnimationFrame(passo);
      });
    }, { threshold: 0.6 });
    contadores.forEach((el) => conta.observe(el));
  }

  /* ---------- FinCK: o mesmo valor em quatro leituras ---------- */
  const calc = $("[data-calc]");
  if (calc) {
    const campos = { renda: $("#calcRenda"), dias: $("#calcDias"), horas: $("#calcHoras"), preco: $("#calcPreco") };
    const saidas = {
      reais: $("[data-calc-reais]"), horas: $("[data-calc-horas]"), dias: $("[data-calc-dias]"),
      percent: $("[data-calc-percent]"), resumo: $("[data-calc-resumo]"), legenda: $("[data-calc-legenda]"),
    };
    const plano = $("[data-calc-blocos]");
    const cubos = [];
    if (plano) {
      for (let i = 0; i < 31; i++) {
        const c = document.createElement("span");
        c.className = "cubo";
        c.style.setProperty("--n", i);
        plano.appendChild(c);
        cubos.push(c);
      }
    }

    const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
    const numero = (v, casas = 1) => new Intl.NumberFormat("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas }).format(v);

    const recalcular = () => {
      const renda = Math.max(0, Number(campos.renda?.value) || 0);
      const dias = Math.round(limitar(Number(campos.dias?.value) || 22, 1, 31));
      const horas = limitar(Number(campos.horas?.value) || 8, 1, 24);
      const preco = Math.max(0, Number(campos.preco?.value) || 0);

      const valorDia = renda > 0 ? renda / dias : 0;
      const valorHora = valorDia > 0 ? valorDia / horas : 0;
      const custoHoras = valorHora > 0 ? preco / valorHora : 0;
      const custoDias = valorDia > 0 ? preco / valorDia : 0;
      const percentual = renda > 0 ? (preco / renda) * 100 : 0;

      if (saidas.reais) saidas.reais.textContent = moeda.format(preco);
      if (saidas.horas) saidas.horas.textContent = `${numero(custoHoras)} h`;
      if (saidas.dias) saidas.dias.textContent = `${numero(custoDias)} dias`;
      if (saidas.percent) saidas.percent.textContent = `${numero(percentual)}%`;
      if (saidas.resumo) {
        saidas.resumo.innerHTML = renda > 0
          ? `Sua hora vale <strong>${moeda.format(valorHora)}</strong> e seu dia vale <strong>${moeda.format(valorDia)}</strong>.`
          : "Informe sua renda mensal para ver quanto vale a sua hora.";
      }

      // cada cubo é um dia de trabalho do mês; os dourados são os que a compra consome
      if (plano) {
        plano.style.gridTemplateColumns = `repeat(${dias > 24 ? 7 : 6}, var(--lado))`;
        cubos.forEach((c, i) => {
          c.hidden = i >= dias;
          const parte = limitar(custoDias - i, 0, 1);
          c.classList.toggle("is-gasto", parte > 0);
          c.style.setProperty("--h", `${parte > 0 ? Math.max(5, Math.round(parte * 30)) : 3}px`);
        });
      }
      if (saidas.legenda) {
        saidas.legenda.textContent = renda <= 0
          ? "Informe sua renda para ver quantos dias de trabalho a compra consome."
          : custoDias > dias
            ? `Esta compra custa mais que um mês inteiro de trabalho: ${numero(custoDias)} dias.`
            : `${numero(custoDias)} dos seus ${dias} dias de trabalho no mês vão para esta compra.`;
      }
    };

    Object.values(campos).forEach((campo) => campo?.addEventListener("input", recalcular));
    calc.addEventListener("submit", (e) => e.preventDefault());
    recalcular();
  }

  /* ---------- DynamiCK: uma sessão que se recompõe ---------- */
  const controle = $("[data-estudo-controle]");
  if (controle) {
    const saidaTempo = $("[data-estudo-tempo]");
    const atualizar = () => {
      const tempo = Number(controle.value), min = Number(controle.min), max = Number(controle.max);
      const aprender = Math.max(4, Math.round(tempo * (tempo <= 25 ? 0.27 : 0.2)));
      const revisar = Math.max(3, Math.round(tempo * 0.2));
      const praticar = Math.max(5, tempo - aprender - revisar);
      controle.style.setProperty("--p", `${((tempo - min) / (max - min)) * 100}%`);
      if (saidaTempo) saidaTempo.textContent = `${tempo} min`;
      Object.entries({ aprender, praticar, revisar }).forEach(([nome, minutos]) => {
        $(`[data-estudo-coluna="${nome}"]`)?.style.setProperty("--h", Math.round(16 + minutos * 2.3));
        const texto = $(`[data-estudo-texto="${nome}"]`);
        if (texto) texto.textContent = `${minutos} min`;
      });
    };
    controle.addEventListener("input", atualizar);
    atualizar();
  }

  /* ---------- identidade: separar as camadas do modelo 3D ---------- */
  const separar = $("[data-separar]");
  const anatomia = $("[data-anatomia]");
  if (separar && anatomia) {
    const saida = $("[data-separar-valor]");
    const aplicar = () => {
      const v = Number(separar.value);
      separar.style.setProperty("--p", `${v}%`);
      if (saida) saida.textContent = `${v}%`;
      window.CK3D?.explodir(anatomia, v / 100);
    };
    separar.addEventListener("input", aplicar);
    $$("[data-separar-ir]").forEach((b) => b.addEventListener("click", () => {
      const alvo = Number(b.dataset.separarIr), de = Number(separar.value), inicio = performance.now();
      if (semMovimento) { separar.value = alvo; return aplicar(); }
      const passo = (agora) => {
        const k = limitar((agora - inicio) / 700, 0, 1);
        separar.value = Math.round(de + (alvo - de) * (1 - Math.pow(1 - k, 3)));
        aplicar();
        if (k < 1) requestAnimationFrame(passo);
      };
      requestAnimationFrame(passo);
    }));
    aplicar();
  }
})();
