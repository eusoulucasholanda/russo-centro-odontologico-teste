// Raio-X frontal desenhado por cima da foto 001 do Assis (652 x 857): crânio, órbitas, nariz,
// seios, mandíbula, canais, coluna e os 32 dentes, com os sisos em destaque.
// Uso: desenhaRaiox(svg) num <svg viewBox="0 0 652 857">.
window.desenhaRaiox = (svg) => {
  const NS = 'http://www.w3.org/2000/svg';
  const cria = (tag, attrs, pai) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); pai.appendChild(e); return e; };
  const id = 'rx' + Math.random().toString(36).slice(2, 7);
  const defs = cria('defs', {}, svg);
  const f = cria('filter', { id: id + 'b', x: '-20%', y: '-20%', width: '140%', height: '140%' }, defs);
  cria('feGaussianBlur', { stdDeviation: 2.4, result: 'b' }, f);
  const m = cria('feMerge', {}, f); cria('feMergeNode', { in: 'b' }, m); cria('feMergeNode', { in: 'SourceGraphic' }, m);
  const gd = cria('linearGradient', { id: id + 'd', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  cria('stop', { offset: 0, 'stop-color': '#f4fbff', 'stop-opacity': .95 }, gd);
  cria('stop', { offset: .42, 'stop-color': '#d8ecf8', 'stop-opacity': .8 }, gd);
  cria('stop', { offset: .48, 'stop-color': '#bcdcf0', 'stop-opacity': .5 }, gd);
  cria('stop', { offset: 1, 'stop-color': '#a9d8f2', 'stop-opacity': .18 }, gd);

  // a cabeça está levemente inclinada na foto
  const g = cria('g', { class: 'rx', transform: 'rotate(-3 318 420)', filter: `url(#${id}b)` }, svg);

  // crânio (tábua externa e interna)
  cria('path', { class: 'rx-osso', d: 'M160,300 C160,180 230,112 318,112 C406,112 476,180 476,300 C476,340 470,370 462,392 L452,392 C458,368 462,340 462,300 C462,192 400,126 318,126 C236,126 174,192 174,300 C174,340 178,368 184,392 L174,392 C166,370 160,340 160,300 Z' }, g);
  // órbitas
  cria('rect', { class: 'rx-vazio', x: 199, y: 306, width: 96, height: 78, rx: 32 }, g);
  cria('rect', { class: 'rx-vazio', x: 322, y: 299, width: 96, height: 78, rx: 32 }, g);
  // abertura nasal e septo
  cria('path', { class: 'rx-vazio', d: 'M318,368 C300,380 290,420 296,440 C302,452 334,452 340,440 C346,420 336,380 318,368 Z' }, g);
  cria('path', { class: 'rx-linha', d: 'M318,378 L318,446' }, g);
  // seios maxilares
  cria('ellipse', { class: 'rx-vazio fraco', cx: 258, cy: 410, rx: 36, ry: 28 }, g);
  cria('ellipse', { class: 'rx-vazio fraco', cx: 380, cy: 404, rx: 36, ry: 28 }, g);
  // arcos zigomáticos
  cria('path', { class: 'rx-linha grossa', d: 'M204,384 C190,392 178,398 166,404' }, g);
  cria('path', { class: 'rx-linha grossa', d: 'M414,378 C430,386 450,392 470,396' }, g);
  // coluna cervical, atrás da mandíbula
  for (let i = 0; i < 6; i++) cria('rect', { class: 'rx-vazio coluna', x: 300, y: 560 + i * 34, width: 36, height: 26, rx: 6 }, g);
  // mandíbula: dois traços sobrepostos desenham as bordas do osso
  const mand = 'M208,400 L211,469 Q215,506 243,523 C275,545 300,560 318,561 C336,560 363,545 395,522 Q423,503 427,465 L431,396';
  cria('path', { class: 'rx-mand-borda', d: mand }, g);
  cria('path', { class: 'rx-mand', d: mand }, g);
  // canais mandibulares
  cria('path', { class: 'rx-canal', d: 'M224,436 C226,480 236,505 262,520 L284,530' }, g);
  cria('path', { class: 'rx-canal', d: 'M412,436 C410,480 400,505 374,520 L352,530' }, g);

  // dentes em vista frontal
  const larg = [0, 14, 11, 12, 10, 10, 12, 11, 10];
  const coroaC = [0, 24, 21, 25, 20, 19, 18, 17, 15], raizC = [0, 34, 30, 42, 32, 30, 26, 24, 20];
  const coroaB = [0, 20, 19, 23, 19, 18, 17, 16, 14], raizB = [0, 30, 30, 38, 32, 30, 26, 24, 20];
  const oclusal = (x) => 462 - .0016 * (x - 318) ** 2;
  const forma = (w, ch, rl) => `M${-w / 2},4 Q${-w / 2},0 ${-w / 2 + 3},0 L${w / 2 - 3},0 Q${w / 2},0 ${w / 2},4 L${w * .46},${ch} C${w * .4},${ch + rl * .6} ${w * .12},${ch + rl} 0,${ch + rl} C${-w * .12},${ch + rl} ${-w * .4},${ch + rl * .6} ${-w * .46},${ch} Z`;
  const dentes = cria('g', {}, g);
  [-1, 1].forEach((lado) => {
    let x = 318;
    for (let pos = 1; pos <= 8; pos++) {
      const w = larg[pos];
      const cx = x + lado * (w / 2 + .75);
      x += lado * (w + 1.5);
      const yo = oclusal(cx);
      // cima: dente 1x (direita do paciente = esquerda da tela) ou 2x; baixo: 4x ou 3x
      [['cima', lado < 0 ? 10 : 20, coroaC, raizC, -1], ['baixo', lado < 0 ? 40 : 30, coroaB, raizB, 1]].forEach(([arco, base, ch, rl, dir]) => {
        const siso = pos === 8;
        let ty = yo + dir * 1, giro = 0;
        if (siso && dir < 0) { ty -= 8; giro = lado * 12; }
        if (siso && dir > 0) { ty += 10; giro = -lado * 20; }
        const t = cria('g', { class: 'rx-dente' + (siso ? ' rx-siso' : ''), 'data-n': base + pos, transform: `translate(${cx.toFixed(1)},${ty.toFixed(1)}) scale(1,${dir}) rotate(${giro})` }, dentes);
        cria('path', { d: forma(w, ch[pos], rl[pos]), fill: `url(#${id}d)` }, t);
        cria('path', { class: 'rx-polpa', d: `M0,${ch[pos] * .35} L0,${(ch[pos] + rl[pos] * .85).toFixed(1)}` }, t);
      });
    }
  });

  // marcadores dos sisos
  const marcas = cria('g', { class: 'rx-marcas' }, svg);
  [[232, 440, '18', -1, -1], [404, 436, '28', 1, -1], [236, 488, '48', -1, 1], [400, 484, '38', 1, 1]].forEach(([x, y, n, sx, sy]) => {
    const m = cria('g', { class: 'rx-marca', transform: 'rotate(-3 318 420)' }, marcas);
    cria('circle', { cx: x, cy: y, r: 13 }, m);
    cria('path', { d: `M${x + sx * 13},${y + sy * 6} L${x + sx * 46},${y + sy * 30}` }, m);
    const t = cria('text', { x: x + sx * 50, y: y + sy * 30 + 4, 'text-anchor': sx < 0 ? 'end' : 'start' }, m);
    t.textContent = n;
  });
  return svg;
};
