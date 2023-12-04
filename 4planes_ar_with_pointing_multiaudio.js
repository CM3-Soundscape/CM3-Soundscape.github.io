// import * as THREE from 'three';
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

class ARButton {

	static createButton( renderer, sessionInit = {} ) {

		const button = document.createElement( 'button' );

		function showStartAR( /*device*/ ) {

			if ( sessionInit.domOverlay === undefined ) {

				const overlay = document.createElement( 'div' );
				overlay.style.display = 'none';
				document.body.appendChild( overlay );

				const svg = document.createElementNS( 'http://www.w3.org/2000/svg', 'svg' );
				svg.setAttribute( 'width', 38 );
				svg.setAttribute( 'height', 38 );
				svg.style.position = 'absolute';
				svg.style.right = '20px';
				svg.style.top = '20px';
				svg.addEventListener( 'click', function () {

					currentSession.end();

				} );
				overlay.appendChild( svg );

				const path = document.createElementNS( 'http://www.w3.org/2000/svg', 'path' );
				path.setAttribute( 'd', 'M 12,12 L 28,28 M 28,12 12,28' );
				path.setAttribute( 'stroke', '#fff' );
				path.setAttribute( 'stroke-width', 2 );
				svg.appendChild( path );

				if ( sessionInit.optionalFeatures === undefined ) {

					sessionInit.optionalFeatures = [];

				}

				sessionInit.optionalFeatures.push( 'dom-overlay' );
				sessionInit.domOverlay = { root: overlay };

			}

			//

			let currentSession = null;

			async function onSessionStarted( session ) {

				session.addEventListener( 'end', onSessionEnded );

				renderer.xr.setReferenceSpaceType( 'local' );

				await renderer.xr.setSession( session );

				button.textContent = 'STOP AR';
				sessionInit.domOverlay.root.style.display = '';

				currentSession = session;

			}

			function onSessionEnded( /*event*/ ) {

				currentSession.removeEventListener( 'end', onSessionEnded );

				button.textContent = 'START AR';
				sessionInit.domOverlay.root.style.display = 'none';

				currentSession = null;

			}

			//

			button.style.display = '';

			button.style.cursor = 'pointer';
			button.style.left = 'calc(50% - 50px)';
			button.style.width = '100px';

			button.textContent = 'START AR';

			button.onmouseenter = function () {

				button.style.opacity = '1.0';

			};

			button.onmouseleave = function () {

				button.style.opacity = '0.5';

			};

			button.onclick = function () {

				if ( currentSession === null ) {

					navigator.xr.requestSession( 'immersive-ar', sessionInit ).then( onSessionStarted );

				} else {

					currentSession.end();

				}

			};

		}

		function disableButton() {

			button.style.display = '';

			button.style.cursor = 'auto';
			button.style.left = 'calc(50% - 75px)';
			button.style.width = '150px';

			button.onmouseenter = null;
			button.onmouseleave = null;

			button.onclick = null;

		}

		function showARNotSupported() {

			disableButton();

			button.textContent = 'AR NOT SUPPORTED';

		}

		function showARNotAllowed( exception ) {

			disableButton();

			console.warn( 'Exception when trying to call xr.isSessionSupported', exception );

			button.textContent = 'AR NOT ALLOWED';

		}

		function stylizeElement( element ) {

			element.style.position = 'absolute';
			element.style.bottom = '20px';
			element.style.padding = '12px 6px';
			element.style.border = '1px solid #fff';
			element.style.borderRadius = '4px';
			element.style.background = 'rgba(0,0,0,0.1)';
			element.style.color = '#fff';
			element.style.font = 'normal 13px sans-serif';
			element.style.textAlign = 'center';
			element.style.opacity = '0.5';
			element.style.outline = 'none';
			element.style.zIndex = '999';

		}

		if ( 'xr' in navigator ) {

			button.id = 'ARButton';
			button.style.display = 'none';

			stylizeElement( button );

			navigator.xr.isSessionSupported( 'immersive-ar' ).then( function ( supported ) {

				supported ? showStartAR() : showARNotSupported();

			} ).catch( showARNotAllowed );

			return button;

		} else {

			const message = document.createElement( 'a' );

			if ( window.isSecureContext === false ) {

				message.href = document.location.href.replace( /^http:/, 'https:' );
				message.innerHTML = 'WEBXR NEEDS HTTPS'; // TODO Improve message

			} else {

				message.href = 'https://immersiveweb.dev/';
				message.innerHTML = 'WEBXR NOT AVAILABLE';

			}

			message.style.left = 'calc(50% - 90px)';
			message.style.width = '180px';
			message.style.textDecoration = 'none';

			stylizeElement( message );

			return message;

		}

	}

}

let camera, scene, renderer;
let controller;
let plane1, plane2, plane3, plane4; // New variables for the planes
let planes = [plane1, plane2, plane3, plane4]; // Array to store the planes
let planeMaterials; // Array to store materials for both planes
let listener;
let audio1, audio2, audio3, audio4;
let audioFile1, audioFile2, audioFile3, audioFile4;
let isplaying = false;

init();
animate();

function init() {
  const container = document.createElement('div');
  document.body.appendChild(container);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 3);
  light.position.set(0.5, 1, 0.25);
  scene.add(light);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  container.appendChild(renderer.domElement);

  document.body.appendChild(ARButton.createButton(renderer));

  // Initialize Web Audio API
  listener = new THREE.AudioListener();

  // Create an Audio object and link it to the listener
  audio1 = new THREE.Audio(listener);
  audio2 = new THREE.Audio(listener);
  audio3 = new THREE.Audio(listener);
  audio4 = new THREE.Audio(listener);

  // Load an audio file
  audioFile1 = './sounds/drums.mp3'; // Change to your audio file
  audioFile2 = './sounds/beat_music.mp3'; // Change to your audio file
  audioFile3 = './sounds/piano_music.mp3'; // Change to your audio file
  audioFile4 = './sounds/relax_music.mp3'; // Change to your audio file

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

  // Attach the listener to the camera
  camera.add(listener);


  // Create an array to store materials for both planes
  planeMaterials = [
    new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide }), // Red material for plane1
    new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide }), // Green material for plane2
	new THREE.MeshBasicMaterial({ color: 0x0000ff, side: THREE.DoubleSide }), // Blue material for plane3
	new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide }), // Yellow material for plane4
  ];

  // Create the first plane and position it
  const geometry1 = new THREE.PlaneGeometry(0.5, 0.5);
  plane1 = new THREE.Mesh(geometry1, planeMaterials[0]);
  plane1.position.set(-1, 0, -1); // Move the first plane to the left
  plane1.rotateY(Math.PI / 4); // Rotate the plane 45 degrees
  scene.add(plane1);

  // Create the second plane and position it
  const geometry2 = new THREE.PlaneGeometry(0.5, 0.5);
  plane2 = new THREE.Mesh(geometry2, planeMaterials[1]);
  plane2.position.set(1, 0, -1); // Move the second plane to the right
  plane2.rotateY( - Math.PI / 4); // Rotate the plane -45 degrees
  scene.add(plane2);

  // Create the third plane and position it
  const geometry3 = new THREE.PlaneGeometry(0.5, 0.5);
  plane3 = new THREE.Mesh(geometry3, planeMaterials[2]);
  plane3.position.set(-1, 0, 1); // Move the third plane to the left
  plane3.rotateY(-Math.PI / 4); // Rotate the plane -45 degrees
  scene.add(plane3);

  // Create the fourth plane and position it
  const geometry4 = new THREE.PlaneGeometry(0.5, 0.5);
  plane4 = new THREE.Mesh(geometry4, planeMaterials[3]);
  plane4.position.set(1, 0, 1); // Move the fourth plane to the right
  plane4.rotateY(Math.PI / 4); // Rotate the plane 45 degrees
  scene.add(plane4);

  controller = renderer.xr.getController(0);
  controller.addEventListener('select', onSelect);
  scene.add(controller);

  window.addEventListener('resize', onWindowResize);
}

function onSelect() {
	const intersections = getIntersections(controller);
  
	if (intersections.length > 0) {
	  const intersectedObject = intersections[0].object;
  
	  // Pause and play the audio to trigger a restart
	  if (intersectedObject == plane1) {
		planeMaterials[0].color.setRGB(Math.random(), Math.random(), Math.random());
		toggleAudio(audio1);
	  } else if (intersectedObject == plane2) {
		planeMaterials[1].color.setRGB(Math.random(), Math.random(), Math.random());
		toggleAudio(audio2);
	  } else if (intersectedObject == plane3) {
		planeMaterials[2].color.setRGB(Math.random(), Math.random(), Math.random());
		toggleAudio(audio3);
	  } else if (intersectedObject == plane4) {
		planeMaterials[3].color.setRGB(Math.random(), Math.random(), Math.random());
		toggleAudio(audio4);
	  }
	}
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
	const raycaster = new THREE.Raycaster();
	const intersections = [];
  
	// Update the raycaster with the controller's position and direction
	const controllerMatrix = controller.matrixWorld;
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
  renderer.render(scene, camera);
}