document.addEventListener("DOMContentLoaded", () => {
    // Inject Floating Widget HTML
    const widgetHTML = `
        <div id="aiWidgetRoot" class="ai-widget-root">
            <button id="aiWidgetToggleBtn" class="ai-widget-btn">
                🤖 Namhohind AI
            </button>
        </div>
        <div id="aiWidgetWindow" class="ai-widget-window">
            <div id="aiWidgetHeader" class="ai-widget-header">
                <div class="ai-widget-title">🤖 Namhohind AI <span>Beta</span></div>
                <div class="ai-widget-controls">
                    <button id="aiWidgetMinBtn" class="ai-widget-ctrl-btn" title="Minimize">&minus;</button>
                    <button id="aiWidgetCloseBtn" class="ai-widget-ctrl-btn" title="Close">&times;</button>
                </div>
            </div>
            <div id="aiWidgetBody" class="ai-widget-body">
                <div class="ai-widget-message ai">
                    <div class="ai-widget-avatar">🤖</div>
                    <div class="ai-widget-bubble">
                        Hi 👋 Welcome to Namhohind AI Beta!<br><br>How can I help you with your exam preparation today?
                        <div class="ai-widget-prompts" id="aiWidgetPrompts">
                            <button class="ai-widget-prompt-btn">📚 Bihar GK</button>
                            <button class="ai-widget-prompt-btn">📰 Current Affairs</button>
                            <button class="ai-widget-prompt-btn">👮 Bihar Police</button>
                            <button class="ai-widget-prompt-btn">🎯 BPSC</button>
                            <button class="ai-widget-prompt-btn">📝 Quiz Help</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="ai-widget-footer">
                <div class="ai-widget-input-wrapper">
                    <input type="file" id="aiWidgetFile" hidden accept=".pdf,.doc,.docx,image/*">
                    <button class="ai-widget-icon-btn" id="aiWidgetAttachBtn" title="Upload File">📎</button>
                    <button class="ai-widget-icon-btn" id="aiWidgetImgBtn" title="Upload Image">🖼️</button>
                    <button class="ai-widget-icon-btn" id="aiWidgetMicBtn" title="Voice Input">🎤</button>
                    <input type="text" id="aiWidgetInput" placeholder="Type your message...">
                    <button class="ai-widget-send-btn" id="aiWidgetSendBtn" title="Send">➤</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', widgetHTML);

    const toggleBtn = document.getElementById("aiWidgetToggleBtn");
    const widgetWindow = document.getElementById("aiWidgetWindow");
    const closeBtn = document.getElementById("aiWidgetCloseBtn");
    const minBtn = document.getElementById("aiWidgetMinBtn");
    const header = document.getElementById("aiWidgetHeader");
    const input = document.getElementById("aiWidgetInput");
    const sendBtn = document.getElementById("aiWidgetSendBtn");
    const body = document.getElementById("aiWidgetBody");
    const prompts = document.querySelectorAll(".ai-widget-prompt-btn");
    const fileInput = document.getElementById("aiWidgetFile");

    let isDragging = false;
    let startX, startY, initialX, initialY;

    // Open / Close / Minimize Logic
    toggleBtn.addEventListener("click", () => {
        widgetWindow.classList.add("open");
        widgetWindow.classList.remove("minimized");
        toggleBtn.style.display = "none";
    });

    closeBtn.addEventListener("click", () => {
        widgetWindow.classList.remove("open");
        setTimeout(() => {
            toggleBtn.style.display = "flex";
            widgetWindow.style.transform = '';
            widgetWindow.style.left = '';
            widgetWindow.style.top = '';
            widgetWindow.style.bottom = '80px';
            widgetWindow.style.right = '20px';
        }, 300);
    });

    minBtn.addEventListener("click", () => widgetWindow.classList.toggle("minimized"));

    // Draggable Logic (Desktop & Mobile)
    const startDrag = (clientX, clientY) => {
        isDragging = true;
        startX = clientX;
        startY = clientY;
        const rect = widgetWindow.getBoundingClientRect();
        initialX = rect.left;
        initialY = rect.top;
        widgetWindow.style.right = 'auto';
        widgetWindow.style.bottom = 'auto';
        widgetWindow.style.left = initialX + 'px';
        widgetWindow.style.top = initialY + 'px';
        widgetWindow.style.transition = 'none'; 
    };

    const onDrag = (clientX, clientY) => {
        if (!isDragging) return;
        let newX = initialX + (clientX - startX);
        let newY = initialY + (clientY - startY);
        newX = Math.max(0, Math.min(newX, window.innerWidth - widgetWindow.offsetWidth));
        newY = Math.max(0, Math.min(newY, window.innerHeight - widgetWindow.offsetHeight));
        widgetWindow.style.left = newX + 'px';
        widgetWindow.style.top = newY + 'px';
    };

    const stopDrag = () => {
        if(isDragging) {
            isDragging = false;
            widgetWindow.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        }
    };

    header.addEventListener("mousedown", (e) => { if(e.target.tagName !== 'BUTTON') startDrag(e.clientX, e.clientY); });
    document.addEventListener("mousemove", (e) => onDrag(e.clientX, e.clientY));
    document.addEventListener("mouseup", stopDrag);

    header.addEventListener("touchstart", (e) => { if(e.target.tagName !== 'BUTTON') startDrag(e.touches[0].clientX, e.touches[0].clientY); });
    document.addEventListener("touchmove", (e) => { if (isDragging) { e.preventDefault(); onDrag(e.touches[0].clientX, e.touches[0].clientY); } }, { passive: false });
    document.addEventListener("touchend", stopDrag);

    // Chat Logic
    const appendMessage = (sender, text) => {
        const msgDiv = document.createElement("div");
        msgDiv.className = `ai-widget-message ${sender}`;
        msgDiv.innerHTML = `<div class="ai-widget-avatar">${sender === "user" ? "👤" : "🤖"}</div><div class="ai-widget-bubble">${text}</div>`;
        body.appendChild(msgDiv);
        body.scrollTop = body.scrollHeight;
    };

    let attachedFile = null;
    let chatHistory = [];

    const handleSend = async () => {
        const text = input.value.trim();
        if(!text && !attachedFile) return;
        if(text) appendMessage("user", text);
        input.value = "";
        document.getElementById("aiWidgetPrompts")?.remove();
        
        appendMessage("ai", "<div class='typing-indicator-dot'><span></span><span></span><span></span></div>");
        const typingMsg = body.lastChild;
        
        console.log("User message received:", text);

        let apiKey = localStorage.getItem("gemini_api_key");
        if (!apiKey) {
            typingMsg.remove();
            appendMessage("ai", "AI Engine Not Connected");
            return;
        }

        console.log("API request sent");
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        let userParts = [];
        if (attachedFile) {
            userParts.push(attachedFile);
            attachedFile = null;
        }
        if (text) userParts.push({ text: text });

        const newMsg = { role: "user", parts: userParts };
        const apiHistory = chatHistory.map(msg => ({ role: msg.role, parts: [{ text: msg.parts[0].text || "" }] }));

        const requestBody = {
            contents: [...apiHistory, newMsg],
            systemInstruction: { parts: [{ text: "You are Namhohind AI, an expert study assistant for Bihar competitive exams." }] }
        };

        try {
            const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestBody) });
            typingMsg.remove();
            if (!response.ok) { appendMessage("ai", "AI Engine Not Connected"); return; }
            const data = await response.json();
            console.log("API response received");
            let replyText = data.candidates[0].content.parts[0].text;
            chatHistory.push({ role: "user", parts: [{ text: text }] });
            chatHistory.push({ role: "model", parts: [{ text: replyText }] });
            replyText = replyText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/\n/g, '<br>');
            appendMessage("ai", replyText);
        } catch (error) {
            console.error("Fetch Error:", error);
            typingMsg.remove();
            appendMessage("ai", "AI Engine Not Connected");
        }
    };

    sendBtn.addEventListener("click", handleSend);
    input.addEventListener("keypress", (e) => { if(e.key === "Enter") handleSend(); });
    prompts.forEach(btn => btn.addEventListener("click", () => { input.value = btn.innerText; handleSend(); }));

    // Action Buttons
    document.getElementById("aiWidgetAttachBtn").addEventListener("click", () => fileInput.click());
    document.getElementById("aiWidgetImgBtn").addEventListener("click", () => { fileInput.setAttribute("accept", "image/*"); fileInput.click(); });
    document.getElementById("aiWidgetMicBtn").addEventListener("click", () => alert("Voice integration coming in the next Beta update."));
    
    fileInput.addEventListener("change", (e) => { 
        if(e.target.files.length) { 
            const file = e.target.files[0];
            appendMessage("user", `📎 Uploaded: <b>${file.name}</b>`); 
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64String = event.target.result.split(',')[1];
                attachedFile = {
                    inlineData: { data: base64String, mimeType: file.type }
                };
            };
            reader.readAsDataURL(file);
            e.target.value = ""; 
        } 
    });
});