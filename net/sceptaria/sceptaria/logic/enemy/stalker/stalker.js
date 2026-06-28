import { STALKER_DAMAGE, STALKER_SPEED, STALKER_HITBOX } from '../../world/enemyProperties.js';

function createStalker(scene, player, spawnPosition) {
    const modelFolder = new URL('../../../../../../assets/sceptaria/models/enemy/stalker/', import.meta.url).href;
    const modelFile = 'stalker.gltf';
    const textureMap = [
        { key: 'head', file: 'stalker_head.png' },
        { key: 'torso', file: 'stalker_torso.png' },
        { key: 'right_arm', file: 'stalker_r_arm.png' },
        { key: 'left_arm', file: 'stalker_l_arm.png' },
        { key: 'right_leg', file: 'stalker_r_leg.png' },
        { key: 'left_leg', file: 'stalker_l_leg.png' },
        { key: 'arm', file: 'stalker_torso.png' },
        { key: 'leg', file: 'stalker_torso.png' },
    ];

    const hitboxMesh = BABYLON.MeshBuilder.CreateBox('stalkerCollider', {
        width: STALKER_HITBOX.width,
        height: STALKER_HITBOX.height,
        depth: STALKER_HITBOX.depth,
    }, scene);
    hitboxMesh.isVisible = false;
    hitboxMesh.checkCollisions = true;
    hitboxMesh.ellipsoid = new BABYLON.Vector3(0.7, 1.1, 0.7);
    hitboxMesh.ellipsoidOffset = new BABYLON.Vector3(0, 1.1, 0);
    hitboxMesh.position = spawnPosition ? spawnPosition.clone() : new BABYLON.Vector3(6, 30, 6);

    const stalker = {
        id: 'sceptaria:stalker',
        root: hitboxMesh,
        player,
        speed: STALKER_SPEED,
        hitbox: STALKER_HITBOX,
        damage: STALKER_DAMAGE,
        lastAttackTime: 0,
        attackCooldown: 0.8,
        runAnim: null,
        attackAnim: null,
        isRunning: false,
        isAttacking: false,
        modelLoaded: false,
        update(deltaTime) {
            if (!this.player || !this.player.camera) {
                return;
            }
            const playerPos = this.player.camera.position;
            const stalkerPos = this.root.position;
            const direction = new BABYLON.Vector3(playerPos.x - stalkerPos.x, 0, playerPos.z - stalkerPos.z);
            const distance = direction.length();
            const attackRange = (this.hitbox.width + this.player.hitbox.width) * 0.5 + 0.2;
            const shouldAttack = distance <= attackRange;

            if (distance > 0.01) {
                direction.normalize();
            }

            if (shouldAttack) {
                this.root.lookAt(new BABYLON.Vector3(playerPos.x, stalkerPos.y, playerPos.z));
                if (performance.now() - this.lastAttackTime > this.attackCooldown * 1000) {
                    this.player.takeDamage(this.damage);
                    this.playAttack();
                    this.lastAttackTime = performance.now();
                }
            } else {
                const moveStep = direction.scale(this.speed * deltaTime);
                if (moveStep.length() > 0.0001) {
                    this.root.lookAt(new BABYLON.Vector3(playerPos.x, stalkerPos.y, playerPos.z));
                    this.root.moveWithCollisions(moveStep);
                    this.playRun();
                }
            }
        },
        playRun() {
            if (!this.runAnim || this.isRunning) {
                return;
            }
            this.attackAnim?.stop();
            this.runAnim.start(true, 1.0);
            this.isRunning = true;
            this.isAttacking = false;
        },
        playAttack() {
            if (!this.attackAnim) {
                return;
            }
            this.runAnim?.stop();
            this.attackAnim.start(false, 1.0, this.attackAnim.from, this.attackAnim.to, false);
            this.isRunning = false;
            this.isAttacking = true;
        },
    };

    BABYLON.SceneLoader.ImportMeshAsync('', modelFolder, modelFile, scene).then((result) => {
        result.meshes.forEach((mesh) => {
            if (mesh === hitboxMesh) {
                return;
            }
            mesh.parent = hitboxMesh;
            mesh.checkCollisions = false;
            mesh.isPickable = false;
            mesh.isVisible = true;
            mesh.receiveShadows = true;
            const name = mesh.name.toLowerCase();
            const part = textureMap.find((entry) => name.includes(entry.key));
            if (part) {
                const mat = new BABYLON.StandardMaterial(`stalkerMat_${entry.key}`, scene);
                const tex = new BABYLON.Texture(new URL(part.file, modelFolder).href, scene, false, false, BABYLON.Texture.NEAREST_SAMPLINGMODE);
                tex.hasAlpha = true;
                tex.level = 1.0;
                mat.diffuseTexture = tex;
                mat.backFaceCulling = false;
                mat.useAlphaFromDiffuseTexture = true;
                mat.specularColor = new BABYLON.Color3(0, 0, 0);
                mat.emissiveColor = new BABYLON.Color3(1, 1, 1);
                mesh.material = mat;
            } else {
                if (!mesh.material) {
                    const fallbackMat = new BABYLON.StandardMaterial('stalkerFallbackMat', scene);
                    fallbackMat.diffuseColor = new BABYLON.Color3(0.8, 0.2, 0.2);
                    fallbackMat.specularColor = new BABYLON.Color3(0, 0, 0);
                    mesh.material = fallbackMat;
                } else {
                    mesh.material.specularColor = new BABYLON.Color3(0, 0, 0);
                }
            }
        });

        stalker.runAnim = result.animationGroups.find((group) => group.name === 'animation.stalker.run');
        stalker.attackAnim = result.animationGroups.find((group) => group.name === 'animation.stalker.attack');
        stalker.modelLoaded = true;
        stalker.playRun();
    }).catch((error) => {
        console.warn('Failed to load stalker model:', error);
    });

    return stalker;
}

export { createStalker };