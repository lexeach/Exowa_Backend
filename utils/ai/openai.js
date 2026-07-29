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

const MODEL =
    process.env.OPENAI_MODEL || "gpt-4o-mini";

async function generateJson(prompt) {

    const client = getClient();

    console.log("\n==================================================");
    console.log("OPENAI REQUEST STARTED");
    console.log("==================================================");
    console.log("Model :", MODEL);
    console.log("Prompt Length :", prompt.length);
    console.log("\n========== PROMPT ==========");
    console.log(prompt);
    console.log("=============================================\n");

    try {

        const response =
            await client.chat.completions.create({

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

        console.log("\n========== OPENAI RESPONSE ==========");

        console.log("Model :", response.model);

        if (response.usage) {

            console.log("Prompt Tokens :", response.usage.prompt_tokens);
            console.log("Completion Tokens :", response.usage.completion_tokens);
            console.log("Total Tokens :", response.usage.total_tokens);

        }

        const content =
            response.choices?.[0]?.message?.content;

        if (!content) {

            throw new Error(
                "Empty response received from OpenAI."
            );

        }

        console.log("\n========== RAW JSON ==========");
        console.log(content);
        console.log("========================================\n");

        const parsed = JSON.parse(content);

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
        console.log("OPENAI REQUEST COMPLETED");
        console.log("==================================================\n");

        return parsed;

    } catch (error) {

        console.error("\n==================================================");
        console.error("OPENAI ERROR");
        console.error("==================================================");
        console.error("Model :", MODEL);
        console.error("Message :", error.message);

        if (error.status) {

            console.error("Status :", error.status);

        }

        if (error.code) {

            console.error("Code :", error.code);

        }

        if (error.response?.data) {

            console.error(
                "Response Data :",
                JSON.stringify(error.response.data, null, 2)
            );

        }

        console.error(error.stack);

        console.error("==================================================\n");

        throw error;

    }

}

module.exports = {
    generateJson
};