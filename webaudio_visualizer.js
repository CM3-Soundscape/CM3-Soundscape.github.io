import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';


// Shader code as strings
const vertexShaderCode = `
    varying vec2 vUv;

    void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
    }
`;

const fragmentShaderCode = `
    uniform sampler2D tAudioData;
    varying vec2 vUv;

    void main() {
        vec3 backgroundColor = vec3(0.125, 0.125, 0.125);
        vec3 color = vec3(1.0, 1.0, 0.0);

        float f = texture2D(tAudioData, vec2(vUv.x, 0.0)).r;

        float i = step(vUv.y, f) * step(f - 0.0125, vUv.y);

        gl_FragColor = vec4(mix(backgroundColor, color, i), 1.0);
    }
`;

let scene, camera, renderer, analyser, uniforms;

const startButton = document.getElementById( 'startButton' );
startButton.addEventListener( 'click', init );

function init() {

    const fftSize = 128;

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );

    scene = new THREE.Scene();

    camera = new THREE.Camera();


    const listener = new THREE.AudioListener();

    const audio = new THREE.Audio( listener );
    const file = './sounds/drums.mp3';

    if ( /(iPad|iPhone|iPod)/g.test( navigator.userAgent ) ) {

        const loader = new THREE.AudioLoader();
        loader.load( file, function ( buffer ) {

            audio.setBuffer( buffer );
            audio.setLoop( true );
            audio.play();

        } );

    } else {

        const mediaElement = new Audio( file );
        mediaElement.play();
        mediaElement.loop = true;

        audio.setMediaElementSource( mediaElement );

    }

    analyser = new THREE.AudioAnalyser( audio, fftSize );

    //

    const format = ( renderer.capabilities.isWebGL2 ) ? THREE.RedFormat : THREE.LuminanceFormat;

    uniforms = {

        tAudioData: { value: new THREE.DataTexture( analyser.data, fftSize / 2, 1, format ) }

    };

    const material = new THREE.ShaderMaterial( {

        uniforms: uniforms,
        vertexShader: vertexShaderCode,
        fragmentShader: fragmentShaderCode

    } );

    const geometry = new THREE.PlaneGeometry( 1, 1 );

    const mesh = new THREE.Mesh( geometry, material );
    scene.add( mesh );

    //

    window.addEventListener( 'resize', onWindowResize );

    animate();

}

function onWindowResize() {

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

    requestAnimationFrame( animate );

    render();

}

function render() {

    analyser.getFrequencyData();

    uniforms.tAudioData.value.needsUpdate = true;

    renderer.render( scene, camera );

}