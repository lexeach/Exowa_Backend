const OpenAI = require("openai");

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const MODEL = "gpt-4.1-mini";

async function generateJson(prompt) {

    const response = await client.chat.completions.create({

        model: MODEL,

        response_format: {
            type: "json_object"
        },

        messages: [

            {
                role: "system",
                content:
                    "You are an expert educational AI. Always return ONLY valid JSON."
            },

            {
                role: "user",
                content: prompt
            }

        ]

    });

    const content = response.choices?.[0]?.message?.content;

    if (!content) {
        throw new Error("Empty response received from OpenAI.");
    }

    try {

        return JSON.parse(content);

    } catch (err) {

        throw new Error(
            "Invalid JSON returned from OpenAI.\n\n" + content
        );

    }

}

module.exports = {
    generateJson
};