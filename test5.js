import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.159.0/three.module.js';
import { VRButton } from './webxr/VRButton.js';
import { XRControllerModelFactory } from './webxr/XRControllerModelFactory.js';
import { XRHandModelFactory } from './webxr/XRHandModelFactory.js';

let camera, scene, renderer;
let controllers = [];
let pointsCollections = [];
let audio1, audio2, audio3, audio4;
let audioFile1, audioFile2, audioFile3, audioFile4;
let analyzers;
let isplaying = [false, false, false, false];
let listener;
let group_size;
let audioFiles;
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
  audioFiles= ['./sounds/Audio 1 (Coffee Shop).mp3', './sounds/Audio 2 (Walking).mp3', './sounds/Audio 3 - Korenmarkt.mp3', './sounds/drums.mp3'];
  // Create audio elements, analyzers, and points collections
  // Initialize Web Audio API
  listener = new THREE.AudioListener();

  // Create an Audio object and link it to the listener
  audio1 = new THREE.Audio(listener);
  audio2 = new THREE.Audio(listener);
  audio3 = new THREE.Audio(listener);
  audio4 = new THREE.Audio(listener);

  // Load an audio file
  audioFile1 = './sounds/drums.mp3'; // Change to your audio file
  audioFile2 = './sounds/Audio 1 (Coffee Shop).mp3'; // Change to your audio file
  audioFile3 = './sounds/Audio 2 (Walking).mp3'; // Change to your audio file
  audioFile4 = './sounds/Audio 3 - Korenmarkt.mp3'; // Change to your audio file

  // Load audio using THREE.AudioLoader
  const loader1 = new THREE.AudioLoader();
  
  loader1.load(audioFile1, function (buffer) {
    audio1.setBuffer(buffer);
    audio1.setLoop(true); // Set to true if you want the audio to loop
    audio1.setVolume(0.5); // Adjust the volume if needed
  });
  const loader2 = new THREE.AudioLoader();
  loader2.load(audioFile2, function (buffer) {
	audio2.setBuffer(buffer);
	audio2.setLoop(true); // Set to true if you want the audio to loop
	audio2.setVolume(0.5); // Adjust the volume if needed
  }
  );
  const loader3 = new THREE.AudioLoader();
  loader3.load(audioFile3, function (buffer) {
	audio3.setBuffer(buffer);
	audio3.setLoop(true); // Set to true if you want the audio to loop
	audio3.setVolume(0.5); // Adjust the volume if needed
  }
  );
  const loader4 = new THREE.AudioLoader();
  loader4.load(audioFile4, function (buffer) {
	audio4.setBuffer(buffer);
	audio4.setLoop(true); // Set to true if you want the audio to loop
	audio4.setVolume(0.5); // Adjust the volume if needed
  }
  );
  
  let audioElements = [audio1, audio2, audio3, audio4];
  analyzers = [createAnalyzer(audio1), createAnalyzer(audio2), createAnalyzer(audio3), createAnalyzer(audio4)];

    const points = createPointsCollection(i);
    pointsCollections.push(points);
    scene.add(points);

    const positions_original = points.geometry.getAttribute('position');
    const positions_fixed = positions_original.clone();
    Object.freeze(positions_fixed);
    positions_fixed_array.push(positions_fixed);


  listener = new THREE.AudioListener();
  camera.add(listener);
  window.addEventListener('resize', onWindowResize);
}

function createAnalyzer(audio) {
	const analyzer = new THREE.AudioAnalyser(audio, 32); // 32 frequency bands
	return analyzer;
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
