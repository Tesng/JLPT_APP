let allVocab = [];      // 儲存從 JSON 抓來的所有單字
let currentVocab = {};  // 目前這題的單字資料

// 取得 HTML 元素
const levelSelect = document.getElementById("level-select");
const jpWordElement = document.getElementById("japanese-word");
const optionsContainer = document.getElementById("options-container");
const feedbackMsg = document.getElementById("feedback-msg");
const nextBtn = document.getElementById("next-btn");

// 1. 抓取資料庫
fetch('data.json')
    .then(res => res.json())
    .then(data => {
        allVocab = data;
        generateQuestion(); // 資料載入完成後，馬上產生第一題
    });

// 2. 當下拉選單改變時，重新出題
levelSelect.addEventListener("change", generateQuestion);

// 3. 產生題目的核心邏輯
function generateQuestion() {
    // 隱藏回饋與下一題按鈕
    feedbackMsg.classList.add("hidden");
    nextBtn.classList.add("hidden");
    optionsContainer.innerHTML = ""; // 清空舊的選項

    // 步驟 A：根據下拉選單過濾單字
    const selectedLevel = levelSelect.value;
    let filteredList = allVocab;
    if (selectedLevel !== "ALL") {
        filteredList = allVocab.filter(word => word.level === selectedLevel);
    }

    // 步驟 B：隨機挑選 1 個作為「正確答案」
    const randomIndex = Math.floor(Math.random() * filteredList.length);
    currentVocab = filteredList[randomIndex];
    jpWordElement.innerText = currentVocab.jp;

    // 步驟 C：產生 4 個選項（1 對 + 3 錯）
    let options = [currentVocab.zh]; // 先把正確答案放進去
    
    // 隨機抓 3 個錯誤答案 (從全部字庫抓，增加混淆度)
    while (options.length < 4) {
        let randomWrong = allVocab[Math.floor(Math.random() * allVocab.length)].zh;
        // 確保選項不重複
        if (!options.includes(randomWrong)) {
            options.push(randomWrong);
        }
    }

    // 將陣列順序打亂 (Shuffle)
    options.sort(() => Math.random() - 0.5);

    // 步驟 D：將選項變成按鈕顯示在畫面上
    options.forEach(optionText => {
        const btn = document.createElement("button");
        btn.classList.add("option-btn");
        btn.innerText = optionText;
        
        // 綁定點擊事件
        btn.addEventListener("click", () => checkAnswer(btn, optionText));
        optionsContainer.appendChild(btn);
    });
}

// 4. 檢查答案邏輯
function checkAnswer(clickedBtn, selectedText) {
    // 鎖定所有按鈕，不讓使用者重複點擊
    const allBtns = document.querySelectorAll(".option-btn");
    allBtns.forEach(btn => btn.disabled = true);

    feedbackMsg.classList.remove("hidden");
    nextBtn.classList.remove("hidden");

    if (selectedText === currentVocab.zh) {
        clickedBtn.classList.add("correct");
        feedbackMsg.innerText = "⭕ 答對了！";
        feedbackMsg.style.color = "#4CAF50";
    } else {
        clickedBtn.classList.add("wrong");
        feedbackMsg.innerText = `❌ 答錯了！正確答案是「${currentVocab.zh}」`;
        feedbackMsg.style.color = "#f44336";
        
        // 把正確的按鈕也標示出來
        allBtns.forEach(btn => {
            if (btn.innerText === currentVocab.zh) {
                btn.classList.add("correct");
            }
        });
    }
}

// 5. 點擊下一題
nextBtn.addEventListener("click", generateQuestion);