const User = require("../models/user.model");
const Children = require("../models/child.model");
const { validateRequiredFields } = require("../utils/validateRequiredFields");
const {
  successResponse,
  errorResponse,
  customErrorResponse,
} = require("../utils/response.dto");

exports.createChild = async (req, res) => {
  const requiredFields = ["name", "age", "grade"]; // Define required fields
  // Validate required fields
  const validationError = validateRequiredFields(requiredFields, req.body, res);
  if (validationError) return; // Stop execution if validation fails

  const { name, age, grade } = req.body;

  try {
    // Ensure the parent is authenticated
    const parentId = req.user.id; // Set from auth middleware
    const parent = req.user.role;

    if (!parent || parent !== "parent") {
      return res.status(403).json({
        success: false,
        message: "Only parents can create child accounts.",
      });
    }
	const page = 1;
    const limit = 10;
    const sortField = "createdAt"; // Default sorting field
    const sortOrder =  1;
	const filter = { parent: parentId };
	const childs = await Children.find(filter).populate("parent", "name email");
	console.log(req.user.childnumber, "childs length");
	if (childs.length>= req.user.childnumber) {
      return res.status(403).json({
        success: false,
        message: "Your create child limit is over.",
      });
    }
    // Create the child user
    const child = new Children({
      name,
      age,
      grade,
      parent: parentId, // Link the child to the parent
    });

    await child.save();

    return successResponse(
      res,
      201,
      "Child account created successfully",
      child
    );
  } catch (error) {
    if (error.code === 11000) {
      return customErrorResponse(
        res,
        409,
        "Child with the same name already exists for this parent",
        { details: error.message }
      );
    }
    return errorResponse(res, error);
  }
};

exports.getChildren = async (req, res) => {
  try {
    const parentId = Number(req.user.id); // Set from auth middleware
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortField = req.query.sort || "createdAt"; // Default sorting field
    const sortOrder = req.query.order === "desc" ? -1 : 1;
    const searchKey = (req.query.search || "").trim(); // Trim spaces url
    // await Children.updateMany({}, { $set: { isDeleted: false } });

    const filter = { isDeleted: false };
    if (searchKey) {
      filter.name = { $regex: searchKey, $options: "i" };
    }
    const user = req.user.role;
    if (!user) {
      return successResponse(res, 404, "User not found");
    }
    // Add role-based filtering
    if (user === "parent") {
      filter.parent = parentId
    }

    const total = await Children.countDocuments(filter);

    const children = await Children.find(filter)
      .populate("parent", "name email")
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

    if (children.length === 0) {
      return successResponse(res, 200, "No children accounts found", []);
    }

    return successResponse(
      res,
      200,
      "Children fetched successfully",
      children,
      pagination
    );
    // return successResponse(res, 200, "Children fetched successfully", children);
  } catch (error) {
    return errorResponse(res, error);
  }
};

exports.showChild = async (req, res) => {
  const { id } = req.params;

  try {
    const parentId = Number(req.user.id); // Set from auth middleware
    const child = await Children.findOne({
      _id: id,
      parent: parentId,
    });
console.log(child);
    if (!child) {
      return successResponse(res, 404, "Child not found");
    }

    return successResponse(res, 200, "Child fetched successfully", child);
  } catch (error) {
    return errorResponse(res, error);
  }
};

exports.updateChild = async (req, res) => {
  const { id } = req.params;
  const { name, age, grade } = req.body;

  try {
    const parentId = Number(req.user.id); // Set from auth middleware

    const child = await Children.findOneAndUpdate(
      { _id: id, parent: parentId },
      { name, age, grade },
      { new: true }
    );

    if (!child) {
      return successResponse(res, 404, "Child not found");
    }

    return successResponse(res, 200, "Child updated successfully", child);
  } catch (error) {
    return errorResponse(res, error);
  } 
};

exports.deleteChild = async (req, res) => {
  const { id } = req.params;

  try {
    const parentId = req.user.id; // Set from auth middleware

    const child = await Children.findOneAndDelete({
      _id: id,
      parent: parentId,
    });

    if (!child) {
      return successResponse(res, 404, "Child not found");
    }

    return successResponse(res, 200, "Child deleted successfully!");
  } catch (error) {
    return errorResponse(res, error);
  }
};
