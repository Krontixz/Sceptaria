import { PLAYER_SPEED, PLAYER_HITBOX } from './world/enemyProperties.js';

function createPlayer(scene, camera) {
    camera.speed = 0.4;
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

    const player = {
        id: 'sceptaria:player',
        camera,
        health: 100,
        speed: PLAYER_SPEED,
        hitbox: PLAYER_HITBOX,
        lastDamageTime: 0,
        takeDamage(amount) {
            const now = performance.now();
            if (now - this.lastDamageTime < 500) {
                return;
            }
            this.lastDamageTime = now;
            this.health = Math.max(0, this.health - amount);
            this.updateUI();
        },
        update(deltaTime) {
            // Player movement is handled by Babylon camera, but the player can have logic here later.
        },
        updateUI() {
            const info = document.getElementById('player-info');
            if (!info) {
                return;
            }
            info.textContent = `Player Health: ${this.health}`;
        },
    };

    player.updateUI();
    return player;
}

export { createPlayer };