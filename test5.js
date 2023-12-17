import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.159.0/three.module.js';
import { VRButton } from './webxr/VRButton.js';
import { XRControllerModelFactory } from './webxr/XRControllerModelFactory.js';
import { XRHandModelFactory } from './webxr/XRHandModelFactory.js';

let camera, scene, renderer;
let controllers = [];
let pointsCollections = [];
let audioElements = [];
let analyzers = [];
let isplaying = [false, false, false, false];
let listener;
let group_size;
let particles = 1024;
let numBands = 256;
let positions_fixed_array = [];

init();
animate();

function init() {
  const container = document.createElement('div');
  document.body.appendChild(container);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

  // ... (Lighting setup and floor)

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  container.appendChild(renderer.domElement);

  document.body.appendChild(VRButton.createButton(renderer));

  // Create controllers
  for (let i = 0; i < 2; i++) {
    const controller = renderer.xr.getController(i);
    controller.addEventListener('selectstart', onSelectStart);
    controller.addEventListener('selectend', onSelectEnd);
    scene.add(controller);
    controllers.push(controller);

    const controllerGrip = renderer.xr.getControllerGrip(i);
    controllerGrip.add(new XRControllerModelFactory().createControllerModel(controllerGrip));
    scene.add(controllerGrip);
  }

  // Create audio elements, analyzers, and points collections
  for (let i = 0; i < 4; i++) {
    const audio = new THREE.Audio(listener);
    const audioFile = `./sounds/drums_${i + 1}.mp3`; // Change to your audio file names
    const loader = new THREE.AudioLoader();
    loader.load(audioFile, function (buffer) {
      audio.setBuffer(buffer);
      audio.setLoop(true);
      audio.setVolume(0.5);
    });
    audio.pause();
    audioElements.push(audio);

    const analyzer = new THREE.AudioAnalyser(audio, numBands);
    analyzers.push(analyzer);

    const points = createPointsCollection(i);
    pointsCollections.push(points);
    scene.add(points);

    const positions_original = points.geometry.getAttribute('position');
    const positions_fixed = positions_original.clone();
    Object.freeze(positions_fixed);
    positions_fixed_array.push(positions_fixed);
  }

  listener = new THREE.AudioListener();
  camera.add(listener);
  window.addEventListener('resize', onWindowResize);
}

function createPointsCollection(index) {
  const geometry = new THREE.BufferGeometry();

  const positions = [];
  const colors = [];
  const color = new THREE.Color();

  const n = 1; // distribute points in a cube of size 1 around the origin

  for (let i = 0; i < particles; i++) {
    const theta = (i / particles) * Math.PI * 2; // Spread points equally around the origin
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

function onSelectStart(event) {
  const controller = event.target;
  const intersections = getIntersections(controller);
  if (intersections.length > 0) {
    const intersection = intersections[0];
    const index = controllers.indexOf(controller);
    toggleAudio(index);
  }
}

function onSelectEnd() {
  // Handle the selectend event here if needed
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

function getIntersections(controller) {
  const tempMatrix = new THREE.Matrix4();
  const direction = new THREE.Vector3();
  const raycaster = new THREE.Raycaster();
  const intersections = [];

  controller.getWorldDirection(direction);
  raycaster.set(controller.position, direction.negate());

  // Check for intersection with points
  const intersectedObjects = [pointsCollections[index]];
  const intersects = raycaster.intersectObjects(intersectedObjects);

  if (intersects.length > 0) {
    intersections.push(intersects[0]);
  }

  return intersections;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  renderer.setAnimationLoop(render);

  // Add this line to continuously update the animation
  requestAnimationFrame(animate);
}

function render() {
  for (let i = 0; i < controllers.length; i++) {
    const controller = controllers[i];
    const analyser = analyzers[i];
    const points = pointsCollections[i];
    const positions_fixed = positions_fixed_array[i]; // Use the correct positions_fixed array

    if (isplaying[i]) {
      const dataArray = analyser.getFrequencyData();
      const averageFrequency = dataArray.reduce((acc, value) => acc + value, 0) / dataArray.length;
      const color = new THREE.Color().setHSL(averageFrequency / 255, 1.0, 0.5);

      const positionsAttribute = points.geometry.getAttribute('position');
      const colorsAttribute = points.geometry.getAttribute('color');

      for (let j = 0; j < colorsAttribute.count; j++) {
        colorsAttribute.setXYZ(j, color.r, color.g, color.b);
      }

      const group_size = particles / numBands;
      for (let k = 0; k < numBands; k++) {
        const group = dataArray.slice(group_size * k, group_size * (k + 1));
        const averageFrequency = group.reduce((acc, value) => acc + value, 0) / group.length;
        const vibration = averageFrequency / 10;

        for (let j = 0; j < group_size; j++) {
          const x = positions_fixed.array[k * group_size * 3 + j * 3];
          const y = positions_fixed.array[k * group_size * 3 + j * 3 + 1];
          const z = positions_fixed.array[k * group_size * 3 + j * 3 + 2];

          positionsAttribute.setXYZ(k * group_size + j, x + vibration, y + vibration, z);
        }
      }

      colorsAttribute.needsUpdate = true;
      positionsAttribute.needsUpdate = true;
    }
  }

  renderer.render(scene, camera);
}
