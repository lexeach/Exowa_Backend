const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const axios = require('axios');
const bcrypt = require("bcryptjs");

const { successResponse, errorResponse } = require("../utils/response.dto.js");

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

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Send credentials directly to external API
    const response = await axios.post('https://apic.myreview.website:8453/api/admin/users_withPass', {
      userid: email,
      passwd: password
    }, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test_4NmoG4TVzCWe4Q'
      }
    });

    // If the API returns user data, login is successful
    const user = response.data.data;

    if (!user || user.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Assuming the API validates the password and returns user info
    const token = jwt.sign({ id: user.userid, email: user.user_email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      token,
      user: {
        id: user.userid,
        name: user.user_name,
        email: user.user_email,
        role: 'parent', // Adjust if you have roles
      },
    });
  } catch (error) {
    console.error(error.response ? error.response.data : error.message);

    // Handle invalid credentials
    if (error.response && error.response.status === 400) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Handle other server errors
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
