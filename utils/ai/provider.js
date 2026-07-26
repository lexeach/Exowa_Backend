const AI_PROVIDER = require("./provider.config");

if (AI_PROVIDER === "openai") {
    module.exports = require("./openai");
} else {
    module.exports = require("./gemini");
}