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
    no_of_question
}) => {

    const totalQuestions = Number(no_of_question) || 10;

    return `
Generate exactly ${totalQuestions} multiple-choice questions.

Subject: ${subject}
Class: ${className}
Board: ${syllabus}
Chapter: ${chapter_from}
Language: ${language}

Return ONLY valid JSON.

[
{
    "questionNumber":1,
    "question":"Question",
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

Rules:

1. Exactly ${totalQuestions} questions.
2. Every question must have A,B,C,D,E.
3. Option E means "I don't know" translated into ${language}.
4. Correct answer must be A/B/C/D/E.
5. No markdown.
6. No explanation.
7. No extra text.
8. Return JSON only.
`;
};

const buildExplanationPrompt = ({
    wrongQuestions,
    className,
    subject,
    syllabus,
    chapter_from,
    language
}) => {

    return `
You are an experienced ${syllabus} teacher.

Subject : ${subject}
Class : ${className}
Chapter : ${chapter_from}
Language : ${language}

Student answered these questions incorrectly.

${JSON.stringify(wrongQuestions)}

Generate ONE explanation object for EACH question.

Return ONLY valid JSON.

{
"questions":[
{
"questionNumber":1,
"explanation":"",
"summary":"",
"learningObjective":"",
"keyConcepts":[
""
],
"verificationQuestions":[
{
"question":"",
"choices":{
"A":"",
"B":"",
"C":"",
"D":""
},
"correctAnswer":"A"
}
],
"references":{
"videos":[],
"articles":[],
"books":[]
}
}
]
}

Rules

- Output length must equal input length.
- Do not skip any question.
- JSON only.
`;
};

const buildVerificationPrompt = ({
    explanation,
    language
}) => {

    return `
Below is the learning explanation.

${explanation}

Generate EXACTLY 3 NEW MCQ questions.

Rules

- Same concept.
- Different wording.
- Similar difficulty.
- JSON only.

[
{
"questionNumber":1,
"question":"",
"choices":{
"A":"",
"B":"",
"C":"",
"D":""
},
"correctAnswer":"A"
}
]

Language : ${language}
`;
};

module.exports = {
    buildQuestionPrompt,
    buildExplanationPrompt,
    buildVerificationPrompt
};