const mongoose = require("mongoose");
const User = require("../models/user.model");
const Children = require("../models/child.model");
const { validateRequiredFields } = require("../utils/validateRequiredFields");
const {
  successResponse,
  errorResponse,
  customErrorResponse,
} = require("../utils/response.dto");

const resolveChildLimit = (tokenUser, dbRecord) => {
  const fallbackLimit = 1;

  if (
    dbRecord &&
    Number.isInteger(dbRecord.childLimit) &&
    dbRecord.childLimit >= 0
  ) {
    return dbRecord.childLimit;
  }

  if (tokenUser) {
    const tokenLimit = Number(
      tokenUser.childLimit ?? tokenUser.child_limit ?? tokenUser.childnumber
    );
    if (Number.isInteger(tokenLimit) && tokenLimit >= 0) {
      return tokenLimit;
    }
  }

  return fallbackLimit;
};

exports.createChild = async (req, res) => {
  const requiredFields = ["name", "age", "grade"]; // Define required fields
  // Validate required fields
  const validationError = validateRequiredFields(requiredFields, req.body, res);
  if (validationError) return; // Stop execution if validation fails

  const { name, age, grade, topics } = req.body;

  try {
    // Ensure the parent is authenticated
    const parentId = req.user.id; // Set from auth middleware
    const userRole = req.user.role;

    if (
      userRole !== "admin" &&
      userRole !== "subadmin" &&
      userRole !== "parent"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only parents and admins | sub admins can create child accounts.",
      });
    }

    let userRecord = null;
    if (mongoose.Types.ObjectId.isValid(parentId)) {
      userRecord = await User.findOne({
        _id: parentId,
        isDeleted: { $ne: true },
      })
        .select("_id childLimit")
        .lean();
    }

    const childLimit = resolveChildLimit(req.user, userRecord);

    const filter = {
      owner: parentId,
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
    };

    console.log('userRecords >> ', userRecord);
    
    if (userRecord?._id) {
      filter.owner = userRecord._id;
    }

    const existingChildrenCount = await Children.countDocuments(filter);

    if (childLimit === 0) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot add new child accounts. Your current child limit is 0.",
      });
    }

    if (
      Number.isInteger(childLimit) &&
      childLimit >= 0 &&
      existingChildrenCount >= childLimit
    ) {
      const limitMessage =
        childLimit === 0
          ? "You cannot add new child accounts. Your current child limit is 0."
          : `You have reached your child limit of ${childLimit}.`;

      return res.status(403).json({
        success: false,
        message: limitMessage,
        details: {
          addedChildren: existingChildrenCount,
          allowedChildren: childLimit,
        },
      });
    }
    
    // Create the child user
    const childData = {
      name,
      age,
      grade,
      parent: parentId, // Link the child to the parent
      topics,
    };

    if (userRecord?._id) {
      childData.owner = userRecord._id;
    }

    const child = new Children(childData);

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
    const parentId = req.user.id; // Set from auth middleware
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
    if (user === "parent" || (user === "subadmin" && user !== "admin")) {
      filter.parent = parentId;
    }

    const total = await Children.countDocuments(filter);

    const children = await Children.find(filter)
      .populate("owner", "name email")
      // .sort({ [sortField]: sortOrder })
      .sort({ createdAt: -1 })
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
      //  parent: parentId,
    });
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
  const { name, age, grade, topics } = req.body;

  try {
    const today = new Date();
    const currentYear = today.getFullYear();
    const startDate = new Date(`${currentYear}-04-01`); // April 1st
    const endDate = new Date(`${currentYear}-05-30T23:59:59`); // May 30th end of day

    // if (today < startDate || today > endDate) {
    //   return successResponse(res, 403, "Updates are only allowed from April 1st to May 30th.");
    // }
    const parentId = (req.user.id); // Set from auth middleware

    const filter =
      req.user.role === "admin" ? { _id: id } : { _id: id, owner: parentId };

    const child = await Children.findOneAndUpdate(
      filter,
      { name, age, grade, topics },
      { new: true }
    );

    if (!child) {
      return successResponse(res, 404, "You haven't added this child");
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
      //parent: parentId,
    });

    if (!child) {
      return successResponse(res, 404, "Child not found");
    }

    return successResponse(res, 200, "Child deleted successfully!");
  } catch (error) {
    return errorResponse(res, error);
  }
};

exports.getClassList = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // If user is admin, return all possible grades
    if (userRole === "admin") {
      const allGrades = [
        { value: 6, label: "6" },
        { value: 7, label: "7" },
        { value: 8, label: "8" },
        { value: 9, label: "9" },
        { value: 10, label: "10" },
        { value: 11, label: "11" },
        { value: 12, label: "12" },
      ];
      return successResponse(res, 200, "All grades retrieved successfully", {
        data: allGrades,
      });
    }

    // For non-admin users, get grades from their children
    if (userRole === "parent" || userRole === "subadmin") {
      const children = await Children.find({
        parent: userId,
        isDeleted: false,
      }).select("grade");

      if (!children || children.length === 0) {
        return successResponse(res, 200, "No children found for this user", {
          data: [],
        });
      }

      // Extract unique grades and sort them numerically
      const data = [...new Set(children.map((child) => child.grade))]
        .filter((grade) => grade)
        .map((grade) => {
          // Extract numeric part from grades like "8th Grade" -> "8"
          const numericGrade = grade.toString().match(/\d+/);
          return numericGrade ? numericGrade[0] : null;
        })
        .filter((grade) => grade && !isNaN(grade))
        .sort((a, b) => parseInt(a) - parseInt(b))
        .map((grade) => ({ value: parseInt(grade), label: grade }));

      return successResponse(
        res,
        200,
        "Grades retrieved successfully from user's children",
        { data }
      );
    }

    // For child users, return their own grade
    if (userRole === "child") {
      const child = await Children.findOne({
        _id: userId,
        isDeleted: false,
      }).select("grade");

      if (!child) {
        return successResponse(res, 404, "Child profile not found", {
          data: [],
        });
      }

      return successResponse(res, 200, "Grade retrieved successfully", {
        data: [
          {
            value: parseInt(child.grade.match(/\d+/)?.[0] || child.grade),
            label: child.grade.match(/\d+/)?.[0] || child.grade,
          },
        ],
      });
    }

    return customErrorResponse(res, 400, "Invalid user role");
  } catch (error) {
    return errorResponse(res, error);
  }
};
