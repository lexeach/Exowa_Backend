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

    if (specificQuestion) {

        return `
Generate a comprehensive explanation and learning resources for this specific question.

Subject: ${questionData.subject}
Board: ${questionData.syllabus}
Class: ${questionData.className}
Chapter: ${questionData.chapter_from}
Language: ${questionData.language}

Question Number: ${questionData.questionNumber}

Question:
${specificQuestion.question}

Choices:
${JSON.stringify(specificQuestion.choices, null, 2)}

Correct Answer:
${specificQuestion.correctAnswer}

Return ONLY valid JSON.

{
    "explanation":"Detailed explanation",
    "references":{
        "videos":[
            "Video 1",
            "Video 2"
        ],
        "articles":[
            "Article 1",
            "Article 2"
        ],
        "books":[
            "Book 1",
            "Book 2"
        ]
    }
}

Rules

- Explain why the correct answer is correct.
- Explain why the other options are incorrect.
- Keep language suitable for Class ${questionData.className}.
- JSON only.
`;

    }

    return `
Generate a comprehensive explanation and learning resources for the following question paper.

Subject: ${questionData.subject}
Board: ${questionData.syllabus}
Class: ${questionData.className}
Chapter: ${questionData.chapter_from}
Language: ${questionData.language}

Questions:

${JSON.stringify(questionData.questions, null, 2)}

Return ONLY valid JSON.

{
    "explanation":"Detailed explanation",
    "references":{
        "videos":[
            "Video 1",
            "Video 2"
        ],
        "articles":[
            "Article 1",
            "Article 2"
        ],
        "books":[
            "Book 1",
            "Book 2"
        ]
    }
}

Rules

- Explain all concepts.
- Suitable for Class ${questionData.className}.
- JSON only.
`;
};

const buildVerificationPrompt = ({
    explanation,
    language
}) => {

    return `
You are an expert teacher.

Below is the learning explanation.

${explanation}

Generate EXACTLY 3 NEW multiple-choice questions.

Rules

- Questions must NOT copy the original question.
- Questions must test the same concept.
- Difficulty should be similar.
- Return ONLY JSON.

[
    {
        "questionNumber":1,
        "question":"Question text",
        "choices":{
            "A":"Option A",
            "B":"Option B",
            "C":"Option C",
            "D":"Option D"
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