const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

const getGenerateQuestion = async ({
  className,
  subject,
  syllabus,
  chapter_from,
  chapter_to,
  language,
  no_of_question,
}) => {
  // Input validation
  if (!className || !subject || !syllabus || !chapter_from || !chapter_to || !language) {
    throw new Error("Missing required parameters");
  }

  const MAX_RETRIES = 3;
  let retryCount = 0;
  let lastError = null;

  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json"
    }
  });

  const numberOfQuestions = Number(no_of_question) || Number(process.env.NO_OF_QUESTIONS) || 10;
  
  const prompt = `
    find chapter name by number on https://feedsyllabus.netlify.app/${className}/${syllabus}/${subject}
    Generate exactly ${numberOfQuestions} multiple-choice questions for a ${subject} exam
    for class ${className} based on the ${syllabus} syllabus from chapter ${chapter_from} to ${chapter_to}.
    Use ${language} language. Return ONLY a valid JSON array in this exact format:
    [
      {
        "questionNumber": 1,
        "question": "Question text here",
        "choices": {
          "A": "Option A text",
          "B": "Option B text",
          "C": "Option C text",
          "D": "Option D text",
          "E": "I don't know (translate this to ${language})"
        },
        "correctAnswer": "A" // Must be A, B, C, D, or E
      }
    ]
    Do not include any text outside the JSON array. Ensure all questions follow this structure exactly.
    For option E, translate "I don't know" to the appropriate text in ${language} language.
  `;

  while (retryCount < MAX_RETRIES) {
    try {
      console.log(`Attempt ${retryCount + 1}/${MAX_RETRIES} to generate questions...`);
      
      // Add timeout to prevent hanging
      const timeoutPromise = (ms) => new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Request timeout")), ms)
      );

      const result = await Promise.race([
        model.generateContent(prompt),
        timeoutPromise(30000) // 30s timeout
      ]);

      const response = await result.response;
      const text = response.text();

      const parsedQuestions = JSON.parse(text);
      
      const isValidQuestion = (question) => {
        return (
          typeof question.questionNumber === "number" &&
          typeof question.question === "string" &&
          question.question.trim().length > 0 &&
          typeof question.choices === "object" &&
          ["A", "B", "C", "D", "E"].every(key => 
            key in question.choices && 
            typeof question.choices[key] === "string" &&
            question.choices[key].trim().length > 0
          ) &&
          ["A", "B", "C", "D", "E"].includes(question.correctAnswer)
        );
      };

      const validatedQuestions = parsedQuestions.filter(isValidQuestion);
      
      if (validatedQuestions.length === 0) {
        throw new Error("No valid questions generated");
      }

      // Fallback mechanism for fewer questions
      if (validatedQuestions.length < numberOfQuestions) {
        console.warn(`Only ${validatedQuestions.length} valid questions generated out of ${numberOfQuestions} requested`);
        return validatedQuestions; // Return what we have
      }

      return validatedQuestions;

    } catch (error) {
      retryCount++;
      lastError = error;
      console.error(`Error on attempt ${retryCount}: ${error.message}`);
      
      if (retryCount >= MAX_RETRIES) {
        throw new Error(`Failed after ${MAX_RETRIES} attempts: ${lastError.message}`);
      }

      const delay = Math.pow(2, retryCount) * 1000;
      console.log(`Waiting ${delay/1000}s before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

module.exports = { getGenerateQuestion };
