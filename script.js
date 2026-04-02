let config;
let words = [];
let selected = [];
let correctCategories = [];
let mistakes = 0;
let infiniteMistakes = false;

async function loadConfig() {
    const response = await fetch('config.json');
    config = await response.json();
    initializeGame();
}

let gameOver = false;
let guessHistory = [];

// Helper to get color emoji for a category key
function getCategoryEmoji(key) {
    switch (key) {
        case 'yellow': return '🟨';
        case 'green': return '🟩';
        case 'blue': return '🟦';
        case 'purple': return '🟪';
        default: return '⬜';
    }
}

function showGuessSummary() {
    // Determine result title
    let correctGuesses = guessHistory.filter(g => g.correct).length;
    let title = '';
    if (guessHistory.length === 4 && correctGuesses === 4) {
        title = 'Perfect!';
    } else if (correctGuesses === 4) {
        title = 'Solid!';
    } else if (guessHistory.length === 4 && correctGuesses === 0) {
        title = 'Almost!';
    } else {
        title = 'Results';
    }
    // Compose summary string
    let summary = '';
    summary += '<div style="text-align:center;font-size:1.3em;font-weight:bold;">Connections 04/04/26</div>';
    summary += '<div style="text-align:center;">Catherine &amp; Matthew Wedding Special</div>';
    // Show each guess as a row of colored squares
    guessHistory.forEach(guess => {
        // For each word in the guess, find its category
        let row = '';
        guess.words.forEach(word => {
            let catKey = Object.keys(config.categories).find(key => config.categories[key].words.includes(word));
            row += getCategoryEmoji(catKey);
        });
        summary += '<div style="text-align:center;font-size:2em;">' + row + '</div>';
    });
    // Show popup
    document.getElementById('results-popup-title').textContent = title;
    document.getElementById('results-popup-summary').innerHTML = summary;
    document.getElementById('results-popup').style.display = 'flex';
}

// Popup logic
document.addEventListener('DOMContentLoaded', () => {
    const popup = document.getElementById('results-popup');
    const closeBtn = document.getElementById('close-results-popup');
    const shareBtn = document.getElementById('share-results-btn');
    const viewBtn = document.getElementById('view-results-btn');
    if (closeBtn) closeBtn.onclick = () => { popup.style.display = 'none'; };
    if (viewBtn) viewBtn.onclick = () => { popup.style.display = 'flex'; };
    if (shareBtn) shareBtn.onclick = () => {
        // Compose share text
        let text = 'Connections 04/04/26\nCatherine & Matthew Wedding Special\n';
        guessHistory.forEach(guess => {
            let row = '';
            guess.words.forEach(word => {
                let catKey = Object.keys(config.categories).find(key => config.categories[key].words.includes(word));
                row += getCategoryEmoji(catKey);
            });
            text += row + '\n';
        });
        navigator.clipboard.writeText(text.trim());
        shareBtn.textContent = 'Copied!';
        setTimeout(() => { shareBtn.textContent = 'Share Your Results'; }, 1200);
    };
});

function initializeGame() {
    words = [];
    if (config.startingOrder && config.startingOrder.length > 0) {
        // Use the configured starting order
        words = [...config.startingOrder];
    } else {
        // Fall back to collecting all words and shuffling
        Object.values(config.categories).forEach(cat => {
            words.push(...cat.words);
        });
        shuffleArray(words);
    }
    correctCategories = [];
    mistakes = 0;
    selected = [];
    infiniteMistakes = document.getElementById('infinite-mistakes').checked;
    gameOver = false;
    guessHistory = [];
    renderBoard();
    updateUI();
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function renderBoard(animateCategoryKey = null, revealOrder = null, revealStep = 0) {
    // Render solved categories area
    const solvedArea = document.getElementById('solved-categories');
    solvedArea.innerHTML = '';
    let revealKeys = revealOrder || correctCategories;
    revealKeys.forEach((key, idx) => {
        if (revealOrder && idx > revealStep) return; // Only reveal up to current step
        const cat = config.categories[key];
        const container = document.createElement('div');
        container.className = 'solved-category single-rect ' + key;
        if (revealOrder && idx === revealStep) container.classList.add('animated');
        if (animateCategoryKey && key === animateCategoryKey) container.classList.add('animated');
        // Top: category name, bold
        const label = document.createElement('div');
        label.className = 'solved-category-label ' + key;
        label.textContent = cat.name;
        container.appendChild(label);
        // Bottom: words, comma-separated
        const wordsLine = document.createElement('div');
        wordsLine.className = 'solved-category-words-line';
        wordsLine.textContent = cat.words.join(', ');
        container.appendChild(wordsLine);
        solvedArea.appendChild(container);
    });

    // Render remaining words on the board
    const board = document.getElementById('game-board');
    board.innerHTML = '';
    // Only show words not in solved categories
    const solvedWords = revealOrder
        ? revealOrder.slice(0, revealStep + 1).flatMap(key => config.categories[key].words)
        : correctCategories.flatMap(key => config.categories[key].words);
    words.filter(word => !solvedWords.includes(word)).forEach(word => {
        const div = document.createElement('div');
        div.className = 'word';
        div.textContent = word;
        div.addEventListener('click', () => toggleSelect(word));
        if (selected.includes(word)) {
            div.classList.add('selected');
        }
        // Animate the 4 words if animating a category
        if (animateCategoryKey && config.categories[animateCategoryKey].words.includes(word)) {
            div.classList.add('move-up');
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

function deselectAll() {
    selected = [];
    renderBoard();
    updateUI();
}

function updateUI() {
    document.getElementById('mistake-count').textContent = mistakes;
    document.getElementById('submit-btn').disabled = selected.length !== 4;
    // Hide mistakes if infiniteMistakes is enabled
    const mistakesDiv = document.getElementById('mistakes');
    if (infiniteMistakes) {
        mistakesDiv.style.display = 'none';
    } else {
        mistakesDiv.style.display = '';
    }
}

function submitGuess() {
    if (gameOver) return;
    // Track guess
    guessHistory.push({
        words: [...selected],
        correct: false,
        category: null
    });
    const categoryKey = Object.keys(config.categories).find(key =>
        selected.every(word => config.categories[key].words.includes(word)) &&
        config.categories[key].words.every(word => selected.includes(word))
    );
    if (categoryKey) {
        // Mark last guess as correct
        guessHistory[guessHistory.length - 1].correct = true;
        guessHistory[guessHistory.length - 1].category = categoryKey;
        // Animate the 4 words moving up
        renderBoard(categoryKey);
        setTimeout(() => {
            correctCategories.push(categoryKey);
            selected = [];
            renderBoard(null);
            updateUI();
            // If all categories solved, show summary
            if (correctCategories.length >= 4) {
                document.getElementById('view-results-btn').style.display = '';
                showGuessSummary();
            }
        }, 600);
    } else {
        if (!infiniteMistakes) {
            mistakes++;
            if (mistakes >= 4) {
                // End game and reveal all answers in order
                gameOver = true;
                // Add all remaining categories to correctCategories in order
                const allOrder = ['yellow', 'green', 'blue', 'purple'];
                const revealOrder = allOrder.filter(key => Object.keys(config.categories).includes(key));
                revealOrder.forEach(key => {
                    if (!correctCategories.includes(key)) {
                        correctCategories.push(key);
                    }
                });
                selected = [];
                // Animate reveal one by one
                let step = 0;
                function revealNext() {
                    renderBoard(null, revealOrder, step);
                    updateUI();
                    if (step < revealOrder.length - 1) {
                        setTimeout(() => {
                            step++;
                            revealNext();
                        }, 700);
                    } else {
                        // Show summary and disable submit
                        showGuessSummary();
                        document.getElementById('view-results-btn').style.display = '';
                        showGuessSummary();
                        document.getElementById('submit-btn').disabled = true;
                    }
                }
                revealNext();
                return;
            }
        }
        selected = [];
        renderBoard();
        updateUI();
    }
}

document.getElementById('submit-btn').addEventListener('click', submitGuess);
document.getElementById('shuffle-btn').addEventListener('click', () => {
    shuffleArray(words);
    renderBoard();
});
document.getElementById('deselect-btn').addEventListener('click', deselectAll);
document.getElementById('infinite-mistakes').addEventListener('change', () => {
    const checkbox = document.getElementById('infinite-mistakes');
    if (checkbox.checked) {
        infiniteMistakes = true;
        updateUI(); // Just update UI, do not reset game
    } else {
        // Ask for confirmation before resetting
        if (confirm('Disabling infinite mistakes will reset the game. Are you sure?')) {
            infiniteMistakes = false;
            initializeGame();
        } else {
            // Re-check the box to keep infinite mode
            checkbox.checked = true;
        }
    }
});

loadConfig();