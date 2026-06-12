const fs = require('fs');
const path = require('path');

const questionBanksDir = path.join(__dirname, 'question-banks');

// 1. Create missing folder
if (!fs.existsSync(questionBanksDir)) {
    fs.mkdirSync(questionBanksDir);
    console.log("Created directory: question-banks/");
}

// 2. Migrate existing incorrectly named files to avoid data loss
const migrations = {
    "bpsc-mock-set-1.json": "bpsc-set1.json",
    "bpsc-mock-set-2.json": "bpsc-set2.json",
    "bpsc-mock-set-3.json": "bpsc-set3.json",
    "bpsc-mock-set-4.json": "bpsc-set4.json",
    "bpsc-mock-set-5.json": "bpsc-set5.json",
    "bpsc-mock-set-6.json": "bpsc-set6.json",
    "bpsc-mock-set-7.json": "bpsc-set7.json",
    "bpsc-mock-set-8.json": "bpsc-set8.json",
    "bpsc-mock-set-9.json": "bpsc-set9.json",
    "bpsc-mock-set-10.json": "bpsc-set10.json",
    "mixed-practice-set-1.json": "mixed-set1.json",
    "mixed-practice-set-2.json": "mixed-set2.json",
    "mixed-practice-set-3.json": "mixed-set3.json",
    "mixed-practice-set-4.json": "mixed-set4.json",
    "mixed-practice-set-5.json": "mixed-set5.json"
};

for (const [oldName, newName] of Object.entries(migrations)) {
    const oldPath = path.join(questionBanksDir, oldName);
    const newPath = path.join(questionBanksDir, newName);
    if (fs.existsSync(oldPath) && !fs.existsSync(newPath)) {
        fs.renameSync(oldPath, newPath);
        console.log(`Migrated: ${oldName} -> ${newName}`);
    }
}

// 3. Expected files based on the EXACT structure requested
const requiredFiles = [
    // Bihar GK Basic
    "bihar-gk-basic-set-1.json", "bihar-gk-basic-set-2.json", "bihar-gk-basic-set-3.json", "bihar-gk-basic-set-4.json", "bihar-gk-basic-set-5.json",
    // Bihar GK Advanced
    "bihar-gk-advanced-set-1.json", "bihar-gk-advanced-set-2.json", "bihar-gk-advanced-set-3.json", "bihar-gk-advanced-set-4.json", "bihar-gk-advanced-set-5.json",
    // Current Affairs
    "current-affairs-set-1.json", "current-affairs-set-2.json", "current-affairs-set-3.json", "current-affairs-set-4.json", "current-affairs-set-5.json",
    // Bihar Police
    "bihar-police-set1.json", "bihar-police-set2.json", "bihar-police-set3.json", "bihar-police-set4.json", "bihar-police-set5.json",
    // BPSC
    "bpsc-set1.json", "bpsc-set2.json", "bpsc-set3.json", "bpsc-set4.json", "bpsc-set5.json", 
    "bpsc-set6.json", "bpsc-set7.json", "bpsc-set8.json", "bpsc-set9.json", "bpsc-set10.json",
    // Mixed Practice
    "mixed-set1.json", "mixed-set2.json", "mixed-set3.json", "mixed-set4.json", "mixed-set5.json"
];

let missingCount = 0;

// 4. Verify and create missing files with placeholder data
requiredFiles.forEach(file => {
    const filePath = path.join(questionBanksDir, file);
    if (!fs.existsSync(filePath)) {
        const placeholder = {
            set_id: file.replace('.json', ''),
            subject: "Placeholder Subject",
            set_number: parseInt(file.match(/\d+/)[0] || 1),
            total_questions: 1,
            total_marks: 1,
            duration_minutes: 5,
            language: "Hindi-English",
            questions: [
                {
                    id: 1,
                    topic: "General",
                    difficulty: "Easy",
                    question_hi: "यह एक प्लेसहोल्डर प्रश्न है। इसे जल्द ही अपडेट किया जाएगा।",
                    question_en: "This is a placeholder question. It will be updated soon.",
                    options: { "A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D" },
                    answer: "A",
                    explanation_hi: "यह फाइल 404 त्रुटि से बचने के लिए बनाई गई है।",
                    explanation_en: "This file is generated to prevent 404 errors."
                }
            ]
        };
        fs.writeFileSync(filePath, JSON.stringify(placeholder, null, 2), 'utf8');
        console.log(`Created missing file: ${file}`);
        missingCount++;
    }
});

console.log(`\nScan & Repair Complete!`);
console.log(`Verified ${requiredFiles.length} files.`);
console.log(`Created ${missingCount} missing files.`);
console.log(`All HTTP 404 errors will now be resolved.`);