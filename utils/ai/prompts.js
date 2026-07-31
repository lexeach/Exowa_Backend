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

Your job is NOT to explain the answer. Your job is to identify the learning topic and generate accurate learning metadata.

CRITICAL WARNING ABOUT URLS: 
Do NOT hallucinate or guess YouTube or PDF URLs. If you do not know a 100% verified, real, and working URL, you MUST leave the url field as an empty string (""). Never invent fake links.

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

Return ONLY valid JSON matching this exact structure:

{
    "topic":"",
    "learningObjective":"",
    "keywords":[
        "",
        "",
        ""
    ],
    "videos":[
        {
            "title":"",
            "url":""
        }
    ],
    "pdfs":[
        {
            "title":"",
            "url":""
        }
    ]
}

Rules:
1. Do NOT explain the answer.
2. Generate ONE clear topic and ONE concise learning objective.
3. Generate EXACTLY 3 keywords.
4. If you cannot provide verified real URLs, return an empty array [] for videos and pdfs.
5. Return ONLY valid JSON with no markdown formatting.
`;

    }

//---------------------------------------------------------
// BULK (ONLY WRONG QUESTIONS)
//---------------------------------------------------------

return `
You are an expert education assistant.

Your task is to generate learning metadata for ONLY the wrong questions provided.

CRITICAL WARNING ABOUT URLS: 
Do NOT hallucinate or guess YouTube or PDF URLs. If you do not have a real, working URL, leave the url field as an empty string ("").

Subject: ${questionData.subject}
Board: ${questionData.syllabus}
Class: ${questionData.className}
Chapter: ${questionData.chapter_from}
Language: ${questionData.language}

Wrong Questions:
${JSON.stringify(questionData.questions, null, 2)}

Return ONLY valid JSON matching this exact structure:

{
  "questions":[
    {
      "questionNumber": 1,
      "topic": "",
      "learningObjective": "",
      "keywords": [
        "",
        "",
        ""
      ],
      "videos": [
        {
          "title": "",
          "url": ""
        }
      ],
      "pdfs": [
        {
          "title": "",
          "url": ""
        }
      ]
    }
  ]
}

Rules:
1. Process ONLY supplied questions.
2. Do NOT explain answers.
3. Generate EXACTLY 3 keywords per question.
4. If reliable URLs are unavailable, leave the url empty or return an empty array.
5. Return ONLY valid JSON.
6. Suggest 2 youtube video url for the topic
7. Suggest 2 pdf url for the topic
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
