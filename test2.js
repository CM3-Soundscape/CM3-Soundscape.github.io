import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

let song;
let spacing = 16;
let border = spacing * 2;
let amplification = 3;

let y = spacing;
let ySteps;

let screenSize;
let renderer;

// Assuming you have loaded Three.js library
const startButton = document.getElementById('startButton');
startButton.addEventListener('click', init);

// Set up the initial scene
function init() {

    const overlay = document.getElementById('overlay');
    overlay.remove();

    
    const container = document.getElementById('container');
    const playAudioButton = document.getElementById('playAudioButton');
    playAudioButton.addEventListener('click', playAudio);
    
    // Set up the scene, camera, and renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Create geometry and material
    const geometry = new THREE.BoxGeometry(1, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff});

    // Create mesh
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(0, 0, 0);
    scene.add(sphere);

    // Load the audio
    const listener = new THREE.AudioListener();
    camera.add(listener);
    song = new THREE.Audio(listener);

    camera.position.z = 5;

    window.addEventListener('resize', onWindowResize);

    animate();
}

function playAudio() {
    const listener = new THREE.AudioListener();

    const audio = new THREE.Audio(listener);
    const file = './sounds/drums.mp3';

    if (/(iPad|iPhone|iPod)/g.test(navigator.userAgent)) {

        const loader = new THREE.AudioLoader();
        loader.load(file, function (buffer) {

            audio.setBuffer(buffer);
            audio.play();

        });

    } else {

        const mediaElement = new Audio(file);
        mediaElement.play();
        audio.setMediaElementSource(mediaElement);

    }
}

// Handle window resizing
function onWindowResize() {
/*     camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix(); */
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Main animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update logic here
    if (song && song.buffer) {
        let x = THREE.MathUtils.mapLinear(song.context.currentTime, 0, audio.buffer.duration, 0, screenSize);

        ySteps = x / (window.innerWidth - 2 * border);
        x -= (window.innerWidth - 2 * border) * ySteps;

        let frequency = song.getLevel() * spacing * amplification * 4; // remove *4 for noisy pieces
        sphere.position.set(x + border, y * ySteps + border, 0);
        sphere.scale.set(frequency, frequency, frequency);

        // Render the scene
        renderer.render(scene, camera);
    }
}
