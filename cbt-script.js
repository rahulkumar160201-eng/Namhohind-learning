/**
 * Professional CBT Examination System
 * For: नमोहिंद | Namhohind
 * Founder & Developer: Rahul Kumar
 */

// --- 1. SECURITY & ANTI-CHEATING IMPLEMENTATION ---

// Prevent Right Click
document.addEventListener('contextmenu', e => e.preventDefault());

// Prevent Text Selection via JS (Double enforcement alongside CSS)
document.addEventListener('selectstart', e => e.preventDefault());

// Prevent Copy, Cut, Paste
document.addEventListener('copy', e => e.preventDefault());
document.addEventListener('cut', e => e.preventDefault());
document.addEventListener('paste', e => e.preventDefault());

// Prevent Key Shortcuts (Print, Save, View Source, Dev Tools)
document.addEventListener('keydown', (e) => {
    if (e.key === 'F12') {
        e.preventDefault();
        return false;
    }
    if (e.ctrlKey) {
        const key = e.key.toLowerCase();
        if (['c', 'v', 'x', 'p', 's', 'u'].includes(key)) {
            e.preventDefault();
            return false;
        }
    }
});

// Tab Switch Detection / Focus Loss
let tabSwitchCount = 0;
let examActive = false;

window.addEventListener('blur', () => {
    if (!examActive) return;
    tabSwitchCount++;
    showWarningOverlay();
});

function showWarningOverlay() {
    const overlay = document.getElementById('warning-overlay');
    const msg = document.getElementById('warning-msg');
    const btnResume = document.getElementById('btn-resume');
    
    overlay.classList.remove('hidden');
    
    if (tabSwitchCount === 1) {
        msg.innerText = "Warning 1/3: Tab switching, minimizing the browser, or opening other applications is strictly prohibited.";
    } else if (tabSwitchCount === 2) {
        msg.innerText = "Warning 2/3: This is your final warning. The next violation will automatically terminate your exam.";
    } else {
        msg.innerText = "Warning 3/3: Exam Terminated due to multiple security violations.";
        btnResume.classList.add('hidden');
        setTimeout(() => {
            overlay.classList.add('hidden');
            submitExam(true); // Force submit
        }, 3000);
    }
}

document.getElementById('btn-resume').addEventListener('click', () => {
    document.getElementById('warning-overlay').classList.add('hidden');
});

// --- 2. EXAM ENGINE LOGIC ---

const TOTAL_QUESTIONS = 50;
let currentQ = 0;
let candidateName = "";
let timeRemaining = 45 * 60; // 45 minutes in seconds
let timerInterval;

// Arrays to track state
// Status Map => 0: Not Visited, 1: Not Answered, 2: Answered, 3: Marked, 4: Answered & Marked
const statusArr = new Array(TOTAL_QUESTIONS).fill(0);
const answersArr = new Array(TOTAL_QUESTIONS).fill(null);

// 50 Sample Questions (Mock BPSC / Current Affairs format)
const questions = [
    { id: 1, text: "Q: हाल ही में बिहार के किस पूर्व मुख्यमंत्री को मरणोपरांत 'भारत रत्न' 2024 से सम्मानित किया गया है?<br>Which former Chief Minister of Bihar was awarded the 'Bharat Ratna' posthumously in 2024?", opts: {A: "Dr. Srikrishna Singh", B: "Karpoori Thakur", C: "Jagannath Mishra", D: "Bhola Paswan Shastri"}, ans: "B" },
    { id: 2, text: "Q: बिहार का दूसरा टाइगर रिजर्व (Tiger Reserve) किस जिले में स्थापित किया जा रहा है?<br>Bihar's second Tiger Reserve is being established in which district?", opts: {A: "West Champaran", B: "Kaimur", C: "Rohtas", D: "Munger"}, ans: "B" },
    { id: 3, text: "Q: हाल ही में पटना में निर्मित 'बापू टावर' की ऊंचाई कितनी है?<br>What is the height of the recently built 'Bapu Tower' in Patna?", opts: {A: "100 feet", B: "120 feet", C: "140 feet", D: "150 feet"}, ans: "B" },
    { id: 4, text: "Q: बिहार सरकार द्वारा 'जाति आधारित गणना' (Caste-based Survey) के आंकड़े किस तिथि को जारी किए गए?", opts: {A: "15 August 2023", B: "2 October 2023", C: "26 January 2024", D: "1 November 2023"}, ans: "B" },
    { id: 5, text: "Q: बिहार की पहली 'खेल अकादमी' कहाँ स्थापित की जा रही है?<br>Where is Bihar's first 'Sports Academy and University' being established?", opts: {A: "Patna", B: "Rajgir", C: "Gaya", D: "Muzaffarpur"}, ans: "B" },
    { id: 6, text: "Q: पश्चिम चंपारण के किस उत्पाद को GI टैग प्रदान किया गया है?", opts: {A: "Katarni Rice", B: "Marcha Rice (Mircha Rice)", C: "Zardalu Mango", D: "Magahi Paan"}, ans: "B" },
    { id: 7, text: "Q: नीतीश कुमार ने रिकॉर्ड कितनी बार बिहार के मुख्यमंत्री पद की शपथ ली है (जनवरी 2024 तक)?", opts: {A: "7th time", B: "8th time", C: "9th time", D: "10th time"}, ans: "C" },
    { id: 8, text: "Q: अंतरराष्ट्रीय जलवायु शिखर सम्मेलन (COP-28) में बिहार के किस मॉडल को मान्यता मिली?", opts: {A: "Jal Jeevan Hariyali", B: "Afforestation Model", C: "Organic Farming Model", D: "Solar Energy Model"}, ans: "B" },
    { id: 9, text: "Q: अयोध्या में नवनिर्मित राम मंदिर में प्राण प्रतिष्ठा समारोह किस तिथि को आयोजित किया गया?", opts: {A: "1 January 2024", B: "14 January 2024", C: "22 January 2024", D: "26 January 2024"}, ans: "C" },
    { id: 10, text: "Q: भारत के नए संसद भवन के मुख्य वास्तुकार (Architect) कौन हैं?", opts: {A: "Hafeez Contractor", B: "Bimal Patel", C: "Raj Rewal", D: "Charles Correa"}, ans: "B" },
    { id: 11, text: "Q: नई दिल्ली में आयोजित G20 शिखर सम्मेलन 2023 का विषय (Theme) क्या था?", opts: {A: "One Earth, One Family, One Future", B: "Recover Together, Recover Stronger", C: "Global Unity for Sustainable Development", D: "Shaping an Interconnected World"}, ans: "A" },
    { id: 12, text: "Q: 2024 के गणतंत्र दिवस परेड में मुख्य अतिथि (Chief Guest) कौन थे?", opts: {A: "Joe Biden", B: "Rishi Sunak", C: "Emmanuel Macron", D: "Anthony Albanese"}, ans: "C" },
    { id: 13, text: "Q: भारत के सबसे लंबे समुद्री पुल का क्या नाम है, जिसका उद्घाटन हाल ही में किया गया?", opts: {A: "Bandra-Worli Sea Link", B: "Atal Setu", C: "Pamban Bridge", D: "Bhupen Hazarika Setu"}, ans: "B" },
    { id: 14, text: "Q: महिला आरक्षण विधेयक (106वां संविधान संशोधन) को आधिकारिक तौर पर क्या नाम दिया गया है?", opts: {A: "Mahila Samman Adhiniyam", B: "Nari Shakti Vandan Adhiniyam", C: "Matritva Suraksha Bill", D: "Mahila Sashaktikaran Act"}, ans: "B" },
    { id: 15, text: "Q: दुनिया का सबसे ऊंचा फाइटर एयरफील्ड भारत के किस क्षेत्र में बनाया जा रहा है?", opts: {A: "Tawang, Arunachal Pradesh", B: "Nyoma, Ladakh", C: "Siachen, Arunachal Pradesh", D: "Spiti Valley"}, ans: "B" },
    { id: 16, text: "Q: 16वें वित्त आयोग (16th Finance Commission) का अध्यक्ष किसे नियुक्त किया गया है?", opts: {A: "N.K. Singh", B: "Arvind Panagariya", C: "Raghuram Rajan", D: "Urjit Patel"}, ans: "B" },
    { id: 17, text: "Q: पारंपरिक कारीगरों और शिल्पकारों की सहायता के लिए केंद्र सरकार ने कौन सी योजना शुरू की है?", opts: {A: "PM Kaushal Vikas Yojana", B: "PM Vishwakarma Yojana", C: "PM Shram Yogi Maandhan", D: "PM Svanidhi Yojana"}, ans: "B" },
    { id: 18, text: "Q: छत पर सौर ऊर्जा (Rooftop Solar) को बढ़ावा देने के लिए प्रधानमंत्री द्वारा शुरू की गई योजना का नाम क्या है?", opts: {A: "PM Ujjwala Yojana", B: "PM Surya Ghar Muft Bijli Yojana", C: "PM Saur Urja Scheme", D: "PM Solar Mission"}, ans: "B" },
    { id: 19, text: "Q: कमजोर जनजातीय समूहों (PVTGs) के विकास के लिए सरकार ने कौन सा मिशन शुरू किया है?", opts: {A: "PM JANMAN Mission", B: "PM Van Dhan Yojana", C: "Eklavya Model Mission", D: "PM Adivasi Vikas Yojana"}, ans: "A" },
    { id: 20, text: "Q: 'लखपति दीदी योजना' का लक्ष्य 2 करोड़ से बढ़ाकर कितना कर दिया गया है?", opts: {A: "2.5 Crore", B: "3 Crore", C: "4 Crore", D: "5 Crore"}, ans: "B" },
    { id: 21, text: "Q: भारत में हरित क्रांति के जनक, जिन्हें 2024 में भारत रत्न से सम्मानित किया गया, कौन हैं?", opts: {A: "Verghese Kurien", B: "M.S. Swaminathan", C: "Norman Borlaug", D: "C.N.R. Rao"}, ans: "B" },
    { id: 22, text: "Q: 2023 का नोबेल शांति पुरस्कार (Nobel Peace Prize) किसे प्रदान किया गया?", opts: {A: "Malala Yousafzai", B: "Narges Mohammadi", C: "Greta Thunberg", D: "Maria Ressa"}, ans: "B" },
    { id: 23, text: "Q: हिंदी भाषा के लिए 'साहित्य अकादमी पुरस्कार 2023' किस उपन्यास के लिए संजीव को दिया गया?", opts: {A: "Mujhe Pehchano", B: "Tumhare Liye", C: "Ret Samadhi", D: "Chhalang"}, ans: "A" },
    { id: 24, text: "Q: 96वें अकादमी पुरस्कार (Oscars 2024) में किस फिल्म ने 'सर्वश्रेष्ठ फिल्म' का पुरस्कार जीता?", opts: {A: "Barbie", B: "Poor Things", C: "Oppenheimer", D: "Killers of the Flower Moon"}, ans: "C" },
    { id: 25, text: "Q: वर्ष 2021 के लिए भारत का सर्वोच्च फिल्म सम्मान 'दादा साहब फाल्के पुरस्कार' 2023 में किसे दिया गया?", opts: {A: "Asha Parekh", B: "Waheeda Rehman", C: "Rekha", D: "Amitabh Bachchan"}, ans: "B" },
    { id: 26, text: "Q: ICC पुरुष क्रिकेट विश्व कप 2023 का खिताब किस टीम ने जीता?", opts: {A: "India", B: "South Africa", C: "Australia", D: "New Zealand"}, ans: "C" },
    { id: 27, text: "Q: हांगझोऊ (चीन) में आयोजित 19वें एशियाई खेलों (Asian Games 2023) में भारत ने कुल कितने पदक जीते?", opts: {A: "70", B: "107", C: "111", D: "125"}, ans: "B" },
    { id: 28, text: "Q: IPL 2024 (इंडियन प्रीमियर लीग) का खिताब किस टीम ने जीता?", opts: {A: "Chennai Super Kings", B: "Sunrisers Hyderabad", C: "Rajasthan Royals", D: "Mumbai Indians"}, ans: "B" },
    { id: 29, text: "Q: विश्व एथलेटिक्स चैंपियनशिप 2023 में नीरज चोपड़ा ने कौन सा पदक जीता?", opts: {A: "Gold", B: "Silver", C: "Bronze", D: "No Medal"}, ans: "A" },
    { id: 30, text: "Q: जनवरी 2024 में ऑस्ट्रेलियन ओपन का पुरुष एकल खिताब किसने जीता?", opts: {A: "Novak Djokovic", B: "Carlos Alcaraz", C: "Daniil Alcaraz", D: "Jannik Sinner"}, ans: "D" },
    { id: 31, text: "Q: 'खेलो इंडिया यूथ गेम्स 2024' में समग्र चैंपियनशिप (Overall Championship) किस राज्य ने जीती?", opts: {A: "Haryana", B: "Tamil Nadu", C: "Maharashtra", D: "Karnataka"}, ans: "C" },
    { id: 32, text: "Q: अंतरिम बजट 2024-25 में वित्तीय वर्ष 25 के लिए राजकोषीय घाटा का लक्ष्य GDP का कितना प्रतिशत रखा गया है?", opts: {A: "4.5%", B: "5.1%", C: "5.8%", D: "5.9%"}, ans: "B" },
    { id: 33, text: "Q: RBI द्वारा वित्त वर्ष 2024-25 के लिए भारत की जीडीपी वृद्धि दर का अनुमान क्या रखा गया है?", opts: {A: "6.5%", B: "7.0%", C: "7.2%", D: "7.5%"}, ans: "C" },
    { id: 34, text: "Q: हाल ही में भारत की UPI सेवाएं आधिकारिक तौर पर किन दो देशों में शुरू की गई हैं?", opts: {A: "Sri Lanka and Mauritius", B: "Nepal and Bhutan", C: "UAE and Saudi Arabia", D: "UK and France"}, ans: "A" },
    { id: 35, text: "Q: 1 जनवरी 2024 को आधिकारिक तौर पर ब्रिक्स (BRICS) समूह में कितने नए देश शामिल हुए हैं?", opts: {A: "3", B: "4", C: "5", D: "6"}, ans: "C" },
    { id: 36, text: "Q: चंद्रयान-3 के लैंडर के चंद्रमा के दक्षिणी ध्रुव पर उतरने वाले स्थान को क्या नाम दिया गया है?", opts: {A: "Tiranga Point", B: "Shiv Shakti Point", C: "Kalam Point", D: "Bharat Point"}, ans: "B" },
    { id: 37, text: "Q: इसरो के मानव अंतरिक्ष उड़ान मिशन 'गगनयान' के पहले क्रू एस्केप सिस्टम परीक्षण उड़ान का नाम क्या था?", opts: {A: "TV-D1", B: "LVM3-M4", C: "HRLV-1", D: "CES-01"}, ans: "A" },
    { id: 38, text: "Q: सूर्य का अध्ययन करने के लिए भारत के पहले अंतरिक्ष आधारित वेधशाला का क्या नाम है?", opts: {A: "Surya-1", B: "Aditya-L1", C: "Bhaskar-L1", D: "Ravi-1"}, ans: "B" },
    { id: 39, text: "Q: C-DAC पुणे में स्थापित भारत के सबसे तेज AI सुपरकंप्यूटर का नाम क्या है?", opts: {A: "Param Siddhi", B: "AIRAWAT", C: "Pratyush", D: "Mihir"}, ans: "B" },
    { id: 40, text: "Q: प्रोजेक्ट 'आरोग्य मैत्री' के तहत बनाए गए दुनिया के पहले पोर्टेबल आपदा अस्पताल का क्या नाम है?", opts: {A: "Sanjeevani", B: "BHISHM", C: "Rakshak Cube", D: "Aarogya Cube"}, ans: "B" },
    { id: 41, text: "Q: हाल ही में गूगल ने 'जेमिनी' (Gemini) लॉन्च किया है, यह क्या है?", opts: {A: "A new smartphone", B: "An advanced AI model", C: "A cloud storage service", D: "A satellite network"}, ans: "B" },
    { id: 42, text: "Q: 1 जनवरी 2024 को इसरो द्वारा लॉन्च किए गए 'XPoSat' मिशन का उद्देश्य क्या है?", opts: {A: "Studying the Sun's corona", B: "Observing exoplanets", C: "Studying X-ray polarization from celestial sources", D: "Mapping lunar minerals"}, ans: "C" },
    { id: 43, text: "Q: भारत के पहले निजी तौर पर विकसित रॉकेट का क्या नाम है?", opts: {A: "Agnibaan", B: "Vikram-S", C: "Kalam-1", D: "Dhruv-1"}, ans: "B" },
    { id: 44, text: "Q: इसरो द्वारा सफल परीक्षण किए गए स्वदेशी 'रीयूजेबल लॉन्च व्हीकल' (RLV) का क्या नाम है?", opts: {A: "Garuda", B: "Pushpak", C: "Vayu", D: "Agni"}, ans: "B" },
    { id: 45, text: "Q: भारत का पहला 3D मुद्रित (3D printed) डाकघर कहाँ खोला गया है?", opts: {A: "Hyderabad", B: "Bengaluru", C: "Chennai", D: "Pune"}, ans: "B" },
    { id: 46, text: "Q: बिहार में 'हर घर गंगा जल' योजना किस परियोजना का हिस्सा है?", opts: {A: "Namami Gange", B: "Jal Jeevan Hariyali", C: "Saat Nischay Part 2", D: "Mukhya Mantri Jal Yojana"}, ans: "B" },
    { id: 47, text: "Q: नीति आयोग की 'राष्ट्रीय बहुआयामी गरीबी सूचकांक' 2023 के अनुसार, गरीबी कम करने में किस राज्य ने सर्वाधिक तेजी दिखाई है?", opts: {A: "Uttar Pradesh", B: "Bihar", C: "Madhya Pradesh", D: "Rajasthan"}, ans: "B" },
    { id: 48, text: "Q: विश्व स्वास्थ्य संगठन (WHO) ने हाल ही में किस देश को मलेरिया-मुक्त (Malaria-free) घोषित किया है?", opts: {A: "Cabo Verde", B: "Kenya", C: "Nigeria", D: "South Africa"}, ans: "A" },
    { id: 49, text: "Q: ICC T20 पुरुष क्रिकेट विश्व कप 2024 का खिताब किस देश ने जीता?", opts: {A: "South Africa", B: "Australia", C: "India", D: "England"}, ans: "C" },
    { id: 50, text: "Q: भारत का पहला 'डार्क स्काई रिजर्व' किस राज्य/केंद्र शासित प्रदेश में स्थापित किया गया है?", opts: {A: "Uttarakhand", B: "Himachal Pradesh", C: "Ladakh", D: "Sikkim"}, ans: "C" }
];

// Initialize Exam
document.getElementById('btn-start').addEventListener('click', () => {
    const nameInput = document.getElementById('candidate-name').value.trim();
    if (!nameInput) {
        alert("Please enter your Full Name to start the exam.");
        return;
    }
    candidateName = nameInput;
    document.getElementById('disp-name').innerText = candidateName;
    
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('exam-screen').classList.remove('hidden');
    
    examActive = true;
    statusArr[0] = 1; // Mark Q1 as Not Answered (Visited)
    renderPalette();
    renderQuestion();
    updateCounts();
    startTimer();
});

// Timer Function
function startTimer() {
    timerInterval = setInterval(() => {
        timeRemaining--;
        const m = Math.floor(timeRemaining / 60).toString().padStart(2, '0');
        const s = (timeRemaining % 60).toString().padStart(2, '0');
        document.getElementById('time').innerText = `${m}:${s}`;
        
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            submitExam(true); // auto submit
        }
    }, 1000);
}

// Rendering
function renderPalette() {
    const palette = document.getElementById('palette');
    palette.innerHTML = '';
    for (let i = 0; i < TOTAL_QUESTIONS; i++) {
        const btn = document.createElement('button');
        btn.className = 'pal-btn';
        btn.innerText = i + 1;
        
        if (i === currentQ) btn.classList.add('active');
        
        if (statusArr[i] === 1) btn.classList.add('not-answered');
        else if (statusArr[i] === 2) btn.classList.add('answered');
        else if (statusArr[i] === 3) btn.classList.add('marked');
        else if (statusArr[i] === 4) btn.classList.add('ans-marked');
        
        btn.onclick = () => navigateTo(i);
        palette.appendChild(btn);
    }
}

function renderQuestion() {
    const q = questions[currentQ];
    document.getElementById('q-no').innerText = `Question ${currentQ + 1} of ${TOTAL_QUESTIONS}`;
    document.getElementById('q-text').innerHTML = q.text;
    
    const optsContainer = document.getElementById('options');
    optsContainer.innerHTML = '';
    
    for (const [key, val] of Object.entries(q.opts)) {
        const isChecked = answersArr[currentQ] === key ? 'checked' : '';
        optsContainer.insertAdjacentHTML('beforeend', `
            <label class="option-label">
                <input type="radio" name="opt" value="${key}" ${isChecked}>
                <span><strong>${key}.</strong> ${val}</span>
            </label>
        `);
    }
    
    document.getElementById('btn-prev').disabled = currentQ === 0;
    document.getElementById('btn-next').innerText = currentQ === TOTAL_QUESTIONS - 1 ? "Save & Finish" : "Save & Next";
    
    if (statusArr[currentQ] === 0) statusArr[currentQ] = 1;
    
    renderPalette();
    updateCounts();
}

function updateCounts() {
    let ans=0, notans=0, notvis=0, mark=0, ansmark=0;
    statusArr.forEach(s => {
        if(s===0) notvis++;
        else if(s===1) notans++;
        else if(s===2) ans++;
        else if(s===3) mark++;
        else if(s===4) ansmark++;
    });
    document.getElementById('cnt-ans').innerText = ans;
    document.getElementById('cnt-notans').innerText = notans;
    document.getElementById('cnt-notvis').innerText = notvis;
    document.getElementById('cnt-mark').innerText = mark;
    document.getElementById('cnt-ansmark').innerText = ansmark;
}

// Actions
function saveResponse(isMarked) {
    const selected = document.querySelector('input[name="opt"]:checked');
    if (selected) {
        answersArr[currentQ] = selected.value;
        statusArr[currentQ] = isMarked ? 4 : 2;
    } else {
        statusArr[currentQ] = isMarked ? 3 : 1;
    }
}

function navigateTo(index) {
    saveResponse(statusArr[currentQ] === 3 || statusArr[currentQ] === 4);
    currentQ = index;
    renderQuestion();
}

document.getElementById('btn-next').addEventListener('click', () => {
    saveResponse(false);
    if (currentQ < TOTAL_QUESTIONS - 1) {
        currentQ++;
        renderQuestion();
    } else {
        submitExam();
    }
});

document.getElementById('btn-mark').addEventListener('click', () => {
    saveResponse(true);
    if (currentQ < TOTAL_QUESTIONS - 1) {
        currentQ++;
        renderQuestion();
    }
});

document.getElementById('btn-clear').addEventListener('click', () => {
    const selected = document.querySelector('input[name="opt"]:checked');
    if (selected) selected.checked = false;
    answersArr[currentQ] = null;
    statusArr[currentQ] = 1;
    renderPalette();
    updateCounts();
});

document.getElementById('btn-prev').addEventListener('click', () => {
    saveResponse(statusArr[currentQ] === 3 || statusArr[currentQ] === 4);
    if (currentQ > 0) {
        currentQ--;
        renderQuestion();
    }
});

document.getElementById('btn-submit').addEventListener('click', () => submitExam());

// --- 3. EXAM SUBMISSION & RESULT ---
function submitExam(auto = false) {
    saveResponse(statusArr[currentQ] === 3 || statusArr[currentQ] === 4);
    
    if (!auto && !confirm("Are you sure you want to submit the exam?")) return;
    
    clearInterval(timerInterval);
    examActive = false;
    
    let correct = 0;
    let wrong = 0;
    
    for(let i = 0; i < TOTAL_QUESTIONS; i++) {
        if (answersArr[i]) {
            if (answersArr[i] === questions[i].ans) correct++;
            else wrong++;
        }
    }
    
    const percentage = (correct / TOTAL_QUESTIONS) * 100;
    const isPass = percentage >= 60;
    
    document.getElementById('res-name').innerText = candidateName;
    document.getElementById('res-date').innerText = new Date().toLocaleDateString();
    document.getElementById('res-correct').innerText = correct;
    document.getElementById('res-wrong').innerText = TOTAL_QUESTIONS - correct;
    document.getElementById('res-score').innerText = `${correct} / ${TOTAL_QUESTIONS}`;
    document.getElementById('res-percent').innerText = `${percentage.toFixed(2)}%`;
    
    const statusEl = document.getElementById('res-status');
    if(isPass) {
        statusEl.innerText = "PASS";
        statusEl.className = "text-success";
    } else {
        statusEl.innerText = "FAIL";
        statusEl.className = "text-danger";
    }
    
    if (percentage >= 80) {
        document.getElementById('cert-area').classList.remove('hidden');
    }
    
    document.getElementById('exam-screen').classList.add('hidden');
    document.getElementById('result-screen').classList.remove('hidden');
}

// --- 4. CERTIFICATE GENERATION (Canvas API) ---
document.getElementById('btn-cert').addEventListener('click', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 700;
    const ctx = canvas.getContext('2d');
    
    // Fill Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw Borders
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 15;
    ctx.strokeRect(20, 20, 960, 660);
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, 920, 620);
    
    // Header Title
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 50px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CERTIFICATE OF ACHIEVEMENT', 500, 150);
    
    // Subtext
    ctx.fillStyle = '#7f8c8d';
    ctx.font = 'italic 24px Arial';
    ctx.fillText('This certificate is proudly awarded to', 500, 230);
    
    // Candidate Name
    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 46px Arial';
    ctx.fillText(candidateName.toUpperCase(), 500, 310);
    
    // Underline
    ctx.beginPath();
    ctx.moveTo(300, 330);
    ctx.lineTo(700, 330);
    ctx.strokeStyle = '#bdc3c7';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Description text
    ctx.fillStyle = '#34495e';
    ctx.font = '24px Arial';
    ctx.fillText('For successfully passing the CBT Examination', 500, 390);
    
    const percentage = document.getElementById('res-percent').innerText;
    ctx.font = 'bold 30px Arial';
    ctx.fillText(`With an outstanding score of ${percentage}`, 500, 440);
    
    // Meta Date
    ctx.font = '20px Arial';
    ctx.fillStyle = '#7f8c8d';
    ctx.fillText(`Date of Examination: ${new Date().toLocaleDateString()}`, 500, 520);
    
    // Footer
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Issued By: नमोहिंद | Namhohind', 500, 600);
    ctx.font = '20px Arial';
    ctx.fillText('Founder & Developer: Rahul Kumar', 500, 640);
    
    // Trigger Download
    const link = document.createElement('a');
    link.download = `${candidateName.replace(/\s+/g, '_')}_Certificate.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
});