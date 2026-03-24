let allVocab = [];
let wrongVocab = []; 
let correctVocab = []; 
let currentPool = []; 
let currentVocab = {};
let selectedLevel = 'N1'; // 預設級別
let currentMode = 'practice'; // 'learn', 'practice', 'wrong', 'single_learn'
let sessionTotal = 0; 

let stats = { total: 0, correct: 0 };
let pendingSessionMode = 'practice'; 
let lastListType = 'all'; 

// DOM 元素綁定
const dashboardView = document.getElementById("dashboard-view");
const quizView = document.getElementById("quiz-view");
const listView = document.getElementById("list-view"); 
const listContent = document.getElementById("list-content");
const listTitle = document.getElementById("list-title");

const jpWordElement = document.getElementById("japanese-word");
const optionsContainer = document.getElementById("options-container");
const feedbackArea = document.getElementById("feedback-area");
const feedbackMsg = document.getElementById("feedback-msg");
const questionText = document.getElementById("question-text");
const kanaText = document.getElementById("kana-text");
const learningBox = document.getElementById("learning-box");
const learnNextBtn = document.getElementById("learn-next-btn");

// 載入 JSON 資料
fetch('data.json').then(res => res.json()).then(data => { 
    allVocab = data; 
    document.getElementById("stat-total").innerText = allVocab.length;
}).catch(e => console.error("資料載入失敗", e));

// 切換日夜間模式
document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
});

// 🌟 這就是大廳選擇等級的核心功能 (剛剛遺失的拼圖！)
function selectLevel(level, element) {
    selectedLevel = level;
    // 移除所有卡片的 active 狀態，並為點擊的卡片加上 active
    document.querySelectorAll('.level-card').forEach(card => card.classList.remove('active'));
    element.classList.add('active');
}

// 返回大廳
function showDashboard() {
    quizView.classList.add("hidden");
    listView.classList.add("hidden"); 
    document.getElementById("session-config-view").classList.add("hidden");
    dashboardView.classList.remove("hidden");
    
    // 更新統計數字
    document.getElementById("stat-total").innerText = allVocab.length;
    document.getElementById("stat-correct").innerText = correctVocab.length;
    document.getElementById("stat-wrong").innerText = wrongVocab.length;
}

// 智慧返回按鈕 (如果從列表點擊單字，返回時回到列表)
function goBackFromQuiz() {
    if (currentMode === 'single_learn') {
        quizView.classList.add("hidden");
        showVocabList(lastListType);
    } else {
        showDashboard();
    }
}

// 顯示單字列表
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

// 點擊列表查看單張字卡
function viewSingleWord(word) {
    currentMode = 'single_learn';
    currentPool = [word]; 
    sessionTotal = 1;

    listView.classList.add("hidden");
    quizView.classList.remove("hidden");
    generateQuestion();
}

// ================= 共用設定模式邏輯 =================

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
    if (isNaN(numInput) || numInput <= 0) {
        alert("請輸入有效的數量！（至少 1 題）");
        return;
    }

    let levelPool = allVocab.filter(word => word.level === selectedLevel);
    if (levelPool.length === 0) {
        alert(`目前題庫中沒有 ${selectedLevel} 的單字。`); 
        return;
    }

    // 確定能抽取的數量並洗牌
    const actualNum = Math.min(numInput, levelPool.length);
    levelPool = levelPool.sort(() => 0.5 - Math.random()).slice(0, actualNum);
    
    currentPool = levelPool;
    sessionTotal = currentPool.length;
    currentMode = pendingSessionMode; 

    document.getElementById("session-config-view").classList.add("hidden");
    quizView.classList.remove("hidden");
    generateQuestion();
}

// ================= 出題與學習邏輯 =================

// 錯題本專用入口
function startSession(mode) {
    if (mode === 'wrong') {
        if (wrongVocab.length === 0) { alert("太厲害了！你沒有錯題記錄喔 🎉"); return; }
        currentPool = [...wrongVocab]; 
        sessionTotal = currentPool.length;
        currentMode = 'wrong';
        dashboardView.classList.add("hidden");
        quizView.classList.remove("hidden");
        generateQuestion();
    }
}

function generateQuestion() {
    feedbackArea.classList.add("hidden");
    optionsContainer.innerHTML = "";
    kanaText.classList.add("hidden");
    learningBox.classList.add("hidden");
    learnNextBtn.classList.add("hidden");
    questionText.classList.add("hidden");

    // 題庫抽完時的結算
    if (currentPool.length === 0) {
        alert("🎉 恭喜完成！");
        showDashboard();
        return;
    }

    // 隨機抽出一題並從陣列中刪除
    const randomIndex = Math.floor(Math.random() * currentPool.length);
    currentVocab = currentPool.splice(randomIndex, 1)[0]; 

    jpWordElement.innerText = currentVocab.jp;

    // 判斷模式繪製介面
    if (currentMode === 'learn' || currentMode === 'single_learn') {
        kanaText.innerText = currentVocab.kana || "";
        document.getElementById("learn-meaning").innerText = currentVocab.zh;
        document.getElementById("learn-ex-jp").innerText = currentVocab.ex_jp || "例句擴充中...";
        document.getElementById("learn-ex-zh").innerText = currentVocab.ex_zh || "";
        
        kanaText.classList.remove("hidden");
        learningBox.classList.remove("hidden");
        
        if (currentMode !== 'single_learn') {
            learnNextBtn.classList.remove("hidden");
        }
        updateProgressUI(); 
    } else {
        questionText.classList.remove("hidden");
        let options = [currentVocab.zh];
        
        // 抓取錯誤選項
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