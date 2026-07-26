const AI_PROVIDER = require("./provider.config");

// const gemini = require("./gemini");
const gemini = require("./gemini");

// const openai = require("./openai");
const openai = require("./openai");

module.exports =
    AI_PROVIDER === "openai"
        ? openai
        : gemini;