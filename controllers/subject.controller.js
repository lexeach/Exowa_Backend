// controllers/subject.controller.js
const User = require("../models/user.model");
const Subject = require("../models/subject.model");
const { validateRequiredFields } = require("../utils/validateRequiredFields");
const {
  successResponse,
  errorResponse,
  customErrorResponse,
} = require("../utils/response.dto");

exports.createSubject = async (req, res) => {
  const requiredFields = ["name"];
  const validationError = validateRequiredFields(requiredFields, req.body, res);
  if (validationError) return;

  const { name } = req.body;

  try {
    const author = req.user.id;
    const user = await User.findById(author);
    
    if (!user) {
      return res.status(403).json({
        success: false,
        message: "User not found",
      });
    }

    const subject = new Subject({
      name,
      author
    });

    await subject.save();

    return successResponse(
      res,
      201,
      "Subject created successfully",
      subject
    );
  } catch (error) {
    if (error.code === 11000) {
      return customErrorResponse(
        res,
        409,
        "Subject with the same name already exists for this owner",
        { details: error.message }
      );
    }
    return errorResponse(res, error);
  }
};

exports.getSubjects = async (req, res) => {
  try {
    const author = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortField = req.query.sort || "createdAt";
    const sortOrder = req.query.order === "desc" ? -1 : 1;
    const searchKey = (req.query.search || "").trim();

    const filter = { isDeleted: false };
    if (searchKey) {
      filter.name = { $regex: searchKey, $options: "i" };
    }

    const total = await Subject.countDocuments(filter);

    const subjects = await Subject.find(filter)
      .sort({ [sortField]: sortOrder })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const pagination = {
      current_page: page,
      per_page: limit,
      total,
      last_page: Math.ceil(total / limit),
      from: (page - 1) * limit + 1,
      to: Math.min(page * limit, total),
    };

    if (subjects.length === 0) {
      return successResponse(res, 200, "No subjects found", []);
    }

    return successResponse(
      res,
      200,
      "Subjects fetched successfully",
      subjects,
      pagination
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};

exports.showSubject = async (req, res) => {
  const { id } = req.params;

  try {
    const author = req.user.id;
    const subject = await Subject.findOne({
      _id: id,
      author,
      isDeleted: false
    });

    if (!subject) {
      return successResponse(res, 404, "Subject not found");
    }

    return successResponse(res, 200, "Subject fetched successfully", subject);
  } catch (error) {
    return errorResponse(res, error);
  }
};

exports.updateSubject = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    const author = req.user.id;

    const subject = await Subject.findOneAndUpdate(
      { _id: id, author, isDeleted: false },
      { name },
      { new: true }
    );

    if (!subject) {
      return successResponse(res, 404, "Subject not found");
    }

    return successResponse(res, 200, "Subject updated successfully", subject);
  } catch (error) {
    if (error.code === 11000) {
      return customErrorResponse(
        res,
        409,
        "Subject with the same name already exists for this owner",
        { details: error.message }
      );
    }
    return errorResponse(res, error);
  }
};

exports.deleteSubject = async (req, res) => {
  const { id } = req.params;

  try {
    const author = req.user.id;

    const subject = await Subject.findOneAndUpdate(
      { _id: id, author, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!subject) {
      return successResponse(res, 404, "Subject not found");
    }

    return successResponse(res, 200, "Subject deleted successfully");
  } catch (error) {
    return errorResponse(res, error);
  }
};