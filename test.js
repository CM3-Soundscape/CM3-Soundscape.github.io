import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import {VRButton} from './webxr/VRButton.js';
import {XRControllerModelFactory} from './webxr/XRControllerModelFactory.js';
import {XRHandModelFactory} from './webxr/XRHandModelFactory.js';

let container;
let audio1, audio2, audio3, audio4;
let audioFile1, audioFile2, audioFile3, audioFile4;
let analyzers;
let geometry2;
let controller1;
let isplaying = [false,false,false,false];
let camera, scene, renderer;
let listener;
let mesh;

init();
animate();

function init() {

    container = document.getElementById( 'container' );

    //

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
    camera.position.z = 50;

    scene = new THREE.Scene();
 /*    scene.background = new THREE.Color( 0x050505 );
    scene.fog = new THREE.Fog( 0x050505, 2000, 3500 ); */

    //

    /* scene.add( new THREE.AmbientLight( 0xcccccc ) );

    const light1 = new THREE.DirectionalLight( 0xffffff, 1.5 );
    light1.position.set( 1, 1, 1 );
    scene.add( light1 );

    const light2 = new THREE.DirectionalLight( 0xffffff, 4.5 );
    light2.position.set( 0, - 1, 0 );
    scene.add( light2 ); */

    //

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

  analyzers = [createAnalyzer(audio1), createAnalyzer(audio2), createAnalyzer(audio3), createAnalyzer(audio4)];

  // Attach the listener to the camera
  camera.add(listener);

  //

    const triangles = 32;

    const geometry = new THREE.BufferGeometry();

    const positions = [];
    const normals = [];
    const colors = [];

    const color = new THREE.Color();

    const n = 5, n2 = n / 2;	// triangles spread in the cube
    const d = 0.5, d2 = d / 2;	// individual triangle size

    const pA = new THREE.Vector3();
    const pB = new THREE.Vector3();
    const pC = new THREE.Vector3();

    const cb = new THREE.Vector3();
    const ab = new THREE.Vector3();

    for ( let i = 0; i < triangles; i ++ ) {

        // positions

        const x = Math.random() * n - n2;
        const y = Math.random() * n - n2;
        const z = Math.random() * n - n2;

        const ax = x + Math.random() * d - d2;
        const ay = y + Math.random() * d - d2;
        const az = z + Math.random() * d - d2;

        const bx = x + Math.random() * d - d2;
        const by = y + Math.random() * d - d2;
        const bz = z + Math.random() * d - d2;

        const cx = x + Math.random() * d - d2;
        const cy = y + Math.random() * d - d2;
        const cz = z + Math.random() * d - d2;

        positions.push( ax, ay, az );
        positions.push( bx, by, bz );
        positions.push( cx, cy, cz );

        // flat face normals

        pA.set( ax, ay, az );
        pB.set( bx, by, bz );
        pC.set( cx, cy, cz );

        cb.subVectors( pC, pB );
        ab.subVectors( pA, pB );
        cb.cross( ab );

        cb.normalize();

        const nx = cb.x;
        const ny = cb.y;
        const nz = cb.z;

        normals.push( nx, ny, nz );
        normals.push( nx, ny, nz );
        normals.push( nx, ny, nz );

        // colors

        const vx = ( x / n ) + 0.5;
        const vy = ( y / n ) + 0.5;
        const vz = ( z / n ) + 0.5;

        color.setRGB( vx, vy, vz );

        const alpha = Math.random();

        colors.push( color.r, color.g, color.b, alpha );
        colors.push( color.r, color.g, color.b, alpha );
        colors.push( color.r, color.g, color.b, alpha );

    }

    function disposeArray() {

        this.array = null;

    }

    geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ).onUpload( disposeArray ) );
    geometry.setAttribute( 'normal', new THREE.Float32BufferAttribute( normals, 3 ).onUpload( disposeArray ) );
    geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 4 ).onUpload( disposeArray ) );

    geometry.computeBoundingBox();

    const material = new THREE.MeshPhongMaterial( {
        color: 0xd5d5d5, specular: 0xffffff, shininess: 250,
        side: THREE.DoubleSide, vertexColors: true, transparent: true
    } );

    mesh = new THREE.Mesh( geometry, material );
    scene.add( mesh );

    //

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  container.appendChild(renderer.domElement);

  document.body.appendChild(VRButton.createButton(renderer));

  /* controller1 = renderer.xr.getController(0);
  controller1.addEventListener('select', onSelect);
  scene.add(controller1);

  const controllerModelFactory = new XRControllerModelFactory();
	const handModelFactory = new XRHandModelFactory();

	// Hand 1
	const controllerGrip1 = renderer.xr.getControllerGrip( 0 );
	controllerGrip1.add( controllerModelFactory.createControllerModel( controllerGrip1 ) );
	scene.add( controllerGrip1 ); */

	/* hand1 = renderer.xr.getHand( 0 );
	hand1.add( handModelFactory.createHandModel( hand1 ) );

	scene.add( hand1 ); */

  /* const geometry2 = new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, - 1 ) ] );

  const line = new THREE.Line( geometry2 );
  line.name = 'line';
  line.scale.z = 5;

  controller1.add( line.clone() ); */

    //
    scene.scale.set(0.01, 0.01, 0.01);
    window.addEventListener( 'resize', onWindowResize );

}

function createAnalyzer(audio) {
	const analyzer = new THREE.AudioAnalyser(audio, 32); // 32 frequency bands
	return analyzer;
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

function onSelect() {
  toggleAudio(audio1, 0);
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

//

function animate() {

    renderer.setAnimationLoop(render);

}

function render() {

    const time = Date.now() * 0.001;

    mesh.rotation.x = time * 0.25;
    mesh.rotation.y = time * 0.5;

    renderer.render( scene, camera );

}
