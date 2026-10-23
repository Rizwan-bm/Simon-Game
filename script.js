
const buttons = document.querySelectorAll(".color-btn");
const levelDisplay = document.getElementById("level");
const bestDisplay = document.getElementById("best");
const message = document.getElementById("message");
const startButton = document.getElementById("start-btn");

const colors = ["green", "red", "yellow", "blue"];

let sequence = [];
let playerSequence = [];
let level = 0;
let bestScore = 0;
let acceptingInput = false;
let gameRunning = false;
let roundToken = 0;

try {
    bestScore = Number(localStorage.getItem("simonBest")) || 0;
} catch (error) {
    bestScore = 0;
}

bestDisplay.textContent = bestScore;

// Play a short tone using the browser's audio system.
function playTone(color) {
    const frequencies = {
        green: 329.63,
        red: 261.63,
        yellow: 392.00,
        blue: 523.25
    };

    try {
        const AudioContext =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContext) return;

        const audio = new AudioContext();
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();

        oscillator.type = "sine";
        oscillator.frequency.value = frequencies[color];
        gain.gain.value = 0.12;

        oscillator.connect(gain);
        gain.connect(audio.destination);

        oscillator.start();
        gain.gain.exponentialRampToValueAtTime(
            0.001,
            audio.currentTime + 0.22
        );

        oscillator.stop(audio.currentTime + 0.22);
        oscillator.onended = () => audio.close();
    } catch (error) {
        // The game remains playable if audio is unavailable.
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function flashColor(color, duration = 400) {
    const button = document.querySelector(
        `.color-btn[data-color="${color}"]`
    );

    button.classList.add("lit");
    playTone(color);

    await sleep(duration);
    button.classList.remove("lit");
    await sleep(150);
}

function updateLevel() {
    levelDisplay.textContent = level;
}

function startGame() {
    roundToken++;

    sequence = [];
    playerSequence = [];
    level = 0;
    gameRunning = true;
    acceptingInput = false;

    updateLevel();
    message.textContent = "Watch the sequence!";
    startButton.textContent = "RESTART GAME";
    startButton.disabled = false;

    nextLevel();
}

async function nextLevel() {
    const token = roundToken;

    if (!gameRunning || token !== roundToken) return;

    acceptingInput = false;
    playerSequence = [];
    level++;
    updateLevel();

    message.textContent = `Level ${level} — Watch carefully!`;

    await sleep(650);

    if (!gameRunning || token !== roundToken) return;

    const nextColor = colors[
        Math.floor(Math.random() * colors.length)
    ];

    sequence.push(nextColor);

    for (const color of sequence) {
        if (!gameRunning || token !== roundToken) return;
        await flashColor(color, 350);
    }

    if (!gameRunning || token !== roundToken) return;

    message.textContent = "Your turn! Repeat the pattern.";
    acceptingInput = true;
}

async function handlePlayerInput(color) {
    if (!gameRunning || !acceptingInput) return;

    acceptingInput = false;

    await flashColor(color, 200);

    if (!gameRunning) return;

    const index = playerSequence.length;
    playerSequence.push(color);

    if (playerSequence[index] !== sequence[index]) {
        endGame();
        return;
    }

    if (playerSequence.length === sequence.length) {
        if (level > bestScore) {
            bestScore = level;
            bestDisplay.textContent = bestScore;

            try {
                localStorage.setItem("simonBest", bestScore);
            } catch (error) {
                // Saving the score is optional.
            }
        }

        message.textContent = "Correct! Get ready...";
        await sleep(700);

        if (gameRunning) nextLevel();
    } else {
        acceptingInput = true;
        message.textContent = "Good! Keep going...";
    }
}

function endGame() {
    gameRunning = false;
    acceptingInput = false;
    roundToken++;

    message.textContent = `Game Over! You reached level ${level}.`;
    startButton.textContent = "PLAY AGAIN";
}

buttons.forEach(button => {
    button.addEventListener("click", () => {
        handlePlayerInput(button.dataset.color);
    });
});

startButton.addEventListener("click", startGame);
