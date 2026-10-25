// Navegação da apresentação de defesa do FinCK.
(() => {
  const palco = document.querySelector('.palco');
  const slides = [...document.querySelectorAll('.slide')];
  const total = slides.length;
  const prog = document.querySelector('.progresso');
  const painel = document.querySelector('.notas');
  const corpoNotas = painel.querySelector('.texto-notas');
  const tituloNotas = painel.querySelector('h4');
  let atual = 0;

  // marca de cada slide: parte da defesa e posição
  slides.forEach((s, i) => {
    if (s.classList.contains('capa')) return;
    const m = document.createElement('div');
    m.className = 'marca';
    m.innerHTML = `<span class="parte">${s.dataset.parte || ''}</span><span class="num">${i + 1} de ${total}</span>`;
    s.prepend(m);
  });

  // gráficos de barras horizontais em SVG
  document.querySelectorAll('.barras').forEach(fig => {
    const itens = JSON.parse(fig.dataset.itens);
    const max = Number(fig.dataset.max) || Math.max(...itens.map(i => i[1]));
    const suf = fig.dataset.sufixo || '';
    const dest = (fig.dataset.destaque || '').split(',').map(Number);
    const rot = Number(fig.dataset.rotulo) || 360;
    const W = Number(fig.dataset.largura) || 1100, h = 46, gap = 20;
    const H = itens.length * (h + gap);
    const area = W - rot - 160;
    const fmt = v => String(v).replace('.', ',');
    let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${fig.getAttribute('aria-label') || ''}">`;
    itens.forEach(([nome, v, cor], i) => {
      const y = i * (h + gap);
      const w = Math.max(4, v / max * area);
      const c = cor || (dest.includes(i) ? '#f2b705' : '#8b45e8');
      svg += `<text x="${rot - 18}" y="${y + h / 2 + 8}" text-anchor="end" font-size="23" fill="#e6dff0">${nome}</text>`;
      svg += `<rect x="${rot}" y="${y}" width="${w}" height="${h}" rx="6" fill="${c}"/>`;
      svg += `<text x="${rot + w + 14}" y="${y + h / 2 + 9}" font-size="26" font-weight="700" fill="#f4efe6" font-family="Space Grotesk, Inter, sans-serif">${fmt(v)}${suf}</text>`;
    });
    fig.innerHTML = svg + '</svg>' + fig.innerHTML;
  });

  function escala() {
    const s = Math.min(innerWidth / 1600, innerHeight / 900);
    palco.style.transform = `scale(${s})`;
  }
  function ir(n, foco = false) {
    atual = Math.max(0, Math.min(total - 1, n));
    slides.forEach((s, i) => { s.classList.toggle('ativo', i === atual); s.setAttribute('aria-hidden', i === atual ? 'false' : 'true'); });
    prog.style.width = ((atual + 1) / total * 100) + '%';
    const nota = slides[atual].querySelector('aside.nota');
    tituloNotas.textContent = `Notas do slide ${atual + 1} de ${total}`;
    corpoNotas.innerHTML = nota ? nota.innerHTML : '<p>Sem notas para este slide.</p>';
    if (location.hash !== '#' + (atual + 1)) history.replaceState(null, '', '#' + (atual + 1));
  }
  const prox = () => ir(atual + 1), ant = () => ir(atual - 1);

  addEventListener('resize', escala);
  addEventListener('keydown', e => {
    if (e.target.closest('input, textarea')) return;
    switch (e.key) {
      case 'ArrowRight': case 'PageDown': case ' ': e.preventDefault(); prox(); break;
      case 'ArrowLeft': case 'PageUp': e.preventDefault(); ant(); break;
      case 'Home': ir(0); break;
      case 'End': ir(total - 1); break;
      case 'n': case 'N': painel.classList.toggle('aberto'); break;
      case 'f': case 'F': (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(() => {}); break;
    }
  });
  let x0 = null;
  addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  addEventListener('touchend', e => { if (x0 == null) return; const d = e.changedTouches[0].clientX - x0; if (Math.abs(d) > 50) (d < 0 ? prox : ant)(); x0 = null; });
  document.querySelector('[data-acao="ant"]').addEventListener('click', ant);
  document.querySelector('[data-acao="prox"]').addEventListener('click', prox);
  document.querySelector('[data-acao="notas"]').addEventListener('click', () => painel.classList.toggle('aberto'));
  palco.addEventListener('click', e => { if (!e.target.closest('a, button')) prox(); });

  addEventListener('hashchange', () => { const n = parseInt(location.hash.slice(1), 10); if (n && n - 1 !== atual) ir(n - 1); });
  let tmr; const mostrar = () => { document.body.classList.add('mostrar'); clearTimeout(tmr); tmr = setTimeout(() => document.body.classList.remove('mostrar'), 2500); };
  addEventListener('mousemove', mostrar); mostrar();
  escala();
  ir((parseInt(location.hash.slice(1), 10) || 1) - 1);
})();
