import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.159.0/three.module.js';
import { VRButton } from './webxr/VRButton.js';
import { XRControllerModelFactory } from './webxr/XRControllerModelFactory.js';
import { XRHandModelFactory } from './webxr/XRHandModelFactory.js';

let camera, scene, renderer;
let controller1, controller2;
let pointsCollections = [];
let audioElements;
let analyzers;
let isplaying = [false, false, false, false];
let listener;

init();
animate();

function init() {
  const container = document.createElement('div');
  document.body.appendChild(container);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

  scene.add(new THREE.HemisphereLight(0xbcbcbc, 0xa5a5a5, 3));

  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(0, 6, 0);
  light.castShadow = true;
  light.shadow.camera.top = 10;
  light.shadow.camera.bottom = -10;
  light.shadow.camera.right = 10;
  light.shadow.camera.left = -10;
  light.shadow.mapSize.set(4096, 4096);
  scene.add(light);

  const floorGeometry = new THREE.PlaneGeometry(4, 4);
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  container.appendChild(renderer.domElement);

  document.body.appendChild(VRButton.createButton(renderer));

  controller1 = renderer.xr.getController(0);
  controller1.addEventListener('select', onSelect);
  scene.add(controller1);

  const controllerModelFactory = new XRControllerModelFactory();
  const handModelFactory = new XRHandModelFactory();

  const controllerGrip1 = renderer.xr.getControllerGrip(0);
  controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
  scene.add(controllerGrip1);

  const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]);

  const line = new THREE.Line(geometry);
  line.name = 'line';
  line.scale.z = 5;

  controller1.add(line.clone());

  // Initialize Web Audio API
  listener = new THREE.AudioListener();

  audioElements = createAudioElements();
  analyzers = createAnalyzers();

  for (let i = 0; i < 4; i++) {
    const points = createPointsCollection(i);
    pointsCollections.push(points);
    scene.add(points);
  }

  listener = new THREE.AudioListener();
  camera.add(listener);
  toggleAudio(0);
  window.addEventListener('resize', onWindowResize);
}

function createAudioElements() {
  const audioFiles = [
    './sounds/drums.mp3',
    './sounds/Audio 1 (Coffee Shop).mp3',
    './sounds/Audio 2 (Walking).mp3',
    './sounds/Audio 3 - Korenmarkt.mp3',
  ];

  const elements = audioFiles.map((file) => {
    const audio = new THREE.Audio(listener);
    const loader = new THREE.AudioLoader();
    loader.load(file, function (buffer) {
      audio.setBuffer(buffer);
      audio.setLoop(true);
      audio.setVolume(0.5);
    });
    return audio;
  });

  return elements;
}

function createAnalyzers() {
  return audioElements.map((audio) => createAnalyzer(audio));
}

function createAnalyzer(audio) {
  const analyzer = new THREE.AudioAnalyser(audio, 32);
  return analyzer;
}

function createPointsCollection(index) {
  const geometry = new THREE.BufferGeometry();

  const positions = [];
  const colors = [];
  const color = new THREE.Color();

  const n = 1;

  for (let i = 0; i < 1024; i++) {
    const theta = (i / 1024) * Math.PI * 2;
    const x = Math.cos(theta) * n;
    const y = Math.random() * n + 0.5;
    const z = Math.sin(theta) * n;

    positions.push(x, y, z);

    const vx = (x / n) + 0.5;
    const vy = (y / n) + 0.5;
    const vz = (z / n) + 0.5;

    color.setRGB(vx, vy, vz);

    colors.push(color.r, color.g, color.b);
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({ size: 0.001, vertexColors: true });

  const points = new THREE.Points(geometry, material);

  return points;
}

function onSelect() {
    const controllerDirection = new THREE.Vector3(0, 0, -1);
    controllerDirection.applyQuaternion(controller1.quaternion);
  
    const referenceVector = new THREE.Vector3(0, 0, -1);
    const angle = controllerDirection.angleTo(referenceVector);
    const angleDegrees = THREE.MathUtils.radToDeg(angle);
  
    let selectedCollectionIndex = -1;
  
    let minThetaDifference = Infinity;
    for (let i = 0; i < pointsCollections.length; i++) {
      const theta = (i / pointsCollections.length) * Math.PI * 2;
      const thetaDifference = Math.abs(angle - theta);
      if (thetaDifference < minThetaDifference) {
        minThetaDifference = thetaDifference;
        selectedCollectionIndex = i;
      }
    }
  
    if (selectedCollectionIndex !== -1) {
      toggleAudio(selectedCollectionIndex);
    }
  }

function toggleAudio(index) {
  if (isplaying[index]) {
    audioElements[index].pause();
    isplaying[index] = false;
  } else {
    audioElements[index].play();
    isplaying[index] = true;
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  renderer.setAnimationLoop(render);
  requestAnimationFrame(animate);
}

function render() {
  for (let i = 0; i < pointsCollections.length; i++) {
    const analyser = analyzers[i];
    const points = pointsCollections[i];

    if (isplaying[i]) {
      const dataArray = analyser.getFrequencyData();
      const averageFrequency = dataArray.reduce((acc, value) => acc + value, 0) / dataArray.length;
      const color = new THREE.Color().setHSL(averageFrequency / 255, 1.0, 0.5);

      const positionsAttribute = points.geometry.getAttribute('position');
      const colorsAttribute = points.geometry.getAttribute('color');

      for (let j = 0; j < colorsAttribute.count; j++) {
        colorsAttribute.setXYZ(j, color.r, color.g, color.b);
      }

      const group_size = 1024 / 256;
      for (let k = 0; k < 256; k++) {
        const group = dataArray.slice(group_size * k, group_size * (k + 1));
        const averageFrequency = group.reduce((acc, value) => acc + value, 0) / group.length;
        const vibration = averageFrequency / 10;

        for (let j = 0; j < group_size; j++) {
          const x = positionsAttribute.array[k * group_size * 3 + j * 3];
          const y = positionsAttribute.array[k * group_size * 3 + j * 3 + 1];
          const z = positionsAttribute.array[k * group_size * 3 + j * 3 + 2];

          positionsAttribute.setXYZ(k * group_size + j, x + vibration, y + vibration, z);
        }
      }

      colorsAttribute.needsUpdate = true;
      positionsAttribute.needsUpdate = true;
    }
  }

  renderer.render(scene, camera);
}
