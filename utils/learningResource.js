const axios = require("axios");

//=====================================================
// Configuration
//=====================================================

const YOUTUBE_API_KEY =
    process.env.YOUTUBE_API_KEY || "";

//=====================================================
// Search YouTube Videos
//=====================================================

const searchYoutubeResources = async (searchQueries = []) => {

    try {

        if (
            !YOUTUBE_API_KEY ||
            searchQueries.length === 0
        ) {

            return [];

        }

        const query = searchQueries[0];

        const response = await axios.get(
            "https://www.googleapis.com/youtube/v3/search",
            {

                params: {

                    key: YOUTUBE_API_KEY,

                    part: "snippet",

                    q: query,

                    type: "video",

                    maxResults: 5,

                    videoEmbeddable: true,

                    safeSearch: "strict",

                    relevanceLanguage:
    query.includes("Hindi")
        ? "hi"
        : "en",

                }

            }
        );

        const items = response.data.items || [];

        return items.map(item => ({

    youtubeId:
        item.id.videoId,

    title:
        item.snippet.title,

    description:
        item.snippet.description,

    channel:
        item.snippet.channelTitle,

    thumbnail:
        item.snippet.thumbnails?.high?.url ||
        item.snippet.thumbnails?.medium?.url ||
        item.snippet.thumbnails?.default?.url ||
        "",

    duration: "",

    url:
        `https://www.youtube.com/watch?v=${item.id.videoId}`

}));

    }

    catch (error) {

        console.error(
            "YouTube API Error:",
            error.response?.data ||
            error.message
        );

        return [];

    }

};

//=====================================================
// Search PDF Notes
//=====================================================

const searchPdfResources = async (searchQueries = []) => {

    if (searchQueries.length === 0) {

        return [];

    }

    const query = searchQueries[0];

try {

    const response = await axios.get(
        "https://www.googleapis.com/customsearch/v1",
        {
            params: {
                key: process.env.GOOGLE_SEARCH_API_KEY,
                cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
                q: `${query} filetype:pdf`,
                num: 5,
            },
        }
    );

    const items = response.data.items || [];

    return items.map((item) => ({

        title: item.title,

        url: item.link,

        source: item.displayLink,

        snippet: item.snippet,

    }));

} catch (error) {

    console.error(
        "PDF Search Error:",
        error.response?.data || error.message
    );

    return [];
}

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

        className ? `Class ${className}` : "",

        topic,

        ...keywords,

        syllabus,

        language,

        "NCERT"

    ]
        .filter(Boolean)
        .join(" ");

    return {

        youtubeSearch: [

            searchText

        ],

        pdfSearch: [

            searchText

        ]

    };

};

module.exports = {

    buildSearchQueries,

    searchYoutubeResources,

    searchPdfResources

};
