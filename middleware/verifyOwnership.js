
const Paper = require("../models/paper.model");
const { errorResponse } = require("../utils/response.dto");
const verifyOwnership = async (req, res, next) => {
  const paper = await Paper.findById(req.params.id);
  if (!paper || paper.author.toString() !== req.user.id) {
    return errorResponse(res, 403, "Unauthorized access");
  }
  next();
};

module.exports = { verifyOwnership };
