const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(
    process.env.GOOGLE_GEMINI_API_KEY
);

const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
        responseMimeType: "application/json"
    }
});

async function generate(prompt) {

    const result = await model.generateContent(prompt);

    const response = await result.response;

    const text = response.text();

    return JSON.parse(text);

}

module.exports = {
    generate
};