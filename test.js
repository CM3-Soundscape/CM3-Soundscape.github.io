import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.159.0/three.module.js';
import { VRButton } from './webxr/VRButton.js';
import { XRControllerModelFactory } from './webxr/XRControllerModelFactory.js';
import { XRHandModelFactory } from './webxr/XRHandModelFactory.js';

let camera, scene, renderer;
let controller1;
let planes = [];
let planeMaterials;
let analyzers;
let isplaying = [false, false, false, false];

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
  light.shadow.camera.top = 2;
  light.shadow.camera.bottom = -2;
  light.shadow.camera.right = 2;
  light.shadow.camera.left = -2;
  light.shadow.mapSize.set(4096, 4096);
  scene.add(light);

  const floorGeometry = new THREE.PlaneGeometry(4, 4);
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
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

  listener = new THREE.AudioListener();
  camera.add(listener);

  const audioFiles = ['./sounds/drums.mp3', './sounds/Audio 1 (Coffee Shop).mp3', './sounds/Audio 2 (Walking).mp3', './sounds/Audio 3 - Korenmarkt.mp3'];

  audioFiles.forEach((audioFile, index) => {
    const audio = new THREE.Audio(listener);
    const loader = new THREE.AudioLoader();

    loader.load(audioFile, function (buffer) {
      audio.setBuffer(buffer);
      audio.setLoop(true);
      audio.setVolume(0.5);
      analyzers[index] = createAnalyzer(audio);
      planes[index] = createRandomizedPlane(index);
      scene.add(planes[index]);
    });
  });

  window.addEventListener('resize', onWindowResize);
}

function createRandomizedPlane(index) {
  const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const material = new THREE.MeshStandardMaterial({ color: getRandomColor(), side: THREE.DoubleSide });
  const plane = new THREE.Mesh(geometry, material);
  const position = getRandomPosition();
  plane.position.set(position.x, position.y, position.z);
  return plane;
}

function getRandomColor() {
  return new THREE.Color(Math.random(), Math.random(), Math.random());
}

function getRandomPosition() {
  const x = Math.random() * 4 - 2;
  const y = Math.random() * 2;
  const z = Math.random() * 4 - 2;
  return { x, y, z };
}

// Rest of the code remains unchanged


function createAnalyzer(audio) {
	const analyzer = new THREE.AudioAnalyser(audio, 32); // 32 frequency bands
	return analyzer;
  }
  

function onSelect() {
	const intersections = getIntersections(controller1);
  
	if (intersections.length > 0) {
	  const intersectedObject = intersections[0].object;
  
	  // Pause and play the audio to trigger a restart
	  if (intersectedObject == plane1) {
		//planeMaterials[0].color.setRGB(Math.random(), Math.random(), Math.random());
		toggleAudio(audio1, 0);
	  } else if (intersectedObject == plane2) {
		//planeMaterials[1].color.setRGB(Math.random(), Math.random(), Math.random());
		toggleAudio(audio2, 1);
	  } else if (intersectedObject == plane3) {
		//planeMaterials[2].color.setRGB(Math.random(), Math.random(), Math.random());
		toggleAudio(audio3, 2);
	  } else if (intersectedObject == plane4) {
		//planeMaterials[3].color.setRGB(Math.random(), Math.random(), Math.random());
		toggleAudio(audio4, 3);
	  }
	}
  }
  
  function toggleAudio(audio, index) {
	if (isplaying[index]) {
	  audio.pause();
	  isplaying[index] = false;
	} else {
	  audio.play();
	  isplaying[index] = true;
	}
  }

  function getIntersections(controller1) {
	const tempMatrix = new THREE.Matrix4();
	const raycaster = new THREE.Raycaster();
	const intersections = [];
  
	// Update the raycaster with the controller's position and direction
	const controllerMatrix = controller1.matrixWorld;
	raycaster.ray.origin.setFromMatrixPosition(controllerMatrix);
	raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix.identity().extractRotation(controllerMatrix));
  
	// Check for intersections with each plane
	const planes = [plane1, plane2, plane3, plane4];
	for (const plane of planes) {
	  const intersection = raycaster.intersectObject(plane);
	  if (intersection.length > 0) {
		intersections.push(intersection[0]);
	  }
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
}

function render() {
	analyzers.forEach((analyzer, index) => {
		if (!isplaying[index]) return;
		const dataArray = analyzer.getFrequencyData();
	
		// Calculate the average frequency to determine color
		const averageFrequency = dataArray.reduce((acc, value) => acc + value, 0) / dataArray.length;
		const color = new THREE.Color().setHSL(averageFrequency / 255, 1.0, 0.5);
	
		// Update plane color
		planeMaterials[index].color = color;

	
	});

  renderer.render(scene, camera);
}