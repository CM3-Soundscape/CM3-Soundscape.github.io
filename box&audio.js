import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

		const startButton = document.getElementById('startButton');
        startButton.addEventListener('click', init);
		function init() {
			const overlay = document.getElementById('overlay');
            overlay.remove();

            //
            const container = document.getElementById('container');
            const playAudioButton = document.getElementById('playAudioButton');
            playAudioButton.addEventListener('click', playAudio);
            function playAudio() {
                const listener = new THREE.AudioListener();

            const audio = new THREE.Audio( listener );
            const file = './sounds/drums.mp3';

            if ( /(iPad|iPhone|iPod)/g.test( navigator.userAgent ) ) {

                const loader = new THREE.AudioLoader();
                loader.load( file, function ( buffer ) {

                    audio.setBuffer( buffer );
                    audio.play();

                } );

            } else {

                const mediaElement = new Audio( file );
                mediaElement.play();

                audio.setMediaElementSource( mediaElement );

            };
            }
            
			const scene = new THREE.Scene();
			const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

			const renderer = new THREE.WebGLRenderer();
			renderer.setSize( window.innerWidth, window.innerHeight );
			document.body.appendChild( renderer.domElement );

			const geometry = new THREE.BoxGeometry( 1, 1, 1 );
			const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
			const cube = new THREE.Mesh( geometry, material );
			scene.add( cube );

			camera.position.z = 5;
			function animate() {
			    requestAnimationFrame( animate );

			    cube.rotation.x += 0.01;
			    cube.rotation.y += 0.01;

			    renderer.render( scene, camera );
		    }
			animate();
		}
		