import { GRASS_BLOCK_ID, handleGrassStep } from '../block/grass/grass.js';

const WORLD_SIZE = 64;
const worldBlocks = [];

function createWorld() {
    for (let x = 0; x < WORLD_SIZE; x++) {
        worldBlocks[x] = [];
        for (let y = 0; y < WORLD_SIZE; y++) {
            worldBlocks[x][y] = [];
            for (let z = 0; z < WORLD_SIZE; z++) {
                worldBlocks[x][y][z] = {
                    id: GRASS_BLOCK_ID,
                    collision: true,
                };
            }
        }
    }
    return worldBlocks;
}

const WORLD_TICK_RATE = 20;
const worldTickListeners = new Set();
let worldTickAccumulator = 0;

function stepOnBlock(entityId, x, y, z) {
    if (!isPositionValid(x, y, z)) {
        return;
    }
    const block = worldBlocks[x][y][z];
    if (block) {
        handleGrassStep(entityId, block.id);
    }
}

function isPositionValid(x, y, z) {
    return x >= 0 && x < WORLD_SIZE && y >= 0 && y < WORLD_SIZE && z >= 0 && z < WORLD_SIZE;
}

function registerWorldTick(listener) {
    if (typeof listener === 'function') {
        worldTickListeners.add(listener);
    }
}

function unregisterWorldTick(listener) {
    worldTickListeners.delete(listener);
}

function updateWorldTicks(deltaTime) {
    if (worldTickListeners.size === 0) {
        return;
    }
    worldTickAccumulator += deltaTime;
    const tickInterval = 1 / WORLD_TICK_RATE;
    while (worldTickAccumulator >= tickInterval) {
        worldTickAccumulator -= tickInterval;
        worldTickListeners.forEach((listener) => {
            try {
                listener();
            } catch (error) {
                console.warn('World tick listener error:', error);
            }
        });
    }
}

export { createWorld, stepOnBlock, registerWorldTick, unregisterWorldTick, updateWorldTicks, WORLD_SIZE };