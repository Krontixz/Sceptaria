import { createPlayer } from './logic/player.js';
import { createStalker } from './logic/enemy/stalker/stalker.js';
import { createWorld, registerWorldTick, updateWorldTicks } from './logic/world/world.js';

window.addEventListener('load', initGamePage);

function initGamePage() {
    const canvas = document.getElementById('game-canvas');
    if (!canvas || typeof BABYLON === 'undefined') {
        return;
    }

    const debugMenuElement = document.getElementById('debug-menu');
    let debugMenuActive = false;
    let debugUpdateCounter = 0;

    const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    engine.setHardwareScalingLevel(1 / window.devicePixelRatio);

    const scene = createScene(engine, canvas);

    engine.runRenderLoop(() => {
        scene.render();
        if (debugMenuActive && debugUpdateCounter++ % 6 === 0) {
            updateDebugMenu(scene, engine, canvas, debugMenuElement);
        }
    });

    window.addEventListener('resize', () => engine.resize());
    window.addEventListener('keydown', (event) => {
        if (event.key === 'F3') {
            debugMenuActive = !debugMenuActive;
            debugUpdateCounter = 0;
            if (debugMenuElement) {
                debugMenuElement.classList.toggle('visible', debugMenuActive);
            }
            event.preventDefault();
        }
    });
}

function updateDebugMenu(scene, engine, canvas, debugMenuElement) {
    if (!debugMenuElement) {
        return;
    }

    const camera = scene.activeCamera;
    if (!camera) {
        debugMenuElement.textContent = 'DEBUG MENU\nWaiting for camera...';
        return;
    }

    const pos = camera.position;
    const rot = camera.rotation || new BABYLON.Vector3(0, 0, 0);
    const fps = engine.getFps().toFixed(1);
    const pointer = document.pointerLockElement === canvas ? 'locked' : 'unlocked';

    debugMenuElement.textContent =
        'DEBUG MENU\n' +
        `FPS: ${fps}\n` +
        `Pos: ${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}\n` +
        `Rot: ${rot.x.toFixed(2)}, ${rot.y.toFixed(2)}, ${rot.z.toFixed(2)}\n` +
        `Meshes: ${scene.meshes.length}`;
}

function createScene(engine, canvas) {
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.6, 0.85, 1, 1);
    scene.ambientColor = new BABYLON.Color3(1, 1, 1);
    scene.gravity = new BABYLON.Vector3(0, -0.98, 0);
    scene.collisionsEnabled = true;

    const camera = new BABYLON.UniversalCamera('playerCamera', new BABYLON.Vector3(0, 34.2, 0), scene);
    camera.setTarget(new BABYLON.Vector3(0, 32, 8));
    camera.attachControl(canvas, true);
    canvas.addEventListener('click', () => {
        if (document.pointerLockElement !== canvas && canvas.requestPointerLock) {
            canvas.requestPointerLock();
        }
    });
    camera.speed = 0.2;
    camera.angularSensibility = 2400;
    camera.inertia = 0.9;
    camera.minZ = 0.1;
    camera.checkCollisions = true;
    camera.applyGravity = true;
    camera.ellipsoid = new BABYLON.Vector3(0.5, 1.4, 0.5);
    camera.ellipsoidOffset = new BABYLON.Vector3(0, 1.4, 0);
    camera.keysUp = [87];
    camera.keysDown = [83];
    camera.keysLeft = [65];
    camera.keysRight = [68];

    const light = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 1.1;
    const sunlight = new BABYLON.DirectionalLight('sun', new BABYLON.Vector3(-0.5, -1, 0.3), scene);
    sunlight.intensity = 0.8;

    createWorld();
    createSky(scene);
    createWorldCollider(scene);
    loadGrassWorld(scene);

    const player = createPlayer(scene, scene.activeCamera);
    const gameState = {
        stalker: null,
        lastFrameTime: performance.now(),
        SPAWN_CHANCE_PER_TICK: 0.12,
        FRAME_CLAMP_ENABLED: true,
    };

    function getRandomSpawnPosition() {
        const edge = Math.random() < 0.5 ? -28 : 28;
        const isXEdge = Math.random() < 0.5;
        const x = isXEdge ? edge : BABYLON.Scalar.RandomRange(-28, 28);
        const z = isXEdge ? BABYLON.Scalar.RandomRange(-28, 28) : edge;
        return new BABYLON.Vector3(x, 1.1, z);
    }

    function spawnStalker() {
        if (gameState.stalker) {
            return;
        }
        const spawnPosition = getRandomSpawnPosition();
        gameState.stalker = createStalker(scene, player, spawnPosition);
        console.log('Stalker spawned at', spawnPosition);
    }

    registerWorldTick(() => {
        if (Math.random() < gameState.SPAWN_CHANCE_PER_TICK) {
            spawnStalker();
        }
    });

    scene.onBeforeRenderObservable.add(() => {
        const now = performance.now();
        const deltaTime = Math.min((now - gameState.lastFrameTime) / 1000, 0.05);
        gameState.lastFrameTime = now;

        if (gameState.FRAME_CLAMP_ENABLED && scene.activeCamera) {
            const pos = scene.activeCamera.position;
            pos.x = BABYLON.Scalar.Clamp(pos.x, -31, 31);
            pos.z = BABYLON.Scalar.Clamp(pos.z, -31, 31);
        }

        player.update(deltaTime);
        updateWorldTicks(deltaTime);
        if (gameState.stalker) {
            gameState.stalker.update(deltaTime);
        }
    });

    return scene;
}

function createSky(scene) {
    const skybox = BABYLON.MeshBuilder.CreateBox('skyBox', { size: 800 }, scene);
    const skyMaterial = new BABYLON.StandardMaterial('skyMat', scene);
    skyMaterial.backFaceCulling = false;
    skyMaterial.disableLighting = true;
    skyMaterial.diffuseColor = new BABYLON.Color3(0.6, 0.85, 1);
    skyMaterial.specularColor = BABYLON.Color3.Black();
    skyMaterial.emissiveColor = new BABYLON.Color3(0.6, 0.85, 1);
    skybox.material = skyMaterial;
    skybox.isPickable = false;
    skybox.infiniteDistance = true;
    skybox.castShadow = false;
    skybox.receiveShadows = false;
}

function createWorldCollider(scene) {
    const thickness = 1;
    const colliders = [
        { name: 'floor', width: 64, height: thickness, depth: 64, x: 0, y: -32 + thickness / 2, z: 0 },
        { name: 'topGround', width: 64, height: thickness, depth: 64, x: 0, y: 31, z: 0 },
        { name: 'ceiling', width: 64, height: thickness, depth: 64, x: 0, y: 65 - thickness / 2, z: 0 },
        { name: 'back', width: 64, height: 64, depth: thickness, x: 0, y: 0, z: -32 + thickness / 2 },
        { name: 'front', width: 64, height: 64, depth: thickness, x: 0, y: 0, z: 32 - thickness / 2 },
        { name: 'left', width: thickness, height: 64, depth: 64, x: -32 + thickness / 2, y: 0, z: 0 },
        { name: 'right', width: thickness, height: 64, depth: 64, x: 32 - thickness / 2, y: 0, z: 0 },
    ];

    colliders.forEach((c) => {
        const box = BABYLON.MeshBuilder.CreateBox(c.name + 'Collider', { width: c.width, height: c.height, depth: c.depth }, scene);
        box.position = new BABYLON.Vector3(c.x, c.y, c.z);
        box.isVisible = false;
        box.checkCollisions = true;
        box.castShadow = false;
    });
}

async function loadGrassWorld(scene) {
    const modelFolder = new URL('../../../assets/sceptaria/models/grass/', import.meta.url).href;
    const modelFile = 'block_o_grass.gltf';

    try {
        const result = await BABYLON.SceneLoader.ImportMeshAsync('', modelFolder, modelFile, scene);
        const sourceMesh = result.meshes.find((m) => m.geometry && typeof m.getTotalVertices === 'function' && m.getTotalVertices() > 0);
        if (!sourceMesh) {
            console.warn('No valid grass mesh found in GLTF, using fallback.');
            createFallbackWorld(scene);
            return;
        }

        sourceMesh.position = BABYLON.Vector3.Zero();
        sourceMesh.rotation = BABYLON.Vector3.Zero();
        sourceMesh.scaling = new BABYLON.Vector3(2, 2, 2);
        sourceMesh.isVisible = false;
        sourceMesh.checkCollisions = false;

        const halfSize = 31.5;
        let cloneCount = 0;

        for (let x = 0; x < 64; x++) {
            for (let y = 0; y < 64; y++) {
                for (let z = 0; z < 64; z++) {
                    if (x !== 0 && x !== 63 && y !== 0 && y !== 63 && z !== 0 && z !== 63) {
                        continue;
                    }

                    const clone = sourceMesh.clone(`grass_${x}_${y}_${z}`);
                    if (!clone) {
                        continue;
                    }

                    clone.position = new BABYLON.Vector3(x - halfSize, y - halfSize, z - halfSize);
                    clone.scaling = sourceMesh.scaling.clone();
                    clone.isVisible = true;
                    clone.checkCollisions = true;
                    clone.material = sourceMesh.material;
                    clone.receiveShadows = false;
                    clone.castShadow = false;
                    cloneCount++;
                }
            }
        }

        if (cloneCount === 0) {
            console.warn('No grass clones created, using fallback world.');
            createFallbackWorld(scene);
            return;
        }

        console.log('Grass world loaded with', cloneCount, 'blocks.');
    } catch (error) {
        console.error('Failed to load grass world:', error);
        createFallbackWorld(scene);
    }
}

function createFallbackWorld(scene) {
    const material = new BABYLON.StandardMaterial('fallbackGrass', scene);
    material.diffuseColor = new BABYLON.Color3(0.2, 0.55, 0.16);
    material.specularColor = BABYLON.Color3.Black();
    material.emissiveColor = new BABYLON.Color3(0.15, 0.4, 0.12);

    for (let x = 0; x < 16; x++) {
        for (let y = 0; y < 8; y++) {
            for (let z = 0; z < 16; z++) {
                const box = BABYLON.MeshBuilder.CreateBox(`blockFallback_${x}_${y}_${z}`, { size: 1 }, scene);
                box.position = new BABYLON.Vector3(x - 7.5, y - 3.5, z - 7.5);
                box.material = material;
                box.checkCollisions = true;
                box.castShadow = false;
            }
        }
    }
}
