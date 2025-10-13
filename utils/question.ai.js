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

const generateQuestionExplanation = async (questionData) => {
  const MAX_RETRIES = 3;
  let retryCount = 0;
  let lastError = null;

  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json"
    }
  });

  // If questionNumber is provided, focus on that specific question
  const specificQuestion = questionData.questionNumber && questionData.questions 
    ? questionData.questions.find(q => q.questionNumber === questionData.questionNumber)
    : null;

  const prompt = specificQuestion 
    ? `
      Generate a comprehensive explanation and learning resources for this specific question:
      
      Subject: ${questionData.subject}
      Syllabus: ${questionData.syllabus}
      Class: ${questionData.className}
      Chapters: ${questionData.chapter_from} to ${questionData.chapter_to}
      Language: ${questionData.language}
      Question Number: ${questionData.questionNumber}
      
      Question: ${specificQuestion.question}
      Choices: ${JSON.stringify(specificQuestion.choices, null, 2)}
      Correct Answer: ${specificQuestion.correctAnswer}
      
      Please provide:
      1. A detailed explanation of the concept tested in this specific question
      2. Step-by-step solution approach
      3. Why the correct answer is right and why others are wrong
      4. Learning resources including:
         - Educational videos (YouTube links or video titles)
         - Articles (online resources, study materials)
         - Books (textbook recommendations, reference books)
      
      Return ONLY a valid JSON object in this exact format:
      {
        "explanation": "Detailed explanation of this specific question and the concept it tests...",
        "references": {
          "videos": [
            "Video title or link 1",
            "Video title or link 2"
          ],
          "articles": [
            "Article title or link 1",
            "Article title or link 2"
          ],
          "books": [
            "Book title and author 1",
            "Book title and author 2"
          ]
        }
      }
      
      Make the explanation educational, comprehensive, and suitable for students of the specified class level.
      Focus specifically on the concept tested in this question.
    `
    : `
      Generate a comprehensive explanation and learning resources for the following question paper:
      
      Subject: ${questionData.subject}
      Syllabus: ${questionData.syllabus}
      Class: ${questionData.className}
      Chapters: ${questionData.chapter_from} to ${questionData.chapter_to}
      Language: ${questionData.language}
      Number of Questions: ${questionData.no_of_question}
      
      Questions: ${JSON.stringify(questionData.questions, null, 2)}
      
      Please provide:
      1. A detailed explanation of the concepts covered in these questions
      2. Step-by-step solutions or approaches for understanding the topics
      3. Learning resources including:
         - Educational videos (YouTube links or video titles)
         - Articles (online resources, study materials)
         - Books (textbook recommendations, reference books)
      
      Return ONLY a valid JSON object in this exact format:
      {
        "explanation": "Detailed explanation of the concepts and topics covered in these questions...",
        "references": {
          "videos": [
            "Video title or link 1",
            "Video title or link 2"
          ],
          "articles": [
            "Article title or link 1",
            "Article title or link 2"
          ],
          "books": [
            "Book title and author 1",
            "Book title and author 2"
          ]
        }
      }
      
      Make the explanation educational, comprehensive, and suitable for students of the specified class level.
      Ensure all references are relevant to the subject and syllabus.
    `;

  while (retryCount < MAX_RETRIES) {
    try {
      console.log(`Attempt ${retryCount + 1}/${MAX_RETRIES} to generate explanation...`);
      
      // Add timeout to prevent hanging
      const timeoutPromise = (ms) => new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Request timeout")), ms)
      );

      const result = await Promise.race([
        model.generateContent(prompt),
        timeoutPromise(45000) // 45s timeout for longer explanation
      ]);

      const response = await result.response;
      
      const text = response.text();

      const parsedResponse = JSON.parse(text);
      
      // Validate the response structure
      if (!parsedResponse.explanation || !parsedResponse.references) {
        throw new Error("Invalid response structure");
      }

      if (!parsedResponse.references.videos || !parsedResponse.references.articles || !parsedResponse.references.books) {
        throw new Error("Missing reference categories");
      }

      return parsedResponse;

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

module.exports = { getGenerateQuestion, generateQuestionExplanation };
