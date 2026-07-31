// =====================================================
// AI Prompt Templates
// Shared by Gemini & OpenAI
// =====================================================

const buildQuestionPrompt = ({
    className,
    subject,
    syllabus,
    chapter_from,
    language,
    numberOfQuestions
}) => {

    return `
Generate exactly ${numberOfQuestions} multiple-choice questions for a ${subject} exam
for class ${className} based on the ${syllabus} syllabus from chapter ${chapter_from}.

Use ${language} language.

Return ONLY a valid JSON array.

[
  {
    "questionNumber": 1,
    "question": "Question text here",
    "choices": {
      "A": "Option A text",
      "B": "Option B text",
      "C": "Option C text",
      "D": "Option D text",
      "E": "I don't know (translated into ${language})"
    },
    "correctAnswer": "A"
  }
]

Rules

1. Generate exactly ${numberOfQuestions} questions.
2. Every question must have A, B, C, D and E.
3. Option E must be "I don't know" translated into ${language}.
4. Correct answer must be A/B/C/D/E.
5. No markdown.
6. No explanation.
7. No extra text.
8. Return only valid JSON.
`;
};

const buildExplanationPrompt = ({
    questionData,
    questionsList
}) => {
    const listToProcess = questionsList || [questionData];

    return `
You are an expert education assistant. 
Your primary task is to analyze the wrong questions, identify their core learning objective, and suggest high-quality study resources based strictly on that learning objective.

CRITICAL WARNING: Do NOT invent or guess fake URLs. If a real, working URL is not known, leave the url field as an empty string ("").

Subject: ${questionData.subject}
Board: ${questionData.syllabus}
Class: ${questionData.className}
Chapter: ${questionData.chapter_from}
Language: ${questionData.language}

Questions to Process:
${JSON.stringify(listToProcess, null, 2)}

Instructions:
1. For each question, first determine the exact "topic" and "learning objective".
2. Recommend educational videos ONLY from trusted channels like "CrashCourse", "Khan Academy", "Amoeba Sisters", or "Bozeman Science" for the "topic" and "learning objective".

Return ONLY valid JSON in this exact structure:

{
  "questions": [
    {
      "questionNumber": 1,
      "topic": "",
      "learningObjective": "",
      "keywords": ["", "", ""],
      "videos": [
        { "title": "", "url": "" },
        { "title": "", "url": "" },
        { "title": "", "url": "" }
      ],
      "pdfs": [
        { "title": "", "url": "" },
        { "title": "", "url": "" },
        { "title": "", "url": "" }
      ]
    }
  ]
}

Rules:
1. Do NOT explain the answers.
2. Generate EXACTLY 3 keywords based on the learning objective.
3. Recommend EXACTLY 3 educational YouTube videos and EXACTLY 3 PDF documents that match the learning objective.
4. Never invent fake URLs (use "" if unavailable).
5. Return ONLY valid JSON (no markdown).
`;
};

const buildVerificationPrompt = ({
    originalQuestion,
    topic,
    learningObjective,
    language
}) => {
    return `
You are an expert teacher.

Generate EXACTLY 3 NEW multiple-choice questions.

The student has already studied the topic using YouTube videos and PDF notes.

Use the following learning metadata.

Topic:
${topic}

Learning Objective:
${learningObjective}

Original Question:
${originalQuestion?.question}

Original Choices:
${JSON.stringify(originalQuestion?.choices, null, 2)}

Correct Answer:
${originalQuestion?.correctAnswer}

Rules

1. Generate EXACTLY 3 NEW MCQs.
2. Do NOT copy the original question.
3. Test the SAME concept.
4. Difficulty should be similar.
5. Every question must have options A, B, C, D and E.
6. Option E must be "I don't know" translated into ${language}.
7. Correct answer must be A/B/C/D/E.
8. Return ONLY valid JSON.
9. Do NOT return markdown.
10. Do NOT return explanation.

[
  {
    "questionNumber":1,
    "question":"Question text",
    "choices":{
      "A":"Option A",
      "B":"Option B",
      "C":"Option C",
      "D":"Option D",
      "E":"I don't know"
    },
    "correctAnswer":"A"
  }
]

Language: ${language}
`;
};

module.exports = {
    buildQuestionPrompt,
    buildExplanationPrompt,
    buildVerificationPrompt
};
