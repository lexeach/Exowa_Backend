const { GoogleGenerativeAI } =
    require("@google/generative-ai");

const MODEL =
    process.env.GEMINI_MODEL ||
    "gemini-2.5-flash";

const genAI =
    new GoogleGenerativeAI(
        process.env.GOOGLE_GEMINI_API_KEY
    );

const model =
    genAI.getGenerativeModel({

        model: MODEL,

        generationConfig: {

            responseMimeType:
                "application/json"

        }

    });

async function generateJson(prompt) {

    console.log("\n==================================================");
    console.log("GEMINI REQUEST STARTED");
    console.log("==================================================");
    console.log("Model :", MODEL);
    console.log("Prompt Length :", prompt.length);
    console.log("\n========== PROMPT ==========");
    console.log(prompt);
    console.log("=============================================\n");

    try {

        const result =
            await model.generateContent(prompt);

        const response =
            await result.response;

        const text =
            response.text();

        if (!text) {

            throw new Error(
                "Empty response received from Gemini."
            );

        }

        console.log("\n========== RAW JSON ==========");
        console.log(text);
        console.log("========================================\n");

        const parsed =
            JSON.parse(text);

        console.log("JSON Parse : SUCCESS");
        console.log("Response Type :", typeof parsed);

        if (
            parsed &&
            typeof parsed === "object"
        ) {

            console.log(
                "Response Keys :",
                Object.keys(parsed)
            );

        }

        console.log("==================================================");
        console.log("GEMINI REQUEST COMPLETED");
        console.log("==================================================\n");

        return parsed;

    } catch (error) {

        console.error("\n==================================================");
        console.error("GEMINI ERROR");
        console.error("==================================================");
        console.error("Model :", MODEL);
        console.error("Message :", error.message);

        console.error(error.stack);

        console.error("==================================================\n");

        throw error;

    }

}

module.exports = {
    generateJson
};