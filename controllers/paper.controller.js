const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { getGenerateQuestion } = require("../utils/question.ai");
const LearningVerification = require("../models/learningVerification.model");
const {
    generateQuestionExplanation: generateLearningResourcesAI,
} = require("../utils/question.ai");

const Paper = require("../models/paper.model");
const User = require("../models/user.model");
const Children = require("../models/child.model");

// NEW MODEL

const {
    successResponse,
    errorResponse,
    customErrorResponse,
} = require("../utils/response.dto");


const { generateOTP } = require("../utils/generate.otp");

//=====================================================
// Learning Resource Constants
//=====================================================

const LEARNING_RESOURCE_PENDING_MESSAGE =
    "Learning resources are being prepared. Please try again in a few moments.";


const {
    buildSearchQueries,
    searchYoutubeResources,
    searchPdfResources,
} = require("../utils/learningResource");

const generateLearningResourcesSequentially = async (
    paperData,
    questionNumbers = []
) => {

    const paper =
        paperData?.toObject
            ? paperData.toObject()
            : paperData;

    if (!paper) {
        console.error("Invalid paper.");
        return;
    }

    //---------------------------------------------------
    // Unique Wrong Questions
    //---------------------------------------------------

    const uniqueQuestionNumbers = [
        ...new Set(
            questionNumbers
                .map(Number)
                .filter(Number.isFinite)
        )
    ];

    if (uniqueQuestionNumbers.length === 0) {
        console.log("No wrong questions found.");
        return;
    }

    //---------------------------------------------------
    // Collect Wrong Questions
    //---------------------------------------------------

    const wrongQuestions = [];

    for (const questionNumber of uniqueQuestionNumbers) {

        const originalQuestion = paper.questions.find(
            q =>
                Number(q.questionNumber) ===
                Number(questionNumber)
        );

        if (!originalQuestion) {
            console.log(
                `Question ${questionNumber} not found.`
            );
            continue;
        }

        const alreadyExists =
            await LearningVerification.findOne({
                paper: paper._id,
                questionIndex: questionNumber,
            });

        if (alreadyExists) {
            continue;
        }

        wrongQuestions.push(originalQuestion);
    }

    if (wrongQuestions.length === 0) {
        console.log(
            "Learning resources already exist."
        );
        return;
    }

    //---------------------------------------------------
    // Single Gemini Call
    //---------------------------------------------------

    let aiResponse;

    try {

        aiResponse =
            await generateLearningResourcesAI({

                className:
                    paper.className ||
                    paper.class,

                subject:
                    paper.subject,

                syllabus:
                    paper.syllabus,

                chapter_from:
                    paper.chapter_from,

                language:
                    paper.language,

                questions:
                    wrongQuestions,

            });

    } catch (error) {

        console.error(
            "Bulk Learning AI Error:",
            error.message
        );

        return;
    }

    //---------------------------------------------------
    // Validate AI Response
    //---------------------------------------------------

    if (
        !aiResponse ||
        !Array.isArray(aiResponse.questions)
    ) {

        console.log(
            "Invalid bulk AI response."
        );

        return;
    }

    //---------------------------------------------------
    // Create Lookup Map
    //---------------------------------------------------

    const aiMap = new Map();

    for (const item of aiResponse.questions) {

        aiMap.set(
            Number(item.questionNumber),
            item
        );
    }


    //---------------------------------------------------
    // Save Learning Resources
    //---------------------------------------------------

    for (const questionNumber of uniqueQuestionNumbers) {

        try {

            const aiItem = aiMap.get(
                Number(questionNumber)
            );

            if (!aiItem) {

                console.log(
                    `No AI data found for Question ${questionNumber}`
                );

                continue;
            }

            const originalQuestion = paper.questions.find(
                q =>
                    Number(q.questionNumber) ===
                    Number(questionNumber)
            );

            if (!originalQuestion) {
                continue;
            }

            const alreadyExists =
                await LearningVerification.findOne({
                    paper: paper._id,
                    questionIndex: questionNumber,
                });

            if (alreadyExists) {
                continue;
            }

            await LearningVerification.create({

                paper: paper._id,

                questionIndex: questionNumber,

                originalQuestion,

                topic:
                    aiItem.topic || "",

                learningObjective:
                    aiItem.learningObjective || "",

                keywords:
                    Array.isArray(aiItem.keywords)
                        ? aiItem.keywords
                        : [],

                youtubeSearch:
                    Array.isArray(aiItem.youtubeSearch)
                        ? aiItem.youtubeSearch
                        : [],

                pdfSearch:
                    Array.isArray(aiItem.pdfSearch)
                        ? aiItem.pdfSearch
                        : [],

                videos: [],

                pdfs: [],

                questions: [],

                totalQuestions: 0,

                score: 0,

                scorePercentage: 0,

                status: "Pending",

                attempts: 0,

                createdBy:
                    paper.author ||
                    paper.authorId,
            });

            console.log(
                `Learning resources generated for Question ${questionNumber}`
            );


                     }

        catch (error) {

            console.error(

                `Learning Resource Error (Question ${questionNumber})`,

                error.message

            );

        }

    }

    //---------------------------------------------------
    // Finished
    //---------------------------------------------------

    console.log(

        `Learning resources generated successfully for ${uniqueQuestionNumbers.length} question(s).`

    );

};






exports.getLearningResources = async (req, res) => {

    try {

        const { id } = req.params;

        const learning = await LearningVerification.findById(id);

        if (!learning) {

            return res.status(404).json({

                success: false,

                message: "Learning resource not found."

            });

        }

        //------------------------------------------------
        // Already Cached
        //------------------------------------------------

        if (
            learning.videos.length > 0 ||
            learning.pdfs.length > 0
        ) {

            return res.json({

                success: true,

                data: learning

            });

        }

        //------------------------------------------------
        // Build Search Queries
        //------------------------------------------------

       const paper = await Paper.findById(learning.paper)
    .select("className class syllabus language");

const {

    youtubeSearch,

    pdfSearch,

} = buildSearchQueries({

    topic: learning.topic,

    className:
        paper?.className ||
        paper?.class ||
        "",

    syllabus:
        paper?.syllabus || "",

    language:
        paper?.language || "English",

});

       //------------------------------------------------
// Search Resources
//------------------------------------------------

const [videos, pdfs] = await Promise.all([
    searchYoutubeResources(youtubeSearch),
    searchPdfResources(pdfSearch),
]);
//------------------------------------------------
// Cache
//------------------------------------------------

learning.videos = videos;

learning.pdfs = pdfs;
        await learning.save();

        //------------------------------------------------
        // Response
        //------------------------------------------------

        return res.json({

            success: true,

            data: learning

        });

    }

    catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

exports.getAllLearningResources = async (req, res) => {

    try {

        const { paperId } = req.params;

        const resources = await LearningVerification
            .find({ paper: paperId })
            .sort({ questionIndex: 1 })
            .select(
                "_id " +
                "questionIndex " +
                "topic " +
                "learningObjective " +
                "status " +
                "score " +
                "totalQuestions " +
                "scorePercentage " +
                "verifiedAt " +
                "videos " +
                "pdfs"
            );

        return res.status(200).json({

            success: true,

            total: resources.length,

            data: resources

        });

    }

    catch (error) {

        console.error(
            "getAllLearningResources Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message: "Failed to fetch learning resources.",

            error: error.message

        });

    }

};

exports.createPaper = async (req, res) => {
  const requiredFields = [
    "subject",
    "syllabus",
    "chapter_from",
    //"chapter_to",
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
    class: className,
    subject,
    syllabus,
    chapter_from,
    //chapter_to,
    language,
    no_of_question,
    topics,
  } = req.body;

  const userId = req.user.id; // Set from auth middleware

  console.log('req.user:', req.user, 'userId:', userId);
  
  const filePath = req.file ? req.file.path : null; // File path from multer
//	const filePath = "https://myreview.website/Exowa_Frontend_New-main/"; // File path from multer
  try {

    let userTopicLimit = 1;
    let userChildLimit = 1;
    const isValidUserObjectId =
      typeof userId === "string" && mongoose.Types.ObjectId.isValid(userId);

    if (isValidUserObjectId) {
      const userRecord = await User.findById(userId)
        .select("topicLimit childLimit")
        .lean();

      if (userRecord) {
        if (
          typeof userRecord.topicLimit === "number" &&
          userRecord.topicLimit >= 0
        ) {
          userTopicLimit = userRecord.topicLimit;
        }
        if (
          typeof userRecord.childLimit === "number" &&
          userRecord.childLimit >= 0
        ) {
          userChildLimit = userRecord.childLimit;
        }
      }
    }

    const tokenTopicLimit = Number(
      req.user.topicLimit ?? req.user.topic_limit
    );
    if (Number.isInteger(tokenTopicLimit) && tokenTopicLimit >= 0) {
      userTopicLimit = tokenTopicLimit;
    }

    const tokenChildLimit = Number(
      req.user.childLimit ?? req.user.child_limit ?? req.user.childnumber
    );
    if (Number.isInteger(tokenChildLimit) && tokenChildLimit >= 0) {
      userChildLimit = tokenChildLimit;
    }

    const normalizedTopics = Array.isArray(topics)
      ? topics
      : topics !== undefined && topics !== null
      ? [topics]
      : [];

    const filteredTopics = normalizedTopics
      .map((topic) => (topic === null || topic === undefined ? "" : `${topic}`.trim()))
      .filter((topic) => topic.length > 0);

    if (filteredTopics.length > userTopicLimit && userTopicLimit >= 0) {
      return customErrorResponse(
        res,
        400,
        `Topic limit exceeded. You can only add up to ${userTopicLimit} topic${
          userTopicLimit === 1 ? "" : "s"
        }.`
      );
    }

    let generatedPapers = await getGenerateQuestion({
      className,
      subject,
      syllabus,
      chapter_from,
      //chapter_to,
      language,
      no_of_question,
    });

    const otp = Math.floor(10000 + Math.random() * 90000) //generateOTP(5);
    
    // Convert userId to ObjectId if it's a valid ObjectId string, otherwise use authorId only
    let authorObjectId = null;
    try {
      // Check if userId is a valid ObjectId format (24 hex characters)
      if (userId && typeof userId === 'string' && userId.length === 24 && /^[0-9a-fA-F]{24}$/.test(userId)) {
        authorObjectId = userId;
      }
    } catch (error) {
      console.log('Invalid ObjectId format for userId:', userId);
    }

    // set creator 
    
    const payload = {
      className,
      subject,
      syllabus,
      chapter_from,
      //chapter_to,
      language,
      authorId: userId,
      // author: userId,
      file: filePath,
      questions: generatedPapers,
      otp,
      no_of_question,
      topics: filteredTopics,
      topicLimit: userTopicLimit,
      childLimit: userChildLimit,
    };
    
    // Only set author if we have a valid ObjectId
    if (authorObjectId) {
      payload.author = authorObjectId;
      // payload.userId = authorObjectId;
    }

    
    const paper = new Paper(payload);
    await paper.save();
    return successResponse(res, 201, "Paper created successfully ", paper);
  } catch (error) {
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
    if (req.user.role === "parent" || req.user.role === "subadmin") {
      filter.authorId = userId;
    }

    // Add search condition
    if (searchKey) {
      filter.$or = [
        { subject: { $regex: searchKey, $options: "i" } },
        { syllabus: { $regex: searchKey, $options: "i" } },
        { language: { $regex: searchKey, $options: "i" } },
        { chapter_from: { $regex: searchKey, $options: "i" } },
        //{ chapter_to: { $regex: searchKey, $options: "i" } },
      ];
    }

    const total = await Paper.countDocuments(filter);
    const papers = await Paper.find(filter)
      .populate("author", "name email").populate("children", "name grade")
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

exports.showPaper = async (req, res) => {
  const { id } = req.params;
  try {
    
    // Find the paper by ID and populate the author details
    const paper = await Paper.findById(id)
      .populate("author", "name email")
      .populate("children", "name grade");

      

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
    const { questionId, answers, userId, questionNumber } = req.body;
    // Validate if the paper exists
    const paper = await Paper.findById(questionId);

    if (!paper) return customErrorResponse(res, 400, "Invalid Paper");
    // Validate if the user exists
    const parent = true;;

    // Update the paper's answers and reset the OTP
    const updatedPaper = await Paper.findByIdAndUpdate(
      questionId,
      {
        answers,
        otp: null,
        // children: userId,
        // childrenId: userId,
        isLearningResourceGenerated: false,
      },
      { new: true }
    );

    if (!updatedPaper) {
      return successResponse(res, 404, "Paper not found");
    }

    const responsePayload =
      updatedPaper?.toObject ? updatedPaper.toObject() : updatedPaper;

    const questionNumbers = Array.isArray(answers)
      ? answers
          .map((answer) => answer?.questionNumber)
          .filter((num) => num !== undefined && num !== null)
      : [];

    if (questionNumber && !questionNumbers.includes(questionNumber)) {
      questionNumbers.push(questionNumber);
    }

    if (questionNumbers.length > 0) {
      setImmediate(() => {
    generateLearningResourcesSequentially(
        responsePayload,
        questionNumbers
    );
});
    }

    return successResponse(
      res,
      201,
      "Paper updated successfully ",
      responsePayload
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

    // Validate input
    if (!id || !questionId || !otp) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const child = await Children.findOne({
      _id: id,
    });

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
      { childrenId: childId, children: childId, url },
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

