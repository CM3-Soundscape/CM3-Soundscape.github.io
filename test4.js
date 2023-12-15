import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.159.0/three.module.js';
import { VRButton } from './webxr/VRButton.js';
import { XRControllerModelFactory } from './webxr/XRControllerModelFactory.js';
import { XRHandModelFactory } from './webxr/XRHandModelFactory.js';

let camera, scene, renderer;
let controller1, controller2;
let points;
let isplaying = false;
let audio;
let audioFile;
let listener;
let averageFrequency = 0;
let analyser;
let geometry2;
let positions_original;
let position_i;
let x_original;
let y_original;
let z_original

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

  const particles = 50000;

  const geometry2 = new THREE.BufferGeometry();

  const positions = [];
  const colors = [];

  const color = new THREE.Color();

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

  geometry2.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry2.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  

  const material = new THREE.PointsMaterial({ size: 0.001, vertexColors: true });

  points = new THREE.Points(geometry2, material);
  scene.add(points);
  positions_original = points.geometry.getAttribute('position');
  //
  

  listener = new THREE.AudioListener();

  // Create an Audio object and link it to the listener
  audio = new THREE.Audio(listener);
  audioFile = './sounds/drums.mp3'; // Change to your audio file
  const loader = new THREE.AudioLoader();
  loader.load(audioFile, function (buffer) {
    audio.setBuffer(buffer);
    audio.setLoop(true); // Set to true if you want the audio to loop
    audio.setVolume(0.5); // Adjust the volume if needed
  });
  audio.pause();
  
  analyser = new THREE.AudioAnalyser(audio, 32);

  camera.add(listener);

  window.addEventListener('resize', onWindowResize);
}

function onSelectStart(event) {
  const controller = event.target;
  const intersections = getIntersections(controller);
  if (intersections.length > 0) {
    const intersection = intersections[0];
    toggleAudio(audio);
  }
}

function onSelectEnd() {
  // Handle the selectend event here if needed
}

function toggleAudio(audio) {
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
  //check if analyser needs update?

  // Update the average frequency
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
  for (let i = 0; i < positionsAttribute.count; i++) {
    // Get the original position
    const x = positions_original.array[i * 3];
    const y = positions_original.array[i * 3 + 1];
    const z = positions_original.array[i * 3 + 2];

    const vibration = averageFrequency/100;

    // Update the y-coordinate based on the vibration
    positionsAttribute.setXYZ(i, x+ vibration, y + vibration, z + vibration);
  }

  // Mark the colors attribute as needing an update
  colorsAttribute.needsUpdate = true;
  // Mark the positions attribute as needing an update
  positionsAttribute.needsUpdate = true;
  renderer.render(scene, camera);
}