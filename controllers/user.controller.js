const mongoose = require("mongoose");
const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const bcrypt = require("bcryptjs");
const Children = require("../models/child.model");

const {
  successResponse,
  errorResponse,
  customErrorResponse,
} = require("../utils/response.dto.js");

exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({ name, email, password: hashedPassword });

    if (email === "admin@exam.com") {
      user.role = "admin";
    }
    await user.save();
    return successResponse(res, 201, "User registered successfully!", user);
  } catch (error) {
    return errorResponse(res, error);
  }
};

exports.updateUserLimits = async (req, res) => {
  const { id } = req.params;
  const { childLimit, topicLimit } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return customErrorResponse(res, 400, "Invalid user id");
  }

  const updates = {};

  if (childLimit !== undefined) {
    const parsedChildLimit = Number(childLimit);
    if (!Number.isInteger(parsedChildLimit) || parsedChildLimit < 0) {
      return customErrorResponse(
        res,
        400,
        "childLimit must be a non-negative integer"
      );
    }
    updates.childLimit = parsedChildLimit;
  }

  if (topicLimit !== undefined) {
    const parsedTopicLimit = Number(topicLimit);
    if (!Number.isInteger(parsedTopicLimit) || parsedTopicLimit < 0) {
      return customErrorResponse(
        res,
        400,
        "topicLimit must be a non-negative integer"
      );
    }
    updates.topicLimit = parsedTopicLimit;
  }

  if (Object.keys(updates).length === 0) {
    return customErrorResponse(
      res,
      400,
      "Provide at least one limit to update"
    );
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      return customErrorResponse(res, 404, "User not found");
    }

    return successResponse(
      res,
      200,
      "User limits updated successfully",
      updatedUser
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};

exports.updateTopicLimits = async (req, res) => {
  const { id } = req.params;
  const { topicLimit } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return customErrorResponse(res, 400, "Invalid user id");
  }

  const updates = {};

  if (topicLimit !== undefined) {
    const parsedTopicLimit = Number(topicLimit);
    if (!Number.isInteger(parsedTopicLimit) || parsedTopicLimit < 0) {
      return customErrorResponse(
        res,
        400,
        "topicLimit must be a non-negative integer"
      );
    }
    updates.topicLimit = parsedTopicLimit;
  }

  if (Object.keys(updates).length === 0) {
    return customErrorResponse(
      res,
      400,
      "Provide at least one limit to update"
    );
  }

  const child = await Children.findById(id);
  if (!child) {
    return customErrorResponse(res, 404, "Child not found");
  }

  try {
    const updatedChild = await Children.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedChild) {
      return customErrorResponse(res, 404, "Child not found");
    }

    return successResponse(
      res,
      200,
      "Topic limit updated successfully",
      updatedChild
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};

exports.login = async (req, res) => {
  const { email, password, LDAP } = req.body;

  console.log(email, password, "ldap", LDAP?.data);

  try {
    // return
    // if(email === "parent1@exam.com"){
    if (email === "admin@exam.com" || email === "teacher@exam.com") {
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: "User not found" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(400).json({ message: "Invalid credentials" });
      const payload = {
        id: user._id,
        role: user.role,
        email: user.email,
        childLimit: user.childLimit,
        topicLimit: user.topicLimit,
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
      res.status(200).json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          childLimit: user.childLimit,
          topicLimit: user.topicLimit,
        },
      });
    } else {
      if (!LDAP?.data?.data) {
        return res.status(400).json({ message: "User not found" });
      }

      const userRecord = LDAP?.data?.data[0];
      const user_email = userRecord?.user_email;
      const name = userRecord?.userid;
      const user_role = userRecord?.user_role;
      const existingUser = await User.findOne({ email: user_email });

       if (existingUser) {

        const payload = {
          id: existingUser._id,
          email: existingUser.email,
          role: existingUser.role,
          childLimit: existingUser.childLimit,
          topicLimit: existingUser.topicLimit,
          childnumber: existingUser.childLimit,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
          expiresIn: "1h",
        });

        res.status(200).json({
          token,
          user: {
            id: existingUser._id,
            name: existingUser.name,
            email: existingUser.email,
            role: existingUser.role, // Adjust if you have roles
            childLimit: existingUser.childLimit,
            topicLimit: existingUser.topicLimit,
          },
        });
       } else {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({
          name,
          email: user_email,
          password: hashedPassword,
          role: user_role,
        });

         await user.save();

        const payload = {
          id: user._id,
          email: user.email,
          role: user.role,
          childLimit: user.childLimit,
          topicLimit: user.topicLimit,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
          expiresIn: "1h",
        });

        res.status(200).json({
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role, // Adjust if you have roles
            childLimit: user.childLimit,
            topicLimit: user.topicLimit,
          },
        });
      }    
    }
  } catch (error) {
    // Handle invalid credentials
    if (error.response && error.response.status === 400) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Handle other server errors
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
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

    const total = await User.countDocuments(filter);

    const user = await User.find(filter)
      // .populate("parent", "name email")
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

    if (user.length === 0) {
      return successResponse(res, 200, "No user accounts found", []);
    }

    return successResponse(
      res,
      200,
      "User fetched successfully",
      user,
      pagination
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};

exports.showUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findOne({
      _id: id,
    });
    if (!user) {
      return successResponse(res, 404, "User not found");
    }
    return successResponse(res, 200, "User fetched successfully", user);
  } catch (error) {
    return errorResponse(res, error);
  }
};

// exports.showChild = async (req, res) => {
//   const { id } = req.params;

//   try {
//     const parentId = Number(req.user.id); // Set from auth middleware
//     const child = await Children.findOne({
//       _id: id,
//       //  parent: parentId,
//     });
//     if (!child) {
//       return successResponse(res, 404, "Child not found");
//     }

//     return successResponse(res, 200, "Child fetched successfully", child);
//   } catch (error) {
//     return errorResponse(res, error);
//   }
// };
