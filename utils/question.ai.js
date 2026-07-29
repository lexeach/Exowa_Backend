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
console.log("==========================================\n");
            //--------------------------------------------------
            // Validation
            //--------------------------------------------------

            if (specificQuestion) {

if (

    !parsedResponse.topic ||

    !parsedResponse.learningObjective ||

    !Array.isArray(parsedResponse.keywords) ||

    !Array.isArray(parsedResponse.youtubeSearch) ||

    !Array.isArray(parsedResponse.pdfSearch)

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

            if (
               console.log(
    "Learning Response Type :",
    typeof parsedResponse
);

console.log(
    "Questions Array Exists :",
    Array.isArray(parsedResponse.questions)
);
                !Array.isArray(parsedResponse.questions)

            ) {

                throw new Error(

                    "Invalid learning resource response."

                );

            }

       if (
           console.log(
    "\nLearning Response Validation Started..."
);

parsedResponse.questions.forEach(q => {

    console.log({

        questionNumber:
            q.questionNumber,

        topic:
            q.topic,

        learningObjective:
            q.learningObjective,

        keywords:
            q.keywords,

        youtubeSearch:
            q.youtubeSearch,

        pdfSearch:
            q.pdfSearch

    });

});
    parsedResponse.questions.some(
        question =>
            !question.questionNumber ||
            !question.topic ||
            !question.learningObjective ||
            !Array.isArray(question.keywords) ||
            !Array.isArray(question.youtubeSearch) ||
            !Array.isArray(question.pdfSearch)
    )
) {

    throw new Error(
        "Invalid learning resource response."
    );

}

return parsedResponse;

        }

        catch (error) {

            retryCount++;

            lastError = error;

            console.error(

                `Error on attempt ${retryCount}: ${error.message}`

            );

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
    explanation,
    language
}) => {

    const MAX_RETRIES = 3;
    let retryCount = 0;
    let lastError = null;

   

   console.log("\n==================================");
console.log("VERIFICATION STARTED");
console.log("==================================");
console.log("Language :", language);

console.log(
    "Explanation Length :",
    explanation?.length || 0
);

const prompt = buildVerificationPrompt({
    explanation,
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
    "===========================================\n"
);

return verificationResponse;

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

    // Single & Bulk Learning Resources
    generateQuestionExplanation: generateLearningResources,
    generateBulkLearningResources: generateLearningResources,

    generateVerificationQuestions,
};
