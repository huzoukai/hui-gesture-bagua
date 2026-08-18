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

function drawCircle(context, center, radius, width, alpha = 0.8) {
  context.beginPath();
  context.arc(center, center, radius, 0, Math.PI * 2);
  context.strokeStyle = 'rgba(226, 240, 232, ' + alpha + ')';
  context.lineWidth = width;
  context.stroke();
}

function drawRadialText(context, size, tokens, radius, fontSize, offset = 0) {
  const center = size / 2;
  context.save();
  context.translate(center, center);
  context.fillStyle = INK;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = fontSize + 'px "Songti SC", "Noto Serif CJK SC", serif';
  tokens.forEach((token, index) => {
    const angle = offset + (index / tokens.length) * Math.PI * 2;
    context.save();
    context.rotate(angle);
    context.translate(0, -radius);
    context.rotate(-angle);
    context.fillText(token, 0, 0);
    context.restore();
  });
  context.restore();
}

function makeTaijiTexture() {
  return canvasTexture(512, (context, size) => {
    const center = size / 2;
    const radius = size * 0.33;
    context.save();
    context.translate(center, center);
    context.beginPath();
    context.arc(0, 0, radius, -Math.PI / 2, Math.PI / 2);
    context.arc(0, radius / 2, radius / 2, Math.PI / 2, -Math.PI / 2, true);
    context.arc(0, -radius / 2, radius / 2, Math.PI / 2, -Math.PI / 2);
    context.closePath();
    context.fillStyle = 'rgba(230, 242, 235, 0.95)';
    context.fill();
    context.beginPath();
    context.arc(0, 0, radius, 0, Math.PI * 2);
    context.strokeStyle = 'rgba(230, 242, 235, 0.95)';
    context.lineWidth = 6;
    context.stroke();
    context.beginPath();
    context.arc(0, -radius / 2, radius * 0.09, 0, Math.PI * 2);
    context.fillStyle = 'rgba(4, 8, 7, 0.95)';
    context.fill();
    context.beginPath();
    context.arc(0, radius / 2, radius * 0.09, 0, Math.PI * 2);
    context.fillStyle = 'rgba(230, 242, 235, 0.95)';
    context.fill();
    context.restore();
  });
}

function makeRingTexture(tokens, inner, outer, offset = 0, ticks = 0) {
  return canvasTexture(1024, (context, size) => {
    const center = size / 2;
    drawCircle(context, center, inner * size, 2.2, 0.35);
    drawCircle(context, center, outer * size, 3.2, 0.75);
    drawCircle(context, center, ((inner + outer) / 2) * size, 1, 0.16);
    drawRadialText(
      context,
      size,
      tokens,
      ((inner + outer) / 2) * size,
      Math.max(17, Math.round((outer - inner) * size * 0.52)),
      offset
    );

    if (ticks) {
      context.save();
      context.translate(center, center);
      for (let index = 0; index < ticks; index += 1) {
        const angle = (index / ticks) * Math.PI * 2;
        const length = index % 3 === 0 ? 14 : 7;
        context.save();
        context.rotate(angle);
        context.beginPath();
        context.moveTo(0, -outer * size);
        context.lineTo(0, -outer * size + length);
        context.strokeStyle = 'rgba(226, 240, 232, 0.42)';
        context.lineWidth = index % 3 === 0 ? 2 : 1;
        context.stroke();
        context.restore();
      }
      context.restore();
    }
  });
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

function createLayer(texture, size, baseOpacity, speed) {
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    color: WHITE.clone(),
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);
  mesh.userData = { baseOpacity, speed };
  return mesh;
}

export function createBaguaExperience(canvas, onStateChange = () => {}) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration = reducedMotion ? 0.2 : 1;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 100);
  camera.position.set(0, 0.15, 7);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setClearColor(0x050706, 1);
  renderer.outputEncoding = THREE.sRGBEncoding;

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 1.05, 0.75, 0.12);
  composer.addPass(bloom);

  const starsGeometry = new THREE.BufferGeometry();
  const starPositions = new Float32Array(900 * 3);
  for (let index = 0; index < 900; index += 1) {
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

  const tokenSets = [
    ['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷'],
    ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤'],
    '壬子癸丑艮寅甲卯乙辰巽巳丙午丁未坤申庚酉辛戌乾亥'.split(''),
    '角亢氐房心尾箕斗牛女虚危室壁奎娄胃昴毕觜参井鬼柳星张翼轸'.split(''),
    '立春雨水惊蛰春分清明谷雨立夏小满芒种夏至小暑大暑立秋处暑白露秋分寒露霜降立冬小雪大雪冬至小寒大寒'.match(/.{2}/gu),
    ['变', '化', '往', '来', '内', '外', '动', '静']
  ];

  const layers = [];
  const taiji = createLayer(makeTaijiTexture(), 1.2, 0.95, 0.045);
  taiji.renderOrder = 20;
  field.add(taiji);
  layers.push(taiji);

  const ringSpecs = [
    [tokenSets[0], 0.22, 0.39, 1.9, 0.8, -0.025, Math.PI / 8, 24],
    [tokenSets[1], 0.29, 0.44, 2.7, 0.62, 0.018, 0, 32],
    [tokenSets[5], 0.34, 0.47, 3.45, 0.48, -0.013, Math.PI / 8, 48],
    [tokenSets[2], 0.36, 0.48, 4.25, 0.46, 0.01, 0, 72],
    [tokenSets[3], 0.37, 0.48, 4.95, 0.4, -0.008, Math.PI / 28, 56],
    [tokenSets[4], 0.38, 0.48, 5.65, 0.38, 0.006, Math.PI / 24, 96]
  ];

  ringSpecs.forEach(([tokens, inner, outer, size, opacity, speed, offset, ticks]) => {
    const layer = createLayer(
      makeRingTexture(tokens, inner, outer, offset, ticks),
      size,
      opacity,
      speed
    );
    field.add(layer);
    layers.push(layer);
  });

  const flowCount = 320;
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
    field.rotation.set(-0.06, 0, 0);
    field.scale.setScalar(0.0001);
    spread.value = 0;
    layers.forEach((layer, index) => {
      layer.material.opacity = index === 0 ? layer.userData.baseOpacity : 0;
    });
    gsap.to(field.scale, {
      x: 0.38,
      y: 0.38,
      z: 0.38,
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
      x: 0.78,
      y: 0.78,
      z: 0.78,
      duration: 1.15 * duration,
      ease: 'power3.out'
    });
    layers.slice(1).forEach((layer, index) => {
      gsap.to(layer.material, {
        opacity: layer.userData.baseOpacity,
        duration: 0.75 * duration,
        delay: index * 0.1 * duration,
        ease: 'power2.out'
      });
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
      x: -0.62,
      y: 0.18,
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
      x: -0.06,
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
      gsap.to(layer.material, {
        opacity: 0,
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
    taiji.material.opacity = taiji.userData.baseOpacity * clamped;
    bloom.strength = 0.7 + clamped * 0.65;
  }

  function guide(palmX, palmY, roll, neutral) {
    if (state !== 'risen') return;
    rotateY(THREE.MathUtils.clamp(0.18 + (palmX - neutral.x) * 3, -1.4, 1.5));
    rotateX(THREE.MathUtils.clamp(-0.62 + (palmY - neutral.y) * 2.6, -1.3, 0.35));
    rotateZ(THREE.MathUtils.clamp((roll - neutral.roll) * 1.25, -0.9, 0.9));
  }

  function manualGuide(normalX, normalY) {
    if (state !== 'risen') return;
    rotateY(normalX * 0.9);
    rotateX(-0.62 + normalY * 0.45);
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
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.7);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    composer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function render() {
    requestAnimationFrame(render);
    const delta = Math.min(clock.getDelta(), 0.04);
    const time = clock.elapsedTime;
    stars.rotation.z += delta * 0.004;

    layers.forEach((layer, index) => {
      const speed = layer.userData.speed * (vortex ? 8 : 1);
      layer.rotation.z += delta * speed;
      layer.position.z = (index - (layers.length - 1) / 2) * 0.22 * spread.value;
      const breathing = 0.94 + Math.sin(time * 1.2 + index * 0.5) * 0.06;
      if (state !== 'hidden' && layer.material.opacity > 0.01) {
        layer.scale.setScalar(breathing);
      }
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
    halo.material.opacity += Math.sin(time * 0.8) * 0.00025;
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
