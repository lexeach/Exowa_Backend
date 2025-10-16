// controllers/syllabus.controller.js
const User = require("../models/user.model");
const Syllabus = require("../models/syllabus.model");
const { validateRequiredFields } = require("../utils/validateRequiredFields");
const {
  successResponse,
  errorResponse,
  customErrorResponse,
} = require("../utils/response.dto");

exports.createSyllabus = async (req, res) => {
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

    const syllabus = new Syllabus({
      name,
      author
    });

    await syllabus.save();

    return successResponse(
      res,
      201,
      "Syllabus created successfully",
      syllabus
    );
  } catch (error) {
    if (error.code === 11000) {
      return customErrorResponse(
        res,
        409,
        "Syllabus with the same name already exists",
        { details: error.message }
      );
    }
    return errorResponse(res, error);
  }
};

exports.getSyllabuses = async (req, res) => {
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

    const total = await Syllabus.countDocuments(filter);

    const syllabuses = await Syllabus.find(filter)
      .populate("author", "name email")
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

    if (syllabuses.length === 0) {
      return successResponse(res, 200, "No syllabuses found", []);
    }

    return successResponse(
      res,
      200,
      "Syllabuses fetched successfully",
      syllabuses,
      pagination
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};

// New endpoint to get both syllabuses and subjects
exports.getSyllabusesWithSubjects = async (req, res) => {
  try {
    const author = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortField = req.query.sort || "createdAt";
    const sortOrder = req.query.order === "desc" ? -1 : 1;
    const searchKey = (req.query.search || "").trim();

    // Get syllabuses
    const syllabusFilter = { isDeleted: false };
    if (searchKey) {
      syllabusFilter.name = { $regex: searchKey, $options: "i" };
    }

    const syllabusTotal = await Syllabus.countDocuments(syllabusFilter);
    const syllabuses = await Syllabus.find(syllabusFilter)
      .populate("author", "name email")
      .sort({ [sortField]: sortOrder })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get subjects
    const Subject = require("../models/subject.model");
    const subjectFilter = { isDeleted: false };
    const subjects = await Subject.find(subjectFilter)
      .populate("author", "name email")
      .sort({ [sortField]: sortOrder });

    const pagination = {
      current_page: page,
      per_page: limit,
      total: syllabusTotal,
      last_page: Math.ceil(syllabusTotal / limit),
      from: (page - 1) * limit + 1,
      to: Math.min(page * limit, syllabusTotal),
    };

    const response = {
      syllabuses: syllabuses,
      subjects: subjects
    };

    return successResponse(
      res,
      200,
      "Syllabuses and subjects fetched successfully",
      response,
      pagination
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};

exports.showSyllabus = async (req, res) => {
  const { id } = req.params;

  try {
    const author = req.user.id;
    const syllabus = await Syllabus.findOne({
      _id: id,
      author,
      isDeleted: false
    }).populate("author", "name email");

    if (!syllabus) {
      return successResponse(res, 404, "Syllabus not found");
    }

    return successResponse(res, 200, "Syllabus fetched successfully", syllabus);
  } catch (error) {
    return errorResponse(res, error);
  }
};

exports.updateSyllabus = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    const author = req.user.id;

    const syllabus = await Syllabus.findOneAndUpdate(
      { _id: id, author, isDeleted: false },
      { name },
      { new: true }
    ).populate("author", "name email");

    if (!syllabus) {
      return successResponse(res, 404, "Syllabus not found");
    }

    return successResponse(res, 200, "Syllabus updated successfully", syllabus);
  } catch (error) {
    if (error.code === 11000) {
      return customErrorResponse(
        res,
        409,
        "Syllabus with the same name already exists",
        { details: error.message }
      );
    }
    return errorResponse(res, error);
  }
};

exports.deleteSyllabus = async (req, res) => {
  const { id } = req.params;

  try {
    const author = req.user.id;

    const syllabus = await Syllabus.findOneAndUpdate(
      { _id: id, author, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!syllabus) {
      return successResponse(res, 404, "Syllabus not found");
    }

    return successResponse(res, 200, "Syllabus deleted successfully");
  } catch (error) {
    return errorResponse(res, error);
  }
};