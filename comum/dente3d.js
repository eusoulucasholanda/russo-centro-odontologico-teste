// Peças 3D compartilhadas pelos testes de hero do siso: palco, dente, polpa, osso e nervo.
import * as THREE from 'three';
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export { THREE };
export const leve = matchMedia('(max-width: 899px), (pointer: coarse)').matches;
export const semMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const limita = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const rampa = (p, a, b) => limita((p - a) / (b - a));
export const suave = (t) => t * t * (3 - 2 * t);
export const janela = (p, a, b, c, d) => rampa(p, a, b) * (1 - rampa(p, c, d));

// renderizador, cena com luz de estúdio e chão escuro
export function criaPalco(canvas, { chao = true, nevoa = true } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, leve ? 1.5 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.localClippingEnabled = true;
  renderer.setClearColor(0x070B12, 1);

  const cena = new THREE.Scene();
  if (nevoa) cena.fog = new THREE.Fog(0x070B12, 11, 26);
  const pmrem = new THREE.PMREMGenerator(renderer);
  cena.environment = pmrem.fromScene(new RoomEnvironment(renderer), .04).texture;
  const camera = new THREE.PerspectiveCamera(30, 1, .1, 80);

  const foco = new THREE.SpotLight(0xfff1dc, 150, 24, .42, .8, 2);
  foco.position.set(.6, 8.5, 2.4);
  foco.target.position.set(0, .8, 0);
  foco.castShadow = true;
  foco.shadow.mapSize.set(leve ? 512 : 1024, leve ? 512 : 1024);
  foco.shadow.bias = -.0004;
  cena.add(foco, foco.target);
  const contra = new THREE.DirectionalLight(0xC8A46A, 1.6); contra.position.set(-5, 3, -4); cena.add(contra);
  const fria = new THREE.DirectionalLight(0x8fc4e6, .6); fria.position.set(5, 2, 4); cena.add(fria);
  cena.add(new THREE.HemisphereLight(0x223047, 0x05070b, .5));

  if (chao) {
    const piso = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ color: 0x0d131d, roughness: .6, metalness: .15 }));
    piso.rotation.x = -Math.PI / 2;
    piso.receiveShadow = true;
    cena.add(piso);
  }
  return { renderer, cena, camera, foco, contra, fria };
}

// campo de esferas do siso (coroa com cúspides e duas raízes curvas), igual ao do site
function preencheDente(mc) {
  mc.reset();
  const bola = (x, y, z, s) => mc.addBall(x, y, z, s, 12);
  bola(.5, .6, .5, .75);
  bola(.435, .62, .5, .55); bola(.565, .62, .5, .55);
  bola(.5, .62, .44, .45); bola(.5, .62, .56, .45);
  [[.44, .45], [.56, .45], [.44, .55], [.56, .55]].forEach(([x, z]) => bola(x, .722, z, .44));
  bola(.5, .555, .5, .42); bola(.5, .52, .5, .36); bola(.5, .48, .5, .3);
  const raizes = [];
  [[.455, .04], [.55, .035]].forEach(([x0, curva]) => {
    const pts = [];
    for (let i = 0; i <= 9; i++) {
      const t = i / 9, x = x0 + t * t * curva, y = .5 - t * .36;
      bola(x, y, .5, .34 * (1 - t * .75));
      pts.push(new THREE.Vector3((x * 2 - 1) * 1.15, (y * 2 - 1) * 1.15, 0));
    }
    raizes.push(pts);
  });
  if (mc.update) mc.update(); else if (mc.render) mc.render();
  return raizes;
}

// o dente: devolve o grupo, os materiais e um jeito de criar cópias recortadas (coroa e raiz separadas)
export function criaDente({ planos = [] } = {}) {
  const grupo = new THREE.Group();
  const matDente = new THREE.MeshPhysicalMaterial({ color: 0xf3ede2, roughness: .28, clearcoat: .85, clearcoatRoughness: .16, sheen: .5, sheenColor: new THREE.Color(0xffffff), sheenRoughness: .5, clippingPlanes: planos });
  const mc = new MarchingCubes(leve ? 52 : 72, matDente, false, false, 120000);
  mc.isolation = 80;
  const raizes = preencheDente(mc);
  mc.scale.setScalar(1.15);
  mc.castShadow = true;
  mc.frustumCulled = false;
  grupo.add(mc);
  const matRecheio = new THREE.MeshBasicMaterial({ color: 0xd8c09a, side: THREE.BackSide, clippingPlanes: planos });
  const recheio = new THREE.Mesh(mc.geometry, matRecheio);
  recheio.scale.copy(mc.scale);
  recheio.frustumCulled = false;
  grupo.add(recheio);
  return { grupo, malha: mc, geometria: mc.geometry, matDente, matRecheio, raizes };
}

// polpa (câmara + canais), opcionalmente recortada
export function criaPolpa(raizes, { planos = [] } = {}) {
  const grupo = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xb8475c, emissive: 0x5c1020, emissiveIntensity: .7, roughness: .5, side: THREE.DoubleSide, clippingPlanes: planos });
  const camara = new THREE.Mesh(new THREE.CapsuleGeometry(.1, .24, 8, 16), mat);
  camara.rotation.z = Math.PI / 2;
  camara.position.y = .2;
  grupo.add(camara);
  raizes.forEach((pts) => grupo.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.slice(0, 9)), 40, .028, 8), mat)));
  return { grupo, mat };
}

// bloco de osso translúcido
export function criaOsso({ planos = [], largura = 2.5, altura = 1.5, fundo = 1.6 } = {}) {
  const mat = leve
    ? new THREE.MeshPhysicalMaterial({ color: 0xbcd6e6, roughness: .3, transparent: true, opacity: .3, depthWrite: false, clearcoat: .6, clippingPlanes: planos, side: THREE.DoubleSide })
    : new THREE.MeshPhysicalMaterial({ color: 0xdbeaf3, roughness: .3, transmission: .93, thickness: 1.4, ior: 1.38, attenuationColor: new THREE.Color(0x9fcbe6), attenuationDistance: 3, clearcoat: .4, clearcoatRoughness: .3, clippingPlanes: planos, side: THREE.DoubleSide });
  const malha = new THREE.Mesh(new RoundedBoxGeometry(largura, altura, fundo, 6, .2), mat);
  return { malha, mat };
}

// canal mandibular com luz própria
export function criaNervo() {
  const curva = new THREE.CatmullRomCurve3([[-1.15, .34, .22], [-.6, .27, .1], [0, .25, 0], [.6, .29, -.08], [1.15, .38, -.18]].map((a) => new THREE.Vector3(...a)));
  const mat = new THREE.MeshStandardMaterial({ color: 0x1d3446, emissive: 0x7fd3ff, emissiveIntensity: 0, roughness: .4 });
  const malha = new THREE.Mesh(new THREE.TubeGeometry(curva, 100, .075, 16), mat);
  const luz = new THREE.PointLight(0x7fd3ff, 0, 3, 2);
  luz.position.set(0, .35, 0);
  const grupo = new THREE.Group();
  grupo.add(malha, luz);
  return { grupo, mat, luz };
}

// poeira fora de foco ao fundo: dá profundidade de estúdio
export function criaPoeira(qtd = 160) {
  const pos = new Float32Array(qtd * 3);
  for (let i = 0; i < qtd; i++) {
    pos[i * 3] = (Math.random() - .5) * 16;
    pos[i * 3 + 1] = Math.random() * 7 - .5;
    pos[i * 3 + 2] = -3 - Math.random() * 8;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(.4, 'rgba(255,255,255,.35)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
  const mat = new THREE.PointsMaterial({ size: .32, map: new THREE.CanvasTexture(c), color: 0xC8A46A, transparent: true, opacity: .45, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
  return new THREE.Points(geo, mat);
}

// ajusta o tamanho e o enquadramento: texto à esquerda no desktop, embaixo no celular
export function ajustaCamera(renderer, camera, palco, { desloca = .19, sobe = .2, centro = false } = {}) {
  const largura = palco.clientWidth, altura = palco.clientHeight;
  renderer.setSize(largura, altura, false);
  const asp = largura / Math.max(1, altura);
  camera.aspect = asp;
  camera.fov = asp < 1 ? 2 * Math.atan(Math.tan(15.5 * Math.PI / 180) / asp) * 180 / Math.PI : 30;
  if (centro) camera.clearViewOffset();
  else if (asp >= 1.1) camera.setViewOffset(largura, altura, -largura * desloca, 0, largura, altura);
  else camera.setViewOffset(largura, altura, 0, altura * sobe, largura, altura);
  camera.updateProjectionMatrix();
  return { largura, altura };
}
