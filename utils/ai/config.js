module.exports = {

    PROVIDER: process.env.AI_PROVIDER || "gemini",

    GEMINI_MODEL:
        process.env.GEMINI_MODEL ||
        "gemini-2.5-flash",

    OPENAI_MODEL:
        process.env.OPENAI_MODEL ||
        "gpt-4.1-mini",

    MAX_RETRIES:
        Number(process.env.AI_MAX_RETRIES) || 3,

    REQUEST_TIMEOUT:
        Number(process.env.AI_TIMEOUT) || 45000,

    AI_REQUEST_DELAY_MS:
        Number(process.env.AI_REQUEST_DELAY_MS) || 2000

};