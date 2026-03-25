let allVocab = [];
let wrongVocab = []; 
let correctVocab = []; 
let currentPool = []; 
let currentVocab = {};
let selectedLevel = 'N1'; 
let currentMode = 'practice'; 
let sessionTotal = 0; 
let sessionHistory = []; // 🌟 新增：用來記錄這回合學過的所有單字

let stats = { total: 0, correct: 0 };
let pendingSessionMode = 'practice'; 
let lastListType = 'all'; 

// DOM 元素綁定
const dashboardView = document.getElementById("dashboard-view");
const quizView = document.getElementById("quiz-view");
const listView = document.getElementById("list-view"); 
const listContent = document.getElementById("list-content");
const listTitle = document.getElementById("list-title");
const summaryView = document.getElementById("summary-view"); // 🌟 新增結算視圖

const jpWordElement = document.getElementById("japanese-word");
const optionsContainer = document.getElementById("options-container");
const feedbackArea = document.getElementById("feedback-area");
const feedbackMsg = document.getElementById("feedback-msg");
const questionText = document.getElementById("question-text");
const kanaText = document.getElementById("kana-text");
const learningBox = document.getElementById("learning-box");
const learnNextBtn = document.getElementById("learn-next-btn");
const speakBtn = document.getElementById("speak-btn");
const vocabImage = document.getElementById("vocab-image");

fetch('data.json').then(res => res.json()).then(data => { 
    allVocab = data; 
    document.getElementById("stat-total").innerText = allVocab.length;
}).catch(e => console.error("資料載入失敗", e));

document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
});

// 🔊 語音朗讀功能
function speakWord(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); 
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ja-JP'; 
        utterance.rate = 0.9;     
        window.speechSynthesis.speak(utterance);
    }
}
if(speakBtn) speakBtn.addEventListener("click", () => {
    if (currentVocab && currentVocab.jp) speakWord(currentVocab.jp);
});

function selectLevel(level, element) {
    selectedLevel = level;
    document.querySelectorAll('.level-card').forEach(card => card.classList.remove('active'));
    element.classList.add('active');
}

function showDashboard() {
    quizView.classList.add("hidden");
    listView.classList.add("hidden"); 
    document.getElementById("session-config-view").classList.add("hidden");
    summaryView.classList.add("hidden"); // 🌟 隱藏結算畫面
    dashboardView.classList.remove("hidden");
    
    document.getElementById("stat-total").innerText = allVocab.length;
    document.getElementById("stat-correct").innerText = correctVocab.length;
    document.getElementById("stat-wrong").innerText = wrongVocab.length;
}

function goBackFromQuiz() {
    if (currentMode === 'single_learn') {
        quizView.classList.add("hidden");
        showVocabList(lastListType);
    } else {
        showDashboard();
    }
}

function showVocabList(type) {
    lastListType = type; 
    dashboardView.classList.add("hidden");
    listView.classList.remove("hidden");
    listContent.innerHTML = ""; 

    let dataToShow = [];
    if (type === 'all') {
        listTitle.innerText = "📚 所有的分級單字列表";
        dataToShow = [...allVocab].sort((a, b) => b.level.localeCompare(a.level));
    } else if (type === 'correct') {
        listTitle.innerText = "✅ 答對的單字記錄";
        dataToShow = correctVocab;
    } else if (type === 'wrong') {
        listTitle.innerText = "🎯 錯題待加強記錄";
        dataToShow = wrongVocab;
    }

    if (dataToShow.length === 0) {
        listContent.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--text-sub);">目前還沒有記錄喔！快去測驗吧。</div>`;
        return;
    }

    dataToShow.forEach(word => {
        const item = document.createElement("div");
        item.className = "vocab-item clickable"; 
        item.onclick = () => viewSingleWord(word); 
        item.innerHTML = `
            <div class="vocab-info">
                <div class="vocab-jp">${word.jp} <span class="level-badge">${word.level}</span></div>
                <div class="vocab-kana">${word.kana || ''}</div>
            </div>
            <div class="vocab-zh">${word.zh}</div>
        `;
        listContent.appendChild(item);
    });
}

function viewSingleWord(word) {
    currentMode = 'single_learn';
    currentPool = [word]; 
    sessionTotal = 1;
    sessionHistory = []; // 清空歷史
    listView.classList.add("hidden");
    quizView.classList.remove("hidden");
    generateQuestion();
}

function showSessionConfig(mode) {
    pendingSessionMode = mode;
    dashboardView.classList.add("hidden");
    document.getElementById("session-config-view").classList.remove("hidden");
    
    const title = document.getElementById("config-title");
    const startBtn = document.getElementById("config-start-btn");
    const numLabel = document.getElementById("config-num-label");
    
    if (mode === 'learn') {
        title.innerText = "📖 學習模式設定";
        numLabel.innerText = `要學習幾個 ${selectedLevel} 單字？`;
        startBtn.innerText = "開始學習 ➔";
    } else {
        title.innerText = "⚙️ 練習模式設定";
        numLabel.innerText = `要測驗幾題 ${selectedLevel} 單字？`;
        startBtn.innerText = "開始測驗 ➔";
    }
}

function startCustomSession() {
    const numInput = parseInt(document.getElementById("session-num-input").value);
    if (isNaN(numInput) || numInput <= 0) { alert("請輸入有效數量！"); return; }

    let levelPool = allVocab.filter(word => word.level === selectedLevel);
    if (levelPool.length === 0) { alert(`題庫無 ${selectedLevel} 單字。`); return; }

    const actualNum = Math.min(numInput, levelPool.length);
    levelPool = levelPool.sort(() => 0.5 - Math.random()).slice(0, actualNum);
    
    currentPool = levelPool;
    sessionTotal = currentPool.length;
    currentMode = pendingSessionMode; 
    sessionHistory = []; // 🌟 新回合開始，清空歷史紀錄

    document.getElementById("session-config-view").classList.add("hidden");
    quizView.classList.remove("hidden");
    generateQuestion();
}

function startSession(mode) {
    if (mode === 'wrong') {
        if (wrongVocab.length === 0) { alert("沒有錯題記錄喔 🎉"); return; }
        currentPool = [...wrongVocab]; 
        sessionTotal = currentPool.length;
        currentMode = 'wrong';
        sessionHistory = []; // 🌟 清空歷史紀錄
        dashboardView.classList.add("hidden");
        quizView.classList.remove("hidden");
        generateQuestion();
    }
}

// 🌟 新增：顯示結算畫面的邏輯
function showSummary() {
    quizView.classList.add("hidden");
    summaryView.classList.remove("hidden");
    const summaryContent = document.getElementById("summary-content");
    summaryContent.innerHTML = "";

    // 巡迴歷史紀錄，把每張卡片印出來並加上漸進式延遲
    sessionHistory.forEach((word, index) => {
        const card = document.createElement("div");
        card.className = "summary-card";
        // 核心魔法：讓卡片一張接一張彈出來，每張延遲 0.15 秒
        card.style.animationDelay = `${index * 0.15}s`; 
        card.innerHTML = `
            <div class="vocab-jp">${word.jp} <span style="font-size:13px; color:var(--text-sub); margin-left:8px;">${word.kana||''}</span></div>
            <div class="vocab-zh">${word.zh}</div>
        `;
        summaryContent.appendChild(card);
    });
}

function generateQuestion() {
    feedbackArea.classList.add("hidden");
    optionsContainer.innerHTML = "";
    kanaText.classList.add("hidden");
    learningBox.classList.add("hidden");
    learnNextBtn.classList.add("hidden");
    questionText.classList.add("hidden");

    // 🌟 修改：當題目抽完時，改呼叫結算畫面，而不是跳出 alert
    if (currentPool.length === 0) {
        if (currentMode === 'single_learn') {
            goBackFromQuiz(); // 若是單獨查看字卡，直接返回
        } else {
            showSummary(); // 正式回合結束，進入超有成就感的結算畫面！
        }
        return;
    }

    const randomIndex = Math.floor(Math.random() * currentPool.length);
    currentVocab = currentPool.splice(randomIndex, 1)[0]; 
    sessionHistory.push(currentVocab); // 🌟 將抽出的單字存進歷史紀錄

    jpWordElement.innerText = currentVocab.jp;

    if (vocabImage) {
        if (currentVocab.image) {
            vocabImage.src = currentVocab.image;
            vocabImage.classList.remove("hidden");
        } else {
            vocabImage.classList.add("hidden");
        }
    }

    if (currentMode === 'learn' || currentMode === 'single_learn') {
        kanaText.innerText = currentVocab.kana || "";
        document.getElementById("learn-meaning").innerText = currentVocab.zh;
        document.getElementById("learn-ex-jp").innerText = currentVocab.ex_jp || "例句擴充中...";
        document.getElementById("learn-ex-zh").innerText = currentVocab.ex_zh || "";
        
        kanaText.classList.remove("hidden");
        learningBox.classList.remove("hidden");
        
        if (currentMode !== 'single_learn') learnNextBtn.classList.remove("hidden");
        
        // 自動發音
        speakWord(currentVocab.jp);
        updateProgressUI(); 
    } else {
        questionText.classList.remove("hidden");
        let options = [currentVocab.zh];
        while (options.length < 4) {
            let randomWrong = allVocab[Math.floor(Math.random() * allVocab.length)].zh;
            if (!options.includes(randomWrong)) options.push(randomWrong);
        }
        options.sort(() => Math.random() - 0.5); 
        options.forEach(optionText => {
            const btn = document.createElement("button");
            btn.classList.add("option-btn");
            btn.innerText = optionText;
            btn.addEventListener("click", () => checkAnswer(btn, optionText));
            optionsContainer.appendChild(btn);
        });
        updateProgressUI();
    }
}

function checkAnswer(clickedBtn, selectedText) {
    const allBtns = document.querySelectorAll(".option-btn");
    allBtns.forEach(btn => btn.disabled = true);
    feedbackArea.classList.remove("hidden");
    stats.total++;

    if (selectedText === currentVocab.zh) {
        clickedBtn.classList.add("correct");
        feedbackMsg.innerText = "⭕ 答對了！";
        feedbackMsg.style.color = "var(--correct)";
        stats.correct++;
        if (!correctVocab.some(w => w.jp === currentVocab.jp)) correctVocab.push(currentVocab);
        if (currentMode === 'wrong') wrongVocab = wrongVocab.filter(word => word.jp !== currentVocab.jp);
    } else {
        clickedBtn.classList.add("wrong");
        feedbackMsg.innerText = `❌ 正解：${currentVocab.zh}`;
        feedbackMsg.style.color = "var(--wrong)";
        allBtns.forEach(btn => { if (btn.innerText === currentVocab.zh) btn.classList.add("correct"); });

        const isAlreadyWrong = wrongVocab.some(word => word.jp === currentVocab.jp);
        if (!isAlreadyWrong) wrongVocab.push(currentVocab);
    }
}

function updateProgressUI() {
    let remain = currentPool.length + (currentMode==='learn' || currentMode==='single_learn' ? 0 : 1);
    document.getElementById("score-display").innerText = `剩餘 ${remain} / ${sessionTotal}`;
    let progressPercent = ((sessionTotal - currentPool.length) / sessionTotal) * 100;
    document.getElementById("progress-bar").style.width = `${progressPercent}%`;
}

// AI 擴充題庫功能 (維持不變，可自行填入金鑰)
const GEMINI_API_KEY = ''; // 記得補上你的 API Key
async function generateWordsWithAI() { /* ...維持原樣... */ }