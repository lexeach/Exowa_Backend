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

                    relevanceLanguage: "en"

                }

            }
        );

        const items = response.data.items || [];

        return items.map(item => ({

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

    return [

        {

            title: "NCERT / Educational PDF Search",

            url:
                `https://www.google.com/search?q=${encodeURIComponent(
                    `site:.edu OR site:ncert.nic.in filetype:pdf ${query}`
                )}`

        },

        {

            title: "Google PDF Search",

            url:
                `https://www.google.com/search?q=${encodeURIComponent(
                    `${query} filetype:pdf`
                )}`

        }

    ];

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
