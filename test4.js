import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.159.0/three.module.js';
import { VRButton } from './webxr/VRButton.js';
import { XRControllerModelFactory } from './webxr/XRControllerModelFactory.js';
import { XRHandModelFactory } from './webxr/XRHandModelFactory.js';

let camera, scene, renderer;
let controller1, controller2;
let points;
let points2;
let points3;
let points4;
let isplaying = false;
let audio1;
let audio2;
let audio3;
let audio4;
let audioFile1;
let audioFile2;
let audioFile3;
let audioFile4;
let listener;
let averageFrequency = 0;
let analyser;
let geometry2;
let positions_original;
let positions_fixed;
let positions_original2;
let positions_fixed2;
let positions_original3;
let positions_fixed3;
let positions_original4;
let positions_fixed4;
let particles = 1024;
let numBands = 1024;
let group_size;

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
  controller1.addEventListener('selectstart', onSelectStart);
  controller1.addEventListener('selectend', onSelectEnd);
  scene.add(controller1);

  controller2 = renderer.xr.getController(1);
  controller2.addEventListener('selectstart', onSelectStart);
  controller2.addEventListener('selectend', onSelectEnd);
  scene.add(controller2);

  const controllerModelFactory = new XRControllerModelFactory();

  // Hand 1
  const controllerGrip1 = renderer.xr.getControllerGrip(0);
  controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
  scene.add(controllerGrip1);

  // Hand 2
  const controllerGrip2 = renderer.xr.getControllerGrip(1);
  controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
  scene.add(controllerGrip2);

  const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]);

  const line = new THREE.Line(geometry);
  line.name = 'line';
  line.scale.z = 5;

  controller1.add(line.clone());
  controller2.add(line.clone());

  const geometry2 = new THREE.BufferGeometry();
  const geometry3 = new THREE.BufferGeometry();
  const geometry4 = new THREE.BufferGeometry();
  const geometry5 = new THREE.BufferGeometry();

  const positions = [];
  const positions2 = [];
  const positions3 = [];
  const positions4 = [];
  const colors = [];
  const colors2 = [];
  const colors3 = [];
  const colors4 = [];

  const color = new THREE.Color();
  const color2 = new THREE.Color();
  const color3 = new THREE.Color();
  const color4 = new THREE.Color();

  const n = 1; // distribute points in a cube of size 1 around (-1, 0.5, -1)

  for (let i = 0; i < particles; i++) {

    // positions

    const x = (Math.random() - 0.5) * n + 1;
    const y = Math.random() * n + 0.5;
    const z = (Math.random() - 0.5) * n + 1;

    positions.push(x, y, z);

    // colors

    const vx = (x / n) + 0.5;
    const vy = (y / n) + 0.5;
    const vz = (z / n) + 0.5;

    color.setRGB(vx, vy, vz);

    colors.push(color.r, color.g, color.b);

  }
  for (let i = 0; i < particles; i++) {

    // positions

    const x2 = (Math.random() - 0.5) * n + 1;
    const y2 = Math.random() * n + 0.5;
    const z2 = (Math.random() - 0.5) * n - 1;

    positions2.push(x2, y2, z2);

    // colors

    const vx = (x2 / n) + 0.5;
    const vy = (y2 / n) + 0.5;
    const vz = (z2 / n) + 0.5;

    color2.setRGB(vx, vy, vz);

    colors2.push(color2.r, color2.g, color2.b);

  }
  for (let i = 0; i < particles; i++) {

    // positions

    const x3 = (Math.random() - 0.5) * n - 1;
    const y3 = Math.random() * n + 0.5;
    const z3 = (Math.random() - 0.5) * n + 1;

    positions3.push(x3, y3, z3);

    // colors

    const vx = (x3 / n) + 0.5;
    const vy = (y3 / n) + 0.5;
    const vz = (z3 / n) + 0.5;

    color3.setRGB(vx, vy, vz);

    colors3.push(color3.r, color3.g, color3.b);

  }
  for (let i = 0; i < particles; i++) {

    // positions

    const x4 = (Math.random() - 0.5) * n - 1;
    const y4 = Math.random() * n + 0.5;
    const z4 = (Math.random() - 0.5) * n - 1;

    positions4.push(x4, y4, z4);

    // colors

    const vx = (x4 / n) + 0.5;
    const vy = (y4 / n) + 0.5;
    const vz = (z4 / n) + 0.5;

    color4.setRGB(vx, vy, vz);

    colors4.push(color4.r, color4.g, color4.b);

  }

  geometry2.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry2.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  geometry3.setAttribute('position', new THREE.Float32BufferAttribute(positions2, 3));
  geometry3.setAttribute('color', new THREE.Float32BufferAttribute(colors2, 3));

  geometry4.setAttribute('position', new THREE.Float32BufferAttribute(positions3, 3));
  geometry4.setAttribute('color', new THREE.Float32BufferAttribute(colors3, 3));

  geometry5.setAttribute('position', new THREE.Float32BufferAttribute(positions4, 3));
  geometry5.setAttribute('color', new THREE.Float32BufferAttribute(colors4, 3));
  

  const material = new THREE.PointsMaterial({ size: 0.001, vertexColors: true });

  points = new THREE.Points(geometry2, material);
  scene.add(points);
  points2 = new THREE.Points(geometry3, material);
  scene.add(points2);
  points3 = new THREE.Points(geometry4, material);
  scene.add(points3);
  points4 = new THREE.Points(geometry5, material);
  scene.add(points4);
  positions_original = points.geometry.getAttribute('position');
  positions_original2 = points2.geometry.getAttribute('position');
  positions_original3 = points3.geometry.getAttribute('position');
  positions_original4 = points4.geometry.getAttribute('position');

  positions_fixed = positions_original.clone();
  positions_fixed2 = positions_original2.clone();
  positions_fixed3 = positions_original3.clone();
  positions_fixed4 = positions_original4.clone();
  Object.freeze(positions_fixed);
  Object.freeze(positions_fixed2);
  Object.freeze(positions_fixed3);
  Object.freeze(positions_fixed4);
  //
  

  listener = new THREE.AudioListener();

  audio1 = new THREE.Audio(listener);
  audioFile1 = './sounds/drums.mp3';
  loadAudio(audio1, audioFile1);

  audio2 = new THREE.Audio(listener);
  audioFile2 = './sounds/audio2.mp3'; // Change to your audio file
  loadAudio(audio2, audioFile2);

  audio3 = new THREE.Audio(listener);
  audioFile3 = './sounds/audio3.mp3'; // Change to your audio file
  loadAudio(audio3, audioFile3);

  audio4 = new THREE.Audio(listener);
  audioFile4 = './sounds/audio4.mp3'; // Change to your audio file
  loadAudio(audio4, audioFile4);

  analyser = new THREE.AudioAnalyser(audio1, numBands);
  analyser2 = new THREE.AudioAnalyser(audio2, numBands);
  analyser3 = new THREE.AudioAnalyser(audio3, numBands);
  analyser4 = new THREE.AudioAnalyser(audio4, numBands);

  camera.add(listener);

  camera.add(listener);

  window.addEventListener('resize', onWindowResize);
}

function onSelectStart(event) {
  const controller = event.target;
  const intersections = getIntersections(controller);

  if (intersections.length > 0) {
    const intersection = intersections[0];

    if (intersection.object === points) {
      toggleAudio(audio1, isplaying);
    } else if (intersection.object === points2) {
      toggleAudio(audio2, isplaying2);
    } else if (intersection.object === points3) {
      toggleAudio(audio3, isplaying3);
    } else if (intersection.object === points4) {
      toggleAudio(audio4, isplaying4);
    }
  }
}


function onSelectEnd() {
  // Handle the selectend event here if needed
}

function loadAudio(audio, file) {
  const loader = new THREE.AudioLoader();
  loader.load(file, function (buffer) {
    audio.setBuffer(buffer);
    audio.setLoop(true);
    audio.setVolume(0.5);
  });
  audio.pause();
}

function toggleAudio(audio, isplaying) {
  if (isplaying) {
    audio.pause();
    isplaying = false;
  } else {
    audio.play();
    isplaying = true;
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
  const intersectedObjects = [points];
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

// ...

function animate() {
  renderer.setAnimationLoop(render);

  // Add this line to continuously update the animation
  requestAnimationFrame(animate);
}


function render() {
  // Update the average frequency
  if (isplaying) {
   
  const dataArray = analyser.getFrequencyData();
  const averageFrequency = dataArray.reduce((acc, value) => acc + value, 0) / dataArray.length;
	const color = new THREE.Color().setHSL(averageFrequency / 255, 1.0, 0.5);

  // Access the position and color attributes
  const positionsAttribute = points.geometry.getAttribute('position');
  const colorsAttribute = points.geometry.getAttribute('color');

  // Iterate through each vertex and update its color
  for (let i = 0; i < colorsAttribute.count; i++) {
    colorsAttribute.setXYZ(i, color.r, color.g, color.b);
  }
  const group_size = particles/numBands;
  for (let j = 0; j < numBands; j++) {
    const group = dataArray.slice(group_size * j, group_size * (j + 1));
    const averageFrequency = group.reduce((acc, value) => acc + value, 0) / group.length;
    const vibration = averageFrequency/10;
  
    for (let i = 0; i < group_size; i++) {
      // Get the original position
      const x = positions_fixed.array[j * group_size * 3 + i * 3];
      const y = positions_fixed.array[j * group_size * 3 + i * 3 + 1];
      const z = positions_fixed.array[j * group_size * 3 + i * 3 + 2];
  
      // Update the y-coordinate based on the vibration
      positionsAttribute.setXYZ(j * group_size + i, x+ vibration , y + vibration, z);
    }
  }
  // Mark the colors attribute as needing an update
  colorsAttribute.needsUpdate = true;
  // Mark the positions attribute as needing an update
  positionsAttribute.needsUpdate = true;
}
  renderer.render(scene, camera);
}