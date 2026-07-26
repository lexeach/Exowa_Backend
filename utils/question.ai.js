const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);


const generateQuestionExplanation = async (questionData) => {
  const MAX_RETRIES = 3;
  let retryCount = 0;
  let lastError = null;

  const model = genAI.getGenerativeModel({
    model: "gemini-3.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  // Get question list
  const wrongQuestions =
    questionData.wrongQuestions ||
    (
      questionData.questionNumber && questionData.questions
        ? questionData.questions.filter(
            (q) => q.questionNumber === questionData.questionNumber
          )
        : questionData.questions || []
    );

  if (!wrongQuestions.length) {
    throw new Error("No question found for explanation generation.");
  }

  const question = wrongQuestions[0];
  const subject = questionData.subject || "General";

  const prompt = `
You are an expert ${subject} teacher.

Generate an explanation ONLY for the following question.

Return ONLY valid JSON in the following format:

{
  "questionNumber": ${question.questionNumber},
  "explanation": "Detailed explanation",
  "summary": "Short summary",
  "learningObjective": "Student should learn...",
  "keyConcepts": [
    "Concept 1",
    "Concept 2"
  ],
  "verificationQuestions": [
    {
      "question": "",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "correctAnswer": "A"
    },
    {
      "question": "",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "correctAnswer": "B"
    }
  ],
  "references": {
    "book": "",
    "chapter": "",
    "topic": ""
  }
}

Question:

${JSON.stringify(question, null, 2)}

Do not wrap JSON inside markdown.
Do not add any explanation.
Return JSON only.
`;

  while (retryCount < MAX_RETRIES) {
    try {
      console.log(
        `Attempt ${retryCount + 1}/${MAX_RETRIES} to generate explanation...`
      );

      const timeoutPromise = (ms) =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout")), ms)
        );

      const result = await Promise.race([
        model.generateContent(prompt),
        timeoutPromise(45000),
      ]);

      const response = await result.response;

      const text = response
        .text()
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const explanation = JSON.parse(text);

      if (!explanation.explanation) {
        throw new Error("Invalid AI response.");
      }

      return explanation;
    } catch (error) {
      retryCount++;
      lastError = error;

      console.error(
        `Explanation generation failed (${retryCount}/${MAX_RETRIES})`,
        error.message
      );

      if (retryCount >= MAX_RETRIES) {
        throw new Error(
          `Failed after ${MAX_RETRIES} attempts: ${lastError.message}`
        );
      }
const generateVerificationQuestions = async ({
  explanation,
  language,
}) => {
  const MAX_RETRIES = 3;
  let retryCount = 0;
  let lastError = null;

  const model = genAI.getGenerativeModel({
    model: "gemini-3.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const prompt = `
You are an expert teacher.

Below is the learning content.

${explanation}

Generate EXACTLY 3 NEW multiple-choice questions that verify whether the student has understood this topic.

Rules:

- Questions must NOT copy the original question.
- Questions must test the same concept.
- Difficulty should be similar.
- Use ${language} language.
- Return ONLY valid JSON.

Format:

[
  {
    "questionNumber": 1,
    "question": "",
    "choices": {
      "A": "",
      "B": "",
      "C": "",
      "D": ""
    },
    "correctAnswer": "A"
  }
]
`;

  while (retryCount < MAX_RETRIES) {
    try {
      console.log(
        `Attempt ${retryCount + 1}/${MAX_RETRIES} to generate verification questions...`
      );

      const timeoutPromise = (ms) =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout")), ms)
        );

      const result = await Promise.race([
        model.generateContent(prompt),
        timeoutPromise(30000),
      ]);

      const response = await result.response;

      const text = response
        .text()
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const questions = JSON.parse(text);

      if (!Array.isArray(questions)) {
        throw new Error("AI returned invalid verification questions.");
      }

      return questions;
    } catch (error) {
      retryCount++;
      lastError = error;

      console.error(
        `Verification question generation failed (${retryCount}/${MAX_RETRIES})`,
        error.message
      );

      if (retryCount >= MAX_RETRIES) {
        throw new Error(
          `Failed after ${MAX_RETRIES} attempts: ${lastError.message}`
        );
      }

      const delay =
        Number(process.env.AI_REQUEST_DELAY_MS) || 70000;

      console.log(
        `Waiting ${delay / 1000} seconds before retry...`
      );

      await new Promise((resolve) =>
        setTimeout(resolve, delay)
      );
    }
  }
//};            }

         //   await new Promise(r=>setTimeout(r,2000*retryCount));

     //   }

    //}

}
module.exports = {
    getGenerateQuestion,
    generateQuestionExplanation,
    generateVerificationQuestions,
};
