/* ============================================================
   FinCK · apresentação final · objetos da fundamentação à conclusão
   Conscious Knowledge · Projeto Interdisciplinar 2026

   Ampulheta (o custo em tempo de vida), celular (o app publicado),
   cronômetro com etiqueta (preço virando horas), pilhas de moedas
   (pequenos gastos que somam), laço da ODS 12 e prancheta (o que
   foi entregue e o que ainda falta medir).
   ============================================================ */
(() => {
  "use strict";

  const C = window.FinckCena;
  const { M, Malha, MAT, forma, PI, TAU, rad } = C;
  const { suave, entre, mola, deitar, dePe, cifrao, moeda, malhaMoeda } = C.pecas;
  const O = C.objetos;

  /* ---------------------------------------------------------
     Ampulheta — pratos em preto piano com frisos de ouro, três
     colunas torneadas, bulbo de vidro e areia dourada.
     Ao entrar em cena ela vira: a contagem começa ali.
     --------------------------------------------------------- */
  O.ampulheta = () => {
    const m = new Malha(), vidro = new Malha();

    for (const s of [1, -1]) {
      m.em(M.escala(1, s, 1), () => {
        m.usar(MAT.piano);
        m.em(M.mover(0, 1.4, 0), () => m.cilindro(.74, .15, { chanfro: .03, seg: 72 }));
        m.usar(MAT.ouro);
        m.em(M.mover(0, 1.4, 0), () => m.toro(.748, .02, { seg: 72, segr: 8 }));
        m.em(M.mover(0, 1.296, 0), () => m.cilindro(.62, .058, { chanfro: .018, seg: 72 }));
        m.em(M.mover(0, 1.235, 0), () => m.cilindro(.19, .07, { chanfro: .02, seg: 40 }));
        m.em(M.mover(0, 1.5, 0), () => m.cilindro(.5, .05, { chanfro: .02, seg: 64 }));
        m.usar(MAT.ouroFosco);
        m.emVolta(48, () => m.em(M.mover(.62, 1.296, 0), () => m.caixa(.014, .03, .016, { chanfro: 0 })));
      });
    }

    const coluna = [[0, -1.27]];
    for (const [y, r] of [[-1.27, .075], [-1.2, .075], [-1.17, .048], [-1.06, .04], [-.96, .086], [-.87, .044],
      [-.5, .058], [0, .07], [.5, .058], [.87, .044], [.96, .086], [1.06, .04], [1.17, .048], [1.2, .075], [1.27, .075]]) coluna.push([r, y]);
    coluna.push([0, 1.27]);
    m.usar(MAT.ouro);
    m.emVolta(3, () => m.em(M.mover(.6, 0, 0), () => m.torno(coluna, { seg: 20, suave: 55 })), { de: rad(30) });

    const parede = (y) => .05 + .46 * Math.pow(Math.sin(PI * Math.pow(Math.abs(y) / 1.21, 1.23)), .75);
    const bulbo = [];
    for (let i = 0; i <= 56; i++) { const y = -1.21 + 2.42 * i / 56; bulbo.push([parede(y), y]); }
    vidro.usar(MAT.vidro).torno(bulbo, { seg: 64, suave: 180 });

    m.usar(MAT.areia);
    const cima = [[.02, .05]];
    for (let i = 0; i <= 12; i++) { const y = .05 + .6 * i / 12; cima.push([parede(y) * .93, y]); }
    cima.push([.2, .58], [0, .5]);
    m.torno(cima, { seg: 48, suave: 60 });
    const baixo = [[0, -1.19]];
    for (let i = 0; i <= 8; i++) { const y = -1.19 + .3 * i / 8; baixo.push([parede(y) * .93, y]); }
    baixo.push([.16, -.74], [0, -.62]);
    m.torno(baixo, { seg: 48, suave: 60 });
    m.em(M.mover(0, -.3, 0), () => m.cilindro(.011, .62, { chanfro: 0, seg: 8 }));

    m.usar(MAT.ouro);
    m.toro(.088, .024, { seg: 36, segr: 10 });

    return {
      partes: [{ geo: m }, { geo: vidro, vidro: true }],
      escala: .97, base: -1.53, giro: "continuo",
      pose: (t, e) => M.rz((1 - suave(entre(e, .2, 1))) * PI),
    };
  };


  /* ---------------------------------------------------------
     Celular — moldura de ouro, costas em laca com o conjunto de
     câmeras e a moeda do FinCK, e na frente a tela acesa: resumo,
     medidor, cartões e o gráfico do mês.
     --------------------------------------------------------- */
  O.celular = () => {
    const m = new Malha(), tela = new Malha();
    const L = 1, A = 2.06, E = .1, R = .17, zt = E / 2 + .0125;

    m.usar(MAT.ouro).extrusao(forma.retangulo(L, A, R, 10), { prof: E, chanfro: .034, passos: 4 });
    m.usar(MAT.piano);
    m.em(M.mover(0, 0, E / 2), () => m.extrusao(forma.retangulo(L - .05, A - .05, R - .025, 10), { prof: .012, chanfro: .005, passos: 2 }));
    m.usar(MAT.laca);
    m.em(M.mover(0, 0, -E / 2), () => m.extrusao(forma.retangulo(L - .05, A - .05, R - .025, 10), { prof: .012, chanfro: .005, passos: 2 }));

    m.usar(MAT.ouroEscuro);
    m.em(M.mover(L / 2 + .004, .36, 0), () => m.caixa(.014, .26, .04, { r: .006, chanfro: .003, passos: 1 }));
    for (const y of [.52, .3]) m.em(M.mover(-L / 2 - .004, y, 0), () => m.caixa(.014, .16, .04, { r: .006, chanfro: .003, passos: 1 }));
    m.usar(MAT.piano);
    m.em(M.mover(0, -A / 2 - .001, 0), () => m.caixa(.16, .006, .022, { chanfro: 0 }));

    /* costas: ilha das câmeras e a moeda */
    const costas = -E / 2 - .006;
    m.usar(MAT.piano);
    m.em(M.mover(.2, .66, costas - .012), () => m.caixa(.42, .42, .03, { r: .11, chanfro: .01, passos: 2 }));
    for (const [x, y] of [[.11, .75], [.3, .57]]) {
      m.em(M.juntar(M.mover(x, y, costas - .028), M.rx(-PI / 2)), () => {
        m.usar(MAT.cromo).toro(.076, .017, { seg: 30, segr: 8 });
        m.usar(MAT.piano);
        m.em(M.escala(1, .4, 1), () => m.esfera(.062, { latDe: 0, aneis: 6, seg: 24 }));
        m.usar(MAT.lacaFunda);
        m.em(M.juntar(M.mover(0, .02, 0), M.escala(1, .4, 1)), () => m.esfera(.03, { latDe: 0, aneis: 5, seg: 16 }));
      });
    }
    m.usar(MAT.esmalte);
    m.em(M.juntar(M.mover(.31, .76, costas - .028), M.rx(-PI / 2)), () => m.cilindro(.026, .006, { seg: 14, chanfro: .002 }));
    m.em(M.juntar(M.mover(0, -.12, costas - .012), M.rx(-PI / 2)), () => moeda(m, .2, .024, { dentes: 48, seg: 48 }));

    /* frente: a tela */
    /* o que acende fica uma camada acima dos painéis de fundo */
    const luz = (mt, x, y, l, a, r = 0) => {
      tela.usar(mt);
      tela.em(M.mover(x, y, mt === MAT.painel ? zt : zt + .005), () =>
        tela.extrusao(forma.retangulo(l, a, Math.min(r, Math.min(l, a) * .42), 4), { prof: .003, chanfro: 0 }));
    };
    const ponto = (mt, x, y, r) => {
      tela.usar(mt);
      tela.em(M.mover(x, y, zt + .005), () => tela.extrusao(forma.circulo(r, 20), { prof: .003, chanfro: 0 }));
    };
    m.usar(MAT.cromo);
    m.em(M.juntar(M.mover(0, .93, zt - .005), dePe), () => m.toro(.022, .006, { seg: 18, segr: 6 }));

    luz(MAT.luzBranca, -.33, .93, .1, .016, .008);
    luz(MAT.luzBranca, .33, .93, .08, .016, .008);
    ponto(MAT.luzOuro, -.36, .78, .05);
    luz(MAT.luzBranca, -.13, .795, .28, .03, .014);
    luz(MAT.painel, -.17, .75, .2, .022, .01);

    luz(MAT.painel, 0, .4, .88, .52, .07);
    tela.em(M.juntar(M.mover(-.22, .4, zt + .008), dePe), () => {
      tela.usar(MAT.luzRoxa).toro(.15, .024, { seg: 48, segr: 8, de: rad(-90), ate: rad(150) });
      tela.usar(MAT.luzOuro).toro(.15, .024, { seg: 20, segr: 8, de: rad(160), ate: rad(260) });
    });
    luz(MAT.luzBranca, -.22, .41, .11, .034, .012);
    luz(MAT.luzBranca, .2, .5, .3, .046, .02);
    luz(MAT.luzMenta, .14, .42, .18, .026, .012);
    luz(MAT.luzRoxa, .17, .33, .24, .02, .01);
    luz(MAT.luzRoxa, .13, .28, .16, .02, .01);

    [MAT.luzOuro, MAT.luzMenta, MAT.luzRoxa].forEach((mt, i) => {
      const x = -.3 + i * .3;
      luz(MAT.painel, x, -.03, .27, .25, .05);
      ponto(mt, x - .07, .04, .032);
      luz(MAT.luzBranca, x, -.05, .17, .024, .01);
      luz(mt, x - .03, -.1, .11, .018, .008);
    });

    luz(MAT.painel, 0, -.5, .88, .5, .07);
    luz(MAT.luzBranca, -.24, -.31, .26, .026, .012);
    [.1, .16, .12, .22, .17, .27, .33].forEach((h, i) =>
      luz(i === 6 ? MAT.luzOuro : MAT.luzRoxa, -.33 + i * .11, -.71 + h / 2, .062, h, .02));

    for (const x of [-.34, -.17, .17, .34]) ponto(MAT.painel, x, -.89, .028);
    ponto(MAT.luzOuro, 0, -.88, .052);

    return {
      partes: [
        { geo: m },
        { geo: tela, brilho: (t, e) => entre(e, .45, .85) * (.92 + .08 * Math.sin(t * 2)) },
      ],
      escala: 1.3, base: -1.06, giro: "balanco", amplitude: .62,
      pose: () => M.rx(-.05),
    };
  };


  /* ---------------------------------------------------------
     Cronômetro — caixa de ouro com aro serrilhado, mostrador de
     esmalte, sessenta marcas, ponteiro que corre e a etiqueta de
     preço presa à argola: quanto custa, em tempo.
     --------------------------------------------------------- */
  O.cronometro = () => {
    const m = new Malha(), vidro = new Malha(), ponteiro = new Malha(), etiqueta = new Malha();

    m.em(dePe, () => {
      m.usar(MAT.ouro);
      m.torno([[0, -.17], [.7, -.17], [.84, -.1], [.885, 0], [.86, .1], [.8, .165], [.745, .165], [.745, .1], [0, .1]], { seg: 96, suave: 40 });
      m.emVolta(90, () => m.em(M.mover(.888, 0, 0), () => m.caixa(.016, .05, .02, { chanfro: 0 })));
      m.usar(MAT.esmalte).sombra(.94);
      m.torno([[.745, .104], [0, .104]], { seg: 96 });
      m.sombra(1).usar(MAT.ouro);
      m.torno([[.69, .109], [.676, .109]], { seg: 96 });
      m.emVolta(60, (i) => {
        m.usar(i % 5 ? MAT.piano : MAT.ouro);
        m.em(M.mover(i % 5 ? .628 : .6, .112, 0), () => m.caixa(i % 5 ? .045 : .11, .01, i % 5 ? .008 : .03, { chanfro: 0 }));
      });

      /* mostrador pequeno, embaixo */
      m.em(M.mover(0, .109, .3), () => {
        m.usar(MAT.ouro).toro(.17, .009, { seg: 44, segr: 6 });
        m.usar(MAT.piano);
        m.emVolta(12, () => m.em(M.mover(.135, .003, 0), () => m.caixa(.032, .006, .007, { chanfro: 0 })));
        m.em(M.juntar(M.ry(rad(50)), M.mover(.05, .008, 0)), () => m.caixa(.13, .008, .014, { chanfro: 0 }));
        m.usar(MAT.ouro);
        m.em(M.mover(0, .008, 0), () => m.esfera(.02, { latDe: 0, aneis: 4, seg: 12 }));
      });

      /* ponteiro dos minutos, parado */
      m.usar(MAT.piano);
      m.em(M.juntar(M.mover(0, .12, 0), M.ry(rad(118)), M.mover(.2, 0, 0)), () => m.caixa(.46, .01, .034, { chanfro: 0 }));
    });

    ponteiro.em(M.mover(0, .132, 0), () => {
      ponteiro.usar(MAT.rubi);
      ponteiro.em(deitar, () => {
        ponteiro.extrusao([[-.2, -.018], [0, -.016], [.66, -.004], [.66, .004], [0, .016], [-.2, .018]], { prof: .01, chanfro: .003, passos: 1 });
        ponteiro.em(M.mover(-.22, 0, 0), () => ponteiro.extrusao(forma.circulo(.042, 20), { prof: .01, chanfro: .003, passos: 1 }));
      });
      ponteiro.usar(MAT.ouro);
      ponteiro.em(M.mover(0, .012, 0), () => ponteiro.cilindro(.045, .03, { seg: 20, chanfro: .008 }));
    });

    const cupula = [];
    for (let i = 0; i <= 14; i++) { const u = i / 14 * PI / 2; cupula.push([.75 * Math.cos(u), .16 + .1 * Math.sin(u)]); }
    vidro.usar(MAT.vidro);
    vidro.em(dePe, () => vidro.torno(cupula, { seg: 72, suave: 180 }));

    /* coroa, botões e argola */
    m.usar(MAT.ouro);
    m.em(M.mover(0, .93, 0), () => m.cilindro(.075, .12, { seg: 24, chanfro: .01 }));
    m.em(M.mover(0, 1.06, 0), () => {
      m.cilindro(.15, .15, { seg: 36, chanfro: .025 });
      m.emVolta(28, () => m.em(M.mover(.15, 0, 0), () => m.caixa(.014, .1, .018, { chanfro: 0 })));
    });
    m.em(M.juntar(M.mover(0, 1.27, 0), M.rx(PI / 2)), () => m.toro(.15, .028, { seg: 40, segr: 10 }));
    for (const s of [-1, 1]) {
      m.em(M.juntar(M.rz(-s * rad(38)), M.mover(0, .94, 0)), () => {
        m.cilindro(.045, .1, { seg: 18, chanfro: .008 });
        m.em(M.mover(0, .075, 0), () => m.cilindro(.066, .05, { seg: 22, chanfro: .012 }));
      });
    }

    /* etiqueta: origem na argola, pendurada pelo cordão */
    const olhal = [.74, -.66, .16];
    const cordao = [];
    for (let i = 0; i <= 14; i++) {
      const t = i / 14, u = 1 - t;
      cordao.push([2 * u * t * .2 + t * t * olhal[0], 2 * u * t * -.62 + t * t * olhal[1], 2 * u * t * .06 + t * t * olhal[2]]);
    }
    etiqueta.usar(MAT.esmalte).tubo(cordao, .009, { seg: 6 });
    etiqueta.em(M.juntar(M.mover(...olhal), M.rz(-.32), M.mover(0, -.31, 0)), () => {
      etiqueta.usar(MAT.laca);
      etiqueta.extrusao([[-.25, -.42], [.25, -.42], [.25, .2], [.11, .42], [-.11, .42], [-.25, .2]], { prof: .04, chanfro: .012, passos: 2 });
      etiqueta.usar(MAT.ouro);
      etiqueta.em(M.juntar(M.mover(0, .31, 0), M.rx(PI / 2)), () => etiqueta.toro(.056, .027, { seg: 24, segr: 8 }));
      for (const s of [1, -1]) {
        etiqueta.em(M.mover(0, -.09, s * .027), () => {
          for (const c of cifrao(.36)) etiqueta.extrusao(c, { prof: .016, chanfro: .005, passos: 2 });
        });
      }
      etiqueta.usar(MAT.ouroFosco);
      etiqueta.em(M.mover(0, -.36, .021), () => etiqueta.caixa(.36, .012, .004, { chanfro: 0 }));
    });

    return {
      partes: [
        { geo: m },
        { geo: ponteiro, m: (t, e) => M.juntar(dePe, M.ry(-(t * TAU / 12 + suave(e) * TAU - rad(90)))) },
        { geo: etiqueta, m: (t) => M.juntar(M.mover(.13, 1.2, .03), M.rz(Math.sin(t * 1.4) * .05), M.rx(Math.cos(t * 1.1) * .04)) },
        { geo: vidro, vidro: true },
      ],
      escala: .92, base: -.9, giro: "balanco", amplitude: .42,
      pose: () => M.mover(-.13, 0, 0),
    };
  };


  /* ---------------------------------------------------------
     Pilhas de moedas — quatro colunas crescentes sobre uma
     bandeja. As moedas caem uma a uma ao entrar e a seta sobe
     por cima delas: pequenos gastos que somam.
     --------------------------------------------------------- */
  O.pilhas = () => {
    const acaso = (n) => { const x = Math.sin(n * 91.7 + 13.3) * 43758.5453; return x - Math.floor(x); };
    const simples = malhaMoeda(.2, .07, { simples: true, dentes: 40, seg: 40 });
    const rica = malhaMoeda(.2, .07, { dentes: 48, seg: 48 });
    const base = new Malha(), seta = new Malha();

    base.usar(MAT.piano);
    base.em(M.juntar(M.mover(0, -.04, 0), deitar), () => base.extrusao(forma.retangulo(1.96, .64, .2, 8), { prof: .07, chanfro: .02, passos: 3 }));
    base.usar(MAT.ouro);
    base.em(M.juntar(M.mover(0, -.008, 0), deitar), () => base.extrusao(forma.retangulo(1.87, .55, .17, 8), { prof: .012, chanfro: .003, passos: 1 }));
    base.usar(MAT.lacaFunda);
    base.em(M.juntar(M.mover(0, -.004, 0), deitar), () => base.extrusao(forma.retangulo(1.835, .515, .155, 8), { prof: .014, chanfro: .003, passos: 1 }));

    const partes = [{ geo: base }];
    const alturas = [3, 6, 10, 15];
    const total = alturas.reduce((a, b) => a + b, 0);
    let ordem = 0;
    alturas.forEach((qtd, c) => {
      const x = -.72 + c * .48;
      for (let i = 0; i < qtd; i++) {
        const dx = (acaso(c * 31 + i * 7) - .5) * .03, dz = (acaso(c * 17 + i * 3) - .5) * .03;
        const giro = acaso(c * 5 + i * 11) * TAU, y = .012 + .037 + i * .0745;
        const inicio = .06 + (ordem++ / total) * .62;
        partes.push({
          geo: i === qtd - 1 ? rica : simples,
          m: (t, e) => {
            const k = entre(e, inicio, inicio + .2);
            if (k <= 0) return M.escala(0);
            return M.juntar(M.mover(x + dx, y + (1 - k * k) * 1.5, dz), M.ry(giro + (1 - k) * 2));
          },
        });
      }
    });

    const caminho = forma.bezier([-.9, .6], [-.3, .62], [.3, .95], [.76, 1.6], 26, true);
    const fim = caminho[caminho.length - 1], antes = caminho[caminho.length - 3];
    const rumo = Math.atan2(fim[1] - antes[1], fim[0] - antes[0]);
    seta.usar(MAT.lacaClara);
    seta.extrusao(forma.traco(caminho.slice(0, -1), .1, { afina: (u) => .45 + .55 * u, pontas: "reta" }), { prof: .05, chanfro: .014, passos: 2 });
    seta.extrusao(forma.mover(forma.girar([[-.15, -.04], [.15, -.04], [0, .25]], rumo - PI / 2), fim[0], fim[1]), { prof: .05, chanfro: .014, passos: 2 });

    partes.push({
      geo: seta,
      m: (t, e) => {
        const k = mola(entre(e, .68, 1));
        return M.juntar(M.mover(-.9, .6 + Math.sin(t * 1.3) * .02, 0), M.escala(Math.max(k, .0001)), M.mover(.9, -.6, 0));
      },
    });

    return { partes, escala: 1, base: -.075, giro: "balanco", amplitude: .5 };
  };


  /* ---------------------------------------------------------
     Laço da ODS 12 — fita de ouro em forma de infinito, com o
     filete de laca e a ponta em seta, e o broto que nasce do
     cruzamento. Uma conta de luz percorre o ciclo.
     --------------------------------------------------------- */
  O.laco = () => {
    const m = new Malha(), conta = new Malha(), broto = new Malha();
    const a = .98;
    const curva = (t) => {
      const s = Math.sin(t), c = Math.cos(t), d = 1 + s * s;
      return [a * c / d, a * s * c / d, .13 * s];
    };

    const n = 180, t0 = .3, t1 = TAU - .34, pts = [];
    for (let i = 0; i <= n; i++) pts.push(curva(t0 + (t1 - t0) * i / n));
    m.usar(MAT.ouro).varrer(pts, forma.retangulo(.23, .1, .04, 4), { cima: [0, 0, 1], suave: 40 });
    m.usar(MAT.lacaFunda).varrer(pts.slice(2, n - 3), forma.retangulo(.05, .108, .01, 2), { cima: [0, 0, 1], suave: 40 });

    /* ponta: um triângulo chanfrado alinhado ao fim da fita */
    const fim = pts[n], ant = pts[n - 1];
    let T = [fim[0] - ant[0], fim[1] - ant[1], fim[2] - ant[2]];
    const lt = Math.hypot(T[0], T[1], T[2]);
    T = T.map((v) => v / lt);
    let N = [-T[0] * T[2], -T[1] * T[2], 1 - T[2] * T[2]];
    const ln = Math.hypot(N[0], N[1], N[2]);
    N = N.map((v) => v / ln);
    const B = [T[1] * N[2] - T[2] * N[1], T[2] * N[0] - T[0] * N[2], T[0] * N[1] - T[1] * N[0]];
    m.usar(MAT.ouro);
    m.em([B[0], B[1], B[2], 0, T[0], T[1], T[2], 0, N[0], N[1], N[2], 0, fim[0], fim[1], fim[2], 1], () =>
      m.extrusao([[-.27, -.03], [.27, -.03], [0, .4]], { prof: .1, chanfro: .03, passos: 3 }));

    broto.usar(MAT.verde);
    broto.tubo([[0, 0, 0], [.03, .26, .02], [0, .52, .0], [-.03, .72, -.03]], .024, { seg: 10, escala: (u) => 1 - u * .5 });
    const folha = [...forma.bezier([0, 0], [.24, .1], [.21, .4], [0, .52], 12), ...forma.bezier([0, .52], [-.21, .4], [-.24, .1], [0, 0], 12)];
    const pousar = (x, y, z, gira, vira, tam) => broto.em(M.juntar(M.mover(x, y, z), M.rz(gira), M.ry(vira), M.escala(tam)), () => {
      broto.usar(MAT.verde).extrusao(folha, { prof: .036, chanfro: .014, passos: 2 });
      broto.usar(MAT.verdeFundo);
      broto.em(M.mover(0, .25, 0), () => broto.caixa(.014, .4, .046, { chanfro: 0 }));
    });
    pousar(.02, .24, .02, -.95, .35, 1);
    pousar(0, .44, .0, .9, -.3, .82);
    pousar(-.03, .7, -.03, .08, .2, .6);

    conta.usar(MAT.luzMenta).esfera(.052, { seg: 18, aneis: 12 });

    return {
      partes: [
        { geo: m },
        { geo: broto, m: (t, e) => M.juntar(M.mover(0, .03, .16), M.rz(Math.sin(t * 1.2) * .04), M.escala(Math.max(mola(entre(e, .45, 1)), .0001))) },
        { geo: conta,
          m: (t) => { const p = curva(t * .7 + 1); return M.mover(p[0], p[1], p[2] + .1); },
          brilho: (t) => 1 + .3 * Math.sin(t * 5) },
      ],
      escala: .93, base: -.8, giro: "balanco", amplitude: .5,
      pose: () => M.rz(.3),
    };
  };


  /* ---------------------------------------------------------
     Prancheta — prancha em laca, prendedor cromado e a lista de
     entregas: os vistos aparecem um a um, e a última linha fica
     em aberto, pulsando. É o que ainda falta medir.
     --------------------------------------------------------- */
  O.prancheta = () => {
    const m = new Malha(), visto = new Malha(), aberto = new Malha();
    const L = 1.5, A = 2.1, zp = .061;

    m.usar(MAT.lacaFunda).extrusao(forma.retangulo(L, A, .1, 8), { prof: .07, chanfro: .02, passos: 3 });
    m.usar(MAT.esmalte);
    m.em(M.juntar(M.mover(.02, -.1, .042), M.rz(.022)), () => m.caixa(1.3, 1.76, .012, { r: .02, chanfro: .003, passos: 1 }));
    m.usar(MAT.papel);
    m.em(M.mover(0, -.09, .054), () => m.caixa(1.3, 1.76, .012, { r: .02, chanfro: .003, passos: 1 }));

    m.usar(MAT.cromo);
    m.em(M.mover(0, .93, .075), () => m.caixa(.66, .2, .05, { r: .05, chanfro: .012, passos: 2 }));
    m.tubo([[-.33, .86, .1], [.33, .86, .1]], .032, { seg: 12 });
    m.usar(MAT.ouro);
    m.em(M.mover(0, .995, .115), () => m.caixa(.4, .15, .04, { r: .07, chanfro: .012, passos: 2 }));
    m.usar(MAT.piano);
    m.em(M.juntar(M.mover(0, 1, .137), dePe), () => m.cilindro(.034, .004, { seg: 18, chanfro: .001 }));

    const linhas = [.56, .24, -.08, -.4, -.72], largura = [.62, .5, .66, .44, .56];
    linhas.forEach((y, i) => {
      m.usar(MAT.ouro);
      m.em(M.mover(-.46, y, zp + .006), () => m.caixa(.2, .2, .012, { r: .04, chanfro: .004, passos: 1 }));
      m.usar(MAT.esmalte);
      m.em(M.mover(-.46, y, zp + .014), () => m.caixa(.15, .15, .006, { r: .025, chanfro: 0 }));
      m.usar(MAT.grafite);
      m.em(M.mover(-.28 + largura[i] / 2, y + .038, zp + .003), () => m.caixa(largura[i], .046, .006, { r: .02, chanfro: 0 }));
      m.usar(MAT.aco);
      m.em(M.mover(-.28 + largura[i] * .3, y - .045, zp + .003), () => m.caixa(largura[i] * .6, .03, .006, { r: .014, chanfro: 0 }));
    });

    /* caneta atravessada no canto */
    m.em(M.juntar(M.mover(.5, -.66, .15), M.rz(.62)), () => {
      m.usar(MAT.ouro).cilindro(.04, .8, { seg: 22, chanfro: .008 });
      m.usar(MAT.piano).torno([[0, -.57], [.012, -.555], [.04, -.4], [0, -.4]], { seg: 22 });
      m.usar(MAT.cromo);
      m.em(M.mover(0, .43, 0), () => m.cilindro(.043, .07, { seg: 22, chanfro: .012 }));
      m.em(M.mover(0, .16, 0), () => m.toro(.041, .008, { seg: 22, segr: 6 }));
      m.usar(MAT.ouroEscuro);
      m.em(M.mover(0, .27, .046), () => m.caixa(.018, .3, .012, { r: .008, chanfro: .003, passos: 1 }));
    });

    visto.usar(MAT.verde);
    visto.extrusao(forma.traco([[-.085, .01], [-.022, -.06]], .046), { prof: .03, chanfro: .01, passos: 2 });
    visto.extrusao(forma.traco([[-.022, -.06], [.1, .092]], .046), { prof: .03, chanfro: .01, passos: 2 });
    aberto.usar(MAT.luzOuro);
    aberto.em(dePe, () => aberto.toro(.15, .009, { seg: 40, segr: 6 }));

    const partes = [{ geo: m }];
    for (let i = 0; i < 4; i++) {
      partes.push({
        geo: visto,
        m: (t, e) => M.juntar(M.mover(-.455, linhas[i], zp + .034), M.escala(Math.max(mola(entre(e, .32 + i * .13, .56 + i * .13)), .0001))),
      });
    }
    partes.push({
      geo: aberto,
      m: () => M.mover(-.46, linhas[4], zp + .022),
      brilho: (t, e) => entre(e, .9, 1) * (.35 + .95 * Math.abs(Math.sin(t * 1.5))),
    });

    return {
      partes, escala: 1.16, base: -1.07, giro: "balanco", amplitude: .5,
      pose: () => M.rx(-.07),
    };
  };
})();
