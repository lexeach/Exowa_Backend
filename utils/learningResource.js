const axios = require("axios");

//=====================================================
// Configuration
//=====================================================

const YOUTUBE_API_KEY =
    process.env.YOUTUBE_API_KEY || "";

const GOOGLE_SEARCH_API_KEY =
    process.env.GOOGLE_SEARCH_API_KEY || "";

const GOOGLE_SEARCH_ENGINE_ID =
    process.env.GOOGLE_SEARCH_ENGINE_ID || "";
//=====================================================
// Search YouTube Videos
//=====================================================

const searchYoutubeResources = async (
    if (!YOUTUBE_API_KEY) {

    console.error("YOUTUBE_API_KEY missing.");

    return [];

}
    searchQueries = []
) => {

    const videos = [];

    try {

        for (const query of searchQueries) {

            if (videos.length >= 3) break;

            const response = await axios.get(

                "https://www.googleapis.com/youtube/v3/search",

                {

                    params: {

                        key: YOUTUBE_API_KEY,

                        part: "snippet",

                        type: "video",

                        maxResults: 3,

                        q: query,

                        safeSearch: "strict",

                        relevanceLanguage: "en"

                    }

                }

            );

            const items = response.data.items || [];

            for (const item of items) {

                if (videos.length >= 3) break;

                if (!item?.id?.videoId) {
    continue;
     }

    if (

    videos.some(

        video =>

            video.youtubeId === item.id.videoId

    )

) {

    continue;

}

videos.push({

    youtubeId:
        item.id.videoId,

    title:
        item.snippet?.title || "",

    channel:
        item.snippet?.channelTitle || "",

    thumbnail:
        item.snippet?.thumbnails?.high?.url ||
        item.snippet?.thumbnails?.default?.url ||
        "",

    duration: ""

     });

            }

        }

    }

    catch (error) {

        console.error(

            "YouTube Search Error:",

            error.message

        );

    }

    return videos;

};

//=====================================================
// Search PDF Notes
//=====================================================

const searchPdfResources = async (
    if (

    !GOOGLE_SEARCH_API_KEY ||

    !GOOGLE_SEARCH_ENGINE_ID

) {

    console.error("Google Search API configuration missing.");

    return [];

}
    searchQueries = []
) => {

    const pdfs = [];

    try {

        for (const query of searchQueries) {

            if (pdfs.length >= 2) break;

            const response = await axios.get(

                "https://www.googleapis.com/customsearch/v1",

                {

                    params: {

                        key: GOOGLE_SEARCH_API_KEY,

                        cx: GOOGLE_SEARCH_ENGINE_ID,

                        q: `${query} filetype:pdf`,

                        num: 2

                    }

                }

            );

            const items = response.data.items || [];

            for (const item of items) {

                if (pdfs.length >= 2) break;

               if (!item?.link) {
    continue;
}

if (

    pdfs.some(

        pdf =>

            pdf.url === item.link

    )

) {

    continue;

}

pdfs.push({

    title: item.title || "",

    url: item.link,

    source:
        item.displayLink || ""

});

            }

        }

    }

    catch (error) {

        console.error(

            "PDF Search Error:",

            error.message

        );

    }

    return pdfs;

};

//=====================================================
// Generate Search Queries
//=====================================================

const buildSearchQueries = ({
    topic,
    className,
    syllabus,
    language
}) => {

    const youtubeSearch = [

        `${topic} Class ${className}`,

        `${topic} ${syllabus}`,

        `${topic} explained ${language}`

    ];

    const pdfSearch = [

        `${topic} Class ${className} PDF`,

        `${topic} ${syllabus} Notes PDF`

    ];

    return {

        youtubeSearch,

        pdfSearch

    };

};

//=====================================================

module.exports = {

    buildSearchQueries,

    searchYoutubeResources,

    searchPdfResources

};
