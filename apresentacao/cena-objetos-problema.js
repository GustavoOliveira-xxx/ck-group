/* ============================================================
   FinCK · apresentação final · objetos da problemática
   Conscious Knowledge · Projeto Interdisciplinar 2026

   Alvo com dardo (do tema ao objetivo), balança (endividamento),
   cartões (crédito e juros), capelo sobre livros (educação
   financeira), placa de circuito com as setas da reciclagem
   (resíduos eletrônicos) e o pino sobre o quarteirão (Taboão).
   ============================================================ */
(() => {
  "use strict";

  const C = window.FinckCena;
  const { M, Malha, MAT, forma, PI, TAU, rad } = C;
  const { suave, entre, mola, deitar, dePe, cifrao, porcento, moeda } = C.pecas;
  const O = C.objetos;

  /* sorteio estável: a mesma peça sai igual em qualquer máquina */
  const acaso = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  /* placa deitada: contorno em planta, espessura para cima */
  const laje = (g, l, p, e, r = 0) =>
    g.em(deitar, () => g.extrusao(forma.retangulo(l, p, r, 6), { prof: e, chanfro: Math.min(e * .3, .02), passos: 2 }));


  /* ---------------------------------------------------------
     Alvo — faixas de laca e esmalte separadas por frisos de
     ouro, sobre um tripé. O dardo chega e crava no centro.
     --------------------------------------------------------- */
  O.alvo = () => {
    const m = new Malha(), dardo = new Malha();
    const centro = [0, .3, 0];

    m.em(M.juntar(M.mover(...centro), M.rx(-.12), dePe), () => {
      m.usar(MAT.piano);
      m.em(M.mover(0, -.08, 0), () => m.cilindro(1, .14, { chanfro: .03, seg: 96 }));
      m.usar(MAT.ouro);
      m.em(M.mover(0, -.012, 0), () => m.toro(.985, .03, { seg: 96, segr: 10 }));
      const faixas = [[.95, .74, MAT.laca], [.74, .54, MAT.esmalte], [.54, .34, MAT.laca], [.34, .15, MAT.esmalte]];
      faixas.forEach(([fora, dentro, mt], i) => {
        const y = .004 + i * .014;
        m.usar(mt);
        m.torno([[fora, y - .012], [fora - .012, y], [dentro + .012, y], [dentro, y - .012]], { seg: 96 });
        m.usar(MAT.ouro);
        m.em(M.mover(0, y - .004, 0), () => m.toro(dentro, .009, { seg: 80, segr: 6 }));
      });
      m.usar(MAT.ouro);
      m.em(M.juntar(M.mover(0, .04, 0), M.escala(1, .34, 1)), () => m.esfera(.15, { latDe: 0, aneis: 8, seg: 40 }));
      m.usar(MAT.piano);
      m.emVolta(20, () => m.em(M.mover(.845, .007, 0), () => m.caixa(.06, .006, .012, { chanfro: 0 })));
    });

    /* tripé */
    m.usar(MAT.ouro);
    const no = [0, .34, -.16];
    m.em(M.mover(...no), () => m.esfera(.07, { seg: 18 }));
    for (const pe of [[-.62, -1.48, -.34], [.62, -1.48, -.34], [0, -1.48, -.98]]) {
      m.usar(MAT.ouro).tubo([no, pe], .03, { seg: 12 });
      const u = .17;
      m.em(M.mover(pe[0] + (no[0] - pe[0]) * u, pe[1] + (no[1] - pe[1]) * u, pe[2] + (no[2] - pe[2]) * u), () =>
        m.toro(.034, .012, { seg: 16, segr: 6 }));
      m.usar(MAT.piano);
      m.em(M.mover(...pe), () => m.esfera(.05, { seg: 14 }));
    }
    m.usar(MAT.ouroEscuro).tubo([[-.4, -.8, -.27], [.4, -.8, -.27]], .016, { seg: 8 });

    /* dardo, modelado da ponta (origem) para a cauda, ao longo de +Y */
    dardo.usar(MAT.cromo).torno([[0, 0], [.014, .2], [.014, .23], [0, .23]], { seg: 14 });
    const corpo = [[0, .22], [.03, .22], [.05, .27]];
    for (let k = 0; k < 7; k++) {
      const y = .29 + k * .046;
      corpo.push([.05, y], [.042, y + .008], [.042, y + .022], [.05, y + .03]);
    }
    corpo.push([.05, .63], [.03, .67], [0, .67]);
    dardo.usar(MAT.ouro).torno(corpo, { seg: 28, suave: 30 });
    dardo.usar(MAT.piano).torno([[0, .66], [.02, .66], [.02, 1], [0, 1]], { seg: 14 });
    dardo.usar(MAT.lacaClara);
    dardo.emVolta(4, () => dardo.extrusao([[.016, .84], [.2, .97], [.2, 1.2], [.016, 1.27]], { prof: .012, chanfro: .004, passos: 1 }));
    dardo.usar(MAT.ouro);
    dardo.em(M.mover(0, 1.28, 0), () => dardo.esfera(.028, { seg: 12 }));

    const d = [.5, .42, .757], inclina = Math.acos(d[1]), vira = Math.atan2(d[0], d[2]);
    const voo = (t, e) => {
      const k = suave(entre(e, .45, .78));
      if (k <= 0) return M.escala(0);
      const falta = (1 - k) * (1 - k) * 4.5;
      const treme = e > .78 ? Math.exp(-(e - .78) * 26) * Math.sin((e - .78) * 150) * .05 : 0;
      return M.juntar(M.mover(centro[0] + d[0] * falta, centro[1] + .01 + d[1] * falta, .05 + d[2] * falta),
        M.ry(vira), M.rx(inclina + treme));
    };

    return {
      partes: [{ geo: m }, { geo: dardo, m: voo }],
      escala: .94, base: -1.53, giro: "balanco", amplitude: .5,
    };
  };


  /* ---------------------------------------------------------
     Balança — coluna torneada, travessão e dois pratos.
     De um lado, moedas; do outro, o peso do "%": a trave pende
     para o lado da dívida.
     --------------------------------------------------------- */
  O.balanca = () => {
    const m = new Malha(), trave = new Malha(), esq = new Malha(), dir = new Malha();

    m.usar(MAT.piano);
    m.torno([[0, -1.5], [.6, -1.5], [.66, -1.45], [.66, -1.4], [.6, -1.35], [.42, -1.32], [.3, -1.27], [0, -1.27]], { seg: 72 });
    m.usar(MAT.ouro);
    m.em(M.mover(0, -1.425, 0), () => m.toro(.666, .02, { seg: 72, segr: 8 }));
    m.em(M.mover(0, -1.335, 0), () => m.toro(.5, .012, { seg: 64, segr: 6 }));
    const col = [[0, -1.29]];
    for (const [y, r] of [[-1.29, .15], [-1.24, .17], [-1.2, .1], [-1.1, .066], [-.95, .05], [-.6, .07], [-.2, .086],
      [.1, .06], [.42, .046], [.5, .09], [.54, .09], [.58, .046], [.74, .046], [.78, .1], [.84, .1], [.87, .05]]) col.push([r, y]);
    col.push([0, .87]);
    m.torno(col, { seg: 32, suave: 50 });
    m.em(M.mover(0, .95, 0), () => m.esfera(.07, { seg: 20 }));
    m.torno([[0, 1], [.032, 1], [0, 1.17]], { seg: 14 });

    trave.usar(MAT.ouro);
    trave.caixa(1.56, .07, .05, { r: .03, chanfro: .012 });
    const arco = [];
    for (let i = 0; i <= 20; i++) { const u = i / 20 * 2 - 1; arco.push([u * .74, .15 * (1 - u * u), 0]); }
    trave.tubo(arco, .013, { seg: 8 });
    trave.em(dePe, () => trave.cilindro(.11, .1, { chanfro: .02, seg: 36 }));
    trave.usar(MAT.piano);
    trave.em(M.juntar(M.mover(0, 0, .052), dePe), () => trave.cilindro(.046, .012, { seg: 20, chanfro: .004 }));
    for (const s of [-1, 1]) {
      trave.usar(MAT.ouro);
      trave.em(M.mover(s * .78, 0, 0), () => trave.esfera(.05, { seg: 16 }));
      trave.em(M.juntar(M.mover(s * .74, -.07, 0), M.rx(PI / 2)), () => trave.toro(.035, .01, { seg: 20, segr: 6 }));
    }

    const prato = (g) => {
      g.usar(MAT.ouro);
      g.em(M.mover(0, -.11, 0), () => g.esfera(.028, { seg: 12 }));
      for (let k = 0; k < 3; k++) {
        const a = rad(90) + k * TAU / 3, fim = [Math.cos(a) * .37, -.97, Math.sin(a) * .37];
        g.tubo([[0, -.11, 0], fim], .007, { seg: 6 });
        for (const u of [.3, .55, .8]) g.em(M.mover(fim[0] * u, -.11 + (fim[1] + .11) * u, fim[2] * u), () => g.esfera(.015, { seg: 8, aneis: 6 }));
      }
      g.torno([[0, -1.1], [.2, -1.09], [.34, -1.02], [.4, -.97], [.412, -.955], [.396, -.955], [.33, -1], [.2, -1.06], [0, -1.07]], { seg: 56, suave: 50 });
      g.em(M.mover(0, -.96, 0), () => g.toro(.404, .012, { seg: 56, segr: 6 }));
    };
    prato(esq);
    prato(dir);

    for (let i = 0; i < 5; i++) {
      esq.em(M.juntar(M.mover(-.03 + acaso(i) * .02, -1.036 + i * .056, .02 + acaso(i + 9) * .02), M.ry(acaso(i + 3) * TAU)), () =>
        moeda(esq, .19, .055, { simples: i < 4, dentes: 40, seg: 40 }));
    }
    for (let i = 0; i < 2; i++) {
      esq.em(M.juntar(M.mover(.2, -1.03 + i * .051, -.1), M.ry(acaso(i + 20) * TAU)), () =>
        moeda(esq, .12, .05, { simples: i < 1, dentes: 32, seg: 32 }));
    }

    dir.em(M.juntar(M.mover(0, -.865, 0), M.ry(.5)), () => {
      dir.usar(MAT.laca).caixa(.4, .4, .4, { r: .05, chanfro: .035, passos: 3 });
      dir.usar(MAT.ouro);
      dir.em(M.mover(0, 0, .205), () => porcento(dir, .3, .022));
      dir.em(M.juntar(M.ry(PI / 2), M.mover(0, 0, .205)), () => porcento(dir, .3, .022));
      dir.em(M.juntar(M.rx(-PI / 2), M.mover(0, 0, .205)), () => porcento(dir, .3, .022));
    });

    const angulo = (t, e) => -(rad(9) * mola(entre(e, .3, 1)) + rad(1.6) * Math.sin(t * 1.1));
    const ponta = (s, t, e) => {
      const a = angulo(t, e), c = Math.cos(a), sn = Math.sin(a), x = s * .74, y = -.07;
      return M.juntar(M.mover(x * c - y * sn, .82 + x * sn + y * c, 0), M.rz(Math.sin(t * 1.3 + s) * .02));
    };

    return {
      partes: [
        { geo: m },
        { geo: trave, m: (t, e) => M.juntar(M.mover(0, .82, 0), M.rz(angulo(t, e))) },
        { geo: esq, m: (t, e) => ponta(-1, t, e) },
        { geo: dir, m: (t, e) => ponta(1, t, e) },
      ],
      escala: .88, base: -1.5, giro: "balanco", amplitude: .38,
    };
  };


  /* ---------------------------------------------------------
     Cartões — o da frente em laca roxa, com chip, aproximação,
     numeração em relevo e a moeda do FinCK; o de trás em preto
     piano com a faixa dourada. Abrem em leque ao entrar.
     --------------------------------------------------------- */
  O.cartao = () => {
    const a = new Malha(), b = new Malha();
    const L = 1.9, A = 1.2, E = .04, z = E / 2;

    const chip = (g, x, y) => g.em(M.mover(x, y, z + .008), () => {
      g.sombra(1).usar(MAT.ouro).caixa(.32, .25, .016, { r: .05, chanfro: .005, passos: 2 });
      g.usar(MAT.ouroEscuro).sombra(.6);
      g.em(M.mover(0, 0, .009), () => {
        for (const yy of [-.045, .045]) g.em(M.mover(0, yy, 0), () => g.caixa(.32, .008, .003, { chanfro: 0 }));
        for (const xx of [-.075, .075]) g.em(M.mover(xx, 0, 0), () => g.caixa(.008, .25, .003, { chanfro: 0 }));
        g.caixa(.1, .1, .004, { r: .02, chanfro: 0 });
      });
      g.sombra(1);
    });

    const digitos = (g, mt, y) => {
      g.usar(mt);
      for (let grupo = 0; grupo < 4; grupo++) {
        for (let dgt = 0; dgt < 4; dgt++) {
          g.em(M.mover(-.72 + grupo * .39 + dgt * .078, y, z + .006), () =>
            g.caixa(.05, .086, .012, { r: .018, chanfro: .004, passos: 1 }));
        }
      }
    };

    a.usar(MAT.laca).caixa(L, A, E, { r: .1, n: 8, chanfro: .012, passos: 3 });
    a.usar(MAT.lacaClara);
    for (let i = 0; i < 8; i++) {
      const r = .5 + i * .16, pts = [];
      for (let k = 0; k <= 48; k++) {
        const g = rad(90 + 90 * k / 48), x = .95 + Math.cos(g) * r, y = -.6 + Math.sin(g) * r;
        if (Math.abs(x) < L / 2 - .06 && Math.abs(y) < A / 2 - .06) pts.push([x, y]);
      }
      if (pts.length > 2) a.em(M.mover(0, 0, z + .001), () =>
        a.extrusao(forma.traco(pts, .011, { pontas: "reta" }), { prof: .004, chanfro: 0 }));
    }
    chip(a, -.54, .1);
    a.usar(MAT.esmalte);
    for (const r of [.05, .09, .13]) {
      a.em(M.mover(-.26, .1, z + .003), () =>
        a.extrusao(forma.traco(forma.arco(0, 0, r, rad(-42), rad(42), 10), .018), { prof: .006, chanfro: 0 }));
    }
    digitos(a, MAT.ouroFosco, -.17);
    a.usar(MAT.esmalte);
    a.em(M.mover(-.49, -.4, z + .004), () => a.caixa(.46, .044, .008, { r: .02, chanfro: 0 }));
    a.em(M.mover(-.02, -.4, z + .004), () => a.caixa(.18, .044, .008, { r: .02, chanfro: 0 }));
    a.usar(MAT.cromo);
    a.em(M.mover(.68, .37, z + .004), () => a.caixa(.22, .15, .008, { r: .035, chanfro: .003, passos: 1 }));
    a.em(M.juntar(M.mover(.68, -.34, z + .016), dePe), () => moeda(a, .16, .03, { dentes: 44, seg: 44 }));

    b.usar(MAT.piano).caixa(L, A, E, { r: .1, n: 8, chanfro: .012, passos: 3 });
    b.usar(MAT.ouro);
    b.em(M.mover(0, .3, z + .002), () => b.caixa(L - .012, .2, .004, { chanfro: 0 }));
    chip(b, -.54, -.02);
    digitos(b, MAT.cromo, -.3);

    const abre = (e) => suave(entre(e, .25, 1));
    return {
      partes: [
        { geo: b, m: (t, e) => M.juntar(M.mover(-.14 * abre(e), .2 * abre(e) + Math.sin(t * .8 + 1) * .015, -.1), M.rz(.2 * abre(e)), M.ry(.1)) },
        { geo: a, m: (t, e) => M.juntar(M.mover(.08 * abre(e), -.14 * abre(e) + Math.sin(t * .8) * .02, .1), M.rz(-.3 * abre(e))) },
      ],
      escala: .82, base: -1.08, giro: "balanco", amplitude: .5,
      pose: () => M.rx(-.08),
    };
  };


  /* ---------------------------------------------------------
     Capelo sobre três livros — capas em laca e preto piano,
     lombadas arredondadas com nervuras de ouro, miolo de papel.
     A borla balança.
     --------------------------------------------------------- */
  O.capelo = () => {
    const m = new Malha(), borla = new Malha();

    const livro = (l, p, e, capa, y, giro, dx) => m.em(M.juntar(M.mover(dx, y, 0), M.ry(giro)), () => {
      m.usar(MAT.papel).sombra(.9);
      m.em(M.mover(.03, 0, 0), () => m.caixa(l - .1, e - .07, p - .1, { chanfro: .006, passos: 1 }));
      m.sombra(1).usar(capa);
      for (const s of [1, -1]) m.em(M.mover(0, s * (e / 2 - .02), 0), () => laje(m, l, p, .04, .03));
      const lombada = (gx, gy) => forma.arco(0, 0, 1, PI / 2, PI * 1.5, 12).map(([x, y2]) => [x * gx - l / 2 + .01, y2 * gy]);
      m.extrusao(lombada(.075, e / 2), { prof: p, chanfro: .012, passos: 2, suave: 60 });
      m.usar(MAT.ouro);
      for (const zz of [-p * .3, p * .3, p * .12]) {
        m.em(M.mover(0, 0, zz), () => m.extrusao(lombada(.083, e / 2 + .006), { prof: zz === p * .12 ? .012 : .034, chanfro: .005, passos: 1, suave: 60 }));
      }
      m.usar(MAT.rubi);
      m.em(M.mover(l / 2 - .01, e / 2 - .05, p * .22), () => m.caixa(.1, .006, .06, { chanfro: 0 }));
    });

    livro(1.5, 1.08, .3, MAT.laca, -1.35, 0, 0);
    livro(1.36, 1, .26, MAT.piano, -1.07, .24, .03);
    livro(1.22, .92, .24, MAT.lacaClara, -.82, -.14, -.02);

    const capelo = M.juntar(M.mover(0, -.7, 0), M.rz(.05), M.ry(.55));
    m.em(capelo, () => {
      m.usar(MAT.feltro);
      m.torno([[0, 0], [.36, 0], [.386, .05], [.35, .27], [0, .27]], { seg: 48 });
      m.usar(MAT.piano);
      m.em(M.mover(0, .29, 0), () => laje(m, 1.12, 1.12, .05, .02));
      m.usar(MAT.ouro);
      m.em(M.juntar(M.mover(0, .314, 0), M.escala(1, .5, 1)), () => m.esfera(.05, { latDe: 0, aneis: 6, seg: 18 }));
      m.tubo([[0, .328, 0], [.25, .327, .07], [.48, .326, .13], [.572, .318, .15], [.585, .28, .153]], .013, { seg: 8 });
    });

    borla.usar(MAT.ouro);
    borla.tubo([[0, 0, 0], [0, -.3, 0]], .013, { seg: 8 });
    borla.em(M.mover(0, -.32, 0), () => borla.esfera(.036, { seg: 14 }));
    borla.em(M.mover(0, -.355, 0), () => borla.toro(.034, .009, { seg: 18, segr: 6 }));
    borla.usar(MAT.ouroFosco);
    borla.torno([[0, -.6], [.06, -.6], [.03, -.35], [0, -.35]], { seg: 20 });
    borla.usar(MAT.ouro);
    borla.emVolta(14, () => borla.tubo([[.03, -.36, 0], [.058, -.6, 0]], .006, { seg: 5 }));

    return {
      partes: [
        { geo: m },
        { geo: borla, m: (t) => M.juntar(capelo, M.mover(.585, .285, .153), M.rz(Math.sin(t * 1.5) * .09), M.rx(Math.cos(t * 1.1) * .05)) },
      ],
      escala: 1.14, base: -1.5, giro: "continuo", velocidade: .28,
    };
  };


  /* ---------------------------------------------------------
     Placa de circuito — laca roxa, trilhas e ilhas em ouro, o
     chip central com os terminais, capacitor, cristal e um LED
     que pulsa. Atrás dela, as três setas da reciclagem giram.
     --------------------------------------------------------- */
  O.placa = () => {
    const m = new Malha(), led = new Malha(), setas = new Malha();
    const L = 1.3, z = .035;
    const disco = (g, x, y, r, h, zz = z) =>
      g.em(M.juntar(M.mover(x, y, zz + h / 2), dePe), () => g.cilindro(r, h, { chanfro: Math.min(r, h) * .2, seg: 22 }));

    m.usar(MAT.lacaFunda).caixa(L, L, .07, { r: .1, n: 6, chanfro: .012, passos: 2 });

    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      const x = sx * (L / 2 - .1), y = sy * (L / 2 - .1);
      m.usar(MAT.ouro);
      m.em(M.juntar(M.mover(x, y, z + .004), dePe), () => m.toro(.046, .013, { seg: 24, segr: 6 }));
      m.usar(MAT.piano);
      disco(m, x, y, .034, .004);
    }

    m.usar(MAT.ouro);
    for (let lado = 0; lado < 4; lado++) {
      for (let i = 0; i < 6; i++) {
        const y0 = -.15 + i * .06, sp = i - 2.5, y1 = y0 + sp * .07;
        const x1 = .36, x2 = x1 + Math.abs(y1 - y0), fim = Math.max(x2 + .03, .5 + (i % 2) * .05);
        const pts = forma.girar([[.27, y0], [x1, y0], [x2, y1], [fim, y1]], lado * PI / 2);
        m.em(M.mover(0, 0, z + .004), () => m.extrusao(forma.traco(pts, .02), { prof: .008, chanfro: .002, passos: 1 }));
        disco(m, pts[3][0], pts[3][1], .028, .01);
      }
    }

    m.usar(MAT.piano);
    m.em(M.mover(0, 0, z + .045), () => m.caixa(.46, .46, .08, { r: .02, chanfro: .012, passos: 2 }));
    m.usar(MAT.cromo);
    for (let lado = 0; lado < 4; lado++) {
      for (let i = 0; i < 6; i++) {
        m.em(M.juntar(M.rz(lado * PI / 2), M.mover(.256, -.15 + i * .06, z + .012)), () => m.caixa(.06, .026, .02, { chanfro: .004, passos: 1 }));
      }
    }
    m.usar(MAT.aco);
    disco(m, -.17, .17, .02, .004, z + .085);
    m.em(M.mover(.02, -.09, z + .087), () => m.caixa(.24, .02, .003, { chanfro: 0 }));
    m.em(M.mover(-.02, -.14, z + .087), () => m.caixa(.16, .02, .003, { chanfro: 0 }));
    m.usar(MAT.ouro);
    m.em(M.mover(.03, .055, z + .088), () => {
      for (const c of cifrao(.15)) m.extrusao(c, { prof: .008, chanfro: .002, passos: 1 });
    });

    /* capacitor, cristal, resistores e o LED nos quatro cantos */
    m.usar(MAT.lacaClara);
    disco(m, -.44, .44, .1, .2);
    m.usar(MAT.cromo);
    disco(m, -.44, .44, .086, .008, z + .2);
    m.usar(MAT.piano);
    for (const g of [0, PI / 2]) m.em(M.juntar(M.mover(-.44, .44, z + .21), M.rz(g)), () => m.caixa(.13, .01, .004, { chanfro: 0 }));
    m.usar(MAT.cromo);
    m.em(M.mover(-.44, -.46, z + .035), () => m.caixa(.22, .1, .07, { r: .048, chanfro: .012, passos: 2 }));
    for (const [x, y, g] of [[.42, -.4, 0], [.42, -.5, 0], [.54, -.3, PI / 2], [-.27, -.5, PI / 2], [.3, .5, 0]]) {
      m.em(M.juntar(M.mover(x, y, z + .015), M.rz(g)), () => {
        m.usar(MAT.grafite).caixa(.09, .046, .03, { chanfro: .005, passos: 1 });
        m.usar(MAT.cromo);
        for (const s of [-1, 1]) m.em(M.mover(s * .04, 0, 0), () => m.caixa(.022, .05, .034, { chanfro: .003, passos: 1 }));
      });
    }
    m.usar(MAT.cromo);
    m.em(M.juntar(M.mover(.45, .45, z + .004), dePe), () => m.toro(.062, .012, { seg: 22, segr: 6 }));
    led.usar(MAT.luzMenta);
    led.em(M.juntar(M.mover(.45, .45, z), dePe), () => led.esfera(.056, { latDe: 0, aneis: 8, seg: 20 }));

    const seta = (a0) => {
      const R = .98, w = .075, c = [], a1 = a0 + rad(84), bico = a1 + rad(21);
      for (let i = 0; i <= 16; i++) { const a = a0 + (a1 - a0) * i / 16; c.push([Math.cos(a) * (R + w), Math.sin(a) * (R + w)]); }
      c.push([Math.cos(a1) * (R + w * 2.2), Math.sin(a1) * (R + w * 2.2)]);
      c.push([Math.cos(bico) * R, Math.sin(bico) * R]);
      c.push([Math.cos(a1) * (R - w * 2.2), Math.sin(a1) * (R - w * 2.2)]);
      for (let i = 16; i >= 0; i--) { const a = a0 + (a1 - a0) * i / 16; c.push([Math.cos(a) * (R - w), Math.sin(a) * (R - w)]); }
      return c;
    };
    setas.usar(MAT.verde);
    for (let k = 0; k < 3; k++) setas.extrusao(seta(k * TAU / 3 + .2), { prof: .07, chanfro: .02, passos: 3 });

    return {
      partes: [
        { geo: setas, m: (t, e) => M.juntar(M.mover(0, 0, -.08), M.rz(t * .32 + (1 - suave(e)) * 2.4), M.escala(mola(entre(e, .2, .9)))) },
        { geo: m },
        { geo: led, brilho: (t) => .25 + 1.1 * Math.pow(Math.sin(t * 2.2) * .5 + .5, 2) },
      ],
      escala: .86, base: -1.17, giro: "balanco", amplitude: .55,
      pose: () => M.rx(-.3),
    };
  };


  /* ---------------------------------------------------------
     Pino sobre o quarteirão — uma lâmina de cidade com ruas em
     ouro, prédios de janelas acesas, uma praça e o pino que
     desce e marca o lugar, soltando um anel de luz.
     --------------------------------------------------------- */
  O.pino = () => {
    const m = new Malha(), luz = new Malha(), pino = new Malha(), pulso = new Malha();

    m.usar(MAT.piano);
    m.em(M.mover(0, -1.28, 0), () => laje(m, 1.9, 1.9, .16, .16));
    m.usar(MAT.ouro);
    m.em(M.mover(0, -1.208, 0), () => laje(m, 1.916, 1.916, .018, .168));
    m.usar(MAT.lacaFunda);
    m.em(M.mover(0, -1.196, 0), () => laje(m, 1.78, 1.78, .012, .11));
    const chao = -1.19;

    m.usar(MAT.ouroFosco);
    for (const v of [-.3, .3]) {
      m.em(M.mover(v, chao + .003, 0), () => laje(m, .05, 1.72, .006));
      m.em(M.mover(0, chao + .003, v), () => laje(m, 1.72, .05, .006));
    }
    m.usar(MAT.ouro);
    m.torno([[.21, chao + .0075], [.18, chao + .0075]], { seg: 56 });
    m.torno([[.07, chao + .0075], [0, chao + .0075]], { seg: 28 });

    let semente = 1;
    const predio = (cx, cz, w, d, h, mt) => {
      m.usar(mt);
      m.em(M.mover(cx, chao + h / 2, cz), () => laje(m, w, d, h, .018));
      m.usar(MAT.grafite);
      m.em(M.mover(cx, chao + h + .008, cz), () => laje(m, w * .78, d * .78, .016, .01));
      const andares = Math.floor((h - .07) / .1);
      for (let face = 0; face < 4; face++) {
        const larg = face % 2 ? d : w, fundo = face % 2 ? w : d, colunas = Math.max(1, Math.floor((larg - .05) / .085));
        luz.em(M.juntar(M.mover(cx, chao, cz), M.ry(face * PI / 2)), () => {
          for (let i = 0; i < andares; i++) {
            for (let j = 0; j < colunas; j++) {
              if (acaso(semente++) < .3) continue;
              luz.usar(acaso(semente++) < .2 ? MAT.luzBranca : MAT.luzOuro);
              luz.em(M.mover((j - (colunas - 1) / 2) * .085, .09 + i * .1, fundo / 2 + .002), () =>
                luz.caixa(.046, .052, .006, { chanfro: 0 }));
            }
          }
        });
      }
    };
    predio(-.66, -.6, .26, .3, .62, MAT.laca);
    predio(-.43, -.63, .15, .22, .36, MAT.grafite);
    predio(0, -.6, .36, .26, .9, MAT.piano);
    predio(.58, -.58, .34, .34, .5, MAT.lacaClara);
    predio(-.6, 0, .3, .36, .4, MAT.grafite);
    predio(.6, .02, .28, .4, .72, MAT.laca);
    predio(0, .6, .4, .24, .26, MAT.lacaClara);
    predio(.58, .6, .3, .3, .36, MAT.piano);

    m.usar(MAT.ouro);
    m.tubo([[.06, chao + .9, -.62], [.06, chao + 1.16, -.62]], .008, { seg: 6 });
    m.em(M.mover(.06, chao + 1.17, -.62), () => m.esfera(.018, { seg: 10 }));
    m.usar(MAT.aco);
    m.em(M.mover(-.08, chao + .93, -.58), () => laje(m, .1, .08, .05, .01));

    m.usar(MAT.verdeFundo);
    m.em(M.mover(-.59, chao + .008, .59), () => laje(m, .46, .46, .016, .07));
    for (const [x, zz, s] of [[-.7, .5, 1], [-.5, .68, .8], [-.48, .47, .65]]) {
      m.usar(MAT.ouroEscuro);
      m.em(M.mover(x, chao + .06 * s, zz), () => m.cilindro(.014, .12 * s, { seg: 8, chanfro: 0 }));
      m.usar(MAT.verde);
      m.em(M.mover(x, chao + .17 * s, zz), () => m.esfera(.085 * s, { seg: 16, aneis: 10 }));
    }

    /* pino: gota de laca, colar e dois botões de ouro */
    const gota = [[0, 0], [.03, .1], [.1, .32], [.2, .56], [.29, .78], [.345, .95]];
    for (let i = 0; i <= 16; i++) { const g = rad(-8 + 98 * i / 16); gota.push([Math.cos(g) * .36, 1.02 + Math.sin(g) * .36]); }
    pino.usar(MAT.laca).torno(gota, { seg: 56, suave: 60 });
    pino.usar(MAT.ouro);
    pino.em(M.mover(0, .2, 0), () => pino.toro(.075, .016, { seg: 28, segr: 8 }));
    for (const s of [1, -1]) pino.em(M.mover(0, 1.02, s * .27), () => pino.esfera(.15, { seg: 26, aneis: 16 }));

    pulso.usar(MAT.luzOuro).torno([[.2, 0], [.165, 0]], { seg: 48 });

    return {
      partes: [
        { geo: m },
        { geo: luz, brilho: (t, e) => entre(e, .3, .9) },
        { geo: pulso,
          m: (t) => M.juntar(M.mover(0, chao + .012, 0), M.escala(.7 + 1.5 * ((t * .5) % 1), 1, .7 + 1.5 * ((t * .5) % 1))),
          brilho: (t, e) => (1 - ((t * .5) % 1)) * 1.5 * entre(e, .8, 1) },
        { geo: pino, m: (t, e) => M.juntar(
          M.mover(0, chao + .1 + Math.sin(t * 1.6) * .035 + (1 - mola(entre(e, .3, .85))) * 1.8, 0), M.ry(t * .9), M.escala(1.22)) },
      ],
      escala: .78, base: -1.36, giro: "balanco", amplitude: .42, rumo: .7,
    };
  };
})();
