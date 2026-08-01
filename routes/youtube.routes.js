const express = require("express");

const router = express.Router();

const {
    searchYoutube,
} = require("../controllers/youtube.controller");

//=========================================
// Search Videos
//=========================================

router.get(

    "/search",

    searchYoutube

);

module.exports = router;