/* ============================================================
   Conscious Knowledge — interações do site
   Tudo é progressivo: se o JS falhar, o conteúdo continua
   legível e navegável. Nada aqui é obrigatório para ler a
   página, apenas para dar vida a ela.
   ============================================================ */

(() => {
  "use strict";

  const semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const temHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const limitar = (v, min, max) => Math.min(max, Math.max(min, v));


  /* ---------------------------------------------------------
     01. Preloader
     --------------------------------------------------------- */
  const preloader = $("[data-preloader]");

  const encerrarPreloader = () => {
    if (!preloader || preloader.classList.contains("is-pronto")) return;
    preloader.classList.add("is-pronto");
    document.body.classList.remove("is-travado");
    setTimeout(() => preloader.remove(), 900);
  };

  if (preloader) {
    document.body.classList.add("is-travado");
    window.addEventListener("load", () => setTimeout(encerrarPreloader, semMovimento ? 0 : 600));
    // rede lenta ou imagem grande não pode prender o usuário
    setTimeout(encerrarPreloader, 4500);
  }


  /* ---------------------------------------------------------
     02. Header, menu mobile e scrollspy
     --------------------------------------------------------- */
  const header = $("body > header");
  const nav = header && $("nav", header);
  const navLinks = nav ? $$("a[href^='#']", nav) : [];
  const secoes = navLinks
    .map((link) => $(link.getAttribute("href")))
    .filter(Boolean);

  let toggle = header && $(".nav-toggle", header);

  if (header && nav && !toggle) {
    toggle = document.createElement("button");
    toggle.className = "nav-toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-label", "Abrir menu");
    toggle.setAttribute("aria-expanded", "false");
    toggle.innerHTML = "<span></span>";
    header.appendChild(toggle);
  }

  const fecharMenu = () => {
    if (!nav || !toggle) return;
    nav.classList.remove("is-open");
    toggle.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Abrir menu");
  };

  toggle?.addEventListener("click", () => {
    const aberto = nav.classList.toggle("is-open");
    toggle.classList.toggle("is-open", aberto);
    toggle.setAttribute("aria-expanded", String(aberto));
    toggle.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
  });

  navLinks.forEach((link) => link.addEventListener("click", fecharMenu));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") fecharMenu();
  });

  /* header some ao descer, volta ao subir */
  let ultimoY = window.scrollY;
  let agendado = false;

  const progresso = document.createElement("div");
  progresso.className = "scroll-progress";
  progresso.setAttribute("aria-hidden", "true");
  document.body.appendChild(progresso);

  const aoRolar = () => {
    const y = window.scrollY;

    header?.classList.toggle("is-scrolled", y > 24);

    if (y > 140 && !nav?.classList.contains("is-open")) {
      if (y > ultimoY + 8) header?.classList.add("is-hidden");
      else if (y < ultimoY - 8) header?.classList.remove("is-hidden");
    } else {
      header?.classList.remove("is-hidden");
    }

    const alturaDoc = document.documentElement.scrollHeight - window.innerHeight;
    progresso.style.width = `${alturaDoc > 0 ? (y / alturaDoc) * 100 : 0}%`;

    ultimoY = y;
    agendado = false;
  };

  window.addEventListener("scroll", () => {
    if (!agendado) {
      window.requestAnimationFrame(aoRolar);
      agendado = true;
    }
  }, { passive: true });

  aoRolar();

  /* link ativo conforme a seção visível */
  if ("IntersectionObserver" in window && secoes.length) {
    const marcarAtivo = (id) => {
      navLinks.forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
      });
    };

    const espiao = new IntersectionObserver(
      (entradas) => {
        entradas
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
          .forEach((e) => marcarAtivo(e.target.id));
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0.1, 0.3, 0.5] }
    );

    secoes.forEach((s) => espiao.observe(s));
  }


  /* ---------------------------------------------------------
     03. Reveal ao rolar
     --------------------------------------------------------- */
  const alvosReveal = [
    [".hero-content", ""],
    [".metric-card", ""],
    ["main > section > header", ""],
    ["#sobre article", "reveal--esq"],
    [".pilar", "reveal--dir"],
    [".finck-intro", ""],
    [".numero", "reveal--zoom"],
    [".prisma-secao", ""],
    [".titulo-bloco", ""],
    [".funcao", ""],
    [".fluxo__passo", ""],
    [".tech__texto", "reveal--esq"],
    [".anel-tech", "reveal--dir"],
    [".project-status", ""],
    [".finck-cta", ""],
    [".entregavel", ""],
    [".timeline__item", "reveal--esq"],
    [".classroom", ""],
    [".members", ""],
    ["#contato address p", "reveal--zoom"],
    [".footer-grade", ""],
  ];

  const elementosReveal = [];

  alvosReveal.forEach(([sel, variante]) => {
    $$(sel).forEach((el, i) => {
      el.classList.add("reveal");
      if (variante) el.classList.add(variante);
      el.style.transitionDelay = `${Math.min(i * 0.07, 0.42)}s`;
      elementosReveal.push(el);
    });
  });

  if ("IntersectionObserver" in window && !semMovimento) {
    const obsReveal = new IntersectionObserver(
      (entradas, obs) => {
        entradas.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-visible");
          obs.unobserve(e.target);
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
    );

    elementosReveal.forEach((el) => obsReveal.observe(el));
  } else {
    elementosReveal.forEach((el) => el.classList.add("is-visible"));
  }


  /* ---------------------------------------------------------
     04. Fundo em canvas — constelação reativa ao mouse
     --------------------------------------------------------- */
  const canvas = $("[data-canvas]");

  if (canvas && !semMovimento) {
    const ctx = canvas.getContext("2d", { alpha: true });
    const ponteiro = { x: -9999, y: -9999 };
    let particulas = [];
    let largura = 0;
    let altura = 0;
    let dpr = 1;
    let animando = true;
    let quadro = 0;

    const CORES = ["168, 85, 247", "192, 132, 252", "254, 200, 0"];

    const dimensionar = () => {
      dpr = limitar(window.devicePixelRatio || 1, 1, 2);
      largura = canvas.clientWidth;
      altura = canvas.clientHeight;
      canvas.width = Math.floor(largura * dpr);
      canvas.height = Math.floor(altura * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // densidade proporcional à área, com teto para não pesar
      const quantidade = limitar(Math.round((largura * altura) / 16000), 26, 92);
      particulas = Array.from({ length: quantidade }, () => ({
        x: Math.random() * largura,
        y: Math.random() * altura,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r: Math.random() * 1.6 + 0.6,
        cor: CORES[Math.random() < 0.12 ? 2 : Math.random() < 0.5 ? 0 : 1],
        brilho: Math.random() * 0.4 + 0.25,
      }));
    };

    const desenhar = () => {
      if (!animando) return;
      quadro = requestAnimationFrame(desenhar);

      ctx.clearRect(0, 0, largura, altura);

      for (let i = 0; i < particulas.length; i++) {
        const p = particulas[i];

        // repulsão suave em torno do ponteiro
        const dxm = p.x - ponteiro.x;
        const dym = p.y - ponteiro.y;
        const distM = Math.hypot(dxm, dym);
        if (distM < 130 && distM > 0.1) {
          const forca = (130 - distM) / 130 * 0.7;
          p.vx += (dxm / distM) * forca * 0.12;
          p.vy += (dym / distM) * forca * 0.12;
        }

        // atrito para a velocidade não escapar
        p.vx *= 0.99;
        p.vy *= 0.99;

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -20) p.x = largura + 20;
        if (p.x > largura + 20) p.x = -20;
        if (p.y < -20) p.y = altura + 20;
        if (p.y > altura + 20) p.y = -20;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.cor}, ${p.brilho})`;
        ctx.fill();

        // linhas entre vizinhos próximos
        for (let j = i + 1; j < particulas.length; j++) {
          const q = particulas[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 > 16900) continue; // 130²
          const alpha = (1 - Math.sqrt(dist2) / 130) * 0.16;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `rgba(${p.cor}, ${alpha})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }
    };

    dimensionar();
    desenhar();

    let redimensionando;
    window.addEventListener("resize", () => {
      clearTimeout(redimensionando);
      redimensionando = setTimeout(dimensionar, 180);
    });

    window.addEventListener("pointermove", (e) => {
      ponteiro.x = e.clientX;
      ponteiro.y = e.clientY;
    }, { passive: true });

    window.addEventListener("pointerleave", () => {
      ponteiro.x = ponteiro.y = -9999;
    });

    // não gasta bateria com a aba escondida
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
     05. Cursor personalizado
     --------------------------------------------------------- */
  const cursor = $("[data-cursor]");
  const halo = $("[data-cursor-halo]");

  if (cursor && halo && temHover && !semMovimento) {
    let px = window.innerWidth / 2;
    let py = window.innerHeight / 2;
    let hx = px;
    let hy = py;

    document.body.classList.add("cursor-ativo");

    window.addEventListener("pointermove", (e) => {
      px = e.clientX;
      py = e.clientY;
      cursor.style.transform = `translate3d(${px - 3.5}px, ${py - 3.5}px, 0)`;
    }, { passive: true });

    const seguir = () => {
      hx += (px - hx) * 0.16;
      hy += (py - hy) * 0.16;
      halo.style.transform = `translate3d(${hx - 19}px, ${hy - 19}px, 0)`;
      requestAnimationFrame(seguir);
    };
    seguir();

    const interativos = "a, button, input, [data-tilt], .membro, .prisma-palco";
    document.addEventListener("pointerover", (e) => {
      if (e.target.closest(interativos)) document.body.classList.add("cursor-toque");
    });
    document.addEventListener("pointerout", (e) => {
      if (e.target.closest(interativos)) document.body.classList.remove("cursor-toque");
    });
  }


  /* ---------------------------------------------------------
     06. Tilt 3D nos cartões
     --------------------------------------------------------- */
  if (temHover && !semMovimento) {
    $$("[data-tilt]").forEach((card) => {
      const intensidade = 9;

      const mover = (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;

        card.style.setProperty("--mx", `${x * 100}%`);
        card.style.setProperty("--my", `${y * 100}%`);
        card.style.transform =
          `perspective(900px) rotateX(${(0.5 - y) * intensidade}deg) ` +
          `rotateY(${(x - 0.5) * intensidade}deg) translateY(-4px)`;
      };

      const sair = () => {
        card.style.transform = "";
        card.style.transition = "transform .6s var(--ease)";
        setTimeout(() => (card.style.transition = ""), 600);
      };

      card.addEventListener("pointermove", mover);
      card.addEventListener("pointerleave", sair);
    });
  }


  /* ---------------------------------------------------------
     07. Botões magnéticos
     --------------------------------------------------------- */
  if (temHover && !semMovimento) {
    $$("[data-magnetico]").forEach((btn) => {
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        btn.style.transform = `translate(${dx * 0.16}px, ${dy * 0.24 - 2}px)`;
      });
      btn.addEventListener("pointerleave", () => {
        btn.style.transform = "";
      });
    });
  }


  /* ---------------------------------------------------------
     08. Parallax do núcleo 3D e do celular
     --------------------------------------------------------- */
  const parallax3d = (el, maxX, maxY) => {
    if (!el || !temHover || semMovimento) return;
    window.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const nx = limitar((e.clientX - cx) / (window.innerWidth / 2), -1, 1);
      const ny = limitar((e.clientY - cy) / (window.innerHeight / 2), -1, 1);
      el.style.setProperty("--ry", `${nx * maxY}deg`);
      el.style.setProperty("--rx", `${-ny * maxX}deg`);
    }, { passive: true });
  };

  parallax3d($("[data-nucleo] .nucleo__palco"), 14, 18);

  const device = $("[data-device] .device");
  if (device && temHover && !semMovimento) {
    const palco = device.parentElement;
    palco.addEventListener("pointermove", (e) => {
      const r = palco.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      device.style.setProperty("--ry", `${-17 + x * 26}deg`);
      device.style.setProperty("--rx", `${6 - y * 18}deg`);
    });
    palco.addEventListener("pointerleave", () => {
      device.style.setProperty("--ry", "-17deg");
      device.style.setProperty("--rx", "6deg");
    });
  }


  /* ---------------------------------------------------------
     09. Texto que se digita
     --------------------------------------------------------- */
  const typed = $("[data-typed]");

  if (typed) {
    const saida = $(".typed__texto", typed);
    const palavras = (typed.dataset.palavras || "").split("|").filter(Boolean);

    if (saida && palavras.length) {
      if (semMovimento) {
        saida.textContent = palavras[0];
      } else {
        let indice = 0;
        let letra = 0;
        let apagando = false;

        const passo = () => {
          const palavra = palavras[indice];
          letra += apagando ? -1 : 1;
          saida.textContent = palavra.slice(0, letra);

          let espera = apagando ? 45 : 85;

          if (!apagando && letra === palavra.length) {
            apagando = true;
            espera = 1900;
          } else if (apagando && letra === 0) {
            apagando = false;
            indice = (indice + 1) % palavras.length;
            espera = 320;
          }

          setTimeout(passo, espera);
        };

        passo();
      }
    }
  }


  /* ---------------------------------------------------------
     10. Contadores
     --------------------------------------------------------- */
  const contadores = $$("[data-contador]");

  if (contadores.length) {
    const animar = (el) => {
      const alvo = Number(el.dataset.contador) || 0;
      if (semMovimento) {
        el.textContent = String(alvo);
        return;
      }

      const duracao = 1400;
      const inicio = performance.now();

      const passo = (agora) => {
        const t = limitar((agora - inicio) / duracao, 0, 1);
        const suave = 1 - Math.pow(1 - t, 3);
        el.textContent = String(Math.round(alvo * suave));
        if (t < 1) requestAnimationFrame(passo);
      };

      requestAnimationFrame(passo);
    };

    if ("IntersectionObserver" in window) {
      const obs = new IntersectionObserver((entradas, o) => {
        entradas.forEach((e) => {
          if (!e.isIntersecting) return;
          animar(e.target);
          o.unobserve(e.target);
        });
      }, { threshold: 0.5 });

      contadores.forEach((el) => obs.observe(el));
    } else {
      contadores.forEach(animar);
    }
  }


  /* ---------------------------------------------------------
     11. Prisma 3D — arrastar para girar
     --------------------------------------------------------- */
  const palcoPrisma = $("[data-prisma]");

  if (palcoPrisma) {
    const prisma = $(".prisma", palcoPrisma);
    let arrastando = false;
    let inicioX = 0;
    let anguloInicial = 0;
    let angulo = 0;

    const lerAngulo = () => {
      const valor = getComputedStyle(prisma).getPropertyValue("--gy").trim();
      return parseFloat(valor) || 0;
    };

    /* A transform aplicada é Rx(-12°)·Ry(θ). Nessa composição a primeira
       coluna da matriz é (cos θ, …) e a terceira é (sen θ, …), então
       θ = atan2(m31, m11). Serve para continuar do ângulo em que a
       animação estava, sem o cubo saltar ao ser agarrado. */
    const anguloVisivel = () => {
      try {
        const m = new DOMMatrixReadOnly(getComputedStyle(prisma).transform);
        return Math.atan2(m.m31, m.m11) * (180 / Math.PI);
      } catch {
        return lerAngulo();
      }
    };

    palcoPrisma.addEventListener("pointerdown", (e) => {
      arrastando = true;
      inicioX = e.clientX;
      anguloInicial = anguloVisivel();
      angulo = anguloInicial;
      palcoPrisma.classList.add("is-arrastando");
      palcoPrisma.setPointerCapture?.(e.pointerId);
    });

    palcoPrisma.addEventListener("pointermove", (e) => {
      if (!arrastando) return;
      angulo = anguloInicial + (e.clientX - inicioX) * 0.45;
      prisma.style.setProperty("--gy", `${angulo}deg`);
    });

    const soltar = (e) => {
      if (!arrastando) return;
      arrastando = false;
      palcoPrisma.classList.remove("is-arrastando");
      palcoPrisma.releasePointerCapture?.(e.pointerId);
    };

    palcoPrisma.addEventListener("pointerup", soltar);
    palcoPrisma.addEventListener("pointercancel", soltar);
  }


  /* ---------------------------------------------------------
     12. Calculadora FinCK of Reality
         Mesmas fórmulas do motor do aplicativo:
           valor_dia  = renda / dias
           valor_hora = valor_dia / horas
           custo      = preço / valor_hora
     --------------------------------------------------------- */
  const calc = $("[data-calc]");

  if (calc) {
    const campos = {
      renda: $("#calcRenda"),
      dias: $("#calcDias"),
      horas: $("#calcHoras"),
      preco: $("#calcPreco"),
    };

    const saidas = {
      reais: $("[data-prisma-reais]"),
      horas: $("[data-prisma-horas]"),
      dias: $("[data-prisma-dias]"),
      percent: $("[data-prisma-percent]"),
      resumo: $("[data-calc-resumo]"),
    };

    const moeda = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    const numero = (valor, casas = 1) =>
      new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: casas,
        maximumFractionDigits: casas,
      }).format(valor);

    const recalcular = () => {
      const renda = Math.max(0, Number(campos.renda?.value) || 0);
      const dias = limitar(Number(campos.dias?.value) || 22, 1, 31);
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
          : `Informe sua renda mensal para ver quanto vale a sua hora.`;
      }
    };

    Object.values(campos).forEach((campo) => {
      campo?.addEventListener("input", recalcular);
    });

    calc.addEventListener("submit", (e) => e.preventDefault());

    recalcular();
  }

})();
