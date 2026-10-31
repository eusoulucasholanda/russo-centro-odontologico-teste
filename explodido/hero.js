// teste 4: o siso abre montado, se desmonta sozinho (coroa, raízes, polpa, nervo, osso) e a rolagem encaixa tudo de volta
import { THREE, criaPalco, criaDente, criaPolpa, criaOsso, criaNervo, criaPoeira, ajustaCamera, semMovimento, limita, rampa, suave } from '../comum/dente3d.js';

const secao = document.getElementById('jornada');
const palco = secao.querySelector('.palco');
const canvas = document.getElementById('hxCanvas');
const caps = [...secao.querySelectorAll('.cap')];
const barra = document.getElementById('hxBarra');
const clareia = document.getElementById('hxClareia');
const rolar = document.getElementById('rolar');
const N = 3;
const modoPrint = /[?&]print/.test(location.search);
const progresso = () => { const r = secao.getBoundingClientRect(); return limita(-r.top / Math.max(1, r.height - innerHeight)); };

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
  const { renderer, cena, camera } = criaPalco(canvas);
  const peca = new THREE.Group(); cena.add(peca);
  const COLO = 1.45; // altura do colo do dente (onde a coroa encontra a raiz)

  // coroa e raiz: o mesmo dente, recortado em duas peças por planos que andam junto com cada uma
  const planoCoroa = new THREE.Plane(new THREE.Vector3(0, 1, 0), -COLO);
  const planoRaiz = new THREE.Plane(new THREE.Vector3(0, -1, 0), COLO);
  const coroa = criaDente({ planos: [planoCoroa] });
  coroa.grupo.position.y = 1.33;
  peca.add(coroa.grupo);
  const raiz = new THREE.Group();
  const matRaiz = coroa.matDente.clone(); matRaiz.clippingPlanes = [planoRaiz];
  const recheioRaiz = coroa.matRecheio.clone(); recheioRaiz.clippingPlanes = [planoRaiz];
  const mRaiz = new THREE.Mesh(coroa.geometria, matRaiz); mRaiz.scale.setScalar(1.15); mRaiz.frustumCulled = false; mRaiz.castShadow = true;
  const rRaiz = new THREE.Mesh(coroa.geometria, recheioRaiz); rRaiz.scale.setScalar(1.15); rRaiz.frustumCulled = false;
  raiz.add(mRaiz, rRaiz);
  raiz.position.y = 1.33;
  peca.add(raiz);

  // polpa: aparece sozinha quando sai de dentro do dente
  const polpa = criaPolpa(coroa.raizes);
  polpa.grupo.position.y = 1.33;
  peca.add(polpa.grupo);

  // osso em duas metades que se afastam
  const planoDir = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);
  const planoEsq = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
  const ossoDir = criaOsso({ planos: [planoDir] }); ossoDir.malha.position.y = .75; peca.add(ossoDir.malha);
  const ossoEsq = criaOsso({ planos: [planoEsq] }); ossoEsq.malha.position.y = .75; peca.add(ossoEsq.malha);

  const nervo = criaNervo();
  peca.add(nervo.grupo);
  cena.add(criaPoeira(120));

  // câmera por capítulo
  const quadros = [
    { pos: [4.4, 3.6, 8.6], alvo: [0, 1.7, 0], giro: -.5 },
    { pos: [3.2, 2.8, 7.2], alvo: [0, 1.4, 0], giro: -.25 },
    { pos: [4.0, 3.4, 7.6], alvo: [0, 1.15, 0], giro: -.45 }
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

  // etiquetas presas às peças
  const etiquetas = [
    { el: secao.querySelector('[data-etq="coroa"]'), no: coroa.grupo, v: new THREE.Vector3(.32, .5, 0) },
    { el: secao.querySelector('[data-etq="raiz"]'), no: raiz, v: new THREE.Vector3(.2, -.55, 0) },
    { el: secao.querySelector('[data-etq="polpa"]'), no: polpa.grupo, v: new THREE.Vector3(.1, .2, 0) },
    { el: secao.querySelector('[data-etq="nervo"]'), no: nervo.grupo, v: new THREE.Vector3(.85, .32, -.1) },
    { el: secao.querySelector('[data-etq="osso"]'), no: ossoEsq.malha, v: new THREE.Vector3(-1.05, .62, .7) }
  ];
  const tmp = new THREE.Vector3();
  let largura = 1, altura = 1;
  const etiqueta = (o) => etiquetas.forEach((e) => {
    if (o <= .01) { e.el.style.opacity = 0; return; }
    e.no.localToWorld(tmp.copy(e.v)).project(camera);
    const x = (tmp.x * .5 + .5) * largura, y = (-tmp.y * .5 + .5) * altura;
    const w = e.el.offsetWidth, limite = largura > 900 ? largura - 190 : largura - 16, esq = x + w > limite;
    if (esq && x - w < 16) { e.el.style.opacity = 0; return; }
    e.el.classList.toggle('esq', esq);
    e.el.style.opacity = o.toFixed(3);
    e.el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)${esq ? ' translateX(-100%)' : ''}`;
  });

  const relogio = new THREE.Clock();
  const aplica = (p) => {
    const t = modoPrint ? 4 : relogio.getElapsedTime();
    // abre montado e se desmonta sozinho; a rolagem encaixa de volta
    const abre = semMovimento ? 1 : suave(rampa(t, .5, 2.1));
    const encaixa = suave(rampa(p, .22, .62));
    const e = abre * (1 - encaixa);
    const flutua = semMovimento ? 0 : Math.sin(t * 1.2) * .04 * e;

    peca.rotation.y = enquadra(p) + (semMovimento ? 0 : Math.sin(t * .35) * .08);
    const sobeCoroa = 1.25 * e + flutua;
    coroa.grupo.position.y = 1.33 + sobeCoroa;
    planoCoroa.constant = -(COLO + sobeCoroa);
    const desceRaiz = -.05 * e;
    raiz.position.y = 1.33 + desceRaiz;
    planoRaiz.constant = COLO + desceRaiz;
    const abreOsso = 1.05 * e;
    ossoDir.malha.position.x = abreOsso;
    ossoEsq.malha.position.x = -abreOsso;
    // os planos do osso giram junto com a peça
    peca.updateMatrixWorld();
    planoDir.set(new THREE.Vector3(1, 0, 0), -abreOsso).applyMatrix4(peca.matrixWorld);
    planoEsq.set(new THREE.Vector3(-1, 0, 0), -abreOsso).applyMatrix4(peca.matrixWorld);
    polpa.grupo.position.set(1.15 * e, 1.33 + .55 * e - flutua, .2 * e);
    polpa.grupo.visible = e > .02;
    nervo.grupo.position.set(0, -.1 * e, 1.0 * e);
    const brilho = .6 + 1.8 * rampa(p, .6, .8);
    nervo.mat.emissiveIntensity = brilho;
    nervo.luz.intensity = brilho * 1.2;

    const luz = rampa(p, .965, .995);
    clareia.style.opacity = luz.toFixed(3);
    renderer.toneMappingExposure = 1.05 + luz * 1.6;
    renderer.render(cena, camera);
    etiqueta(rampa(e, .75, .95));
  };

  const ajusta = () => { ({ largura, altura } = ajustaCamera(renderer, camera, palco, { desloca: .19, sobe: .2 })); };
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
  new IntersectionObserver(([en]) => { visivel = en.isIntersecting; if (visivel && !rodando) { rodando = true; requestAnimationFrame(quadro); } }).observe(secao);
  document.documentElement.classList.add('com-3d');
} catch (err) {
  document.documentElement.classList.add('sem-3d');
  console.warn('3D indisponível', err);
}
