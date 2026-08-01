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

Generate the explanation as a student-friendly learning note of approximately 250 to 400 words.
Use simple language.
Explain the concept instead of just explaining the answer.
Do not reveal the correct option.
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

      "explanation":"",

      "videoSearchQueries":[
        "",
        "",
        ""
      ],

      "pdfSearchQueries":[
        "",
        "",
        ""
      ]
    }
  ]
}

Rules

1. Process EVERY supplied question.
2. Generate ONE topic.
3. Generate ONE concise learning objective.
4. Generate EXACTLY 3 keywords.
5. Generate ONE detailed explanation.
6. The explanation should be written in simple ${questionData.language} language.
7. The explanation should be easy enough for a Class ${questionData.className} student to understand.
8. Explain the complete concept step by step.
9. Include examples wherever helpful.
10. Do NOT mention the correct option or correct answer directly.
11. Generate EXACTLY 3 YouTube search queries.
12. Generate EXACTLY 3 PDF search queries.
13. Never generate YouTube URLs.
14. Never generate PDF URLs.
15. Search queries should be highly relevant to the concept.
16. Return ONLY valid JSON.`;
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
6. Every question must have options A, B, C, D and E.
7. Option E must be "I don't know" translated into ${language}.
8. Correct answer must be A/B/C/D/E.
9. Return ONLY valid JSON.
10. Do NOT return markdown.
11. Do NOT return explanation.

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
