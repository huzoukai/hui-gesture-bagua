import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { gsap } from 'gsap';

const WHITE = new THREE.Color(0xe8f4ee);
const BLUE = new THREE.Color(0x77b9d8);
const GOLD = new THREE.Color(0xf0b956);
const INK = 'rgba(226, 240, 232, 0.92)';

function canvasTexture(size, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, size, size);
  draw(context, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.encoding = THREE.sRGBEncoding;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

const STEMS = '甲乙丙丁戊己庚辛壬癸';
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥';
const JIAZI = Array.from({ length: 60 }, (_, index) =>
  STEMS[index % STEMS.length] + BRANCHES[index % BRANCHES.length]
);
const MOUNTAINS = '壬子癸丑艮寅甲卯乙辰巽巳丙午丁未坤申庚酉辛戌乾亥'.split('');
const HEXAGRAMS = [
  '乾', '坤', '屯', '蒙', '需', '讼', '师', '比', '小畜', '履', '泰', '否', '同人',
  '大有', '谦', '豫', '随', '蛊', '临', '观', '噬嗑', '贲', '剥', '复', '无妄',
  '大畜', '颐', '大过', '坎', '离', '咸', '恒', '遁', '大壮', '晋', '明夷',
  '家人', '睽', '蹇', '解', '损', '益', '夬', '姤', '萃', '升', '困', '井',
  '革', '鼎', '震', '艮', '渐', '归妹', '丰', '旅', '巽', '兑', '涣', '节',
  '中孚', '小过', '既济', '未济'
];
const SOLAR_TERMS = '立春雨水惊蛰春分清明谷雨立夏小满芒种夏至小暑大暑立秋处暑白露秋分寒露霜降立冬小雪大雪冬至小寒大寒'
  .match(/.{2}/gu);
const MANSIONS = '角亢氐房心尾箕斗牛女虚危室壁奎娄胃昴毕觜参井鬼柳星张翼轸'.split('');

function drawCircle(context, size, radius, width = 2, color = 'rgba(226, 240, 232, 0.72)') {
  context.beginPath();
  context.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
  context.strokeStyle = color;
  context.lineWidth = width;
  context.stroke();
}

function drawTokenRing(context, size, tokens, radius, fontSize, color = INK, offset = 0) {
  const center = size / 2;
  const step = (Math.PI * 2) / tokens.length;
  context.fillStyle = color;
  context.font = `${fontSize}px "Songti SC", "STSong", "Noto Serif CJK SC", serif`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  tokens.forEach((token, index) => {
    const angle = index * step + offset;
    context.save();
    context.translate(center + Math.cos(angle) * radius, center + Math.sin(angle) * radius);
    context.rotate(angle + Math.PI / 2);
    context.fillText(token, 0, 0);
    context.restore();
  });
}

function drawTicks(context, size, radius, count, length, width = 2, direction = -1) {
  const center = size / 2;
  const majorEvery = Math.max(1, Math.round(count / 8));
  context.strokeStyle = 'rgba(210, 232, 224, 0.65)';
  context.lineWidth = width;
  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * Math.PI * 2;
    const tickLength = (index % majorEvery === 0 ? length * 1.65 : length) * direction;
    context.beginPath();
    context.moveTo(center + Math.cos(angle) * radius, center + Math.sin(angle) * radius);
    context.lineTo(
      center + Math.cos(angle) * (radius + tickLength),
      center + Math.sin(angle) * (radius + tickLength)
    );
    context.stroke();
  }
}

function makeTaijiTexture() {
  return canvasTexture(512, (context, size) => {
    const center = size / 2;
    const radius = size * 0.44;
    const half = radius / 2;
    context.fillStyle = 'rgba(210, 234, 223, 0.14)';
    context.beginPath();
    context.arc(center, center, radius, -Math.PI / 2, Math.PI / 2);
    context.arc(center, center + half, half, Math.PI / 2, -Math.PI / 2, true);
    context.arc(center, center - half, half, Math.PI / 2, -Math.PI / 2, true);
    context.closePath();
    context.fill();
    context.strokeStyle = INK;
    context.lineWidth = 7;
    context.beginPath();
    context.arc(center, center, radius, 0, Math.PI * 2);
    context.stroke();
    context.lineWidth = 6;
    context.beginPath();
    context.arc(center, center - half, half, -Math.PI / 2, Math.PI / 2);
    context.arc(center, center + half, half, -Math.PI / 2, Math.PI / 2, true);
    context.stroke();
    context.fillStyle = INK;
    context.beginPath();
    context.arc(center, center - half, 13, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.arc(center, center + half, 13, 0, Math.PI * 2);
    context.stroke();
  });
}

function makePlateTexture(size = 512) {
  return canvasTexture(size, (context, textureSize) => {
    const center = textureSize / 2;
    const gradient = context.createRadialGradient(center, center, 0, center, center, center);
    gradient.addColorStop(0, 'rgba(255,255,255,.13)');
    gradient.addColorStop(0.68, 'rgba(255,255,255,.06)');
    gradient.addColorStop(0.94, 'rgba(255,255,255,.24)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(center, center, center, 0, Math.PI * 2);
    context.fill();
  });
}

function makeBandPlateTexture(ring, resolution = 256) {
  return canvasTexture(resolution, (context, size) => {
    const center = size / 2;
    const toStop = (radius) => THREE.MathUtils.clamp((radius * 2) / ring.size, 0, 1);
    const middle = (ring.inner + ring.outer) / 2;
    const gradient = context.createRadialGradient(center, center, 0, center, center, center);
    gradient.addColorStop(toStop(ring.inner - 0.05), 'rgba(255,255,255,0)');
    gradient.addColorStop(toStop(ring.inner - 0.01), 'rgba(255,255,255,.08)');
    gradient.addColorStop(toStop(middle), 'rgba(255,255,255,.14)');
    gradient.addColorStop(toStop(ring.outer - 0.015), 'rgba(255,255,255,.22)');
    gradient.addColorStop(toStop(ring.outer + 0.02), 'rgba(255,255,255,0)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  });
}

function createLayer(texture, size, targetZ, speed, baseOpacity, brightness, plateTexture) {
  const geometry = new THREE.PlaneGeometry(size, size);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    color: WHITE.clone(),
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(geometry, material);
  const plate = new THREE.Mesh(
    geometry.clone(),
    new THREE.MeshBasicMaterial({
      map: plateTexture,
      color: WHITE.clone(),
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );
  plate.position.z = -0.012;
  mesh.add(plate);
  const echo = new THREE.Mesh(
    geometry.clone(),
    new THREE.MeshBasicMaterial({
      map: texture,
      color: 0x40534a,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );
  echo.position.z = -0.004;
  echo.scale.setScalar(1.004);
  mesh.add(echo);
  mesh.userData = {
    baseOpacity,
    brightness,
    targetZ,
    speed,
    opacity: { value: 0 },
    flash: { value: 0 },
    plate,
    echo
  };
  return mesh;
}

function makeGlowTexture() {
  return canvasTexture(256, (context, size) => {
    const center = size / 2;
    const gradient = context.createRadialGradient(center, center, 0, center, center, center);
    gradient.addColorStop(0, 'rgba(210, 238, 224, 0.9)');
    gradient.addColorStop(0.25, 'rgba(127, 185, 158, 0.28)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  });
}

export function createBaguaExperience(canvas, onStateChange = () => {}) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const compactViewport = window.matchMedia('(max-width: 720px)').matches;
  const touchDevice = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
  const limitedMemory = Number(navigator.deviceMemory || 8) <= 4;
  const lowPower = reducedMotion || compactViewport || touchDevice || limitedMemory;
  const duration = reducedMotion ? 0.2 : 1;
  const seedScale = compactViewport || touchDevice ? 0.42 : 0.48;
  const flatScale = compactViewport || touchDevice ? 0.56 : 0.68;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 100);
  camera.position.set(0, 0.15, 7);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !lowPower,
    powerPreference: 'high-performance'
  });
  renderer.setClearColor(0x050706, 1);
  renderer.outputEncoding = THREE.sRGBEncoding;

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 1, 0.55, 0.5);
  composer.addPass(bloom);

  const starsGeometry = new THREE.BufferGeometry();
  const starCount = lowPower ? 360 : 900;
  const starPositions = new Float32Array(starCount * 3);
  for (let index = 0; index < starCount; index += 1) {
    starPositions[index * 3] = (Math.random() - 0.5) * 18;
    starPositions[index * 3 + 1] = (Math.random() - 0.5) * 11;
    starPositions[index * 3 + 2] = -2 - Math.random() * 6;
  }
  starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(
    starsGeometry,
    new THREE.PointsMaterial({
      size: 0.018,
      color: 0xaec8ba,
      transparent: true,
      opacity: 0.52,
      depthWrite: false
    })
  );
  scene.add(stars);

  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeGlowTexture(),
      color: WHITE.clone(),
      transparent: true,
      opacity: 0.07,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  halo.scale.set(9, 9, 1);
  halo.position.z = -1;
  scene.add(halo);

  const field = new THREE.Group();
  field.visible = false;
  field.scale.setScalar(0.0001);
  scene.add(field);

  const baseResolution = 1024;
  const denseResolution = lowPower ? 1024 : 2048;
  const plateResolution = lowPower ? 256 : 512;
  function ringTexture(band, draw, resolution = baseResolution) {
    const [inner, outer] = band;
    const size = 2 * (outer + 0.035);
    const texture = canvasTexture(resolution, (context, textureSize) => {
      draw(context, textureSize, textureSize / size, inner, outer);
    });
    return { texture, size, inner, outer };
  }

  const guaRing = ringTexture([0.5, 0.84], (context, size, scale, inner, outer) => {
    drawTokenRing(context, size, ['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷'], (inner + 0.215) * scale, 0.2 * scale);
    drawTokenRing(context, size, ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤'], (inner + 0.062) * scale, 0.075 * scale, 'rgba(235,245,240,.72)');
    drawCircle(context, size, inner * scale, 0.006 * scale, 'rgba(220,235,228,.45)');
    drawCircle(context, size, outer * scale, 0.009 * scale);
  });
  const nineStarsRing = ringTexture([0.84, 1.07], (context, size, scale, inner, outer) => {
    drawTokenRing(context, size, ['贪狼', '巨门', '禄存', '文曲', '廉贞', '武曲', '破军', '左辅', '右弼'], ((inner + outer) / 2) * scale, 0.125 * scale);
    drawCircle(context, size, inner * scale, 0.005 * scale, 'rgba(220,235,228,.45)');
    drawCircle(context, size, outer * scale, 0.007 * scale);
  });
  const heavenStarsRing = ringTexture([1.07, 1.29], (context, size, scale, inner, outer) => {
    drawTokenRing(context, size, ['天皇', '天厩', '天鬼', '天乙', '少微', '天汉', '天关', '天战', '天帝', '南极', '天马', '太微', '天屏', '太乙', '太罡', '天官', '天命', '天苑', '天棓', '天市', '天厨', '天魁', '天垒', '天辅'], ((inner + outer) / 2) * scale, 0.112 * scale);
    drawCircle(context, size, inner * scale, 0.005 * scale, 'rgba(220,235,228,.45)');
    drawCircle(context, size, outer * scale, 0.007 * scale);
  });
  const earthNeedleRing = ringTexture([1.29, 1.52], (context, size, scale, inner, outer) => {
    drawTokenRing(context, size, MOUNTAINS, ((inner + outer) / 2 - 0.01) * scale, 0.12 * scale);
    drawTicks(context, size, (outer - 0.008) * scale, 24, 0.024 * scale, 0.005 * scale);
    drawCircle(context, size, inner * scale, 0.005 * scale, 'rgba(220,235,228,.45)');
    drawCircle(context, size, outer * scale, 0.007 * scale);
  });
  const seventyTwoDragonsRing = ringTexture([1.52, 1.7], (context, size, scale, inner, outer) => {
    drawTokenRing(context, size, JIAZI, ((inner + outer) / 2 - 0.005) * scale, 0.078 * scale, 'rgba(235,245,240,.86)');
    drawTicks(context, size, (outer - 0.008) * scale, 72, 0.02 * scale, 0.004 * scale);
    drawCircle(context, size, inner * scale, 0.004 * scale, 'rgba(220,235,228,.4)');
    drawCircle(context, size, outer * scale, 0.006 * scale);
  }, denseResolution);
  const humanNeedleRing = ringTexture([1.7, 1.93], (context, size, scale, inner, outer) => {
    drawTokenRing(context, size, MOUNTAINS, ((inner + outer) / 2 - 0.01) * scale, 0.12 * scale, INK, Math.PI / 24);
    drawTicks(context, size, (outer - 0.008) * scale, 24, 0.024 * scale, 0.005 * scale);
    drawCircle(context, size, inner * scale, 0.005 * scale, 'rgba(220,235,228,.45)');
    drawCircle(context, size, outer * scale, 0.007 * scale);
  });
  const sixtyDragonsRing = ringTexture([1.93, 2.11], (context, size, scale, inner, outer) => {
    drawTokenRing(context, size, JIAZI, ((inner + outer) / 2 - 0.005) * scale, 0.078 * scale, 'rgba(235,245,240,.86)', Math.PI / 60);
    drawTicks(context, size, (outer - 0.008) * scale, 60, 0.02 * scale, 0.004 * scale);
    drawCircle(context, size, inner * scale, 0.004 * scale, 'rgba(220,235,228,.4)');
    drawCircle(context, size, outer * scale, 0.006 * scale);
  }, denseResolution);
  const heavenNeedleRing = ringTexture([2.11, 2.34], (context, size, scale, inner, outer) => {
    drawTokenRing(context, size, MOUNTAINS, ((inner + outer) / 2 - 0.01) * scale, 0.12 * scale, INK, -Math.PI / 24);
    drawTicks(context, size, (outer - 0.008) * scale, 24, 0.024 * scale, 0.005 * scale);
    drawCircle(context, size, inner * scale, 0.005 * scale, 'rgba(220,235,228,.45)');
    drawCircle(context, size, outer * scale, 0.007 * scale);
  });
  const oneTwentyRing = ringTexture([2.34, 2.5], (context, size, scale, inner, outer) => {
    drawTicks(context, size, (outer - 0.008) * scale, 120, 0.03 * scale, 0.004 * scale);
    drawCircle(context, size, inner * scale, 0.004 * scale, 'rgba(220,235,228,.4)');
    drawCircle(context, size, outer * scale, 0.007 * scale);
  }, denseResolution);
  const hexagramsRing = ringTexture([2.5, 2.68], (context, size, scale, inner, outer) => {
    drawTokenRing(context, size, HEXAGRAMS, ((inner + outer) / 2 - 0.005) * scale, 0.078 * scale);
    drawTicks(context, size, (outer - 0.008) * scale, 64, 0.02 * scale, 0.004 * scale);
    drawCircle(context, size, inner * scale, 0.004 * scale, 'rgba(220,235,228,.4)');
    drawCircle(context, size, outer * scale, 0.006 * scale);
  }, denseResolution);
  const mansionsRing = ringTexture([2.68, 2.89], (context, size, scale, inner, outer) => {
    drawTokenRing(context, size, [...MANSIONS, ...MANSIONS], ((inner + outer) / 2 + 0.01) * scale, 0.098 * scale);
    drawTicks(context, size, (inner + 0.008) * scale, 112, 0.028 * scale, 0.004 * scale, 1);
    drawCircle(context, size, inner * scale, 0.004 * scale, 'rgba(220,235,228,.4)');
    drawCircle(context, size, outer * scale, 0.007 * scale);
  }, denseResolution);
  const solarTermsRing = ringTexture([2.89, 3.1], (context, size, scale, inner, outer) => {
    drawTokenRing(context, size, SOLAR_TERMS, ((inner + outer) / 2 - 0.005) * scale, 0.098 * scale);
    drawTicks(context, size, (outer - 0.008) * scale, 24, 0.024 * scale, 0.005 * scale);
    drawCircle(context, size, inner * scale, 0.004 * scale, 'rgba(220,235,228,.4)');
    drawCircle(context, size, outer * scale, 0.007 * scale);
  });
  const degreesRing = ringTexture([3.1, 3.28], (context, size, scale, inner, outer) => {
    drawTicks(context, size, (outer - 0.008) * scale, 360, 0.022 * scale, 0.003 * scale);
    drawTicks(context, size, (outer - 0.008) * scale, 72, 0.045 * scale, 0.005 * scale);
    drawCircle(context, size, inner * scale, 0.005 * scale, 'rgba(220,235,228,.4)');
    drawCircle(context, size, outer * scale, 0.01 * scale);
  }, denseResolution);

  const layers = [];
  function addLayer(label, texture, size, targetZ, speed, baseOpacity, brightness, plateTexture) {
    const layer = createLayer(texture, size, targetZ, speed, baseOpacity, brightness, plateTexture);
    layer.userData.label = label;
    layer.renderOrder = 20 - layers.length;
    field.add(layer);
    layers.push(layer);
    return layer;
  }
  const taiji = addLayer('天池太极', makeTaijiTexture(), 0.95, 1.96, 0.18, 1, 0.5, makePlateTexture(plateResolution));
  const ringDefinitions = [
    ['先天八卦', guaRing, 1.55, -0.12, 0.95, 0.56],
    ['洛书九星', nineStarsRing, 1.14, 0.09, 0.9, 0.62],
    ['二十四天星', heavenStarsRing, 0.78, -0.07, 0.88, 0.68],
    ['地盘正针', earthNeedleRing, 0.46, 0.05, 0.86, 0.74],
    ['穿山七十二龙', seventyTwoDragonsRing, 0.17, -0.04, 0.84, 0.79],
    ['人盘中针', humanNeedleRing, -0.17, 0.035, 0.82, 0.84],
    ['透地六十龙', sixtyDragonsRing, -0.42, -0.03, 0.82, 0.88],
    ['天盘缝针', heavenNeedleRing, -0.65, 0.025, 0.82, 0.92],
    ['一百二十分金', oneTwentyRing, -0.86, -0.02, 0.82, 0.95],
    ['六十四卦', hexagramsRing, -1.05, 0.016, 0.82, 0.97],
    ['二十八星宿', mansionsRing, -1.22, -0.013, 0.82, 0.98],
    ['二十四节气', solarTermsRing, -1.38, 0.01, 0.82, 0.99],
    ['周天刻度', degreesRing, -1.51, -0.008, 0.82, 1]
  ];
  ringDefinitions.forEach(([label, ring, targetZ, speed, baseOpacity, brightness]) => {
    addLayer(
      label,
      ring.texture,
      ring.size,
      targetZ,
      speed,
      baseOpacity,
      brightness,
      makeBandPlateTexture(ring, plateResolution)
    );
  });

  const flowCount = lowPower ? 140 : 320;
  const flowGeometry = new THREE.BufferGeometry();
  const flowPositions = new Float32Array(flowCount * 3);
  const flowData = [];
  for (let index = 0; index < flowCount; index += 1) {
    flowData.push({
      angle: Math.random() * Math.PI * 2,
      radius: 1.2 + Math.random() * 4,
      depth: (Math.random() - 0.5) * 1.8,
      speed: 0.12 + Math.random() * 0.28
    });
  }
  flowGeometry.setAttribute('position', new THREE.BufferAttribute(flowPositions, 3));
  const flowMaterial = new THREE.PointsMaterial({
    size: 0.035,
    color: BLUE.clone(),
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const flow = new THREE.Points(flowGeometry, flowMaterial);
  scene.add(flow);

  const shockMaterial = new THREE.MeshBasicMaterial({
    color: WHITE.clone(),
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const shock = new THREE.Mesh(new THREE.RingGeometry(0.97, 1, 128), shockMaterial);
  shock.position.z = 0.4;
  scene.add(shock);

  let state = 'hidden';
  let vortex = false;
  const spread = { value: 0 };
  const flowStrength = { value: 0 };
  const clock = new THREE.Clock();

  const rotateX = gsap.quickTo(field.rotation, 'x', {
    duration: 0.45,
    ease: 'power2.out'
  });
  const rotateY = gsap.quickTo(field.rotation, 'y', {
    duration: 0.45,
    ease: 'power2.out'
  });
  const rotateZ = gsap.quickTo(field.rotation, 'z', {
    duration: 0.45,
    ease: 'power2.out'
  });
  const moveX = gsap.quickTo(field.position, 'x', {
    duration: 0.32,
    ease: 'power3.out'
  });
  const moveY = gsap.quickTo(field.position, 'y', {
    duration: 0.32,
    ease: 'power3.out'
  });

  function announce(nextState) {
    onStateChange(nextState, vortex);
  }

  function tint(color, tweenDuration = 1) {
    layers.forEach((layer) => {
      gsap.to(layer.material.color, {
        r: color.r,
        g: color.g,
        b: color.b,
        duration: tweenDuration
      });
      gsap.to(layer.userData.plate.material.color, {
        r: color.r,
        g: color.g,
        b: color.b,
        duration: tweenDuration
      });
    });
    gsap.to(halo.material.color, {
      r: color.r,
      g: color.g,
      b: color.b,
      duration: tweenDuration
    });
    gsap.to(flowMaterial.color, {
      r: color.r,
      g: color.g,
      b: color.b,
      duration: tweenDuration
    });
  }

  function pulse(color = WHITE, scale = 4.5) {
    shock.material.color.copy(color);
    shock.scale.setScalar(0.15);
    shock.material.opacity = 0.8;
    gsap.to(shock.scale, {
      x: scale,
      y: scale,
      duration: 0.9 * duration,
      ease: 'power2.out'
    });
    gsap.to(shock.material, {
      opacity: 0,
      duration: 1.05 * duration,
      ease: 'power2.out'
    });
  }

  function summon(x = 0, y = 0) {
    if (state !== 'hidden') return false;
    state = 'seed';
    vortex = false;
    field.visible = true;
    field.position.set(x, y, 0);
    field.rotation.set(-0.1, 0, 0);
    field.scale.setScalar(0.0001);
    spread.value = 0;
    layers.forEach((layer, index) => {
      layer.position.z = 0;
      layer.scale.setScalar(1);
      layer.userData.flash.value = 0;
      layer.userData.opacity.value = index < 2 ? layer.userData.baseOpacity : 0;
    });
    gsap.to(field.scale, {
      x: seedScale,
      y: seedScale,
      z: seedScale,
      duration: 0.55 * duration,
      ease: 'back.out(1.6)'
    });
    gsap.to(halo.material, { opacity: 0.16, duration: 0.7 * duration });
    pulse(WHITE, 1.5);
    announce(state);
    return true;
  }

  function flatten() {
    if (state !== 'seed') return false;
    state = 'flat';
    gsap.to(field.scale, {
      x: flatScale,
      y: flatScale,
      z: flatScale,
      duration: 1.15 * duration,
      ease: 'power3.out'
    });
    gsap.to(field.rotation, {
      x: -0.1,
      y: 0,
      z: 0,
      duration: 0.8 * duration,
      ease: 'power2.out'
    });
    layers.slice(2).forEach((layer, index) => {
      layer.scale.setScalar(0.58);
      gsap.to(layer.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.8 * duration,
        delay: index * 0.075 * duration,
        ease: 'power2.out'
      });
      gsap.to(layer.userData.opacity, {
        value: layer.userData.baseOpacity,
        duration: 0.75 * duration,
        delay: index * 0.075 * duration,
        ease: 'power2.out'
      });
      gsap.fromTo(
        layer.userData.flash,
        { value: 0.85 },
        { value: 0, duration: 0.95 * duration, delay: index * 0.075 * duration }
      );
    });
    gsap.to(halo.material, { opacity: 0.23, duration: 1.1 * duration });
    pulse(WHITE, 3.8);
    announce(state);
    return true;
  }

  function rise() {
    if (state !== 'flat') return false;
    state = 'rising';
    tint(BLUE, 1.2 * duration);
    gsap.to(spread, {
      value: 1,
      duration: 1.9 * duration,
      ease: 'power2.inOut',
      onComplete: () => {
        if (state === 'rising') {
          state = 'risen';
          announce(state);
        }
      }
    });
    gsap.to(field.rotation, {
      x: -0.42,
      y: 0.15,
      duration: 1.6 * duration,
      ease: 'power2.inOut'
    });
    gsap.to(flowStrength, { value: 0.5, duration: 1.5 * duration });
    gsap.to(flowMaterial, { opacity: 0.42, duration: 1.4 * duration });
    gsap.to(halo.material, { opacity: 0.34, duration: 1.4 * duration });
    pulse(BLUE, 4.3);
    announce(state);
    return true;
  }

  function flattenBack() {
    if (state !== 'rising' && state !== 'risen') return false;
    state = 'flat';
    vortex = false;
    tint(WHITE, 0.8 * duration);
    gsap.to(spread, {
      value: 0,
      duration: 1.05 * duration,
      ease: 'power2.inOut'
    });
    gsap.to(field.rotation, {
      x: -0.1,
      y: 0,
      z: 0,
      duration: 1.05 * duration,
      ease: 'power2.inOut'
    });
    gsap.to(flowStrength, { value: 0, duration: 0.7 * duration });
    gsap.to(flowMaterial, { opacity: 0, duration: 0.7 * duration });
    gsap.to(halo.material, { opacity: 0.23, duration: 0.7 * duration });
    announce(state);
    return true;
  }

  function reset() {
    if (state === 'hidden') return false;
    state = 'hidden';
    vortex = false;
    gsap.to(spread, { value: 0, duration: 0.45 * duration });
    gsap.to(flowStrength, { value: 0, duration: 0.35 * duration });
    gsap.to(flowMaterial, { opacity: 0, duration: 0.35 * duration });
    layers.forEach((layer, index) => {
      gsap.to(layer.userData.opacity, {
        value: 0,
        duration: 0.3 * duration,
        delay: index * 0.025 * duration
      });
    });
    gsap.to(field.scale, {
      x: 0.0001,
      y: 0.0001,
      z: 0.0001,
      duration: 0.5 * duration,
      ease: 'power2.in',
      onComplete: () => {
        field.visible = false;
      }
    });
    gsap.to(halo.material, { opacity: 0.07, duration: 0.5 * duration });
    announce(state);
    return true;
  }

  function toggleVortex() {
    if (state !== 'flat' && state !== 'risen') return false;
    vortex = !vortex;
    const target = vortex ? GOLD : state === 'risen' ? BLUE : WHITE;
    tint(target, 0.9 * duration);
    gsap.to(flowStrength, {
      value: vortex ? 2.6 : state === 'risen' ? 0.5 : 0,
      duration: 0.9 * duration
    });
    gsap.to(flowMaterial, {
      opacity: vortex ? 0.86 : state === 'risen' ? 0.42 : 0,
      duration: 0.8 * duration
    });
    gsap.to(halo.material, {
      opacity: vortex ? 0.48 : state === 'risen' ? 0.34 : 0.23,
      duration: 0.8 * duration
    });
    pulse(target, 4.6);
    announce(state);
    return vortex;
  }

  function moveSeed(x, y) {
    if (state !== 'seed') return;
    moveX(x);
    moveY(y);
  }

  function setSeedIntensity(value) {
    if (state !== 'seed') return;
    const clamped = THREE.MathUtils.clamp(value, 0.35, 1);
    taiji.userData.opacity.value = taiji.userData.baseOpacity * clamped;
    bloom.strength = 0.7 + clamped * 0.65;
  }

  function guide(palmX, palmY, roll, neutral) {
    if (state !== 'risen') return;
    rotateY(THREE.MathUtils.clamp(0.15 + (palmX - neutral.x) * 3, -1.15, 1.25));
    rotateX(THREE.MathUtils.clamp(-0.42 + (palmY - neutral.y) * 2.25, -1.05, 0.25));
    rotateZ(THREE.MathUtils.clamp((roll - neutral.roll) * 1.25, -0.9, 0.9));
  }

  function manualGuide(normalX, normalY) {
    if (state !== 'risen') return;
    rotateY(0.15 + normalX * 0.82);
    rotateX(-0.42 + normalY * 0.38);
  }

  function scaleBy(factor) {
    if (state === 'hidden') return;
    const next = THREE.MathUtils.clamp(field.scale.x * factor, 0.35, 1.35);
    gsap.to(field.scale, {
      x: next,
      y: next,
      z: next,
      duration: 0.25,
      overwrite: true
    });
  }

  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const raycaster = new THREE.Raycaster();
  function screenToWorld(clientX, clientY) {
    const pointer = new THREE.Vector2(
      (clientX / window.innerWidth) * 2 - 1,
      -(clientY / window.innerHeight) * 2 + 1
    );
    raycaster.setFromCamera(pointer, camera);
    const target = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, target);
    target.x = THREE.MathUtils.clamp(target.x, -3, 3);
    target.y = THREE.MathUtils.clamp(target.y, -2, 2);
    return target;
  }

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelRatio = lowPower ? 1 : Math.min(window.devicePixelRatio || 1, 1.7);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    composer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  let lastRenderAt = 0;
  function render(now = 0) {
    requestAnimationFrame(render);
    if (lowPower && now - lastRenderAt < 1000 / 30) return;
    lastRenderAt = now;
    const delta = Math.min(clock.getDelta(), 0.04);
    const time = clock.elapsedTime;
    stars.rotation.z += delta * 0.004;

    const breath = state === 'seed'
      ? 0.9 + Math.sin(time * 2.2) * 0.1
      : 0.96 + Math.sin(time * 1.35) * 0.04;
    layers.forEach((layer) => {
      const speed = layer.userData.speed * (vortex ? 8 : 1);
      layer.rotation.z += delta * speed;
      layer.position.z = layer.userData.targetZ * spread.value;
      const opacity = layer.userData.opacity.value * breath;
      const flash = layer.userData.flash.value;
      const textBrightness = 0.78 + layer.userData.brightness * 0.22;
      layer.material.opacity = Math.min(1, opacity * textBrightness + flash * 0.28);
      layer.userData.plate.material.opacity = Math.min(
        0.82,
        opacity * layer.userData.brightness * (0.42 + spread.value * 0.18) + flash * 0.16
      );
      layer.userData.echo.material.opacity = Math.min(0.5, opacity * textBrightness * 0.42);
    });

    const positions = flow.geometry.attributes.position.array;
    flowData.forEach((particle, index) => {
      particle.angle += delta * particle.speed * (1 + flowStrength.value * 2.5);
      particle.radius -= delta * 0.04 * flowStrength.value;
      if (particle.radius < 0.35) particle.radius = 3.2 + Math.random() * 1.2;
      positions[index * 3] = field.position.x + Math.cos(particle.angle) * particle.radius;
      positions[index * 3 + 1] = field.position.y + Math.sin(particle.angle) * particle.radius;
      positions[index * 3 + 2] = particle.depth * spread.value;
    });
    flow.geometry.attributes.position.needsUpdate = true;
    bloom.strength = (vortex ? 1.42 : state === 'risen' ? 1.12 : 0.92);
    composer.render();
  }

  resize();
  window.addEventListener('resize', resize);
  render();

  return {
    get state() {
      return state;
    },
    get vortex() {
      return vortex;
    },
    summon,
    flatten,
    rise,
    flattenBack,
    reset,
    toggleVortex,
    moveSeed,
    setSeedIntensity,
    guide,
    manualGuide,
    scaleBy,
    screenToWorld
  };
}
