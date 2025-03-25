const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

// const getGenerateQuestion = async ({
//   className,
//   subject,
//   syllabus,
//   chapter_from,
//   chapter_to,
//   language,
//   no_of_question,
// }) => {
//   const MAX_RETRIES = 3;
//   let retryCount = 0;
//   let lastError = null;

//   while (retryCount < MAX_RETRIES) {
//     try {
//       console.log(`Attempt ${retryCount + 1}/${MAX_RETRIES} to generate questions...`);
      
//       const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Using updated model
//       const numberOfQuestions = Number(process.env.NO_OF_QUESTIONS) || 10;
//       const prompt = `Generate ${Number(
//         no_of_question
//       )} multiple-choice questions for a ${subject} exam
//       for class ${className} based on the ${syllabus} syllabus from chapter ${chapter_from} to ${chapter_to}.
//       The questions should be in ${language}. Provide the output strictly as a JSON array in the following format:
//       [
//         {
//           "questionNumber": 1,
//           "question": "<Text of question>",
//           "choices": {
//             "A": "<Option A>",
//             "B": "<Option B>",
//             "C": "<Option C>",
//             "D": "<Option D>"
//           },
//           "correctAnswer": "<A|B|C|D>"
//         }
//       ]
//       Only return the JSON array, nothing else.`;

//       const result = await model.generateContent(prompt);
//       const response = await result.response;
//       const text = response.text();
      
//       const jsonStart = text.indexOf("[");
//       const jsonEnd = text.lastIndexOf("]") + 1;
      
//       if (jsonStart !== -1 && jsonEnd !== -1) {
//         const jsonString = text.substring(jsonStart, jsonEnd);
//         try {
//           const parsedQuestions = JSON.parse(jsonString);
//           const isValidQuestion = (question) => {
//             return (
//               typeof question.questionNumber === "number" &&
//               typeof question.question === "string" &&
//               typeof question.choices === "object" &&
//               ["A", "B", "C", "D"].every((key) => key in question.choices) &&
//               ["A", "B", "C", "D"].includes(question.correctAnswer)
//             );
//           };
          
//           const validatedQuestions = parsedQuestions.filter(isValidQuestion);
          
//           if (validatedQuestions.length === 0) {
//             throw new Error("No valid questions generated");
//           }
          
//           return validatedQuestions;
//         } catch (error) {
//           console.error("JSON Parse Error:", error.message);
//           console.error("Extracted JSON String:", jsonString);
//           throw new Error("Invalid JSON format received from the AI");
//         }
//       } else {
//         console.error("Failed to locate JSON in response:", text);
//         throw new Error("Response does not contain JSON");
//       }
//     } catch (error) {
//       retryCount++;
//       lastError = error;
      
//       // Log the current retry attempt
//       // console.error(`Error on attempt ${retryCount}/${MAX_RETRIES}:`, error.message);
      
//       // Check if this is a GoogleGenerativeAIFetchError specifically
//       if (error.name === "GoogleGenerativeAIFetchError" || error.toString().includes("GoogleGenerativeAIFetchError")) {
//         console.log(`GoogleGenerativeAIFetchError detected. Retrying... (${retryCount}/${MAX_RETRIES})`);
//       }
      
//       // If we've reached max retries, throw the error
//       if (retryCount >= MAX_RETRIES) {
//         console.error(`Max retries (${MAX_RETRIES}) reached. Giving up.`);
//         throw new Error(`Failed to generate questions after ${MAX_RETRIES} attempts: ${lastError.message}`);
//       }
      
//       // Add exponential backoff with jitter
//       const delay = Math.min(1000 * Math.pow(2, retryCount) + Math.random() * 1000, 10000);
//       console.log(`Waiting ${delay/1000} seconds before retry...`);
//       await new Promise(resolve => setTimeout(resolve, delay));
//     }
//   }
// };

const getGenerateQuestion = async ({
  className,
  subject,
  syllabus,
  chapter_from,
  chapter_to,
  language,
  no_of_question,
}) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Break down large question sets into smaller chunks
    const CHUNK_SIZE = 10;
    const numberOfChunks = Math.ceil(Number(no_of_question) / CHUNK_SIZE);
    let allQuestions = [];

    for (let i = 0; i < numberOfChunks; i++) {
      const questionsInThisChunk = Math.min(
        CHUNK_SIZE,
        Number(no_of_question) - (i * CHUNK_SIZE)
      );

      const prompt = `Generate exactly ${questionsInThisChunk} multiple-choice questions for a ${subject} exam
      for class ${className} based on the ${syllabus} syllabus, covering chapters ${chapter_from} to ${chapter_to}.
      The questions should be in ${language}.
      
      Important formatting rules:
      1. Use only standard ASCII characters
      2. Avoid special characters or symbols
      3. Keep questions concise and clear
      
      Return the response in this exact JSON format:
      [
        {
          "questionNumber": ${i * CHUNK_SIZE + 1},
          "question": "question text",
          "choices": {
            "A": "first option",
            "B": "second option",
            "C": "third option",
            "D": "fourth option"
          },
          "correctAnswer": "A"
        }
      ]
      
      Respond with only the JSON array, no additional text.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text()
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[^\x20-\x7E]/g, ''); // Remove non-ASCII characters

      // Find the JSON array in the response
      const jsonStart = text.indexOf("[");
      const jsonEnd = text.lastIndexOf("]") + 1;
      
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error("Invalid response format");
      }

      const jsonString = text.substring(jsonStart, jsonEnd);
      
      try {
        const parsedQuestions = JSON.parse(jsonString);
        
        // Validate questions
        const validatedQuestions = parsedQuestions.filter(question => {
          return (
            question.questionNumber &&
            typeof question.question === "string" &&
            question.choices &&
            Object.keys(question.choices).length === 4 &&
            ["A", "B", "C", "D"].includes(question.correctAnswer)
          );
        });

        allQuestions = [...allQuestions, ...validatedQuestions];
      } catch (parseError) {
        console.error("Chunk parsing error:", parseError.message);
        throw new Error(`Failed to parse questions in chunk ${i + 1}`);
      }
    }

    // Verify we have the correct number of questions
    if (allQuestions.length !== Number(no_of_question)) {
      throw new Error(`Expected ${no_of_question} questions but got ${allQuestions.length}`);
    }

    // Renumber questions sequentially
    return allQuestions.map((q, idx) => ({
      ...q,
      questionNumber: idx + 1
    }));

  } catch (error) {
    console.error("Question generation error:", error.message);
    throw error;
  }
};

module.exports = { getGenerateQuestion };