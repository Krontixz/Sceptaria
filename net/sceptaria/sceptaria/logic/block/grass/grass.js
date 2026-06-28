const GRASS_BLOCK_ID = 'sceptaria:block_o_grass';
const GRASS_MODEL_PATH = 'assets/sceptaria/models/grass/block_o_grass.gltf';
const GRASS_TEXTURE_PATH = 'assets/sceptaria/models/grass/grass.png';
const GRASS_STEP_SOUND = 'assets/sceptaria/sounds/block/grass.mp3';

function handleGrassStep(entityId, blockId) {
    if (blockId !== GRASS_BLOCK_ID) {
        return;
    }

    if (entityId === 'sceptaria:player' || entityId === 'sceptaria:stalker') {
        playGrassStepSound();
    }
}

function playGrassStepSound() {
    const audio = new Audio(GRASS_STEP_SOUND);
    audio.volume = 0.8;
    audio.play().catch(() => {
        // ignore autoplay restrictions or missing file
    });
}

export { GRASS_BLOCK_ID, GRASS_MODEL_PATH, GRASS_TEXTURE_PATH, handleGrassStep };