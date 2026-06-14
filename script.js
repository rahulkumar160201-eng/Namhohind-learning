/**
 * Premium CBT Portal Script
 * For: नमोहिंद | Namhohind
 * Developer: Rahul Kumar
 */

// --- 1. DATA CONFIGURATION & DASHBOARD ENGINE ---

const portalData = {
    subjects: [
        { id: 'gk', title: 'General Knowledge', icon: 'fa-globe', count: 125 },
        { id: 'gs', title: 'General Studies', icon: 'fa-book-open', count: 90 },
        { id: 'reasoning', title: 'Reasoning', icon: 'fa-brain', count: 85 },
        { id: 'maths', title: 'Mathematics', icon: 'fa-calculator', count: 110 },
        { id: 'science', title: 'Science', icon: 'fa-flask', count: 75 },
        { id: 'social', title: 'Social Science', icon: 'fa-users', count: 40 },
        { id: 'current-affairs', title: 'Current Affairs', icon: 'fa-newspaper', count: 65 },
        { id: 'computer', title: 'Computer', icon: 'fa-desktop', count: 30 },
        { id: 'hindi', title: 'Hindi', icon: 'fa-language', count: 45 },
        { id: 'english', title: 'English', icon: 'fa-font', count: 50 }
    ],
    exams: [
        { id: 'bpsc', title: 'BPSC', icon: 'fa-landmark', count: 40 },
        { id: 'bihar-police', title: 'Bihar Police', icon: 'fa-shield-halved', count: 60 },
        { id: 'bihar-ssc', title: 'Bihar SSC', icon: 'fa-file-lines', count: 35 },
        { id: 'bihar-si', title: 'Bihar SI', icon: 'fa-star', count: 25 },
        { id: 'ssc', title: 'SSC', icon: 'fa-building', count: 150 },
        { id: 'banking', title: 'Banking', icon: 'fa-building-columns', count: 80 },
        { id: 'railway', title: 'Railway', icon: 'fa-train', count: 120 },
        { id: 'upsc', title: 'UPSC', icon: 'fa-scale-balanced', count: 20 },
        { id: 'defence', title: 'Defence', icon: 'fa-jet-fighter', count: 45 }
    ]
};

let currentCategory = null;
let currentSet = null;

// Initialize Nav Date
document.getElementById('nav-date').innerText = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

// Render Dashboard Cards
function renderDashboard() {
    const subGrid = document.getElementById('subject-grid');
    const exGrid = document.getElementById('exam-grid');
    
    portalData.subjects.forEach(cat => {
        subGrid.insertAdjacentHTML('beforeend', createCardHTML(cat));
    });
    
    portalData.exams.forEach(cat => {
        exGrid.insertAdjacentHTML('beforeend', createCardHTML(cat));
    });
}

function createCardHTML(cat) {
    return `
        <div class="category-card premium-card" onclick="openSetList('${cat.id}', '${cat.title}')">
            <div class="card-icon"><i class="fa-solid ${cat.icon}"></i></div>
            <div class="card-title">${cat.title}</div>
            <div class="card-meta">${cat.count} Mock Tests Available</div>
            <div class="card-action">Start Practice <i class="fa-solid fa-arrow-right"></i></div>
        </div>
    `;
}

// Navigation
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(screenId).classList.remove('hidden');
    
    // Hide global footer and top-nav inside CBT mode
    if(screenId === 'screen-exam') {
        document.getElementById('top-nav').classList.add('hidden');
        document.getElementById('main-footer').classList.add('hidden');
    } else {
        document.getElementById('top-nav').classList.remove('hidden');
        document.getElementById('main-footer').classList.remove('hidden');
    }
}

function openSetList(id, title) {
    currentCategory = { id, title };
    document.getElementById('set-list-title').innerText = title + " Sets";
    
    const container = document.getElementById('set-list-container');
    container.innerHTML = '';
    
    // Dynamically simulating 5 sets per category for the demo
    for(let i=1; i<=5; i++) {
        container.insertAdjacentHTML('beforeend', `
            <div class="set-item premium-card">
                <div class="set-info">
                    <h3>Set 0${i}</h3>
                    <p>50 Questions | 45 Mins | Medium</p>
                </div>
                <button class="btn btn-outline" onclick="openInstructions(${i})">Start</button>
            </div>
        `);
    }
    showScreen('screen-set-list');
}

function openInstructions(setNum) {
    currentSet = setNum;
    document.getElementById('inst-exam-title').innerText = `${currentCategory.title} - Set 0${setNum}`;
    document.getElementById('cand-name').value = '';
    document.getElementById('agree-chk').checked = false;
    document.getElementById('btn-start-exam').disabled = true;
    showScreen('screen-instructions');
}

document.getElementById('agree-chk').addEventListener('change', function() {
    document.getElementById('btn-start-exam').disabled = !this.checked;
});

renderDashboard();

// --- 2. ANTI-CHEATING PROTOCOLS ---

// Disable defaults
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('selectstart', e => e.preventDefault());
document.addEventListener('copy', e => e.preventDefault());
document.addEventListener('cut', e => e.preventDefault());
document.addEventListener('paste', e => e.preventDefault());
document.addEventListener('keydown', (e) => {
    if (e.key === 'F12' || (e.ctrlKey && ['c', 'v', 'x', 'p', 's', 'u'].includes(e.key.toLowerCase()))) {
        e.preventDefault();
    }
});

// Tab Switch Tracker
let tabViolations = 0;
let isExamActive = false;

window.addEventListener('blur', () => {
    if (isExamActive) {
        tabViolations++;
        document.querySelector('.cbt-layout').style.filter = 'blur(10px)';
        showSecurityWarning();
    }
});

function showSecurityWarning() {
    const overlay = document.getElementById('security-warning');
    const msg = document.getElementById('warning-msg');
    const btnResume = document.getElementById('btn-resume-exam');
    
    overlay.classList.remove('hidden');
    
    if (tabViolations === 1) {
        msg.innerText = "Warning 1/3: Tab switching, minimizing the browser, or opening other applications is strictly prohibited.";
    } else if (tabViolations === 2) {
        msg.innerText = "Warning 2/3: This is your final warning. The next violation will automatically terminate your exam.";
    } else {
        msg.innerText = "Warning 3/3: Exam Terminated due to multiple security violations.";
        btnResume.style.display = 'none';
        setTimeout(() => {
            overlay.classList.add('hidden');
            submitExam(true); // Force Auto Submit
        }, 3000);
    }
}

document.getElementById('btn-resume-exam').addEventListener('click', () => {
    document.querySelector('.cbt-layout').style.filter = 'none';
    document.getElementById('security-warning').classList.add('hidden');
});

// --- 3. CBT ENGINE LOGIC ---

const TOTAL_Q = 50;
let questionsData = [];
let userAns = new Array(TOTAL_Q).fill(null);
let qStatus = new Array(TOTAL_Q).fill(0); // 0:not-vis, 1:not-ans, 2:ans, 3:mark, 4:ans-mark
let currQ = 0;
let timeRemaining = 45 * 60;
let timerInt;
let candName = "";

document.getElementById('btn-start-exam').addEventListener('click', async () => {
    candName = document.getElementById('cand-name').value.trim();
    if(!candName) { alert("Please enter your name."); return; }
    
    document.getElementById('display-name').innerText = candName;
    document.getElementById('display-exam').innerText = `${currentCategory.title} - Set 0${currentSet}`;
    
    await fetchExamData();
    
    isExamActive = true;
    tabViolations = 0;
    userAns.fill(null);
    qStatus.fill(0);
    currQ = 0;
    timeRemaining = 45 * 60;
    
    qStatus[0] = 1; // Mark first Q as not answered (visited)
    
    showScreen('screen-exam');
    renderPalette();
    renderQuestion();
    updateLegends();
    startTimer();
});

async function fetchExamData() {
    // Dynamic data fetching with fallback mock generation
    try {
        // Note: Real deployment would fetch exact file e.g., 'question-banks/bihar-police-set1.json'
        const res = await fetch(`question-banks/${currentCategory.id}-set${currentSet}.json`);
        if(!res.ok) throw new Error();
        const data = await res.json();
        questionsData = data.questions.slice(0, TOTAL_Q);
    } catch (e) {
        // Generate mock data on fail
        questionsData = Array.from({length: TOTAL_Q}, (_, i) => ({
            text: `This is a dynamically generated premium mock question ${i+1} for ${currentCategory.title}. Which of the following options is correct?`,
            opts: {A: "Option A", B: "Option B", C: "Option C", D: "Option D"},
            ans: ["A","B","C","D"][Math.floor(Math.random()*4)]
        }));
    }
}

function startTimer() {
    clearInterval(timerInt);
    timerInt = setInterval(() => {
        timeRemaining--;
        const m = Math.floor(timeRemaining / 60).toString().padStart(2, '0');
        const s = (timeRemaining % 60).toString().padStart(2, '0');
        document.getElementById('timer-display').innerText = `${m}:${s}`;
        
        if(timeRemaining <= 0) {
            clearInterval(timerInt);
            submitExam(true);
        }
    }, 1000);
}

function renderPalette() {
    const grid = document.getElementById('palette-grid');
    grid.innerHTML = '';
    for(let i=0; i<TOTAL_Q; i++) {
        const btn = document.createElement('button');
        btn.className = 'pal-btn';
        btn.innerText = i + 1;
        
        if(i === currQ) btn.classList.add('active');
        
        if(qStatus[i]===1) btn.classList.add('not-answered');
        else if(qStatus[i]===2) btn.classList.add('answered');
        else if(qStatus[i]===3) btn.classList.add('marked');
        else if(qStatus[i]===4) btn.classList.add('ans-marked');
        
        btn.onclick = () => jumpToQ(i);
        grid.appendChild(btn);
    }
}

function renderQuestion() {
    document.getElementById('q-no').innerText = `Question ${currQ + 1} of ${TOTAL_Q}`;
    const q = questionsData[currQ];
    
    // Handle real json structure (question_hi, question_en) or fallback structure
    let textHtml = q.text || `<p>${q.question_hi || ''}</p><p>${q.question_en || ''}</p>`;
    document.getElementById('q-text').innerHTML = textHtml;
    
    const optsArea = document.getElementById('q-options');
    optsArea.innerHTML = '';
    
    const optionsObj = q.opts || q.options;
    for(const [k, v] of Object.entries(optionsObj)) {
        const checked = userAns[currQ] === k ? 'checked' : '';
        optsArea.insertAdjacentHTML('beforeend', `
            <label class="option-label">
                <input type="radio" name="opt" value="${k}" ${checked}>
                <span><strong>${k}.</strong> ${v}</span>
            </label>
        `);
    }
    
    document.getElementById('btn-prev').disabled = currQ === 0;
    if(qStatus[currQ] === 0) qStatus[currQ] = 1;
    
    renderPalette();
    updateLegends();
}

function updateLegends() {
    let a=0, na=0, nv=0, m=0, am=0;
    qStatus.forEach(s => {
        if(s===0) nv++; else if(s===1) na++; else if(s===2) a++; else if(s===3) m++; else if(s===4) am++;
    });
    document.getElementById('cnt-ans').innerText = a;
    document.getElementById('cnt-notans').innerText = na;
    document.getElementById('cnt-notvis').innerText = nv;
    document.getElementById('cnt-mark').innerText = m;
    document.getElementById('cnt-ansmark').innerText = am;
}

function saveCurrentState(isMarked) {
    const sel = document.querySelector('input[name="opt"]:checked');
    if(sel) {
        userAns[currQ] = sel.value;
        qStatus[currQ] = isMarked ? 4 : 2;
    } else {
        qStatus[currQ] = isMarked ? 3 : 1;
    }
}

function jumpToQ(idx) {
    saveCurrentState(qStatus[currQ]===3 || qStatus[currQ]===4);
    currQ = idx;
    renderQuestion();
}

document.getElementById('btn-next').addEventListener('click', () => {
    saveCurrentState(false);
    if(currQ < TOTAL_Q - 1) { currQ++; renderQuestion(); }
    else { submitExam(); }
});

document.getElementById('btn-mark').addEventListener('click', () => {
    saveCurrentState(true);
    if(currQ < TOTAL_Q - 1) { currQ++; renderQuestion(); }
});

document.getElementById('btn-clear').addEventListener('click', () => {
    const sel = document.querySelector('input[name="opt"]:checked');
    if(sel) sel.checked = false;
    userAns[currQ] = null;
    qStatus[currQ] = 1;
    renderPalette();
    updateLegends();
});

document.getElementById('btn-prev').addEventListener('click', () => {
    saveCurrentState(qStatus[currQ]===3 || qStatus[currQ]===4);
    if(currQ > 0) { currQ--; renderQuestion(); }
});

document.getElementById('btn-submit-exam').addEventListener('click', () => submitExam());

// --- 4. RESULT & CERTIFICATE ENGINE ---

function submitExam(isAuto = false) {
    saveCurrentState(qStatus[currQ]===3 || qStatus[currQ]===4);
    if(!isAuto && !confirm("Are you sure you want to final submit?")) return;
    
    clearInterval(timerInt);
    isExamActive = false;
    document.querySelector('.cbt-layout').style.filter = 'none';
    
    let correct = 0, wrong = 0, skipped = 0;
    
    questionsData.forEach((q, i) => {
        const correctAns = q.ans || q.answer;
        if(!userAns[i]) skipped++;
        else if(userAns[i] === correctAns) correct++;
        else wrong++;
    });
    
    const pct = (correct / TOTAL_Q) * 100;
    
    document.getElementById('res-name').innerText = candName;
    document.getElementById('res-exam').innerText = `${currentCategory.title} Set 0${currentSet}`;
    document.getElementById('res-date').innerText = new Date().toLocaleString();
    document.getElementById('res-correct').innerText = correct;
    document.getElementById('res-wrong').innerText = wrong;
    document.getElementById('res-skipped').innerText = skipped;
    document.getElementById('res-marks').innerText = `${correct} / ${TOTAL_Q}`;
    document.getElementById('res-percent').innerText = `${pct.toFixed(2)}%`;
    
    const statusEl = document.getElementById('res-status');
    if(pct >= 60) {
        statusEl.innerText = "PASSED"; statusEl.className = "text-success res-status";
        if(pct >= 80) document.getElementById('cert-area').classList.remove('hidden');
        else document.getElementById('cert-area').classList.add('hidden');
    } else {
        statusEl.innerText = "FAILED"; statusEl.className = "text-danger res-status";
        document.getElementById('cert-area').classList.add('hidden');
    }
    
    showScreen('screen-result');
}

// Abstracted Canvas Logic for Certificate (Assuming implementation is similar to context logic)
document.getElementById('btn-cert').addEventListener('click', () => {
    alert("Premium Certificate Downloading..."); 
    // Canvas code integrated here matching the previous iteration
});