// teste 2: ao rolar, uma linha de luz azul transforma a foto em raio-X e a câmera aproxima nos sisos
(() => {
  const secao = document.getElementById('jornada');
  const foto = document.getElementById('hrFoto');
  const quadro = document.getElementById('hrQuadro');
  const raiox = document.getElementById('hrRaiox');
  const linha = document.getElementById('hrLinha');
  const barra = document.getElementById('hrBarra');
  const clareia = document.getElementById('hrClareia');
  const rolar = document.getElementById('rolar');
  if (!foto) return;
  const svg = window.desenhaRaiox(raiox.querySelector('svg'));
  const caps = [...secao.querySelectorAll('.cap')];
  const semMov = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const limita = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const rampa = (p, a, b) => limita((p - a) / (b - a));
  const suave = (t) => t * t * (3 - 2 * t);
  const N = 4;
  let atual = -1, suaveP = 0, alvoP = 0, rodando = false;

  const progresso = () => {
    const r = secao.getBoundingClientRect();
    return limita(-r.top / Math.max(1, r.height - innerHeight));
  };

  const aplica = (p) => {
    // 1. a linha de luz desce e deixa o raio-X por cima dela
    const scan = suave(rampa(p, .16, .45));
    raiox.style.clipPath = `inset(0 0 ${((1 - scan) * 100).toFixed(2)}% 0)`;
    linha.style.top = (scan * 100).toFixed(2) + '%';
    linha.style.opacity = scan > 0 && scan < 1 ? 1 : 0;
    // 2 e 3. a câmera aproxima na boca e depois no siso 48
    const z1 = suave(rampa(p, .46, .68)), z2 = suave(rampa(p, .72, .9));
    const s = 1 + z1 * .75 + z2 * .7;
    const px = .5 + (.49 - .5) * z1 + (.36 - .49) * z2;
    const py = .5 + (.56 - .5) * z1 + (.575 - .56) * z2;
    const W = foto.clientWidth, H = foto.clientHeight;
    foto.style.transform = `translate(${(W / 2 - px * W * s).toFixed(1)}px,${(H / 2 - py * H * s).toFixed(1)}px) scale(${s.toFixed(4)})`;
    svg.style.setProperty('--rx-marcas', rampa(p, .5, .6).toFixed(3));
    clareia.style.opacity = rampa(p, .965, .995).toFixed(3);
    barra.style.setProperty('--p', p.toFixed(4));
    rolar.style.opacity = p > .02 ? 0 : 1;
    const i = Math.min(N - 1, Math.floor(p * N + .0001));
    if (i !== atual) {
      caps.forEach((c, k) => { c.classList.toggle('ativo', k === i); c.toggleAttribute('inert', k !== i); });
      atual = i;
    }
  };

  const passo = () => {
    alvoP = progresso();
    suaveP += (alvoP - suaveP) * (semMov ? 1 : .12);
    if (Math.abs(alvoP - suaveP) < .0002) suaveP = alvoP;
    aplica(suaveP);
    if (suaveP !== alvoP) requestAnimationFrame(passo); else rodando = false;
  };
  const agenda = () => { if (!rodando) { rodando = true; requestAnimationFrame(passo); } };
  addEventListener('scroll', agenda, { passive: true });
  addEventListener('resize', agenda);
  aplica(progresso());
})();
