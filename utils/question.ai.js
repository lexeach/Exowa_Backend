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

     const aiResponse = await Promise.race([
    ai.generateJson(prompt),
    timeoutPromise(30000)
]);

console.log("========== QUESTION AI RESPONSE ==========");
console.dir(aiResponse, { depth: null });
console.log("=========================================");

// Normalize response
let parsedQuestions = aiResponse;

if (
    !Array.isArray(parsedQuestions) &&
    Array.isArray(parsedQuestions.questions)
) {
    parsedQuestions = parsedQuestions.questions;
}

if (!Array.isArray(parsedQuestions)) {
    throw new Error(
        "Invalid question response received from AI."
    );
}

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

const validatedQuestions =
    parsedQuestions.filter(isValidQuestion);
      
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
        
console.error("\n====================================");
console.error("LEARNING RESOURCE ERROR");
console.error("Attempt :", retryCount);
console.error("Message :", error.message);
console.error("Stack :");
console.error(error.stack);
console.error("====================================\n");
      
      if (retryCount >= MAX_RETRIES) {
        throw new Error(`Failed after ${MAX_RETRIES} attempts: ${lastError.message}`);
      }

      const delay = Math.pow(2, retryCount) * 1000;
      console.log(`Waiting ${delay/1000}s before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

const generateLearningResources = async (questionData) => {

    const MAX_RETRIES = 3;

    let retryCount = 0;

    let lastError = null;

    //--------------------------------------------------
    // Find Specific Question
    //--------------------------------------------------

    const specificQuestion =
        questionData.questionNumber && questionData.questions

            ? questionData.questions.find(
                  q =>
                      Number(q.questionNumber) ===
                      Number(questionData.questionNumber)
              )

            : null;

    if (
        questionData.questionNumber &&
        !specificQuestion
    ) {

        throw new Error(
            "Question not found."
        );

    }

    //--------------------------------------------------
    // Build Prompt
    //--------------------------------------------------

    console.log("\n========================================");
console.log("LEARNING RESOURCE REQUEST");
console.log("========================================");
console.log("Mode :", specificQuestion ? "Single" : "Bulk");
console.log("Class :", questionData.className);
console.log("Subject :", questionData.subject);
console.log("Board :", questionData.syllabus);
console.log("Chapter :", questionData.chapter_from);
console.log("Language :", questionData.language);

if (specificQuestion) {

    console.log(
        "Question Number :",
        questionData.questionNumber
    );

} else {

    console.log(
        "Questions Count :",
        questionData.questions?.length || 0
    );

    console.log(
        "Question Numbers :",
        questionData.questions?.map(q => q.questionNumber)
    );

}

const prompt = buildExplanationPrompt({

    questionData,

    specificQuestion

});

console.log("\n========== LEARNING PROMPT ==========");
console.log(prompt);
console.log("=====================================\n");
    //--------------------------------------------------
    // Retry
    //--------------------------------------------------

    while (retryCount < MAX_RETRIES) {

        try {

            console.log(

                `Attempt ${retryCount + 1}/${MAX_RETRIES} to generate learning resources...`

            );

            const timeoutPromise = ms =>

                new Promise((_, reject) =>

                    setTimeout(

                        () => reject(new Error("Request timeout")),

                        ms

                    )

                );

            const parsedResponse =
    await Promise.race([
        ai.generateJson(prompt),
        timeoutPromise(30000)
    ]);

console.log("\n========== LEARNING AI RESPONSE ==========");
console.dir(parsedResponse, { depth: null });
            console.log(
    "AI Response Keys :",
    Object.keys(parsedResponse)
);

if (Array.isArray(parsedResponse.questions)) {

    console.log(
        "Questions Returned :",
        parsedResponse.questions.length
    );

}
console.log("==========================================\n");
            //--------------------------------------------------
            // Validation
            //--------------------------------------------------

            if (specificQuestion) {


    if (

    !parsedResponse.topic ||
    !parsedResponse.learningObjective ||
    !Array.isArray(parsedResponse.keywords) ||
    typeof parsedResponse.explanation !== "string"

) {

    throw new Error(
        "Invalid learning resource response."
    );

}
                return parsedResponse;

            }

            //--------------------------------------------------
            // Whole Paper
            //--------------------------------------------------

           console.log(
    "Learning Response Type :",
    typeof parsedResponse
);

console.log(
    "Questions Array Exists :",
    Array.isArray(parsedResponse.questions)
);

if (

    !Array.isArray(parsedResponse.questions)

)
{

                throw new Error(

                    "Invalid learning resource response."

                );

            }

       console.log(
    "\nLearning Response Validation Started..."
);

parsedResponse.questions.forEach(q => {

    console.log({
    questionNumber: q.questionNumber,
    topic: q.topic,
    learningObjective: q.learningObjective,
    keywords: q.keywords,
    explanation:
        q.explanation?.substring(0,100)
});

});

if (

    parsedResponse.questions.some(
        question =>
            !question.questionNumber ||
            !question.topic ||
            !question.learningObjective ||
            !Array.isArray(question.keywords) ||
            typeof question.explanation !== "string"

    )

) 
{

    throw new Error(
        "Invalid learning resource response."
    );

}

return parsedResponse;

        }

        catch (error) {

            retryCount++;

            lastError = error;
            
console.error("\n====================================");
console.error("LEARNING RESOURCE ERROR");
console.error("Attempt :", retryCount);
console.error("Message :", error.message);
console.error("Stack :");
console.error(error.stack);
console.error("====================================\n");

            if (retryCount >= MAX_RETRIES) {

                throw new Error(

                    `Failed after ${MAX_RETRIES} attempts: ${lastError.message}`

                );

            }

            const delay =
                Math.pow(2, retryCount) * 1000;

            console.log(

                `Waiting ${delay / 1000}s before retry...`

            );

            await new Promise(resolve =>

                setTimeout(resolve, delay)

            );

        }

    }

};
const generateVerificationQuestions = async ({
    originalQuestion,
    topic,
    learningObjective,
    keywords = [],
    language
}) => {
    const MAX_RETRIES = 3;
    let retryCount = 0;
    let lastError = null;

   

   console.log("\n==================================");
console.log("VERIFICATION STARTED");
console.log("==================================");
console.log("Language :", language);

console.log("Topic :", topic);

console.log(
    "Learning Objective :",
    learningObjective
);

console.log(
    "Keywords :",
    keywords
);

console.log(
    "Question :",
    originalQuestion?.question
);
    const prompt = buildVerificationPrompt({

    originalQuestion,

    topic,

    learningObjective,

    keywords,

    language

});
console.log("\n========== VERIFICATION PROMPT ==========");
console.log(prompt);
console.log("=========================================\n");
    while(retryCount < MAX_RETRIES){

        try{

            const timeoutPromise=(ms)=>new Promise((_,reject)=>
                setTimeout(()=>reject(new Error("Timeout")),ms)
            );

           const verificationResponse =
    await Promise.race([
        ai.generateJson(prompt),
        timeoutPromise(30000)
    ]);

console.log(
    "\n========== VERIFICATION RESPONSE =========="
);

console.dir(
    verificationResponse,
    { depth: null }
);
            console.log(
    "Questions Returned :",
    Array.isArray(verificationResponse)
        ? verificationResponse.length
        : 0
);

console.log(
    "===========================================\n"
);

console.log("\n========== RAW VERIFICATION RESPONSE ==========");
console.dir(verificationResponse, { depth: null });
console.log("===============================================");

if (Array.isArray(verificationResponse)) {
    return verificationResponse;
}

if (
    verificationResponse &&
    Array.isArray(verificationResponse.questions)
) {
    return verificationResponse.questions;
}

if (
    verificationResponse &&
    Array.isArray(verificationResponse.data)
) {
    return verificationResponse.data;
}

throw new Error(
    `Invalid verification response: ${JSON.stringify(verificationResponse)}`
);
        }
        catch(error){

            retryCount++;
            lastError=error;
            console.error("\n================================");
console.error("VERIFICATION ERROR");
console.error("Attempt :", retryCount);
console.error("Message :", error.message);
console.error(error.stack);
console.error("================================\n");

            if(retryCount>=MAX_RETRIES){
                throw lastError;
            }

            await new Promise(r=>setTimeout(r,2000*retryCount));

        }

    }

}
module.exports = {
    getGenerateQuestion,

    // Single & Bulk Learning Resources
    generateQuestionExplanation: generateLearningResources,
    generateBulkLearningResources: generateLearningResources,

    generateVerificationQuestions,
};
