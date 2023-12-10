import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import {VRButton} from './webxr/VRButton.js';
import {XRControllerModelFactory} from './webxr/XRControllerModelFactory.js';
import {XRHandModelFactory} from './webxr/XRHandModelFactory.js';


let container, stats;

let camera, scene, renderer;

let controller1, controller2;

let hand1, hand2;

let mesh;

init();
animate();

function init() {
    container = document.getElementById('container');

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 10);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    scene.fog = new THREE.Fog(0x050505, 2000, 3500);

    scene.add(new THREE.AmbientLight(0xcccccc));

    const light1 = new THREE.DirectionalLight(0xffffff, 1.5);
    light1.position.set(1, 1, 1);
    scene.add(light1);

    const light2 = new THREE.DirectionalLight(0xffffff, 4.5);
    light2.position.set(0, -1, 0);
    scene.add(light2);

    const triangles = 160000;

    const geometry = new THREE.BufferGeometry();

    const positions = [];
    const normals = [];
    const colors = [];

    const color = new THREE.Color();

    const n = 800, n2 = n / 2;
    const d = 12, d2 = d / 2;

    const pA = new THREE.Vector3();
    const pB = new THREE.Vector3();
    const pC = new THREE.Vector3();

    const cb = new THREE.Vector3();
    const ab = new THREE.Vector3();

    for (let i = 0; i < triangles; i++) {
        // ...

        // Positions, normals, and colors generation remain the same.

        // ...
    }

    function disposeArray() {
        this.array = null;
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3).onUpload(disposeArray));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3).onUpload(disposeArray));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4).onUpload(disposeArray));

    geometry.computeBoundingSphere();

    const material = new THREE.MeshPhongMaterial({
        color: 0xd5d5d5, specular: 0xffffff, shininess: 250,
        side: THREE.DoubleSide, vertexColors: true, transparent: true
    });

    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    //

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    //

    stats = new Stats();
    container.appendChild(stats.dom);

    //

    window.addEventListener('resize', onWindowResize);

    // XR setup
    const xrButton = document.createElement('button');
    document.body.appendChild(xrButton);

    xrButton.style.display = 'none';

    navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
        supported ? xrButton.style.display = '' : xrButton.style.display = 'none';
    });

    xrButton.addEventListener('click', toggleXR);

    function toggleXR() {
        if (session === null) {
            navigator.xr.requestSession('immersive-vr').then(onSessionStarted);
        } else {
            session.end();
        }
    }

    function onSessionStarted(session) {
        xrButton.textContent = 'Exit VR';

        session.addEventListener('end', onSessionEnded);

        renderer.xr.setReferenceSpaceType('local');
        renderer.xr.setSession(session);

        session.requestReferenceSpace('local').then((referenceSpace) => {
            const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]);
            const line = new THREE.Line(geometry);
            line.scale.z = 5;

            controller1 = renderer.xr.getController(0);
            controller1.addEventListener('selectstart', onSelectStart);
            controller1.addEventListener('selectend', onSelectEnd);
            controller1.add(line.clone());
            scene.add(controller1);

            controller2 = renderer.xr.getController(1);
            controller2.addEventListener('selectstart', onSelectStart);
            controller2.addEventListener('selectend', onSelectEnd);
            controller2.add(line.clone());
            scene.add(controller2);

            const controllerModelFactory = new XRControllerModelFactory();
            const handModelFactory = new XRHandModelFactory();

            hand1 = renderer.xr.getHand(0);
            hand1.add(controllerModelFactory.createControllerModel(controller1));
            hand1.add(handModelFactory.createHandModel(hand1));
            scene.add(hand1);

            hand2 = renderer.xr.getHand(1);
            hand2.add(controllerModelFactory.createControllerModel(controller2));
            hand2.add(handModelFactory.createHandModel(hand2));
            scene.add(hand2);

            session.requestAnimationFrame(onXRFrame);
        });
    }

    function onSessionEnded() {
        xrButton.textContent = 'Enter VR';
    }

    function onSelectStart(event) {
        const controller = event.target;

        const intersections = getIntersections(controller);

        if (intersections.length > 0) {
            const intersection = intersections[0];
            const object = intersection.object;

            object.material.emissive.b = 1;
            controller.attach(object);
        }
    }

    function onSelectEnd(event) {
        const controller = event.target;

        if (controller.userData.selected !== undefined) {
            const object = controller.userData.selected;
            object.material.emissive.b = 0;
            scene.attach(object);
        }
    }

    function getIntersections(controller) {
        tempMatrix.identity();
        tempMatrix.multiplyMatrices(controller.matrixWorld, tempMatrix2.getInverse(controller.matrixWorld));

        raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
        raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

        return raycaster.intersectObjects(scene.children);
    }

    function intersectObjects(controller) {
        const intersections = getIntersections(controller);

        if (intersections.length > 0) {
            const intersection = intersections[0];
            controller.userData.selected = intersection.object;
        }
    }

    function onXRFrame(time, frame) {
        const session = frame.session;

        if (session) {
            const inputSources = Array.from(frame.session.inputSources);

            for (const inputSource of inputSources) {
                const controller = renderer.xr.getController(inputSource);
                if (controller) {
                    controller.updateFromXRFrame(frame);
                    intersectObjects(controller);
                }
            }

            const pose = frame.getViewerPose(referenceSpace);

            if (pose) {
                const xrCamera = renderer.xr.getCamera(camera);
                xrCamera.position.copy(pose.transform.position);
                xrCamera.quaternion.copy(pose.transform.orientation);
            }

            renderer.render(scene, camera);
        }
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

//

function animate() {
    requestAnimationFrame(animate);

    render();
    stats.update();
}

function render() {
    const time = Date.now() * 0.001;

    mesh.rotation.x = time * 0.25;
    mesh.rotation.y = time * 0.5;

    renderer.render(scene, camera);
}