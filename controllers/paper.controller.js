const jwt = require("jsonwebtoken");
const Paper = require("../models/paper.model");
const User = require("../models/user.model");
const Children = require("../models/child.model");
const {
  successResponse,
  errorResponse,
  customErrorResponse,
} = require("../utils/response.dto");
const { getGenerateQuestion } = require("../utils/question.ai");
const { generateOTP } = require("../utils/generate.otp");

exports.createPaper = async (req, res) => {
  const requiredFields = [
    "subject",
    "syllabus",
    "chapter_from",
    "chapter_to",
    "language",
    "no_of_question",
    "class",
  ];
  const missingFields = [];

  // Check for missing fields
  requiredFields.forEach((field) => {
    if (!req.body[field]) {
      missingFields.push(field);
    }
  });

  // If there are missing fields, return an error response
  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: `The following fields are required: ${missingFields.join(", ")}`,
    });
  }
  const {
    //class: className,
    className
    subject,
    syllabus,
    chapter_from,
    chapter_to,
    language,
    no_of_question,
  } = req.body;

  const userId = req.user.id; // Set from auth middleware
  const filePath = req.file ? req.file.path : null; // File path from multer
//	const filePath = "https://myreview.website/Exowa_Frontend_New-main/"; // File path from multer
  try {


    let generatedPapers = await getGenerateQuestion({
      className,
      subject,
      syllabus,
      chapter_from,
      chapter_to,
      language,
      no_of_question,
    });

    const otp = Math.floor(10000 + Math.random() * 90000) //generateOTP(5);
    const payload = {
      className,
      subject,
      syllabus,
      chapter_from,
      chapter_to,
      language,
      author: Number(userId),
      authorId: Number(userId),
      file: filePath,
      questions: generatedPapers,
      otp,
      no_of_question,
    };
    const paper = new Paper(payload);
    await paper.save();
    return successResponse(res, 201, "Paper created successfully ", paper);
  } catch (error) {
	  console.log(error);
    error.message ="Server is Busy Please Try Again Later, Thanks"
    return errorResponse(res, error);
  } 
};

exports.generateQuestionOTP = async (req, res) => {
  try {
    const { questionId } = req.params;
    const userId = req.user.id;

    if (!questionId) {
      return res.status(400).json({
        success: false,
        message: "Question ID is required.",
      });
    }

    const paper = await Paper.findById(questionId);
    if (!paper) {
      return res.status(404).json({
        success: false,
        message: "Question not found.",
      });
    }

    // const newOTP = generateOTP(5);
    const otp = Math.floor(10000 + Math.random() * 90000); //generateOTP(5);
    paper.otp = otp;
    await paper.save();

    return successResponse(res, 200, "OTP generated successfully", {
      questionId: paper._id,
      otp,
    });
  } catch (error) {
    return errorResponse(res, error);
  }
};

exports.getPapers = async (req, res) => {
  try {
    const DEFAULT_PAGE = 1;
    const DEFAULT_LIMIT = 10;
    const DEFAULT_SORT_FIELD = "createdAt";
    const DEFAULT_SORT_ORDER = -1; // Ascending

    const page =
      Math.max(DEFAULT_PAGE, parseInt(req.query.page)) || DEFAULT_PAGE;
    const limit =
      Math.min(100, Math.max(1, parseInt(req.query.limit))) || DEFAULT_LIMIT;
    const sortField = req.query.sort || DEFAULT_SORT_FIELD;
    const sortOrder = req.query.order === "desc" ? -1 : DEFAULT_SORT_ORDER;

    const searchKey = (req.query.search || "").trim();

    const userId = req.user.id; // Assuming `id` is available on `req.user`
	const user = userId;
   //const user = await User.findById(userId);
    const filter = { isDeleted: false };
    if (!user) {
      return successResponse(res, 404, "User not found");
    }
    // Add role-based filtering
    if (req.user.role === "parent") {
      filter.authorId = userId;
    }

    // Add search condition
    if (searchKey) {
      filter.$or = [
        { subject: { $regex: searchKey, $options: "i" } },
        { syllabus: { $regex: searchKey, $options: "i" } },
      ];
    }

    const total = await Paper.countDocuments(filter);
    const papers = await Paper.find(filter)
      .populate("author", "name email")
      .sort({ 'createdAt': -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const pagination = {
      current_page: page,
      per_page: limit,
      total,
      last_page: Math.ceil(total / limit),
      from: (page - 1) * limit + 1,
      to: Math.min(page * limit, total),
    };

    return successResponse(
      res,
      200,
      "Papers fetched successfully",
      papers,
      pagination
    );
  } catch (error) {
    console.error("Error fetching papers:", error);
    return errorResponse(res, 500, "Failed to fetch papers");
  }
};

// exports.getPapers = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const sortField = req.query.sort || "createdAt"; // Default sorting field
//     const sortOrder = req.query.order === "desc" ? -1 : 1;

//     const searchKey = (req.query.search || "").trim(); // Trim spaces url
//     const filter = { isDeleted: false };
//     if (searchKey) {
//       filter.subject = { $regex: searchKey, $options: "i" };
//     }

//     const total = await Paper.countDocuments(filter);
//     const papers = await Paper.find(filter)
//       .populate("author", "name email")
//       .sort({ createdAt: -1 })
//       // .sort({ [sortField]: sortOrder })
//       .limit(limit * 1)
//       .skip((page - 1) * limit);

//     const pagination = {
//       current_page: page,
//       per_page: limit,
//       total,
//       last_page: Math.ceil(total / limit),
//       from: (page - 1) * limit + 1,
//       to: Math.min(page * limit, total),
//     };

//     return successResponse(
//       res,
//       200,
//       "Papers fetched successfully",
//       papers,
//       pagination
//     );
//   } catch (error) {
//     return errorResponse(res, error);
//   }
// };
// result 
exports.showPaper = async (req, res) => {
  const { id } = req.params;
  try {
    console.log('paper details', id);
    
    // Find the paper by ID and populate the author details
    const paper = await Paper.findById(id)
      .populate("author", "name email")
      .populate("children", "name grade");

      console.log(paper, "paper details");
      

    // If the paper doesn't exist, return a 404 response
    if (!paper) {
      return successResponse(res, 404, "Paper not found");
    }
    // Return the paper data in the response
    return successResponse(res, 200, "Paper fetched successfully", paper);
  } catch (error) {
    // Handle any server-side errors
	console.log(error);
    return errorResponse(res, error);
  }
};

exports.updatePaper = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  // on paper update only author can update the paper and should pass the child id

  try {
    // Ensure updates is not empty
    if (Object.keys(updates).length === 0) {
      return successResponse(res, 400, "No fields provided for update");
    }
    const paper = await Paper.findByIdAndUpdate(id, updates, { new: true });

    if (!paper) {
      return successResponse(res, 404, "Paper not found");
    }

    return successResponse(res, 200, "Paper updated successfully", paper);
  } catch (error) {
    return errorResponse(res, error);
  }
};

exports.deletePaper = async (req, res) => {
  const { id } = req.params;
  try {
    const paper = await Paper.findByIdAndUpdate(
      id,
      { $set: { isDeleted: true } },
      { new: true } // Return the updated document
    );
    if (!paper) return successResponse(res, 404, "Paper not found");
    return successResponse(res, 201, "Paper deleted successfully!");
  } catch (error) {
    return errorResponse(res, error);
  }
};

// answer the question
exports.questionAnswer = async (req, res) => {
  //try {
    // Extract query and body parameters
    const { questionId, answers, userId } = req.body;
    // Validate if the paper exists
    const paper = await Paper.findById(questionId);

    if (!paper) return customErrorResponse(res, 400, "Invalid Paper");
    // Validate if the user exists
    const parent = true;;

    // Update the paper's answers and reset the OTP
    const updatedPaper = await Paper.findByIdAndUpdate(
      questionId,
      { answers, otp: null },
      { new: true }
    );

    return successResponse(
      res,
      201,
      "Paper updated successfully ",
      updatedPaper
    );
  /*} catch (error) {
	  console.log(error);
    return errorResponse(res, error);
  } */
};

exports.getChildrenLogin = async (req, res) => {
  try {
    const { id } = req.params;
    //const { parentId, questionId, otp } = req.body;
	const { questionId, otp } = req.body;
	console.log(questionId, otp, id, "childlogin");

    // Validate input
    if (!id || !questionId || !otp) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const child = await Children.findOne({
      _id: id,
    });
	console.log(child,"childchildchild");
    if (!child) {
      return res.status(400).json({ message: "Child not found." });
    }

    // Fetch the question and parent details
    const question = await Paper.findById(questionId);
    //const parent = req.user.role;

    if (!question) {
      return res.status(404).json({ message: "Question not found." });
    }
    /*if (!parent) {
      return res.status(404).json({ message: "Parent not found." });
    } */
    // Validate OTP and IDs
    if (question.otp !== Number(otp)) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    // Update the question to set OTP to null
    question.otp = null;
    await question.save();

    if (question.childrenId !== id) {
      return res
        .status(400)
        .json({ message: "This question is not assigned to the child." });
    }
    const token = jwt.sign({ id: id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({
      token,
      user: { id: child._id, name: child.name, grade: child.grade },
    });
  } catch (error) {
    // Handle any server-side errors
    return errorResponse(res, error);
  }  
};

exports.questionAssign = async (req, res) => {
  try {
    // Extract query and body parameters
    const { questionId } = req.query;
    const { childId, url } = req.body;
    const userId = req.user.id;

    // Validate if the paper exists
    const paper = await Paper.findById(questionId);

    if (!paper) return customErrorResponse(res, 400, "Invalid Paper");
    // if (paper?.childrenId)
    //   return customErrorResponse(res, 400, "Paper already assigned to a child");

    // Validate if the user exists
    const parent = req.user.role;
    if (!parent) return customErrorResponse(res, 400, "Invalid Parent");

    const child = await Children.findById(childId);
    if (!child) return customErrorResponse(res, 400, "Child Parent");

    // Update the paper's answers and reset the OTP children childrenId
    const updatedPaper = await Paper.findByIdAndUpdate(
      questionId,
      { childrenId: childId, children: child, url },
      { new: true }
    );

    return successResponse(
      res,
      201,
      "Assign Paper successfully ",
      updatedPaper
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};
