//const axios = require("axios");

//=====================================================
// Configuration
//=====================================================

//const YOUTUBE_API_KEY =
  //  process.env.YOUTUBE_API_KEY || "";

//const GOOGLE_SEARCH_API_KEY =
  //  process.env.GOOGLE_SEARCH_API_KEY || "";

//const GOOGLE_SEARCH_ENGINE_ID =
  //  process.env.GOOGLE_SEARCH_ENGINE_ID || "";
//=====================================================
// Search YouTube Videos
//=====================================================

const searchYoutubeResources = async (searchQueries = []) => {

    return searchQueries.map(url => ({
        title: "Watch on YouTube",
        url
    }));

};
};

//=====================================================
// Search PDF Notes
//=====================================================

const searchPdfResources = async (searchQueries = []) => {

    return searchQueries.map(url => ({
        title: "Open PDF Search",
        url
    }));

};

};

//=====================================================
// Generate Search Queries
//=====================================================

const buildSearchQueries = ({
    topic,
    className,
    syllabus,
    language,
    keywords = []
}) => {

    const searchText = [
        `Class ${className}`,
        topic,
        ...keywords,
        syllabus,
        language
    ]
        .filter(Boolean)
        .join(" ");

    return {

        youtubeSearch: [
            `https://www.youtube.com/results?search_query=${encodeURIComponent(searchText)}`
        ],

        pdfSearch: [
            `https://www.google.com/search?q=${encodeURIComponent(searchText + " PDF")}`
        ]

    };

};
};

//=====================================================

module.exports = {

    buildSearchQueries,

    searchYoutubeResources,

    searchPdfResources

};
