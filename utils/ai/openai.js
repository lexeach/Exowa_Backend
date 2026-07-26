const OpenAI = require("openai");

let client = null;

function getClient() {
    if (!client) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error("OPENAI_API_KEY is missing.");
        }

        client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }

    return client;
}

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

async function generateJson(prompt) {

    const client = getClient();

    const response = await client.chat.completions.create({
        model: MODEL,

        response_format: {
            type: "json_object"
        },

        messages: [
            {
                role: "system",
                content:
                    "Return ONLY valid JSON. Never use markdown. Never explain."
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

    let parsed;

    try {
        parsed = JSON.parse(content);
    } catch (e) {
        throw new Error("Invalid JSON returned by OpenAI:\n\n" + content);
    }

    // Normalize question array
    if (Array.isArray(parsed)) {
        return parsed;
    }

    if (Array.isArray(parsed.questions)) {
        return parsed.questions;
    }

    return parsed;
}

module.exports = {
    generateJson
};