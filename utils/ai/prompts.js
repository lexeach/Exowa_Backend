// =====================================================
// Exowa AI Prompt Templates
// Shared by Gemini & OpenAI
// Optimized for Token Usage
// =====================================================

/**
 * =====================================================
 * QUESTION GENERATION
 * =====================================================
 */

const buildQuestionPrompt = ({
    className,
    subject,
    syllabus,
    chapter_from,
    language,
    numberOfQuestions
}) => {

    return `
You are an experienced ${subject} teacher.

Generate EXACTLY ${numberOfQuestions} multiple-choice questions.

Details

Class: ${className}
Subject: ${subject}
Board: ${syllabus}
Chapter: ${chapter_from}
Language: ${language}

Return ONLY valid JSON.

{
  "questions":[
    {
      "questionNumber":1,
      "question":"",

      "choices":{
        "A":"",
        "B":"",
        "C":"",
        "D":"",
        "E":""
      },

      "correctAnswer":"A",

      "learningObjective":""
    }
  ]
}

Rules

1. Generate EXACTLY ${numberOfQuestions} questions.
2. Question language must be ${language}.
3. Every question must contain options A,B,C,D,E.
4. Option E must always be "I don't know" translated into ${language}.
5. Correct answer must be A/B/C/D only.
6. learningObjective must be ONE SHORT sentence (maximum 15 words).
7. Do not repeat questions.
8. Do not include explanations.
9. Do not include markdown.
10. Return JSON only.
`;
};



/**
 * =====================================================
 * QUESTION EXPLANATION
 * =====================================================
 */

const buildExplanationPrompt = ({
    className,
    subject,
    syllabus,
    chapter_from,
    language,
    question,
    choices,
    correctAnswer
}) => {

    return `
You are an expert teacher.

Explain this question for a Class ${className} student.

Class: ${className}
Subject: ${subject}
Board: ${syllabus}
Chapter: ${chapter_from}

Language: ${language}

Question

${question}

Choices

${JSON.stringify(choices, null, 2)}

Correct Answer

${correctAnswer}

Return ONLY JSON.

{
    "explanation":"",
    "importantPoints":[
        "",
        "",
        ""
    ],

    "commonMistakes":[
        "",
        ""
    ]
}

Rules

1. Explain why the correct answer is correct.
2. Briefly explain why other options are incorrect.
3. Use simple ${language}.
4. Do NOT recommend videos.
5. Do NOT recommend books.
6. Do NOT recommend websites.
7. No markdown.
8. Return JSON only.
`;
};



/**
 * =====================================================
 * PRACTICE MORE
 * =====================================================
 */

const buildVerificationPrompt = ({
    className,
    subject,
    syllabus,
    chapter_from,
    language,
    question,
    choices,
    correctAnswer,
    learningObjective = ""
}) => {

    return `
You are an experienced teacher.

Generate EXACTLY 3 NEW multiple-choice questions.

Class: ${className}
Subject: ${subject}
Board: ${syllabus}
Chapter: ${chapter_from}

Language: ${language}

Original Question

${question}

Choices

${JSON.stringify(choices, null, 2)}

Correct Answer

${correctAnswer}

Learning Objective

${learningObjective}

Return ONLY JSON.

{
  "questions":[
    {
      "questionNumber":1,

      "question":"",

      "choices":{
        "A":"",
        "B":"",
        "C":"",
        "D":"",
        "E":""
      },

      "correctAnswer":"A"
    }
  ]
}

Rules

1. Generate EXACTLY 3 NEW questions.
2. Do NOT copy the original question.
3. Test the same learning objective.
4. Keep the same difficulty level.
5. Use ${language}.
6. Option E must be "I don't know" translated into ${language}.
7. Correct answer must be A/B/C/D only.
8. No explanation.
9. No markdown.
10. Return JSON only.
`;
};

module.exports = {
    buildQuestionPrompt,
    buildExplanationPrompt,
    buildVerificationPrompt
};