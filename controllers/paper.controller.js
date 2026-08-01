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


//const {searchLearningResources,} = require("../utils/searchResources");
const generateLearningResourcesSequentially = async (
    paperData,
    questionNumbers = []
) => {

    //---------------------------------------------------
    // Request Information
    //---------------------------------------------------

    const requestId =
        `LR-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    const startTime = Date.now();

    console.log("\n");
    console.log("============================================================");
    console.log("LEARNING RESOURCE GENERATION STARTED");
    console.log("============================================================");
    console.log("Request ID :", requestId);
    console.log("Started At :", new Date().toISOString());

    //---------------------------------------------------
    // Normalize Paper
    //---------------------------------------------------

    const paper =
        paperData?.toObject
            ? paperData.toObject()
            : paperData;

    if (!paper) {

        console.error("Invalid paper received.");
        console.error("Request ID :", requestId);

        return;

    }

    console.log("Paper ID :", paper._id?.toString());
    console.log("Author :", paper.author || paper.authorId);
    console.log("Subject :", paper.subject);
    console.log("Class :", paper.className || paper.class);
    console.log("Language :", paper.language);
    console.log("Chapter :", paper.chapter_from);

    //---------------------------------------------------
    // Incoming Questions
    //---------------------------------------------------

    console.log("\nIncoming Wrong Question Numbers:");
    console.dir(questionNumbers, { depth: null });

    //---------------------------------------------------
    // Unique Question Numbers
    //---------------------------------------------------

    const uniqueQuestionNumbers = [

        ...new Set(

            questionNumbers
                .map(Number)
                .filter(Number.isFinite)

        )

    ];

    console.log("\nUnique Wrong Questions:");
    console.dir(uniqueQuestionNumbers, { depth: null });

    if (uniqueQuestionNumbers.length === 0) {

        console.log("No wrong questions found.");
        console.log("Request ID :", requestId);

        return;

    }

    //---------------------------------------------------
    // Collect Pending Questions
    //---------------------------------------------------

    const pendingQuestions = [];

    for (const questionNumber of uniqueQuestionNumbers) {

        console.log("\n-------------------------------------");
        console.log("Checking Question :", questionNumber);

        const originalQuestion =
            paper.questions.find(

                q =>

                    Number(q.questionNumber) ===
                    Number(questionNumber)

            );

        if (!originalQuestion) {

            console.warn(
                `Question ${questionNumber} not found in paper.`
            );

            continue;

        }

        console.log("Question Found");

        const alreadyExists =
            await LearningVerification.findOne({

                paper: paper._id,

                questionIndex: questionNumber,

            });

        if (alreadyExists) {

            console.log(
                `Learning resource already exists for Question ${questionNumber}`
            );

            continue;

        }

        console.log("Queued for AI Generation");

        pendingQuestions.push({

            questionNumber,

            originalQuestion,

        });

    }

    console.log("\n=================================================");
    console.log("Pending Questions Count :", pendingQuestions.length);
    console.log(
        "Pending Question Numbers :",
        pendingQuestions.map(q => q.questionNumber)
    );
    console.log("=================================================\n");

    if (pendingQuestions.length === 0) {

        console.log(
            "No new learning resources to generate."
        );

        console.log("Request ID :", requestId);

        return;

    }

    //---------------------------------------------------
    // Prepare AI Input
    //---------------------------------------------------

    const questionsForAI =
        pendingQuestions.map(
            item => item.originalQuestion
        );

    console.log("Preparing AI Payload...");
    console.log("Questions Sent To AI :", questionsForAI.length);

    console.log("\n========== AI PAYLOAD ==========");
    console.dir(questionsForAI, { depth: null });
    console.log("================================\n");

    
	//---------------------------------------------------
// AI Call
//---------------------------------------------------

let aiResponse;

const aiStartTime = Date.now();

console.log("\n=================================================");
console.log("AI REQUEST STARTED");
console.log("=================================================");
console.log("Request ID :", requestId);
console.log("Questions :", questionsForAI.length);

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
                questionsForAI,

        });

    const aiTime =
        Date.now() - aiStartTime;

    console.log("\n=================================================");
    console.log("AI RESPONSE RECEIVED");
    console.log("=================================================");
    console.log("Request ID :", requestId);
    console.log("Execution Time :", aiTime + " ms");

} catch (error) {

    console.error("\n=================================================");
    console.error("AI REQUEST FAILED");
    console.error("=================================================");
    console.error("Request ID :", requestId);
    console.error("Message :", error.message);

    if (error.code) {

        console.error("Code :", error.code);

    }

    if (error.status) {

        console.error("Status :", error.status);

    }

    console.error(error.stack);

    console.error("=================================================\n");

    return;

}

console.log("\n================ AI RAW RESPONSE ================");

console.dir(aiResponse, {

    depth: null,
    colors: true

});

console.log("=================================================\n");

//---------------------------------------------------
// Validate Response
//---------------------------------------------------

console.log("Validating AI Response...");

if (!aiResponse) {

    console.error("AI Response is NULL");
    console.error("Request ID :", requestId);

    return;

}

if (typeof aiResponse !== "object") {

    console.error("AI Response is not an object");
    console.error("Actual Type :", typeof aiResponse);

    return;

}

console.log("Response Type :", typeof aiResponse);

console.log("Response Keys :");

console.dir(

    Object.keys(aiResponse),

    { depth: null }

);

if (!Array.isArray(aiResponse.questions)) {

    console.error("\nquestions[] not found.");

    console.error("Received Object:");

    console.dir(
        aiResponse,
        { depth: null }
    );

    return;

}

//=================================================
// Validate Every AI Question
//=================================================

for (const item of aiResponse.questions) {

    if (!item.topic) {
        item.topic = "";
    }

    if (!item.learningObjective) {
        item.learningObjective = "";
    }

    if (!Array.isArray(item.keywords)) {
        item.keywords = [];
    }

    if (typeof item.explanation !== "string") {
        item.explanation = "";
    }

    if (typeof item.videoSearchQuery !== "string") {

    item.videoSearchQuery = "";

}

if (typeof item.pdfSearchQuery !== "string") {

    item.pdfSearchQuery = "";

}

}
	
   for (const item of aiResponse.questions) {

    console.log("\n--------------------------------");

    console.log("Question :", item.questionNumber);

    console.log("Topic :", item.topic);

    console.log("Learning Objective :", item.learningObjective);

    console.log(
        "Keywords :",
        item.keywords
    );

    console.log(
        "Explanation :",
        item.explanation
            ? item.explanation.substring(0,150) + "..."
            : ""
    );

    console.log(
        "Video Query :",
        item.videoSearchQuery
    );

    console.log(
        "PDF Query :",
        item.pdfSearchQuery
    );

}


console.log(

    "Learning Resources Returned :",

    aiResponse.questions.length

);

if (aiResponse.questions.length === 0) {

    console.error(

        "AI returned empty questions array."

    );

    return;

}

console.log("\nReturned Question Numbers:");

console.log(

    aiResponse.questions.map(

        item => item.questionNumber

    )

);

console.log("AI Response Validation : SUCCESS\n");

	
    //---------------------------------------------------
    // Create Fast Lookup Map
    //---------------------------------------------------

   //---------------------------------------------------
// Create Fast Lookup Map
//---------------------------------------------------

console.log("\n=================================================");
console.log("CREATING AI LOOKUP MAP");
console.log("=================================================");

const aiMap = new Map();

for (const item of aiResponse.questions) {

    if (
        item &&
        item.questionNumber !== undefined
    ) {

        aiMap.set(
            Number(item.questionNumber),
            item
        );

        console.log(
            `Mapped AI Question -> ${item.questionNumber}`
        );

    }

}

console.log(
    "Total AI Records :",
    aiMap.size
);

//---------------------------------------------------
// Save Learning Resources
//---------------------------------------------------

let successCount = 0;
let failedCount = 0;

console.log("\n=================================================");
console.log("STARTING DATABASE SAVE");
console.log("=================================================");

for (const pending of pendingQuestions) {

    try {

        const {

            questionNumber,

            originalQuestion,

        } = pending;

        console.log("\n----------------------------------------");
        console.log("Saving Question :", questionNumber);

        const aiItem =
            aiMap.get(
                Number(questionNumber)
            );

        if (!aiItem) {

            console.warn(
                `AI response missing for Question ${questionNumber}`
            );

            failedCount++;

            continue;

        }

        console.log("Topic :", aiItem.topic);

        console.log(
            "Learning Objective :",
            aiItem.learningObjective
        );

        console.log(
            "Keywords :",
            Array.isArray(aiItem.keywords)
                ? aiItem.keywords.length
                : 0
        );

  console.log(
    "Keywords :",
    Array.isArray(aiItem.keywords)
        ? aiItem.keywords
        : []
);

console.log(
    "Explanation :",
    aiItem.explanation || ""
);

console.log(
    "Video Search Query :",
    aiItem.videoSearchQuery || ""
);

console.log(
    "PDF Search Query :",
    aiItem.pdfSearchQuery || ""
);

		console.log("\n=======================================");
console.log("FRONTEND SEARCH REQUEST");
console.log("=======================================");

console.log("Question :", questionNumber);

console.log(
    "Video Query :",
    aiItem.videoSearchQuery
);

console.log(
    "PDF Query :",
    aiItem.pdfSearchQuery
);

console.log("=======================================\n");

		//----------------------------------------------------
//--------------------------------------------------
// Frontend Search Architecture
//--------------------------------------------------

const videos = [];
const pdfs = [];

console.log("\n=======================================");
console.log("FRONTEND SEARCH MODE");
console.log("=======================================");
console.log("Video Query :", aiItem.videoSearchQuery);
console.log("PDF Query :", aiItem.pdfSearchQuery);
console.log("=======================================\n");
		//--------------------------------------------------
// Future Provider Cache
//--------------------------------------------------

const learningDoc =
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

explanation:
    aiItem.explanation || "",

videos,

pdfs,

videoSearchQuery:
    aiItem.videoSearchQuery || "",

pdfSearchQuery:
    aiItem.pdfSearchQuery || "",
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

        successCount++;

        console.log(
            "Mongo Save : SUCCESS"
        );

        console.log(
            "LearningVerification ID :",
            learningDoc._id.toString()
        );

    }

    catch (error) {

        failedCount++;

        console.error("\n========================================");

        console.error(
            `DATABASE SAVE FAILED (Question ${pending.questionNumber})`
        );

        console.error(
            "Request ID :",
            requestId
        );

        console.error(
            "Paper ID :",
            paper._id.toString()
        );

        console.error(
            "Message :",
            error.message
        );

        console.error(
            error.stack
        );

        console.error(
            "========================================\n"
        );

    }

}

    //---------------------------------------------------
    // Finished
    //---------------------------------------------------

   //---------------------------------------------------
// Finished
//---------------------------------------------------

const totalExecutionTime =
    Date.now() - startTime;

console.log("\n");
console.log("============================================================");
console.log("LEARNING RESOURCE GENERATION COMPLETED");
console.log("============================================================");

console.log("Request ID :", requestId);

console.log(
    "Paper ID :",
    paper._id?.toString()
);

console.log(
    "Total Wrong Questions :",
    uniqueQuestionNumbers.length
);

console.log(
    "Questions Sent To AI :",
    questionsForAI.length
);

console.log(
    "Learning Records Created :",
    successCount
);

console.log(
    "Learning Records Failed :",
    failedCount
);

console.log(
    "Execution Time :",
    `${totalExecutionTime} ms`
);

console.log(
    "Completed At :",
    new Date().toISOString()
);

console.log(
    "Node Version :",
    process.version
);

const memory =
    process.memoryUsage();

console.log("\nMemory Usage");

console.log(
    "RSS :",
    `${(memory.rss / 1024 / 1024).toFixed(2)} MB`
);

console.log(
    "Heap Total :",
    `${(memory.heapTotal / 1024 / 1024).toFixed(2)} MB`
);

console.log(
    "Heap Used :",
    `${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB`
);

console.log(
    "External :",
    `${(memory.external / 1024 / 1024).toFixed(2)} MB`
);

console.log("\nSummary");

console.table({

    requestId,

    paperId:
        paper._id?.toString(),

    aiQuestions:
        questionsForAI.length,

    created:
        successCount,

    failed:
        failedCount,

    executionTime:
        `${totalExecutionTime} ms`

});

console.log("============================================================");
console.log("END OF LEARNING RESOURCE GENERATION");
console.log("============================================================\n");

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
    "pdfs " +
    "videoSearchQuery " +
    "pdfSearchQuery"
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

    const requestId =
        `QA-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    const startTime = Date.now();

    console.log("\n============================================================");
    console.log("QUESTION ANSWER REQUEST STARTED");
    console.log("============================================================");
    console.log("Request ID :", requestId);
    console.log("Time :", new Date().toISOString());

    try {

        //---------------------------------------------------
        // Request
        //---------------------------------------------------

        const {

            questionId,
            answers,
            userId,
            questionNumber

        } = req.body;

        console.log("Question ID :", questionId);
        console.log("User ID :", userId);
        console.log("Answer Count :", Array.isArray(answers) ? answers.length : 0);

        console.log("\n========== ANSWERS RECEIVED ==========");
        console.dir(answers, { depth: null });
        console.log("======================================");

        //---------------------------------------------------
        // Load Paper
        //---------------------------------------------------

        const paper =
            await Paper.findById(questionId);

        if (!paper) {

            console.error("Paper not found.");
            console.error("Request ID :", requestId);

            return customErrorResponse(
                res,
                400,
                "Invalid Paper"
            );

        }

        console.log("Paper Loaded Successfully");
        console.log("Paper ID :", paper._id.toString());
        console.log("Subject :", paper.subject);
        console.log("Class :", paper.className || paper.class);

        //---------------------------------------------------
        // Save Answers
        //---------------------------------------------------

        console.log("\nSaving Student Answers...");

        const updatedPaper =
            await Paper.findByIdAndUpdate(

                questionId,

                {

                    answers,

                    otp: null,

                    isLearningResourceGenerated: false,

                },

                {

                    new: true

                }

            );

        if (!updatedPaper) {

            console.error("Paper update failed.");

            return successResponse(
                res,
                404,
                "Paper not found"
            );

        }

        console.log("Answers Saved Successfully");

        //---------------------------------------------------
        // Prepare Response
        //---------------------------------------------------

        const responsePayload =

            updatedPaper?.toObject

                ? updatedPaper.toObject()

                : updatedPaper;

        //---------------------------------------------------
        // Detect Wrong Answers
        //---------------------------------------------------

        console.log("\nChecking Wrong Answers...");

        const questionNumbers =

            Array.isArray(answers)

                ? answers

                    .filter(answer => {

                        const question =

                            responsePayload.questions.find(

                                q =>

                                    Number(q.questionNumber) ===
                                    Number(answer.questionNumber)

                            );

                        if (!question) {

                            console.warn(
                                `Question ${answer.questionNumber} missing in paper`
                            );

                            return false;

                        }

                        const isWrong =
                            question.correctAnswer !== answer.option;

                        console.log(

                            `Q${answer.questionNumber}`,

                            "| Selected :", answer.option,

                            "| Correct :", question.correctAnswer,

                            "|",

                            isWrong ? "WRONG" : "CORRECT"

                        );

                        return isWrong;

                    })

                    .map(

                        answer => answer.questionNumber

                    )

                : [];

        //---------------------------------------------------
        // Manual Question
        //---------------------------------------------------

        if (

            questionNumber &&

            !questionNumbers.includes(questionNumber)

        ) {

            questionNumbers.push(questionNumber);

        }

        console.log("\nWrong Questions :");

        console.dir(

            questionNumbers,

            {

                depth: null

            }

        );

        //---------------------------------------------------
        // Background Learning
        //---------------------------------------------------

        if (

            questionNumbers.length > 0

        ) {

            console.log("\nLearning Resource Generation Triggered");

            setImmediate(() => {

                console.log(
                    "Background Learning Started..."
                );

                generateLearningResourcesSequentially(

                    responsePayload,

                    questionNumbers

                );

            });

        } else {

            console.log(
                "No wrong answers. Learning generation skipped."
            );

        }

        //---------------------------------------------------
        // Response
        //---------------------------------------------------

        const executionTime =
            Date.now() - startTime;

        console.log("\n============================================================");
        console.log("QUESTION ANSWER REQUEST COMPLETED");
        console.log("============================================================");
        console.log("Request ID :", requestId);
        console.log("Wrong Answers :", questionNumbers.length);
        console.log("Execution Time :", executionTime + " ms");
        console.log("============================================================\n");

        return successResponse(

            res,

            201,

            "Paper updated successfully",

            responsePayload

        );

    }

    catch (error) {

        console.error("\n============================================================");
        console.error("QUESTION ANSWER ERROR");
        console.error("============================================================");

        console.error("Request ID :", requestId);

        console.error(

            "Message :",

            error.message

        );

        console.error(error.stack);

        console.error("============================================================\n");

        return errorResponse(

            res,

            error

        );

    }

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

