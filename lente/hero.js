// teste 1: a lente de raio-X segue o mouse (ou o dedo) com leve inércia; sozinha ela passeia pelo rosto
(() => {
  const foto = document.getElementById('hlFoto');
  const raiox = document.getElementById('hlRaiox');
  const lente = document.getElementById('hlLente');
  const dica = document.getElementById('hlDica');
  const botaoTudo = document.getElementById('hlTudo');
  if (!foto) return;
  window.desenhaRaiox(raiox.querySelector('svg'));
  const semMov = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const toque = matchMedia('(pointer: coarse)').matches;
  const RAIO = () => lente.offsetWidth / 2;
  const alvo = { x: .49, y: .56 }, pos = { x: .49, y: .56 };
  let raio = 0, tudo = false, ultimaMao = -1e9, arrastando = false, mexeu = false, visivel = true, rodando = false;
  const inicio = performance.now();
  foto.style.setProperty('--h', foto.clientHeight + 'px');

  const ponto = (e) => {
    const r = foto.getBoundingClientRect();
    return { x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) };
  };
  const usou = () => {
    ultimaMao = performance.now();
    if (!mexeu) { mexeu = true; dica.classList.add('sumiu'); }
  };

  // mouse: a lente vai atrás do cursor
  foto.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' && !arrastando) return;
    Object.assign(alvo, ponto(e)); usou();
  });
  // dedo: arrasta a lente, ou toca num ponto do rosto
  lente.addEventListener('pointerdown', (e) => { arrastando = true; lente.setPointerCapture(e.pointerId); usou(); });
  lente.addEventListener('pointermove', (e) => { if (arrastando) { Object.assign(alvo, ponto(e)); usou(); } });
  const solta = () => { arrastando = false; usou(); };
  lente.addEventListener('pointerup', solta);
  lente.addEventListener('pointercancel', solta);
  foto.addEventListener('click', (e) => { if (e.target === lente || lente.contains(e.target)) return; Object.assign(alvo, ponto(e)); usou(); });

  botaoTudo.addEventListener('click', () => {
    tudo = !tudo;
    botaoTudo.setAttribute('aria-pressed', tudo);
    botaoTudo.querySelector('span').textContent = tudo ? 'Voltar à foto' : 'Ver raio-X completo';
    usou();
  });

  const quadro = (agora) => {
    if (!visivel) { rodando = false; return; }
    const t = (agora - inicio) / 1000;
    // passeio automático pelo rosto enquanto ninguém mexe
    if (!semMov && !arrastando && agora - ultimaMao > 2600) {
      alvo.x = .49 + .17 * Math.sin(t * .55);
      alvo.y = .53 + .1 * Math.sin(t * .9 + 1.2);
    }
    const k = semMov ? 1 : (arrastando ? .35 : .12);
    pos.x += (alvo.x - pos.x) * k;
    pos.y += (alvo.y - pos.y) * k;
    const w = foto.clientWidth, h = foto.clientHeight;
    const nasce = semMov ? 1 : Math.min(1, Math.max(0, (t - .9) / .8));
    const alvoRaio = tudo ? Math.hypot(w, h) : RAIO() * (1 - Math.pow(1 - nasce, 3));
    raio += (alvoRaio - raio) * (semMov ? 1 : .11);
    const x = pos.x * w, y = pos.y * h;
    raiox.style.clipPath = `circle(${raio.toFixed(1)}px at ${x.toFixed(1)}px ${y.toFixed(1)}px)`;
    lente.style.transform = `translate(${(x - RAIO()).toFixed(1)}px,${(y - RAIO()).toFixed(1)}px) scale(${Math.min(1, raio / Math.max(1, RAIO())).toFixed(3)})`;
    lente.style.opacity = tudo ? 0 : Math.min(1, raio / 30).toFixed(2);
    requestAnimationFrame(quadro);
  };
  new IntersectionObserver(([e]) => {
    visivel = e.isIntersecting;
    if (visivel && !rodando) { rodando = true; requestAnimationFrame(quadro); }
  }).observe(foto);
  addEventListener('resize', () => foto.style.setProperty('--h', foto.clientHeight + 'px'));
})();
