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
You are an expert education assistant.

Your job is NOT to explain the answer.

Your job is to identify the learning topic and generate search keywords that will help students learn the concept using YouTube videos and PDF notes.

Subject: ${questionData.subject}
Board: ${questionData.syllabus}
Class: ${questionData.className}
Chapter: ${questionData.chapter_from}
Language: ${questionData.language}

Question Number:
${questionData.questionNumber}

Question:
${specificQuestion.question}

Choices:
${JSON.stringify(specificQuestion.choices, null, 2)}

Correct Answer:
${specificQuestion.correctAnswer}

Return ONLY valid JSON.

{
    "topic":"",

    "learningObjective":"",

    "keywords":[
        "",
        "",
        ""
    ]
}
Rules

1. Do NOT explain the answer.

2. Do NOT generate YouTube links.

3. Do NOT generate PDF links.

4. Generate ONE clear topic.

5. Generate ONE concise learning objective.

6. Generate EXACTLY 3 keywords or short search phrases.

7. Keywords must describe the concept, not URLs.

8. Do NOT generate YouTube queries.

9. Do NOT generate PDF queries.

10. Return ONLY JSON.

`;

    }

   //---------------------------------------------------------
// BULK (ONLY WRONG QUESTIONS)
//---------------------------------------------------------

return `
You are an expert education assistant.

Your task is to generate learning metadata for ONLY the wrong questions provided.

Subject: ${questionData.subject}
Board: ${questionData.syllabus}
Class: ${questionData.className}
Chapter: ${questionData.chapter_from}
Language: ${questionData.language}

Wrong Questions:

${JSON.stringify(questionData.questions, null, 2)}

Return ONLY valid JSON.

{
  "questions":[
    {
      "questionNumber":1,

      "topic":"",

      "learningObjective":"",

      "keywords":[
        "",
        "",
        ""
      ],

      "youtubeSearch":[
        "",
        "",
        ""
      ],

      "pdfSearch":[
        "",
        ""
      ]
    }
  ]
}

Rules

1. Process ONLY the questions supplied.
2. Do NOT generate questions that are not supplied.
3. Do NOT explain answers.
4. Generate ONE topic.
5. Generate ONE learning objective.
6. Generate EXACTLY 3 keywords.
7. Generate EXACTLY 3 YouTube search phrases.
8. Generate EXACTLY 2 PDF search phrases.
9. Do NOT generate URLs.
10. Return ONLY JSON.

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
