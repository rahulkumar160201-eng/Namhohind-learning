/* Namhohind CBT quiz module. Refactored to fetch dynamic JSON question banks and handle user sessions. */
(function () {
    "use strict";

    const quizConfig = {
        "bihar-gk-basic": {
            name: "Bihar GK Basic",
            questions: 50,
            duration: 45,
            sets: {
                "Set 01": "question-banks/bihar-gk-basic-set-1.json",
                "Set 02": "question-banks/bihar-gk-basic-set-2.json",
                "Set 03": "question-banks/bihar-gk-basic-set-3.json",
                "Set 04": "question-banks/bihar-gk-basic-set-4.json",
                "Set 05": "question-banks/bihar-gk-basic-set-5.json"
            }
        },
        "bihar-gk-advanced": {
            name: "Bihar GK Advanced",
            questions: 50,
            duration: 45,
            sets: {
                "Set 01": "question-banks/bihar-gk-advanced-set-1.json",
                "Set 02": "question-banks/bihar-gk-advanced-set-2.json",
                "Set 03": "question-banks/bihar-gk-advanced-set-3.json",
                "Set 04": "question-banks/bihar-gk-advanced-set-4.json",
                "Set 05": "question-banks/bihar-gk-advanced-set-5.json"
            }
        },
        "current-affairs": {
            name: "Current Affairs",
            questions: 50,
            duration: 30,
            sets: {
                "Set 01": "question-banks/current-affairs-set-1.json",
                "Set 02": "question-banks/current-affairs-set-2.json",
                "Set 03": "question-banks/current-affairs-set-3.json",
                "Set 04": "question-banks/current-affairs-set-4.json",
                "Set 05": "question-banks/current-affairs-set-5.json"
            }
        },
        "mixed-practice": {
            name: "Mixed Practice Test",
            questions: 50,
            duration: 45,
            sets: {
                "Set 01": "question-banks/mixed-set1.json",
                "Set 02": "question-banks/mixed-set2.json",
                "Set 03": "question-banks/mixed-set3.json",
                "Set 04": "question-banks/mixed-set4.json",
                "Set 05": "question-banks/mixed-set5.json"
            }
        },
        "bihar-police": {
            name: "Bihar Police Mock Test",
            questions: 100,
            duration: 120,
            sets: {
                "Set 01": "question-banks/bihar-police-set1.json",
                "Set 02": "question-banks/bihar-police-set2.json",
                "Set 03": "question-banks/bihar-police-set3.json",
                "Set 04": "question-banks/bihar-police-set4.json",
                "Set 05": "question-banks/bihar-police-set5.json"
            }
        },
        "bpsc": {
            name: "BPSC Mock Test",
            questions: 150,
            duration: 180,
            sets: {
                "Set 01": "question-banks/bpsc-set1.json",
                "Set 02": "question-banks/bpsc-set2.json",
                "Set 03": "question-banks/bpsc-set3.json",
                "Set 04": "question-banks/bpsc-set4.json",
                "Set 05": "question-banks/bpsc-set5.json",
                "Set 06": "question-banks/bpsc-set6.json",
                "Set 07": "question-banks/bpsc-set7.json",
                "Set 08": "question-banks/bpsc-set8.json",
                "Set 09": "question-banks/bpsc-set9.json",
                "Set 10": "question-banks/bpsc-set10.json"
            }
        }
    };

    const examStore = {
        get(key, fallback) {
            try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
            catch (error) { return fallback; }
        },
        set(key, value) {
            localStorage.setItem(key, JSON.stringify(value));
        },
        currentUser() {
            return this.get("namhohindCurrentUser", null);
        }
    };

    let state = {
        subject: "",
        topic: "",
        questions: [],
        current: 0,
        answers: [],
        status: [],
        secondsLeft: 0,
        totalSeconds: 0,
        timer: null
    };

    function showWarning() {
        let warning = document.getElementById("antiCopyWarning");
        if (!warning) {
            warning = document.createElement("div");
            warning.id = "antiCopyWarning";
            warning.style.position = "fixed";
            warning.style.top = "10px";
            warning.style.right = "10px";
            warning.style.background = "#e74c3c";
            warning.style.color = "white";
            warning.style.padding = "10px 20px";
            warning.style.zIndex = "9999";
            warning.style.borderRadius = "5px";
            warning.style.fontWeight = "bold";
            warning.textContent = "Warning: Copying or inspecting elements is disabled for security reasons.";
            document.body.appendChild(warning);
        }
        warning.style.display = "block";
        setTimeout(() => warning.style.display = "none", 3000);
    }

    function initProtection() {
        document.body.classList.add("exam-lock");
        ["copy", "cut", "contextmenu", "dragstart", "selectstart"].forEach((eventName) => {
            document.addEventListener(eventName, (event) => {
                event.preventDefault();
                showWarning();
            });
        });
        document.addEventListener("keydown", (event) => {
            const key = event.key.toLowerCase();
            const blocked = key === "f12" || (event.ctrlKey && ["c", "u", "x"].includes(key)) || (event.ctrlKey && event.shiftKey && key === "i");
            if (blocked) {
                event.preventDefault();
                showWarning();
            }
        });
    }

    function init() {
        initProtection();
        const page = document.body.dataset.page;
        if (page === "quiz") initQuizPage();
        if (page === "login") initLogin();
        if (page === "signup") initSignup();
        if (page === "forgot-password") initForgotPassword();
        if (page === "dashboard") initDashboard();
        if (page === "result") renderResult();
        if (page === "leaderboard") initLeaderboard();
    }

    function initQuizPage() {
        const urlParams = new URLSearchParams(window.location.search);
        let subjectKey = urlParams.get('subject');
        
        if (!subjectKey || !quizConfig[subjectKey]) {
            subjectKey = "bihar-gk-basic";
        }
        
        const config = quizConfig[subjectKey];
        
        const titleEl = document.getElementById("quizSetupTitle");
        if(titleEl) titleEl.innerText = config.name;
        
        const subjInput = document.getElementById("subjectSelect");
        if (subjInput) subjInput.value = subjectKey;
        
        const topicSelect = document.getElementById("topicSelect");
        if (topicSelect) {
            topicSelect.innerHTML = Object.keys(config.sets).map((set) => `<option value="${set}">${set}</option>`).join("");
            topicSelect.addEventListener("change", updateTopics);
        }

        updateTopics();

        const user = examStore.currentUser();
        const users = examStore.get("namhohindUsers", []);
        const latestUser = user ? users.find(u => u.username === user.username) : null;
        
        if (latestUser) {
            text("candidateName", latestUser.fullName || latestUser.username);
            text("candidateId", latestUser.candidateId || "N/A");
            text("candidateDob", latestUser.dob || "N/A");
            text("candidateScore", latestUser.stats?.score || 0);
            text("candidateTests", latestUser.stats?.attempted || 0);
            
            const rankedUsers = [...users].sort((a,b) => (b.stats?.score || 0) - (a.stats?.score || 0));
            const rank = rankedUsers.findIndex(u => u.username === latestUser.username) + 1;
            text("candidateRank", rank);
            
            document.getElementById("guestActions")?.classList.add("hidden");
            document.getElementById("loggedInActions")?.classList.remove("hidden");
            
            document.getElementById("logoutBtn")?.addEventListener("click", () => {
                examStore.set("namhohindCurrentUser", null);
                window.location.reload();
            });
        }

        document.getElementById("quizSetupForm")?.addEventListener("submit", startQuiz);
        document.getElementById("previousBtn")?.addEventListener("click", previousQuestion);
        document.getElementById("nextBtn")?.addEventListener("click", nextQuestion);
        document.getElementById("saveNextBtn")?.addEventListener("click", saveAndNext);
        document.getElementById("reviewBtn")?.addEventListener("click", markForReview);
        document.getElementById("clearBtn")?.addEventListener("click", clearResponse);
        document.getElementById("submitTestBtn")?.addEventListener("click", () => submitTest(false));
    }

    function updateTopics() {
        const subjInput = document.getElementById("subjectSelect");
        const subjectKey = subjInput ? subjInput.value : "bihar-gk-basic";
        const config = quizConfig[subjectKey];
        if (!config) return;
        
        text("totalQuestions", config.questions);
        text("totalMarks", config.questions);
        text("timeDuration", config.duration + " Min");
    }

    async function startQuiz(event) {
        event.preventDefault();
        const subjectKey = document.getElementById("subjectSelect").value;
        let topic = document.getElementById("topicSelect").value;
        const config = quizConfig[subjectKey];
        
        state.subject = config.name;
        state.topic = topic;
        
        let jsonUrl = config.sets[topic];
        
        console.log("Subject:", state.subject);
        console.log("Topic:", subjectKey);
        console.log("Set:", state.topic);
        console.log("File Path:", jsonUrl);

        if (!jsonUrl) {
            alert(`Subject: ${state.subject}\nSet: ${state.topic}\nExpected File: Not configured\nError Type: File path is missing in configuration.`);
            return;
        }

        try {
            let response = await fetch(jsonUrl);
            
            if (!response.ok) {
                console.error("Failed Path:", jsonUrl);
                
                let fallbackTopic = "Set 01";
                let fallbackUrl = config.sets[fallbackTopic];
                
                if (topic !== fallbackTopic && fallbackUrl) {
                    console.log(`Attempting fallback to ${fallbackTopic} (${fallbackUrl})`);
                    response = await fetch(fallbackUrl);
                    if (response.ok) {
                        topic = fallbackTopic;
                        state.topic = topic;
                        jsonUrl = fallbackUrl;
                        const topicSelect = document.getElementById("topicSelect");
                        if (topicSelect) topicSelect.value = topic;
                        console.log("Fallback successful. Loading file:", jsonUrl);
                    } else {
                        throw new Error(`HTTP ${response.status} - Both primary (${jsonUrl}) and fallback (${fallbackUrl}) files failed to load.`);
                    }
                } else {
                    throw new Error(`HTTP ${response.status} - File not found on server.`);
                }
            }

            const data = await response.json();
            state.questions = data.questions;
            
            if (!state.questions || !Array.isArray(state.questions) || state.questions.length === 0) {
                throw new Error("JSON file is valid but contains no questions or is not formatted correctly.");
            }
            
            console.log("Questions Loaded:", state.questions.length);
            
            if(data.duration_minutes) {
                state.secondsLeft = data.duration_minutes * 60;
            } else {
                state.secondsLeft = Math.max(5, state.questions.length) * 60;
            }
            state.totalSeconds = state.secondsLeft;
        } catch (error) {
            console.error("Failed Path:", jsonUrl);
            console.error("Actual Error:", error);
            alert(`Subject: ${state.subject}\nSet: ${state.topic}\nExpected File: ${jsonUrl}\nError Type: ${error.message}`);
            return;
        }

        state.current = 0;
        state.answers = Array(state.questions.length).fill(null);
        state.status = Array(state.questions.length).fill("not-visited");
        
        const dash = document.getElementById("quizDashboard");
        if (dash) dash.classList.add("hidden");
        const panel = document.getElementById("examPanel");
        if (panel) panel.classList.remove("hidden");
        
        text("activeSubject", state.subject);
        text("activeTopic", state.topic);
        
        renderQuestion();
        renderPalette();
        tick();
        if (state.timer) clearInterval(state.timer);
        state.timer = setInterval(tick, 1000);
    }

    function renderQuestion() {
        const item = state.questions[state.current];
        if (!item) return;
        if (state.status[state.current] === "not-visited") state.status[state.current] = "not-answered";
        text("questionCounter", `Question ${state.current + 1} of ${state.questions.length}`);
        
        const qText = `${item.question_hi || item.question}\n\n${item.question_en || ""}`;
        const qElement = document.getElementById("questionText");
        if(qElement) qElement.innerText = qText;
        
        const optionsList = document.getElementById("optionsList");
        if (optionsList && item.options) {
            let optionsHtml = "";
            const keys = Object.keys(item.options);
            keys.forEach((key, index) => {
                const checked = state.answers[state.current] === index ? "checked" : "";
                const selected = checked ? " selected" : "";
                optionsHtml += `<label class="option-row${selected}"><input type="radio" name="answer" value="${index}" ${checked}>${key}. ${item.options[key]}</label>`;
            });
            optionsList.innerHTML = optionsHtml;
            
            document.querySelectorAll("input[name='answer']").forEach((input) => {
                input.addEventListener("change", () => {
                    state.answers[state.current] = Number(input.value);
                    state.status[state.current] = "answered";
                    renderQuestion(); 
                });
            });
        }
        renderPalette();
    }

    function renderPalette() {
        const palette = document.getElementById("questionPalette");
        if (!palette) return;
        palette.innerHTML = state.questions.map((_, index) => {
            const active = index === state.current ? " active" : "";
            return `<button class="palette-btn ${state.status[index]}${active}" type="button" data-index="${index}">${index + 1}</button>`;
        }).join("");
        
        document.querySelectorAll(".palette-btn").forEach((button) => {
            button.addEventListener("click", () => {
                state.current = Number(button.dataset.index);
                renderQuestion();
            });
        });
    }

    function previousQuestion() {
        if (state.current > 0) {
            state.current -= 1;
            renderQuestion();
        }
    }

    function nextQuestion() {
        if (state.current < state.questions.length - 1) {
            state.current += 1;
            renderQuestion();
        }
    }

    function saveAndNext() {
        if (state.answers[state.current] !== null) state.status[state.current] = "answered";
        nextQuestion();
    }

    function markForReview() {
        state.status[state.current] = "review";
        renderPalette();
        nextQuestion();
    }

    function clearResponse() {
        state.answers[state.current] = null;
        state.status[state.current] = "not-answered";
        renderQuestion();
    }

    function tick() {
        const minutes = Math.floor(state.secondsLeft / 60);
        const seconds = state.secondsLeft % 60;
        text("timerDisplay", `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`);
        const timerBox = document.getElementById("timerBox");
        if(timerBox) {
            timerBox.classList.toggle("warning", state.secondsLeft <= 300 && state.secondsLeft > 60);
            timerBox.classList.toggle("danger", state.secondsLeft <= 60);
        }
        if (state.secondsLeft <= 0) {
            submitTest(true);
            return;
        }
        state.secondsLeft -= 1;
    }

    function submitTest(auto) {
        if (!auto && !confirm("Do you want to submit the test?")) return;
        clearInterval(state.timer);
        const result = calculateResult();
        examStore.set("namhohindLatestResult", result);
        saveLeaderboard(result);
        window.location.href = "result.html";
    }

    function calculateResult() {
        let correct = 0;
        let wrong = 0;
        state.questions.forEach((question, index) => {
            if (state.answers[index] === null) return;
            
            const optionKeys = Object.keys(question.options);
            const selectedOptionKey = optionKeys[state.answers[index]];

            if (selectedOptionKey === question.answer) correct += 1;
            else wrong += 1;
        });
        
        const total = state.questions.length;
        const attempted = correct + wrong;
        const score = correct;
        const percentage = Math.round((score / total) * 100);
        
        const timeTakenSeconds = state.totalSeconds - state.secondsLeft;
        const timeTakenFormatted = `${Math.floor(timeTakenSeconds / 60)}m ${timeTakenSeconds % 60}s`;

        const user = examStore.currentUser();
        
        if (user) {
            const users = examStore.get("namhohindUsers", []);
            const userIndex = users.findIndex(u => u.username === user.username);
            if (userIndex !== -1) {
                if(!users[userIndex].stats) users[userIndex].stats = { attempted: 0, score: 0, correct: 0, wrong: 0 };
                users[userIndex].stats.attempted += 1;
                users[userIndex].stats.score += score;
                users[userIndex].stats.correct += correct;
                users[userIndex].stats.wrong += wrong;
                examStore.set("namhohindUsers", users);
            }
        }
        
        return {
            subject: state.subject,
            topic: state.topic,
            username: user ? user.username : "Guest",
            fullName: user ? user.fullName : "Guest User",
            candidateId: user ? user.candidateId : "Guest",
            total,
            attempted,
            correct,
            wrong,
            unanswered: total - attempted,
            score,
            percentage,
            timeTaken: timeTakenFormatted,
            status: percentage >= 40 ? "Pass" : "Fail",
            date: new Date().toLocaleDateString("en-IN")
        };
    }

    function saveLeaderboard(result) {
        const key = `namhohindLeaderboard:${result.subject}`;
        let rows = examStore.get(key, []);
        
        const existingIndex = rows.findIndex(r => r.username === result.username);
        const userStats = examStore.get("namhohindUsers", []).find(u => u.username === result.username);
        const attempted = userStats ? userStats.stats.attempted : 1;
        const fullName = userStats ? userStats.fullName : result.username;

        if (existingIndex !== -1) {
            rows[existingIndex].score += result.score;
            rows[existingIndex].attempted = attempted;
            rows[existingIndex].date = result.date;
            rows[existingIndex].timeTaken = result.timeTaken;
        } else {
            rows.push({ 
                username: result.username, 
                fullName: fullName,
                candidateId: result.candidateId,
                score: result.score, 
                attempted: attempted,
                timeTaken: result.timeTaken,
                date: result.date 
            });
        }
        
        rows.sort((a, b) => b.score - a.score);
        examStore.set(key, rows);
    }

    function initSignup() {
        const form = document.getElementById("signupForm");
        if(!form) return;
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            const fullName = document.getElementById("signupFullName")?.value.trim() || "";
            const username = document.getElementById("signupUsername").value.trim();
            const dob = document.getElementById("signupDob")?.value || "";
            const password = document.getElementById("signupPassword").value;
            const confirmPassword = document.getElementById("signupConfirmPassword")?.value || password;

            if (password !== confirmPassword) {
                text("signupMessage", "Passwords do not match.");
                return;
            }

            const users = examStore.get("namhohindUsers", []);
            if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
                text("signupMessage", "Username already exists.");
                return;
            }
            
            const nextId = "NHB" + (1000 + users.length + 1);
            
            const newUser = { 
                candidateId: nextId, 
                fullName, 
                username, 
                dob, 
                password, 
                stats: { attempted: 0, score: 0, correct: 0, wrong: 0 } 
            };
            users.push(newUser);
            examStore.set("namhohindUsers", users);
            examStore.set("namhohindCurrentUser", newUser);
            
            text("signupMessage", `Signup successful. Your ID is ${nextId}. Redirecting...`);
            setTimeout(() => window.location.href = "quiz-dashboard.html", 1500); 
        });
    }

    function initLogin() {
        const form = document.getElementById("loginForm");
        if(!form) return;
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            const username = document.getElementById("loginUsername").value.trim();
            const password = document.getElementById("loginPassword").value;
            const users = examStore.get("namhohindUsers", []);
            const user = users.find((item) => item.username === username && item.password === password);
            if (!user) {
                text("loginMessage", "Invalid username or password.");
                return;
            }
            examStore.set("namhohindCurrentUser", user);
            text("loginMessage", "Login successful. Redirecting to dashboard...");
            setTimeout(() => window.location.href = "quiz-dashboard.html", 700);
        });
    }
    
    function initForgotPassword() {
        const form = document.getElementById("forgotPasswordForm");
        if(!form) return;
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            const username = document.getElementById("resetUsername").value.trim();
            const dob = document.getElementById("resetDob").value;
            const newPassword = document.getElementById("resetNewPassword").value;
            const confirmPassword = document.getElementById("resetConfirmPassword").value;

            if (newPassword !== confirmPassword) {
                text("resetMessage", "Passwords do not match.");
                return;
            }

            const users = examStore.get("namhohindUsers", []);
            const userIndex = users.findIndex(u => u.username === username && u.dob === dob);

            if (userIndex === -1) {
                text("resetMessage", "Invalid Username or Date of Birth.");
                return;
            }

            users[userIndex].password = newPassword;
            examStore.set("namhohindUsers", users);
            text("resetMessage", "Password reset successful. Please login.");
            setTimeout(() => window.location.href = "login.html", 1500);
        });
    }
    
    function initDashboard() {
        const user = examStore.currentUser();
        if (!user) {
            window.location.href = "login.html";
            return;
        }
        
        const users = examStore.get("namhohindUsers", []);
        const latestUser = users.find(u => u.username === user.username) || user;

        text("dashCandidateName", latestUser.fullName || latestUser.username);
        text("dashCandidateId", latestUser.candidateId || "N/A");
        text("dashDob", latestUser.dob || "N/A");
        
        text("dashTestsAttempted", latestUser.stats?.attempted || 0);
        text("dashTotalScore", latestUser.stats?.score || 0);
        text("dashCorrectAnswers", latestUser.stats?.correct || 0);
        text("dashWrongAnswers", latestUser.stats?.wrong || 0);
        
        const rankedUsers = [...users].sort((a,b) => (b.stats?.score || 0) - (a.stats?.score || 0));
        const rank = rankedUsers.findIndex(u => u.username === latestUser.username) + 1;
        text("dashCurrentRank", rank);
    }

    function renderResult() {
        const result = examStore.get("namhohindLatestResult", null);
        if (!result) {
            text("resultSubtitle", "No result found. Please take a quiz first.");
            return;
        }
        const displayName = result.fullName !== "Guest User" ? result.fullName : result.candidateId;
        text("resultSubtitle", `${result.subject} - ${result.topic} | Candidate: ${displayName}`);
        const stats = [
            ["Total Questions", result.total],
            ["Attempted Questions", result.attempted],
            ["Correct Answers", result.correct],
            ["Wrong Answers", result.wrong],
            ["Unanswered Questions", result.unanswered],
            ["Final Score", result.score],
            ["Percentage", `${result.percentage}%`]
        ];
        const resultGrid = document.getElementById("resultGrid");
        if(resultGrid) {
            resultGrid.innerHTML = stats.map(([label, value]) => `<div class="result-stat"><span>${label}</span><strong>${value}</strong></div>`).join("");
        }
        const passStatus = document.getElementById("passStatus");
        if(passStatus) {
            passStatus.innerHTML = `<span class="pass-badge ${result.status.toLowerCase()}">${result.status}</span>`;
        }
    }

    function initLeaderboard() {
        const select = document.getElementById("leaderboardSubject");
        if (select) {
            select.innerHTML = Object.keys(quizConfig).map((key) => `<option value="${quizConfig[key].name}">${quizConfig[key].name}</option>`).join("");
            select.addEventListener("change", renderLeaderboard);
        }
        renderLeaderboard();
    }

    function renderLeaderboard() {
        const select = document.getElementById("leaderboardSubject");
        const subjectName = select ? select.value : quizConfig[Object.keys(quizConfig)[0]].name;
        if (!subjectName) return;

        const rows = examStore.get(`namhohindLeaderboard:${subjectName}`, []);
        const tbody = document.getElementById("leaderboardBody");
        if (tbody) {
            tbody.innerHTML = rows.length
                ? rows.map((row, index) => `<tr><td>${index + 1}</td><td>${row.fullName || row.candidateId}</td><td>${row.candidateId || 'N/A'}</td><td>${row.score}</td><td>${row.timeTaken || 'N/A'}</td></tr>`).join("")
                : `<tr><td colspan="5">No scores yet for ${subjectName}.</td></tr>`;
        }
    }

    function text(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    document.addEventListener("DOMContentLoaded", init);
})();
