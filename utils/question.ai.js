const ai = require("./ai/provider");

const {
    buildQuestionPrompt,
    buildExplanationPrompt,
    buildVerificationPrompt
} = require("./ai/prompts");

const getGenerateQuestion = async ({
  className,
  subject,
  syllabus,
  chapter_from,
  //chapter_to,
  language,
  no_of_question,
}) => {
  // Input validation
 
  if (!className || !subject || !syllabus || !chapter_from || !language) {
  throw new Error("Missing required parameters");
}

  const MAX_RETRIES = 3;
  let retryCount = 0;
  let lastError = null;

  
  const numberOfQuestions = Number(no_of_question) || Number(process.env.NO_OF_QUESTIONS) || 10;
  
  const prompt = buildQuestionPrompt({
    className,
    subject,
    syllabus,
    chapter_from,
    language,
    numberOfQuestions
});
  while (retryCount < MAX_RETRIES) {
    try {
      console.log(`Attempt ${retryCount + 1}/${MAX_RETRIES} to generate questions...`);
      
      // Add timeout to prevent hanging
      const timeoutPromise = (ms) => new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Request timeout")), ms)
      );

     const parsedQuestions = await Promise.race([
    ai.generateJson(prompt),
    timeoutPromise(30000)
]);
      
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

  

  // If questionNumber is provided, focus on that specific question
  const specificQuestion = questionData.questionNumber && questionData.questions 
    ? questionData.questions.find(q => q.questionNumber === questionData.questionNumber)
    : null;

  const prompt = buildExplanationPrompt({
    questionData,
    specificQuestion
});
    // add this on both condition 
    //   4. Learning resources including:
    //  - Educational videos (YouTube links or video titles)
    //  - Articles (online resources, study materials)
    //  - Books (textbook recommendations, reference books)

  while (retryCount < MAX_RETRIES) {
    try {
      console.log(`Attempt ${retryCount + 1}/${MAX_RETRIES} to generate explanation...`);
      
      // Add timeout to prevent hanging
      const timeoutPromise = (ms) => new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Request timeout")), ms)
      );

      const parsedResponse = await Promise.race([
    ai.generateJson(prompt),
    timeoutPromise(45000)
]);
      
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
const generateVerificationQuestions = async ({
    explanation,
    language
}) => {

    const MAX_RETRIES = 3;
    let retryCount = 0;
    let lastError = null;

   

    const prompt = buildVerificationPrompt({
    explanation,
    language
});

    while(retryCount < MAX_RETRIES){

        try{

            const timeoutPromise=(ms)=>new Promise((_,reject)=>
                setTimeout(()=>reject(new Error("Timeout")),ms)
            );

            return await Promise.race([
    ai.generateJson(prompt),
    timeoutPromise(30000)
]);

        }
        catch(error){

            retryCount++;
            lastError=error;

            if(retryCount>=MAX_RETRIES){
                throw lastError;
            }

            await new Promise(r=>setTimeout(r,2000*retryCount));

        }

    }

}
module.exports = {
    getGenerateQuestion,
    generateQuestionExplanation,
    generateVerificationQuestions,
};
