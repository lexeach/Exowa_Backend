const {
    searchYouTubeVideos,
} = require("../utils/youtubeProvider");

//======================================================
// Search YouTube Videos
//======================================================

const searchYoutube = async (req, res) => {

    try {

        const query = req.query.q;

        if (!query) {

            return res.status(400).json({

                success: false,

                message: "Search query is required."

            });

        }

        console.log("\n====================================");
        console.log("YouTube Search Request");
        console.log("====================================");
        console.log("Query :", query);

        const videos =
            await searchYouTubeVideos(query);

        console.log("Videos Found :", videos.length);

        return res.status(200).json({

            success: true,

            query,

            total: videos.length,

            videos

        });

    }

    catch (error) {

        console.error(
            "YouTube Controller Error :",
            error
        );

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

module.exports = {

    searchYoutube

};