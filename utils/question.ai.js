const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

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

  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json"
    }
  });

  const numberOfQuestions = Number(no_of_question) || Number(process.env.NO_OF_QUESTIONS) || 10;
  
  const prompt = `
    Generate exactly ${numberOfQuestions} multiple-choice questions for a ${subject} exam
    for class ${className} based on the ${syllabus} syllabus from chapter ${chapter_from} .
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
  const wrongQuestions =
  questionData.wrongQuestions ||
  (
    questionData.questionNumber && questionData.questions
      ? questionData.questions.filter(
          q => q.questionNumber === questionData.questionNumber
        )
      : questionData.questions || []
  );

const specificQuestion =
  wrongQuestions.length === 1
    ? wrongQuestions[0]
    : null;

  const prompt = `
You are an experienced ${questionData.syllabus} teacher.

Subject: ${questionData.subject}
Class: ${questionData.className}
Chapter: ${questionData.chapter_from}
Language: ${questionData.language}

The following questions were answered incorrectly by the student.

Generate one explanation object for EACH question.

The output array length MUST exactly match the input array length.

Do not skip any question.

Use the same questionNumber for every returned object.

${JSON.stringify(wrongQuestions, null, 2)}

For EACH question generate:

1. explanation
2. summary
3. learningObjective
4. keyConcepts (5-10)
5. exactly 10 verification questions
6. learning references

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
`;
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

      const result = await Promise.race([
        model.generateContent(prompt),
        timeoutPromise(45000) // 45s timeout for longer explanation
      ]);

      const response = await result.response;
      
      const text = response.text();

      const parsedResponse = JSON.parse(text);
      const explanations = parsedResponse.questions || [
    {
        questionNumber: wrongQuestions[0]?.questionNumber,
        explanation: parsedResponse.explanation,
        summary: parsedResponse.summary || "",
        learningObjective: parsedResponse.learningObjective || "",
        keyConcepts: parsedResponse.keyConcepts || [],
        verificationQuestions: parsedResponse.verificationQuestions || [],
        references: parsedResponse.references || {
            videos: [],
            articles: [],
            books: [],
        },
    },
];
      for (const item of explanations) {
    if (
        !item.questionNumber ||
        !item.explanation ||
        !item.references
    ) {
        throw new Error("Invalid AI response structure");
    }
}

return explanations;
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

   const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
        responseMimeType: "application/json"
    }
    });

    const prompt = `
You are an expert teacher.

Below is the learning content.

${explanation}

Generate EXACTLY 3 NEW multiple choice questions that test whether the student has understood this topic.

Rules:

- Questions must NOT copy the original question.
- Questions must test the same concept.
- Difficulty should be similar.
- Return ONLY JSON.

Format:

[
{
"questionNumber":1,
"question":"...",
"choices":{
"A":"...",
"B":"...",
"C":"...",
"D":"..."
},
"correctAnswer":"A"
}
]

Language: ${language}
`;

    while(retryCount < MAX_RETRIES){

        try{

            const timeoutPromise=(ms)=>new Promise((_,reject)=>
                setTimeout(()=>reject(new Error("Timeout")),ms)
            );

            const result=await Promise.race([
                model.generateContent(prompt),
                timeoutPromise(30000)
            ]);

            const response=await result.response;

            return JSON.parse(response.text());

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
