const fs = require('fs');
const path = require('path');

// Ensure you install node-fetch if using older Node.js (npm install node-fetch)
// Add your Gemini API Key Here
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const outputDir = path.join(__dirname, 'question-banks');

async function generateSet(setNumber) {
    console.log(`Generating Set ${setNumber}...`);
    
    const prompt = `
    Generate 150 highly accurate BPSC Civil Services Mock Test questions.
    Distribute questions across: History, Geography, Polity, Economy, Science, Current Affairs, Bihar Special, Environment, Math, Reasoning.
    Return ONLY valid JSON.
    Format required:
    {
      "set_id": "bpsc-set${setNumber}",
      "subject": "BPSC Mock Test",
      "set_number": ${setNumber},
      "total_questions": 150,
      "total_marks": 150,
      "duration_minutes": 180,
      "language": "Hindi-English",
      "questions": [
         {
           "id": 1,
           "topic": "History",
           "difficulty": "Medium",
           "question_hi": "...",
           "question_en": "...",
           "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
           "answer": "A",
           "explanation_hi": "...",
           "explanation_en": "..."
         }
      ]
    }`;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        let text = data.candidates[0].content.parts[0].text;
        
        // Clean markdown backticks if present
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        const jsonOutput = JSON.parse(text);
        
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
        const filename = path.join(outputDir, `bpsc-set${setNumber}.json`);
        
        fs.writeFileSync(filename, JSON.stringify(jsonOutput, null, 2), 'utf-8');
        console.log(`Successfully saved ${filename}`);
        
    } catch (err) {
        console.error(`Failed generating Set ${setNumber}:`, err.message);
    }
}

async function generateAll() {
    // Generate sets 1 through 10
    for (let i = 1; i <= 10; i++) {
        await generateSet(i);
        // Artificial delay to prevent API rate limiting
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
    console.log("All 1500 questions generated!");
}

generateAll();