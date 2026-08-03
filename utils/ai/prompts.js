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
    specificQuestion
}) => {

    const questions = specificQuestion
        ? [{
            questionNumber:
                specificQuestion.questionNumber ??
                questionData.questionNumber ??
                1,
            question: specificQuestion.question,
            choices: specificQuestion.choices,
            correctAnswer: specificQuestion.correctAnswer
        }]
        : questionData.questions;

    return `
You are an expert education assistant.

Your task is to generate learning metadata for EVERY supplied question.

Do NOT explain the answer.

Subject: ${questionData.subject}
Board: ${questionData.syllabus}
Class: ${questionData.className}
Chapter: ${questionData.chapter_from}
Language: ${questionData.language}

Questions

${JSON.stringify(questions, null, 2)}

{
  "prompt": "Generate the explanation as a student-friendly learning note of approximately 250 to 400 words. Use simple language. Explain the concept instead of just explaining the answer. Do not reveal the correct option. Return ONLY valid JSON.\n{\n  \"questions\":[\n    {\n      \"questionNumber\":1,\n      \"topic\":\"\",\n      \"learningObjective\":\"\",\n      \"keywords\":[\n        \"\",\n        \"\",\n        \"\"\n      ],\n      \"explanation\":\"\",\n      \"videoSearchQuery\":\"\",\n      \"pdfSearchQuery\":\"\"\n    }\n  ]\n}\n\nRules\n1. Process EVERY supplied question.\n2. Generate ONE topic.\n3. Generate ONE concise learning objective.\n4. Generate EXACTLY 3 keywords.\n5. Generate ONE detailed explanation.\n6. The explanation should be written in simple language.\n7. The explanation should be easy enough for a Class student to understand.\n8. Explain the complete concept step by step.\n9. Include examples wherever helpful.\n10. Do NOT mention the correct option or correct answer directly.\n11. Generate ONLY ONE highly optimized YouTube search query that prioritizes top Indian educational channels (such as Physics Wallah, Magnet Brains, Khan Sir, or Vedantu) by including their names and keywords to favor concise video content.\n12. Generate ONLY ONE highly optimized PDF search query.\n13. Never generate YouTube URLs.\n14. Never generate PDF URLs.\n15. The search query should contain: Subject + Standard/Class + Chapter + Main Concept + Famous Indian educational channels.\n16. The query should be optimized to return short or specific educational video results where the video duration or format targets brief concept overviews (under 15 minutes).\n17. Ensure that any specified parameters or target video results for the search query favor content with a duration of no more than 15 minutes.\n18. Return ONLY valid JSON."
}"
}
`;
};

const buildVerificationPrompt = ({
    originalQuestion,
    topic,
    learningObjective,
    keywords = [],
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

Important Keywords:
${Array.isArray(keywords) ? keywords.join(", ") : ""}

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
4. Use the provided topic, learning objective and keywords while generating questions.
5. Difficulty should be similar.
6. Every question must have options A, B, C and D.
7. Correct answer must be A/B/C/D.
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
