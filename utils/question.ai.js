const ai = require("./ai/provider");

const {
    buildQuestionPrompt,
    buildExplanationPrompt,
    buildVerificationPrompt
} = require("./ai/prompts");

/**
 * ===========================================================
 * Exowa AI Engine V2
 * Shared Helpers
 * ===========================================================
 */

const MAX_RETRIES = 3;
const REQUEST_TIMEOUT = 30000;

const sleep = (ms) =>
    new Promise(resolve => setTimeout(resolve, ms));

const timeoutPromise = (ms) =>
    new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), ms)
    );

/**
 * Normalize OpenAI/Gemini response.
 *
 * Supports:
 *
 * [
 *   {...}
 * ]
 *
 * or
 *
 * {
 *    questions:[...]
 * }
 */

const normalizeQuestions = (response) => {

    if (Array.isArray(response)) {
        return response;
    }

    if (
        response &&
        typeof response === "object" &&
        Array.isArray(response.questions)
    ) {
        return response.questions;
    }

    throw new Error("Invalid AI response format.");
};

/**
 * Validate generated question.
 */

const isValidQuestion = (question) => {

    if (!question) return false;

    return (

        typeof question.questionNumber === "number"

        && typeof question.question === "string"

        && question.question.trim().length > 0

        && typeof question.choices === "object"

        && ["A", "B", "C", "D", "E"].every(option =>

            typeof question.choices[option] === "string"

            && question.choices[option].trim().length > 0

        )

        && ["A", "B", "C", "D"].includes(question.correctAnswer)

    );

};

/**
 * ===========================================================
 * Generate Question Paper
 * ===========================================================
 */

const getGenerateQuestion = async ({

    className,

    subject,

    syllabus,

    chapter_from,

    language,

    no_of_question

}) => {

    if (
        !className ||
        !subject ||
        !syllabus ||
        !chapter_from ||
        !language
    ) {

        throw new Error("Missing required parameters.");

    }

    const numberOfQuestions =
        Number(no_of_question)
        || Number(process.env.NO_OF_QUESTIONS)
        || 10;

    const prompt = buildQuestionPrompt({

        className,

        subject,

        syllabus,

        chapter_from,

        language,

        numberOfQuestions

    });

    let retry = 0;

    let lastError = null;

    while (retry < MAX_RETRIES) {

        try {

            console.log(
                `Generate Paper Attempt ${retry + 1}/${MAX_RETRIES}`
            );

            const aiResponse = await Promise.race([

                ai.generateJson(prompt),

                timeoutPromise(REQUEST_TIMEOUT)

            ]);

            const parsedQuestions =
                normalizeQuestions(aiResponse);

            const validatedQuestions =
                parsedQuestions.filter(isValidQuestion);

            if (validatedQuestions.length === 0) {

                throw new Error(
                    "AI returned no valid questions."
                );

            }

            /**
             * Fill missing learningObjective
             */

            validatedQuestions.forEach((question) => {

                if (!question.learningObjective) {

                    question.learningObjective = "";

                }

            });

            console.log(
                `${validatedQuestions.length} questions generated successfully.`
            );

            return validatedQuestions;

        }

        catch (error) {

            retry++;

            lastError = error;

            console.error(
                `Generate Paper Error (${retry}/${MAX_RETRIES})`,
                error.message
            );

            if (retry >= MAX_RETRIES) {

                throw new Error(
                    `Failed after ${MAX_RETRIES} attempts.\n${lastError.message}`
                );

            }

            await sleep(
                Math.pow(2, retry) * 1000
            );

        }

    };

};

/**
 * ===========================================================
 * Explanation Engine
 * ===========================================================
 *
 * >>> Continue from here in Part-2 <<<
 */

const generateQuestionExplanation = async ({

    className,

    subject,

    syllabus,

    chapter_from,

    language,

    question,

    choices,

    correctAnswer

}) => {

    const prompt = buildExplanationPrompt({

        className,

        subject,

        syllabus,

        chapter_from,

        language,

        question,

        choices,

        correctAnswer

    });

    let retry = 0;

    let lastError = null;

    while (retry < MAX_RETRIES) {

        try {

            console.log(
                `Generate Explanation Attempt ${retry + 1}/${MAX_RETRIES}`
            );

            const response = await Promise.race([

                ai.generateJson(prompt),

                timeoutPromise(45000)

            ]);

            if (

                !response ||

                typeof response !== "object"

            ) {

                throw new Error(
                    "Invalid explanation response."
                );

            }

            if (!response.explanation) {

                throw new Error(
                    "Explanation missing."
                );

            }

            response.importantPoints =
                Array.isArray(response.importantPoints)
                    ? response.importantPoints
                    : [];

            response.commonMistakes =
                Array.isArray(response.commonMistakes)
                    ? response.commonMistakes
                    : [];

            return response;

        }

        catch (error) {

            retry++;

            lastError = error;

            console.error(

                `Generate Explanation Error (${retry}/${MAX_RETRIES})`,

                error.message

            );

            if (retry >= MAX_RETRIES) {

                throw new Error(

                    `Failed after ${MAX_RETRIES} attempts.\n${lastError.message}`

                );

            }

            await sleep(

                Math.pow(2, retry) * 1000

            );

        }

    }

};



/**
 * ===========================================================
 * Practice More
 *
 * NO Explanation Required
 * ===========================================================
 */

const generateVerificationQuestions = async ({

    className,

    subject,

    syllabus,

    chapter_from,

    language,

    question,

    choices,

    correctAnswer,

    learningObjective = ""

}) => {

    const prompt = buildVerificationPrompt({

        className,

        subject,

        syllabus,

        chapter_from,

        language,

        question,

        choices,

        correctAnswer,

        learningObjective

    });

    let retry = 0;

    let lastError = null;

    while (retry < MAX_RETRIES) {

        try {

            console.log(

                `Generate Practice Questions Attempt ${retry + 1}/${MAX_RETRIES}`

            );

            const aiResponse = await Promise.race([

                ai.generateJson(prompt),

                timeoutPromise(REQUEST_TIMEOUT)

            ]);

            const questions =
                normalizeQuestions(aiResponse);

            const validatedQuestions =
                questions.filter(isValidQuestion);

            if (!validatedQuestions.length) {

                throw new Error(
                    "No valid practice questions generated."
                );

            }

            return validatedQuestions;

        }

        catch (error) {

            retry++;

            lastError = error;

            console.error(

                `Practice Question Error (${retry}/${MAX_RETRIES})`,

                error.message

            );

            if (retry >= MAX_RETRIES) {

                throw new Error(

                    `Failed after ${MAX_RETRIES} attempts.\n${lastError.message}`

                );

            }

            await sleep(

                Math.pow(2, retry) * 1000

            );

        }

    }

};



module.exports = {

    getGenerateQuestion,

    generateQuestionExplanation,

    generateVerificationQuestions

};