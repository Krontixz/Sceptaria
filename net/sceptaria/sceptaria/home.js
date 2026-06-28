const playButton = document.getElementById('play-button');
let gameTransitionStarted = false;

if (playButton) {
    playButton.addEventListener('click', () => {
        alert("Thank's For Playing Our Game! It Will Be Starting Shortly");
        startGameTransition();
    });
}

async function startGameTransition() {
    if (gameTransitionStarted) {
        return;
    }
    gameTransitionStarted = true;

    if (playButton) {
        playButton.disabled = true;
    }

    const overlay = getOrCreateOverlay();
    overlay.classList.add('active');

    const message = await getRandomTransitionMessage();
    const textNode = document.getElementById('game-loading-text');
    if (textNode) {
        textNode.textContent = message;
    }

    const bg = document.getElementById('page-bg');
    if (bg) {
        bg.classList.add('game-animate');
        animateBackground(bg, 5000);
    }

    setTimeout(() => {
        window.location.href = './game/game.html';
    }, 5000);
}

function getOrCreateOverlay() {
    let overlay = document.getElementById('game-loading-overlay');
    if (overlay) {
        return overlay;
    }

    overlay = document.createElement('div');
    overlay.id = 'game-loading-overlay';

    const text = document.createElement('div');
    text.id = 'game-loading-text';
    text.textContent = 'Preparing the world...';

    overlay.appendChild(text);
    document.body.appendChild(overlay);
    return overlay;
}

async function getRandomTransitionMessage() {
    try {
        const response = await fetch('net/sceptaria/sceptaria/json/tr_str.json', { cache: 'no-cache' });
        if (response.ok) {
            const data = await response.json();
            const strings = Array.isArray(data) ? data : Array.isArray(data.strings) ? data.strings : [];
            if (strings.length > 0) {
                return strings[Math.floor(Math.random() * strings.length)];
            }
        }
    } catch (error) {
        // ignore errors and use fallback text
    }
    return 'Sceptaria is opening...';
}

function animateBackground(bg, duration) {
    const start = performance.now();
    const amplitude = 25;

    function step(now) {
        const elapsed = now - start;
        const offset = Math.sin((elapsed / duration) * Math.PI * 2) * amplitude;
        bg.style.backgroundPosition = `${50 + offset}% 50%`;
        if (elapsed < duration) {
            requestAnimationFrame(step);
        }
    }

    requestAnimationFrame(step);
}