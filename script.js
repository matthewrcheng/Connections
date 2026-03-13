let config;
let words = [];
let selected = [];
let correctCategories = [];
let mistakes = 0;

async function loadConfig() {
    const response = await fetch('config.json');
    config = await response.json();
    initializeGame();
}

function initializeGame() {
    words = [];
    Object.values(config.categories).forEach(cat => {
        words.push(...cat.words);
    });
    shuffleArray(words);
    correctCategories = [];
    mistakes = 0;
    selected = [];
    renderBoard();
    updateUI();
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function renderBoard() {
    const board = document.getElementById('game-board');
    board.innerHTML = '';
    words.forEach(word => {
        const div = document.createElement('div');
        div.className = 'word';
        div.textContent = word;
        div.addEventListener('click', () => toggleSelect(word));
        if (correctCategories.some(key => config.categories[key].words.includes(word))) {
            const key = correctCategories.find(k => config.categories[k].words.includes(word));
            div.classList.add('correct');
            div.classList.add(key);
            div.style.pointerEvents = 'none';
        }
        if (selected.includes(word)) {
            div.classList.add('selected');
        }
        board.appendChild(div);
    });
}

function toggleSelect(word) {
    if (correctCategories.some(key => config.categories[key].words.includes(word))) return;
    const index = selected.indexOf(word);
    if (index > -1) {
        selected.splice(index, 1);
    } else if (selected.length < 4) {
        selected.push(word);
    }
    renderBoard();
    updateUI();
}

function updateUI() {
    document.getElementById('mistake-count').textContent = mistakes;
    document.getElementById('submit-btn').disabled = selected.length !== 4;
    document.getElementById('message').textContent = '';
}

function submitGuess() {
    const categoryKey = Object.keys(config.categories).find(key =>
        selected.every(word => config.categories[key].words.includes(word)) &&
        config.categories[key].words.every(word => selected.includes(word))
    );
    if (categoryKey) {
        correctCategories.push(categoryKey);
        selected = [];
        renderBoard();
        updateUI();
        document.getElementById('message').textContent = `Correct! Category: ${config.categories[categoryKey].name}`;
        if (correctCategories.length === 4) {
            document.getElementById('message').textContent = 'Congratulations! You solved all categories!';
        }
    } else {
        mistakes++;
        selected = [];
        renderBoard();
        updateUI();
        document.getElementById('message').textContent = 'Incorrect. Try again.';
        if (mistakes >= 4) {
            document.getElementById('message').textContent = 'Game over! You made 4 mistakes.';
        }
    }
}

document.getElementById('submit-btn').addEventListener('click', submitGuess);
document.getElementById('shuffle-btn').addEventListener('click', () => {
    shuffleArray(words);
    renderBoard();
});

loadConfig();