document.addEventListener("DOMContentLoaded", () => {
    const chatMessages = document.getElementById("chatMessages");
    const aiInput = document.getElementById("aiInput");
    const sendBtn = document.getElementById("sendBtn");
    const attachBtn = document.getElementById("attachBtn");
    const aiFile = document.getElementById("aiFile");
    const micBtn = document.getElementById("micBtn");
    const quickPrompts = document.querySelectorAll(".ai-quick-prompts button");
    const modeBtns = document.querySelectorAll(".ai-mode-btn");
    
    let currentMode = "study";
    let attachedFile = null;
    let isListening = false;
    let chatHistory = [];
    
    // REPLACE THIS URL with your actual deployed Cloudflare Worker URL
    // e.g., "https://namhohind-ai.your-username.workers.dev"
    const API_ENDPOINT = "https://your-cloudflare-worker-url.workers.dev";

    const scrollToBottom = () => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    aiInput.addEventListener("input", function() {
        this.style.height = "auto";
        this.style.height = (this.scrollHeight) + "px";
        if(this.value === "") this.style.height = "auto";
    });

    quickPrompts.forEach(btn => {
        btn.addEventListener("click", () => {
            aiInput.value = btn.innerText;
            handleSend();
        });
    });

    modeBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            modeBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentMode = btn.dataset.mode;
            appendMessage("ai", `Switched to <strong>${btn.innerText}</strong>. How can I assist you in this mode?`, true);
        });
    });

    attachBtn.addEventListener("click", () => {
        aiFile.click();
    });

    aiFile.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            appendMessage("user", `📎 Attached: <strong>${file.name}</strong>`, true);
            
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64String = event.target.result.split(',')[1];
                attachedFile = {
                    inlineData: {
                        data: base64String,
                        mimeType: file.type
                    }
                };
            };
            reader.readAsDataURL(file);
        }
    });

    // Web Speech API Initialization
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-IN'; // Can handle mixed Hindi/English
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            aiInput.value = transcript;
            handleSend();
        };
        
        recognition.onerror = (event) => {
            console.error("Speech recognition error", event.error);
            resetMic();
            appendMessage("ai", "Sorry, I couldn't hear that properly. Please try again.");
        };
        
        recognition.onend = () => {
            resetMic();
        };
    }

    function resetMic() {
        isListening = false;
        micBtn.style.color = "#666";
        aiInput.placeholder = "Ask a question or upload notes/images...";
    }

    micBtn.addEventListener("click", () => {
        if (!isListening && recognition) {
            isListening = true;
            micBtn.style.color = "#c62828";
            aiInput.placeholder = "Listening... Speak now.";
            recognition.start();
        } else if (!recognition) {
            alert("Voice input is not supported in this browser.");
        }
    });

    sendBtn.addEventListener("click", handleSend);
    aiInput.addEventListener("keypress", (e) => {
        if(e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    async function handleSend() {
        const text = aiInput.value.trim();
        if (!text && !attachedFile) return;
        
        if (text) appendMessage("user", text);
        aiInput.value = "";
        aiInput.style.height = "auto";
        document.getElementById("quickPrompts").style.display = "none";
        
        console.log("User message received:", text);

        showTypingIndicator();
        console.log("API request sent");
        
        // Fetch actual response from Gemini
        const responseHTML = await fetchGeminiResponse(text, currentMode);
        
        removeTypingIndicator();
        appendMessage("ai", responseHTML, true);
    }

    function appendMessage(sender, text, isHtml = false) {
        const msgDiv = document.createElement("div");
        msgDiv.className = `ai-message ${sender}`;
        
        const avatar = document.createElement("div");
        avatar.className = "ai-avatar";
        avatar.innerText = sender === "user" ? "👤" : "🤖";
        
        const bubble = document.createElement("div");
        bubble.className = "ai-bubble";
        
        if (isHtml) {
            bubble.innerHTML = text;
        } else {
            bubble.innerHTML = text.replace(/\n/g, '<br>');
        }

        msgDiv.appendChild(avatar);
        msgDiv.appendChild(bubble);
        chatMessages.appendChild(msgDiv);
        scrollToBottom();
    }

    function showTypingIndicator() {
        const msgDiv = document.createElement("div");
        msgDiv.className = "ai-message ai typing-message";
        msgDiv.id = "typingIndicator";
        
        const avatar = document.createElement("div");
        avatar.className = "ai-avatar";
        avatar.innerText = "🤖";
        
        const bubble = document.createElement("div");
        bubble.className = "typing-indicator";
        bubble.innerHTML = "<span></span><span></span><span></span>";

        msgDiv.appendChild(avatar);
        msgDiv.appendChild(bubble);
        chatMessages.appendChild(msgDiv);
        scrollToBottom();
    }

    function removeTypingIndicator() {
        const indicator = document.getElementById("typingIndicator");
        if(indicator) indicator.remove();
    }

    function formatMarkdown(text) {
        let formatted = text.replace(/```([\s\S]*?)```/g, '<pre style="background:#333;color:#fff;padding:10px;border-radius:6px;overflow-x:auto;"><code>$1</code></pre>');
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
        formatted = formatted.replace(/\n/g, '<br>');
        return formatted;
    }

    async function fetchGeminiResponse(userText, mode) {
        const url = API_ENDPOINT;
        
        let userParts = [];
        if (attachedFile) {
            userParts.push(attachedFile);
            attachedFile = null; // consume file
        }
        if (userText) {
            userParts.push({ text: userText });
        }

        const newMsg = { role: "user", parts: userParts };
        
        // We don't send raw files in chatHistory to save bandwidth, only text history
        const apiHistory = chatHistory.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.parts[0].text || "" }]
        }));

        const requestBody = {
            contents: [...apiHistory, newMsg],
            systemInstruction: { parts: [{ text: `You are Namhohind AI, an expert and highly encouraging study assistant for Bihar competitive exams like BPSC, Bihar Police, and Bihar SSC. You can read uploaded PDFs and images. Currently the user is interacting with you in '${mode.toUpperCase()}' mode. Keep responses concise, accurate, and format them clearly.` }] }
        };

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                const err = await response.json();
                console.error("Backend Error:", err);
                return "Oops! Connection to the AI Engine failed. Please try again later.";
            }

            const data = await response.json();
            if (data.error) {
                console.error("Gemini API Error:", data.error);
                return "AI Engine encountered an error. Please try again.";
            }

            console.log("API response received");
            const replyText = data.candidates[0].content.parts[0].text;

            // Save text interaction to history
            chatHistory.push({ role: "user", parts: [{ text: userText }] });
            chatHistory.push({ role: "model", parts: [{ text: replyText }] });

            return formatMarkdown(replyText);
        } catch (error) {
            console.error("Fetch Error:", error);
            return "Oops! Connection to the AI Engine failed. Please check your network.";
        }
    }
});