const axios = require("axios");

//======================================================
// Search YouTube Videos
//======================================================

async function searchYouTubeVideos(query) {

    try {

        console.log("\n====================================");
        console.log("YouTube Provider");
        console.log("====================================");
        console.log("Search Query :", query);

        const encodedQuery =
            encodeURIComponent(query);

        const url =
            `https://www.youtube.com/results?search_query=${encodedQuery}`;

        const response =
            await axios.get(

                url,

                {

                    timeout: 15000,

                    headers: {

                        "User-Agent":
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",

                        "Accept-Language":
                            "en-US,en;q=0.9",

                        "Accept":
                            "text/html"

                    }

                }

            );

        const html = response.data;

        console.log(
            "HTML Length :",
            html.length
        );

        //--------------------------------------------------
        // Extract ytInitialData
        //--------------------------------------------------

        const match = html.match(

            /(?:var\s+)?ytInitialData\s*=\s*(\{.*?\});/s

        );

        console.log(

            "Regex Match :",

            !!match

        );

        if (!match) {

            throw new Error(

                "ytInitialData not found."

            );

        }

        const ytInitialData =
            JSON.parse(match[1]);

        console.log(

            "ytInitialData Loaded"

        );
        
        // JSON path traverse karke video results nikalna
                //--------------------------------------------------
        // Traverse ytInitialData
        //--------------------------------------------------

        const contents =
            ytInitialData
                ?.contents
                ?.twoColumnSearchResultsRenderer
                ?.primaryContents
                ?.sectionListRenderer
                ?.contents;

        if (!contents) {

            console.log(
                "No search contents found."
            );

            return [];

        }

        const videos = [];

        for (const section of contents) {

            const items =
                section
                    ?.itemSectionRenderer
                    ?.contents || [];

            for (const item of items) {

                const videoData =
                    item?.videoRenderer;

                if (!videoData)
                    continue;

                videos.push({

                    videoId:
                        videoData.videoId,

                    title:
                        videoData.title?.runs?.[0]?.text || "",

                    duration:
                        videoData.lengthText?.simpleText || "",

                    thumbnail:
                        videoData.thumbnail?.thumbnails?.at(-1)?.url || "",

                    channelTitle:
                        videoData.ownerText?.runs?.[0]?.text || "",

                    videoUrl:
                        `https://www.youtube.com/watch?v=${videoData.videoId}`

                });

                if (videos.length >= 3)
                    break;

            }

            if (videos.length >= 3)
                break;

        }

        console.log(
            "Videos Extracted :",
            videos.length
        );

        console.dir(
            videos,
            { depth: null }
        );

        return videos;

    }

    catch (error) {

        console.error(
            "\nYouTube Provider Error"
        );

        console.error(
            error.message
        );

        return [];

    }

}

module.exports = {

    searchYouTubeVideos

};
