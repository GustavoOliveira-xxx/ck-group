/* ============================================================
   FinCK · apresentação final · peças comuns da vitrine
   Conscious Knowledge · Projeto Interdisciplinar 2026

   O que mais de um objeto usa: a moeda do FinCK (cifrão de um
   lado, relógio do outro — preço e tempo na mesma peça), o
   pedestal da vitrine e o giroscópio que envolve a marca.

   Cada objeto devolve { partes, escala, base, giro, pose }:
   partes  malhas, cada uma com a sua matriz local opcional
   escala  fator que leva a peça ao tamanho da vitrine
   base    altura do ponto mais baixo, para pousar no pedestal
   giro    "continuo" (gira inteiro) ou "balanco" (vai e volta)
   pose    matriz da peça inteira em função do tempo e da entrada
   ============================================================ */
(() => {
  "use strict";

  const C = window.FinckCena;
  const { M, Malha, MAT, forma, PI, TAU, rad } = C;

  const suave = (t) => t * t * (3 - 2 * t);
  const entre = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
  const mola = (t) => 1 + 2.6 * Math.pow(t - 1, 3) + 1.6 * Math.pow(t - 1, 2);

  /* extrusão desenhada em XY passa a "crescer" para cima */
  const deitar = M.rx(-PI / 2);
  /* peça torneada no eixo Y passa a olhar para a plateia */
  const dePe = M.rx(PI / 2);

  /* ---------- cifrão: um S de dois arcos e a haste ---------- */
  const cifrao = (s) => {
    const a = .27 * s, p = [];
    for (let i = 0; i <= 16; i++) {
      const g = rad(28 + (270 - 28) * i / 16);
      p.push([Math.cos(g) * a, a + Math.sin(g) * a]);
    }
    for (let i = 1; i <= 16; i++) {
      const g = rad(90 - 242 * i / 16);
      p.push([Math.cos(g) * a, -a + Math.sin(g) * a]);
    }
    return [forma.traco(p, .17 * s), forma.retangulo(.09 * s, 1.42 * s, .04 * s, 3)];
  };

  /* ---------- por cento: dois aros e a barra ---------- */
  const porcento = (m, s, prof) => {
    m.extrusao(forma.traco([[-.3 * s, -.42 * s], [.3 * s, .42 * s]], .11 * s), { prof, chanfro: prof * .3, passos: 2 });
    for (const [x, y] of [[-.26 * s, .26 * s], [.26 * s, -.26 * s]]) {
      m.em(M.juntar(M.mover(x, y, 0), dePe), () =>
        m.torno([[.085 * s, -prof / 2], [.19 * s, -prof / 2], [.19 * s, prof / 2], [.085 * s, prof / 2], [.085 * s, -prof / 2]],
          { seg: 28, fechado: true, suave: 20 }));
    }
  };

  /* ---------- moeda ----------
     Deitada, eixo em Y. Serrilha na borda, aro em relevo, campo
     fosco, perolado e o relevo central. A versão simples é a que
     fica no meio das pilhas, onde só a borda aparece. */
  const moeda = (m, R, h, o = {}) => {
    const b = h * .24, y = h / 2, metal = o.mat || MAT.ouro, seg = o.seg || 56;
    m.sombra(1).usar(metal);
    m.torno([[0, -y], [R - b, -y], [R, -y + b], [R, y - b], [R - b, y], [0, y]], { seg });
    m.emVolta(o.dentes || 64, () =>
      m.em(M.mover(R, 0, 0), () => m.caixa(R * .034, h - b * 2.2, R * .042, { chanfro: 0 })));

    for (const lado of [1, -1]) {
      m.em(lado > 0 ? M.id() : M.rx(PI), () => {
        const g = h * .2;
        m.usar(metal);
        m.torno([[R - b, y], [R - b - g * .5, y + g], [R * .85 + g * .5, y + g], [R * .85, y]], { seg });
        if (o.simples) return;

        m.usar(o.campo || MAT.ouroFosco).sombra(.84);
        m.torno([[R * .85, y + R * .004], [0, y + R * .004]], { seg });
        m.sombra(1).usar(metal);
        m.emVolta(32, () => m.em(M.mover(R * .75, y, 0), () => m.esfera(R * .026, { latDe: 0, aneis: 3, seg: 8 })));

        if (lado > 0) {
          m.em(M.juntar(M.mover(0, y + g * .4, 0), deitar), () => {
            for (const c of cifrao(R * .9)) m.extrusao(c, { prof: g * .9, chanfro: g * .28, passos: 2 });
          });
        } else {
          m.emVolta(12, (i) => m.em(M.mover(R * .57, y + g * .3, 0), () =>
            m.caixa(R * (i % 3 ? .08 : .14), g * .6, R * .036, { chanfro: 0 })));
          for (const [ang, comp] of [[rad(60), .4], [rad(-150), .28]]) {
            m.em(M.juntar(M.mover(0, y + g * .3, 0), M.ry(ang), M.mover(R * comp / 2, 0, 0)), () =>
              m.caixa(R * comp, g * .6, R * .05, { chanfro: 0 }));
          }
          m.em(M.mover(0, y, 0), () => m.esfera(R * .07, { latDe: 0, aneis: 4, seg: 14 }));
        }
      });
    }
    return m;
  };

  const malhaMoeda = (R, h, o) => moeda(new Malha(), R, h, o);

  /* ---------- pedestal da vitrine ---------- */
  const pedestal = () => {
    const m = new Malha(), luz = new Malha();
    m.usar(MAT.piano);
    m.torno([[0, -.2], [.9, -.2], [1, -.13], [1, -.045], [.955, 0], [0, 0]], { seg: 96 });
    m.usar(MAT.ouro);
    m.torno([[1, -.118], [1.018, -.106], [1.018, -.07], [1, -.058]], { seg: 96 });
    m.em(M.mover(0, -.2, 0), () => m.toro(.86, .014, { seg: 96, segr: 8 }));
    m.usar(MAT.ouroFosco);
    m.torno([[.9, .004], [.872, .004]], { seg: 96 });
    m.torno([[.3, .004], [.285, .004]], { seg: 64 });
    m.usar(MAT.ouro);
    m.emVolta(60, (i) => m.em(M.mover(.926, .005, 0), () =>
      m.caixa(i % 5 ? .026 : .05, .008, i % 5 ? .006 : .013, { chanfro: 0 })));
    luz.usar(MAT.luzRoxa);
    luz.torno([[.8, .005], [.755, .005]], { seg: 96 });
    luz.usar(MAT.luzOuro);
    luz.torno([[.215, .005], [.2, .005]], { seg: 48 });
    return { corpo: m, luz };
  };

  /* ---------- aro do giroscópio: seção chanfrada, marcas e uma joia ---------- */
  const aro = (R, o = {}) => {
    const m = new Malha(), w = o.larg || .016, h = o.alt || .034, c = .007;
    m.usar(o.mat || MAT.ouro);
    m.torno([[R - w, -h + c], [R - w + c, -h], [R + w - c, -h], [R + w, -h + c], [R + w, h - c],
      [R + w - c, h], [R - w + c, h], [R - w, h - c], [R - w, -h + c]], { seg: 120, fechado: true, suave: 20 });
    m.usar(MAT.piano);
    m.emVolta(o.marcas || 72, (i) => m.em(M.mover(R + w, 0, 0), () =>
      m.caixa(.004, i % 6 ? h * .7 : h * 1.5, .006, { chanfro: 0 })));
    m.usar(o.joia || MAT.luzRoxa);
    m.em(M.mover(R, 0, 0), () => m.esfera(.036, { seg: 16, aneis: 10 }));
    m.usar(MAT.ouro);
    m.em(M.mover(R, 0, 0), () => m.toro(.045, .011, { seg: 20, segr: 8 }));
    return m;
  };

  C.pecas = { suave, entre, mola, deitar, dePe, cifrao, porcento, moeda, malhaMoeda, pedestal, aro };
  C.objetos = {};
})();
