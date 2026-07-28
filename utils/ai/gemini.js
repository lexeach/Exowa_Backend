const { GoogleGenerativeAI } =
    require("@google/generative-ai");

const genAI =
    new GoogleGenerativeAI(
        process.env.GOOGLE_GEMINI_API_KEY
    );

const model =
    genAI.getGenerativeModel({

        model:
            process.env.GEMINI_MODEL ||
            "gemini-2.5-flash",

        generationConfig: {

            responseMimeType:
                "application/json"

        }

    });

async function generateJson(prompt) {

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

    try {

        return JSON.parse(text);

    } catch (error) {

        console.error(
            "Gemini Raw Response:\n",
            text
        );

        throw new Error(
            "Invalid JSON returned by Gemini."
        );

    }

}

module.exports = {
    generateJson
};
