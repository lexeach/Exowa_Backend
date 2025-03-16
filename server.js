require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const connectDB = require("./config/db");
const userRoutes = require("./routes/user.routes");
const paperRoutes = require("./routes/paper.routes");
const childRoutes = require("./routes/child.routes");
const subjectRoutes = require("./routes/subject.routes");
const syllabusRoutes = require("./routes/syllabus.routes");

const app = express();
connectDB();

// Enable CORS for all origins and methods
// app.use(cors());
//# this is for production
const allowedOrigins =
  [
    "https://user.exowa.click",
    "https://heartfelt-dolphin-732aa6.netlify.app",
  "https://auto-paper.netlify.app", // Deployed host
  "http://localhost:5173", // Local development
];
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], // Allow all methods
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  })
);
// app.use(cors({
//   origin: 'https://auto-paper.netlify.app', // Allow the specified host
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Allow all methods
//   credentials: true, // Allow credentials (cookies, authorization headers, etc.)
// }));

// Swagger Configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Question API",
      version: "1.0.0",
      description: "API for managing users and papers",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js"], // Adjust path based on your project structure
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Middleware
app.use(bodyParser.json());
app.use("/api/users", userRoutes);
app.use("/api/papers", paperRoutes);
app.use("/api/children", childRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/syllabuses", syllabusRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
