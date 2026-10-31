// teste 3: o siso flutua no centro, entra girando com a luz acendendo; a rolagem mostra raízes, osso, nervo e corte
import { THREE, criaPalco, criaDente, criaPolpa, criaOsso, criaNervo, criaPoeira, ajustaCamera, semMovimento, limita, rampa, suave, janela } from '../comum/dente3d.js';

const secao = document.getElementById('jornada');
const palco = secao.querySelector('.palco');
const canvas = document.getElementById('h3Canvas');
const caps = [...secao.querySelectorAll('.cap')];
const barra = document.getElementById('h3Barra');
const clareia = document.getElementById('h3Clareia');
const rolar = document.getElementById('rolar');
const N = 4;
const modoPrint = /[?&]print/.test(location.search);
const progresso = () => { const r = secao.getBoundingClientRect(); return limita(-r.top / Math.max(1, r.height - innerHeight)); };

// texto dos capítulos acompanha a rolagem
let atual = -1;
const texto = (p) => {
  barra.style.setProperty('--p', p.toFixed(4));
  rolar.style.opacity = p > .02 ? 0 : 1;
  const i = Math.min(N - 1, Math.floor(p * N + .0001));
  if (i !== atual) { caps.forEach((c, k) => { c.classList.toggle('ativo', k === i); c.toggleAttribute('inert', k !== i); }); atual = i; }
};
addEventListener('scroll', () => texto(progresso()), { passive: true });
texto(progresso());

try {
  const { renderer, cena, camera, foco } = criaPalco(canvas);
  cena.fog.near = 9; cena.fog.far = 17;
  const corte = new THREE.Plane(new THREE.Vector3(0, 0, -1), 50);
  const peca = new THREE.Group(); cena.add(peca);
  const dente = criaDente({ planos: [corte] });
  const polpa = criaPolpa(dente.raizes, { planos: [corte] });
  dente.grupo.add(polpa.grupo);
  peca.add(dente.grupo);
  const osso = criaOsso();
  peca.add(osso.malha);
  const nervo = criaNervo();
  peca.add(nervo.grupo);
  nervo.mat.transparent = true;
  const poeira = criaPoeira();
  cena.add(poeira);

  // moldura do corte
  const matMoldura = new THREE.LineBasicMaterial({ color: 0xa9d8f2, transparent: true, opacity: 0 });
  const moldura = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(2.9, 2.7)), matMoldura);
  moldura.position.y = 1.3; peca.add(moldura);

  const quadros = [
    { pos: [0, 2.5, 9.6], alvo: [0, 2.2, 0], giro: 0 },
    { pos: [-4.6, 1.3, 4.4], alvo: [0, 1.6, 0], giro: .6 },
    { pos: [4.6, 3.4, 7.8], alvo: [0, 1.2, 0], giro: .3 },
    { pos: [0, 2.0, 8.4], alvo: [0, 1.55, 0], giro: 0 }
  ].map((q) => ({ pos: new THREE.Vector3(...q.pos), alvo: new THREE.Vector3(...q.alvo), giro: q.giro }));
  const pos = new THREE.Vector3(), alvo = new THREE.Vector3();
  const enquadra = (p) => {
    const k = p * N - .5;
    const i = limita(Math.floor(k), 0, N - 1), j = Math.min(N - 1, i + 1);
    const t = semMovimento ? (k - i > .5 ? 1 : 0) : (k < 0 ? 0 : suave(limita(k - i)));
    pos.lerpVectors(quadros[i].pos, quadros[j].pos, t);
    alvo.lerpVectors(quadros[i].alvo, quadros[j].alvo, t);
    camera.position.copy(pos); camera.lookAt(alvo);
    return quadros[i].giro + (quadros[j].giro - quadros[i].giro) * t;
  };

  const etiquetas = [
    { el: secao.querySelector('[data-etq="raizes"]'), no: dente.grupo, v: new THREE.Vector3(.2, -.55, 0), on: (p) => janela(p, .3, .36, .47, .5) },
    { el: secao.querySelector('[data-etq="canal"]'), no: peca, v: new THREE.Vector3(.75, .3, -.05), on: (p) => janela(p, .62, .68, .74, .77) },
    { el: secao.querySelector('[data-etq="polpa"]'), no: dente.grupo, v: new THREE.Vector3(0, .2, 0), on: (p) => janela(p, .86, .9, .97, .99) }
  ];
  const tmp = new THREE.Vector3();
  let largura = 1, altura = 1;
  const etiqueta = (p) => etiquetas.forEach((e) => {
    const o = e.on(p);
    if (o <= 0) { e.el.style.opacity = 0; return; }
    e.no.localToWorld(tmp.copy(e.v)).project(camera);
    const x = (tmp.x * .5 + .5) * largura, y = (-tmp.y * .5 + .5) * altura;
    const w = e.el.offsetWidth, esq = x + w > largura - 16;
    if (esq && x - w < 16) { e.el.style.opacity = 0; return; }
    e.el.classList.toggle('esq', esq);
    e.el.style.opacity = o.toFixed(3);
    e.el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)${esq ? ' translateX(-100%)' : ''}`;
  });

  const relogio = new THREE.Clock();
  let giroLivre = -Math.PI * 1.5, ultimo = 0;
  const aplica = (p) => {
    const t = modoPrint ? 3 : relogio.getElapsedTime();
    const dt = Math.min(.05, t - ultimo); ultimo = t;
    // entrada: o dente cresce girando e a luz acende
    const entra = semMovimento ? 1 : suave(rampa(t, .15, 1.9));
    foco.intensity = 150 * (.25 + .75 * entra);
    const giro = enquadra(p);
    if (!semMovimento) giroLivre += dt * (.35 + (1 - entra) * 3.2);
    const solta = rampa(p, .04, .3);
    const delta = ((giro - giroLivre) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
    dente.grupo.rotation.y = giroLivre + delta * solta;
    if (solta >= 1) giroLivre = giro;
    dente.grupo.scale.setScalar(.35 + .65 * entra);

    const b = suave(rampa(p, .5, .66));
    osso.malha.visible = b > .001;
    osso.malha.scale.set(1, Math.max(.001, b), 1);
    osso.malha.position.y = .75 * b;
    dente.grupo.position.y = 1.95 - .62 * b + (semMovimento ? 0 : Math.sin(t * 1.3) * .05 * (1 - b));
    const brilho = 2.4 * rampa(p, .6, .7);
    nervo.mat.emissiveIntensity = brilho;
    nervo.mat.opacity = rampa(p, .56, .64);
    nervo.grupo.visible = nervo.mat.opacity > 0;
    nervo.luz.intensity = brilho * 1.4;

    const fundo = suave(rampa(p, .78, .9));
    corte.constant = fundo > 0 ? .95 - fundo * .95 : 50;
    moldura.position.z = corte.constant;
    matMoldura.opacity = fundo > 0 && fundo < 1 ? .9 : fundo * .4;

    poeira.rotation.y = t * .02;
    const luz = rampa(p, .965, .995);
    clareia.style.opacity = luz.toFixed(3);
    renderer.toneMappingExposure = 1.05 + luz * 1.6;
    renderer.render(cena, camera);
    etiqueta(p);
  };

  const ajusta = () => {
    const desk = palco.clientWidth / Math.max(1, palco.clientHeight) >= 1.1;
    ({ largura, altura } = ajustaCamera(renderer, camera, palco, { centro: desk, sobe: .2 }));
    if (desk) { camera.setViewOffset(largura, altura, 0, -altura * .24, largura, altura); camera.updateProjectionMatrix(); }
  };
  new ResizeObserver(ajusta).observe(palco);
  ajusta();

  let suaveP = progresso(), visivel = true, rodando = false, ultimoP = -1;
  const quadro = () => {
    if (!visivel) { rodando = false; return; }
    const alvoP = progresso();
    if (modoPrint) { if (alvoP !== ultimoP) { ultimoP = suaveP = alvoP; aplica(alvoP); } setTimeout(() => requestAnimationFrame(quadro), 250); return; }
    suaveP += (alvoP - suaveP) * (semMovimento ? 1 : .09);
    aplica(suaveP);
    requestAnimationFrame(quadro);
  };
  new IntersectionObserver(([e]) => { visivel = e.isIntersecting; if (visivel && !rodando) { rodando = true; requestAnimationFrame(quadro); } }).observe(secao);
  document.documentElement.classList.add('com-3d');
} catch (e) {
  document.documentElement.classList.add('sem-3d');
  console.warn('3D indisponível', e);
}
