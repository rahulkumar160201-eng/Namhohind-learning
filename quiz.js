document.addEventListener("DOMContentLoaded", () => {
    const dashboard = document.getElementById("quiz-dashboard");
    const interfaceUI = document.getElementById("quiz-interface");
    const resultScreen = document.getElementById("quiz-result");
    const loader = document.getElementById("quiz-loader");

    const form = document.getElementById("quizSetupForm");
    const categorySelect = document.getElementById("quiz-category");
    const setSelect = document.getElementById("quiz-set");

    const quizTitle = document.getElementById("quiz-title");
    const timerDisplay = document.getElementById("timer-display");
    const questionNumber = document.getElementById("question-number");
    const questionText = document.getElementById("question-text");
    const optionsContainer = document.getElementById("options-container");
    const paletteContainer = document.getElementById("palette-container");

    const btnPrev = document.getElementById("btn-prev");
    const btnSaveNext = document.getElementById("btn-save-next");
    const btnSubmit = document.getElementById("btn-submit");
    const btnHome = document.getElementById("btn-home");

    const config = {
        "bihar-gk": { name: "Bihar GK", folder: "bihar-gk", defaultTime: 30 },
        "bihar-police": { name: "Bihar Police", folder: "bihar-police", defaultTime: 120 },
        "bpsc": { name: "BPSC", folder: "bpsc", defaultTime: 120 },
        "current-affairs": { name: "Current Affairs", folder: "current-affairs", defaultTime: 30 }
    };

    let state = {
        questions: [],
        answers: [],
        status: [], // 0: unvisited, 1: answered, 2: viewed but unanswered
        current: 0,
        timeLeft: 0,
        timerInterval: null
    };

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const catKey = categorySelect.value;
        const setNum = setSelect.value;
        const targetConfig = config[catKey];

        // GitHub Pages compatible relative path
        const jsonPath = `question-banks/${targetConfig.folder}/set${setNum}.json`;

        dashboard.classList.add("hidden");
        loader.classList.remove("hidden");

        try {
            console.log(`[Quiz Engine] Validating and Loading: ${jsonPath}`);
            // Cache busting parameter to enforce fresh pull
            const response = await fetch(`${jsonPath}?t=${new Date().getTime()}`);
            
            if (!response.ok) {
                throw new Error(`HTTP Error ${response.status}: File not found.`);
            }

            const data = await response.json();
            
            if (!data.questions || data.questions.length === 0) {
                throw new Error("Invalid JSON: Questions array missing or empty.");
            }

            // Setup state
            state.questions = data.questions;
            state.answers = new Array(data.questions.length).fill(null);
            state.status = new Array(data.questions.length).fill(0);
            state.current = 0;
            state.timeLeft = (data.duration_minutes ? data.duration_minutes : targetConfig.defaultTime) * 60;

            quizTitle.innerText = `${targetConfig.name} - Set 0${setNum}`;

            loader.classList.add("hidden");
            interfaceUI.classList.remove("hidden");

            startTimer();
            renderQuestion();

        } catch (error) {
            console.warn("[Quiz Engine Fallback] Missing JSON or Fetch failed:", error.message);
            loader.classList.add("hidden");
            dashboard.classList.remove("hidden");
            // Friendly fallback error masking the technical HTTP 404
            alert("Quiz content is currently unavailable. Please contact administrator.");
        }
    });

    function startTimer() {
        if (state.timerInterval) clearInterval(state.timerInterval);
        updateTimerDisplay();
        state.timerInterval = setInterval(() => {
            state.timeLeft--;
            updateTimerDisplay();
            if (state.timeLeft <= 0) {
                clearInterval(state.timerInterval);
                submitTest(true);
            }
        }, 1000);
    }

    function updateTimerDisplay() {
        const m = Math.floor(state.timeLeft / 60).toString().padStart(2, '0');
        const s = (state.timeLeft % 60).toString().padStart(2, '0');
        timerDisplay.innerText = `${m}:${s}`;
    }

    function renderQuestion() {
        if (state.status[state.current] === 0) {
            state.status[state.current] = 2; // Mark as viewed
        }

        const q = state.questions[state.current];
        questionNumber.innerText = `Question ${state.current + 1} of ${state.questions.length}`;
        
        let textHtml = "";
        if (q.question_hi) textHtml += `<p>${q.question_hi}</p>`;
        if (q.question_en) textHtml += `<p>${q.question_en}</p>`;
        if (!q.question_hi && !q.question_en) textHtml += `<p>${q.question}</p>`;
        questionText.innerHTML = textHtml;

        optionsContainer.innerHTML = "";
        if (q.options) {
            Object.entries(q.options).forEach(([key, val]) => {
                const isChecked = state.answers[state.current] === key ? "checked" : "";
                optionsContainer.insertAdjacentHTML('beforeend', `
                    <label class="option-label">
                        <input type="radio" name="opt" value="${key}" ${isChecked}>
                        <span><strong>${key}.</strong> ${val}</span>
                    </label>
                `);
            });
        }

        btnPrev.disabled = state.current === 0;
        renderPalette();
    }

    function renderPalette() {
        paletteContainer.innerHTML = "";
        state.questions.forEach((_, idx) => {
            const btn = document.createElement("button");
            btn.className = "palette-btn";
            btn.innerText = idx + 1;
            if (idx === state.current) btn.classList.add("active");
            if (state.status[idx] === 1) btn.classList.add("answered");
            else if (state.status[idx] === 2) btn.classList.add("viewed");
            
            btn.onclick = () => { saveCurrentAnswer(); state.current = idx; renderQuestion(); };
            paletteContainer.appendChild(btn);
        });
    }

    function saveCurrentAnswer() {
        const selected = document.querySelector('input[name="opt"]:checked');
        if (selected) {
            state.answers[state.current] = selected.value;
            state.status[state.current] = 1;
        }
    }

    btnSaveNext.addEventListener("click", () => {
        saveCurrentAnswer();
        if (state.current < state.questions.length - 1) {
            state.current++;
            renderQuestion();
        }
    });

    btnPrev.addEventListener("click", () => {
        saveCurrentAnswer();
        if (state.current > 0) {
            state.current--;
            renderQuestion();
        }
    });

    btnSubmit.addEventListener("click", () => submitTest(false));

    function submitTest(isAuto) {
        saveCurrentAnswer();
        if (!isAuto && !confirm("Are you sure you want to submit the test?")) return;
        
        clearInterval(state.timerInterval);
        let correct = 0, incorrect = 0, unanswered = 0;

        state.questions.forEach((q, i) => {
            const ans = state.answers[i];
            if (!ans) unanswered++;
            else if (ans === q.answer) correct++;
            else incorrect++;
        });

        document.getElementById("res-total").innerText = state.questions.length;
        document.getElementById("res-correct").innerText = correct;
        document.getElementById("res-incorrect").innerText = incorrect;
        document.getElementById("res-unanswered").innerText = unanswered;
        
        const pct = Math.round((correct / state.questions.length) * 100);
        document.getElementById("res-score").innerText = `${pct}%`;

        interfaceUI.classList.add("hidden");
        resultScreen.classList.remove("hidden");
    }

    btnHome.addEventListener("click", () => window.location.reload());
});
