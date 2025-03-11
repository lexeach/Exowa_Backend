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
  const MAX_RETRIES = 3;
  let retryCount = 0;
  let lastError = null;

  while (retryCount < MAX_RETRIES) {
    try {
      console.log(`Attempt ${retryCount + 1}/${MAX_RETRIES} to generate questions...`);
      
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Using updated model
      const numberOfQuestions = Number(process.env.NO_OF_QUESTIONS) || 10;
      const prompt = `Generate ${Number(
        no_of_question
      )} multiple-choice questions for a ${subject} exam
      for class ${className} based on the ${syllabus} syllabus from chapter ${chapter_from} to ${chapter_to}.
      The questions should be in ${language}. Provide the output strictly as a JSON array in the following format:
      [
        {
          "questionNumber": 1,
          "question": "<Text of question>",
          "choices": {
            "A": "<Option A>",
            "B": "<Option B>",
            "C": "<Option C>",
            "D": "<Option D>"
          },
          "correctAnswer": "<A|B|C|D>"
        }
      ]
      Only return the JSON array, nothing else.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonStart = text.indexOf("[");
      const jsonEnd = text.lastIndexOf("]") + 1;
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonString = text.substring(jsonStart, jsonEnd);
        try {
          const parsedQuestions = JSON.parse(jsonString);
          const isValidQuestion = (question) => {
            return (
              typeof question.questionNumber === "number" &&
              typeof question.question === "string" &&
              typeof question.choices === "object" &&
              ["A", "B", "C", "D"].every((key) => key in question.choices) &&
              ["A", "B", "C", "D"].includes(question.correctAnswer)
            );
          };
          
          const validatedQuestions = parsedQuestions.filter(isValidQuestion);
          
          if (validatedQuestions.length === 0) {
            throw new Error("No valid questions generated");
          }
          
          return validatedQuestions;
        } catch (error) {
          console.error("JSON Parse Error:", error.message);
          console.error("Extracted JSON String:", jsonString);
          throw new Error("Invalid JSON format received from the AI");
        }
      } else {
        console.error("Failed to locate JSON in response:", text);
        throw new Error("Response does not contain JSON");
      }
    } catch (error) {
      retryCount++;
      lastError = error;
      
      // Log the current retry attempt
      // console.error(`Error on attempt ${retryCount}/${MAX_RETRIES}:`, error.message);
      
      // Check if this is a GoogleGenerativeAIFetchError specifically
      if (error.name === "GoogleGenerativeAIFetchError" || error.toString().includes("GoogleGenerativeAIFetchError")) {
        console.log(`GoogleGenerativeAIFetchError detected. Retrying... (${retryCount}/${MAX_RETRIES})`);
      }
      
      // If we've reached max retries, throw the error
      if (retryCount >= MAX_RETRIES) {
        console.error(`Max retries (${MAX_RETRIES}) reached. Giving up.`);
        throw new Error(`Failed to generate questions after ${MAX_RETRIES} attempts: ${lastError.message}`);
      }
      
      // Add exponential backoff with jitter
      const delay = Math.min(1000 * Math.pow(2, retryCount) + Math.random() * 1000, 10000);
      console.log(`Waiting ${delay/1000} seconds before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

module.exports = { getGenerateQuestion };