let allVocab = [];
let currentVocab = {};
let totalAnswered = 0;
let correctCount = 0;

const levelSelect = document.getElementById("level-select");
const jpWordElement = document.getElementById("japanese-word");
const optionsContainer = document.getElementById("options-container");
const feedbackArea = document.getElementById("feedback-area");
const feedbackMsg = document.getElementById("feedback-msg");
const nextBtn = document.getElementById("next-btn");
const progressBar = document.getElementById("progress-bar");
const scoreDisplay = document.getElementById("score-display");
const ghost = document.getElementById("ghost");

fetch('data.json')
    .then(res => res.json())
    .then(data => {
        allVocab = data;
        generateQuestion();
    });

// 改變級別時重置分數
levelSelect.addEventListener("change", () => {
    totalAnswered = 0;
    correctCount = 0;
    updateScoreBoard();
    generateQuestion();
});

function updateScoreBoard() {
    scoreDisplay.innerText = `${correctCount} / ${totalAnswered}`;
    // 設定每 10 題為一個進度循環
    const progress = Math.min((totalAnswered % 10 !== 0 ? totalAnswered % 10 : (totalAnswered === 0 ? 0 : 10)) / 10 * 100, 100);
    progressBar.style.width = `${progress}%`;
}

function generateQuestion() {
    feedbackArea.classList.add("hidden");
    ghost.classList.remove("peek"); // 隱藏幽靈
    optionsContainer.innerHTML = "";

    const selectedLevel = levelSelect.value;
    let filteredList = allVocab;
    if (selectedLevel !== "ALL") {
        filteredList = allVocab.filter(word => word.level === selectedLevel);
    }

    const randomIndex = Math.floor(Math.random() * filteredList.length);
    currentVocab = filteredList[randomIndex];
    jpWordElement.innerText = currentVocab.jp;

    let options = [currentVocab.zh];
    while (options.length < 4) {
        let randomWrong = allVocab[Math.floor(Math.random() * allVocab.length)].zh;
        if (!options.includes(randomWrong)) {
            options.push(randomWrong);
        }
    }
    options.sort(() => Math.random() - 0.5);

    options.forEach(optionText => {
        const btn = document.createElement("button");
        btn.classList.add("option-btn");
        btn.innerText = optionText;
        btn.addEventListener("click", () => checkAnswer(btn, optionText));
        optionsContainer.appendChild(btn);
    });
}

function checkAnswer(clickedBtn, selectedText) {
    const allBtns = document.querySelectorAll(".option-btn");
    allBtns.forEach(btn => btn.disabled = true);

    feedbackArea.classList.remove("hidden");
    totalAnswered++;

    if (selectedText === currentVocab.zh) {
        clickedBtn.classList.add("correct");
        feedbackMsg.innerText = "答對了！✨";
        feedbackMsg.style.color = "var(--correct)";
        correctCount++;
        ghost.classList.add("peek"); // 召喚幽靈探頭
    } else {
        clickedBtn.classList.add("wrong");
        feedbackMsg.innerText = `正確答案是「${currentVocab.zh}」`;
        feedbackMsg.style.color = "var(--wrong)";
        
        allBtns.forEach(btn => {
            if (btn.innerText === currentVocab.zh) {
                btn.classList.add("correct");
            }
        });
    }
    updateScoreBoard();
}

nextBtn.addEventListener("click", generateQuestion);