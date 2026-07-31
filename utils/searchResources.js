const axios = require("axios");
const cheerio = require("cheerio");

//====================================================
// Configuration
//====================================================

const GOOGLE_SEARCH_URL =
    "https://www.google.com/search";

const REQUEST_TIMEOUT = 15000;

const USER_AGENT =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0 Safari/537.36";

//====================================================
// Axios Instance
//====================================================

const client = axios.create({

    timeout: REQUEST_TIMEOUT,

    headers: {

        "User-Agent": USER_AGENT,

        "Accept":
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",

        "Accept-Language":
            "en-US,en;q=0.9",

        "Cache-Control":
            "no-cache"

    }

});

//====================================================
// Sleep
//====================================================

function sleep(ms) {

    return new Promise(resolve => setTimeout(resolve, ms));

}

//====================================================
// Remove Duplicate Videos
//====================================================

function removeDuplicateVideos(videos = []) {

    const map = new Map();

    for (const item of videos) {

        if (!item.url) {

            continue;

        }

        if (!map.has(item.url)) {

            map.set(item.url, item);

        }

    }

    return Array.from(map.values());

}

//====================================================
// Remove Duplicate PDFs
//====================================================

function removeDuplicatePdfs(pdfs = []) {

    const map = new Map();

    for (const item of pdfs) {

        if (!item.url) {

            continue;

        }

        if (!map.has(item.url)) {

            map.set(item.url, item);

        }

    }

    return Array.from(map.values());

}

//====================================================
// Normalize Video
//====================================================

function normalizeVideo(item = {}) {

    return {

        title:
            item.title || "",

        url:
            item.url || "",

        thumbnail:
            item.thumbnail || "",

        channel:
            item.channel || ""

    };

}

//====================================================
// Normalize PDF
//====================================================

function normalizePdf(item = {}) {

    return {

        title:
            item.title || "",

        url:
            item.url || ""

    };

}

//====================================================
// Google Search
//====================================================

async function searchGoogle(query = "") {

    console.log("\n========================================");
    console.log("GOOGLE SEARCH");
    console.log("========================================");
    console.log("Query :", query);

    try {

        await sleep(800);

        const response =
            await client.get(
                GOOGLE_SEARCH_URL,
                {
                    params: {
                        q: query
                    }
                }
            );

        const html =
            response.data || "";

        const $ =
            cheerio.load(html);

        const results = [];

        $("a").each((index, element) => {

            const href =
                $(element).attr("href");

            if (!href) {

                return;

            }

            //--------------------------------------------------
            // Google redirects
            //--------------------------------------------------

            if (!href.startsWith("/url?q=")) {

                return;

            }

            let url =
                href.replace("/url?q=", "");

            const ampIndex =
                url.indexOf("&");

            if (ampIndex !== -1) {

                url =
                    url.substring(0, ampIndex);

            }

            url =
                decodeURIComponent(url);

            //--------------------------------------------------
            // Ignore unwanted links
            //--------------------------------------------------

            if (
                url.includes("google.") ||
                url.includes("/search?") ||
                url.includes("/settings") ||
                url.includes("accounts.google") ||
                url.includes("support.google")
            ) {

                return;

            }

            //--------------------------------------------------
            // Title
            //--------------------------------------------------

            let title =
                $(element).text().trim();

            if (!title) {

                title =
                    $(element)
                        .find("h3")
                        .text()
                        .trim();

            }

            if (!title) {

                title = url;

            }

            results.push({

                title,

                url

            });

        });

        //--------------------------------------------------
        // Remove duplicates
        //--------------------------------------------------

        const unique =
            [];

        const seen =
            new Set();

        for (const item of results) {

            if (seen.has(item.url)) {

                continue;

            }

            seen.add(item.url);

            unique.push(item);

        }

        console.log(
            "Google Results :",
            unique.length
        );

        return unique;

    }

    catch (error) {

        console.error(
            "Google Search Failed :",
            error.message
        );

        return [];

    }

}


//====================================================
// Search YouTube
//====================================================

async function searchYoutube(videoQueries = []) {

    console.log("\n========================================");
    console.log("YOUTUBE SEARCH");
    console.log("========================================");

    const videos = [];

    for (const query of videoQueries) {

        console.log("\nSearching :", query);

        const results =
            await searchGoogle(
                `${query} site:youtube.com`
            );

        let added = 0;

        for (const item of results) {

            if (!item.url) {

                continue;

            }

            //--------------------------------------------------
            // Only youtube links
            //--------------------------------------------------

            if (
                !item.url.includes("youtube.com") &&
                !item.url.includes("youtu.be")
            ) {

                continue;

            }

            //--------------------------------------------------
            // Extract Video Id
            //--------------------------------------------------

            let videoId = "";

            try {

                const url =
                    new URL(item.url);

                if (
                    url.hostname === "youtu.be"
                ) {

                    videoId =
                        url.pathname.replace("/", "");

                }

                else {

                    videoId =
                        url.searchParams.get("v") || "";

                }

            }

            catch {

                continue;

            }

            if (!videoId) {

                continue;

            }

            //--------------------------------------------------
            // Thumbnail
            //--------------------------------------------------

            const thumbnail =
                `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

            //--------------------------------------------------
            // Channel
            //--------------------------------------------------

            let channel = "";

            try {

                const url =
                    new URL(item.url);

                channel =
                    url.hostname;

            }

            catch {

                channel = "";

            }

            videos.push(

                normalizeVideo({

                    title:
                        item.title,

                    url:
                        item.url,

                    thumbnail,

                    channel

                })

            );

            added++;

            if (added >= 3) {

                break;

            }

        }

    }

    //--------------------------------------------------
    // Remove Duplicates
    //--------------------------------------------------

    const uniqueVideos =
        removeDuplicateVideos(videos);

    console.log(
        "Videos Found :",
        uniqueVideos.length
    );

    return uniqueVideos.slice(0, 3);

}

//====================================================
// Search PDF
//====================================================

async function searchPdf(pdfQueries = []) {

    console.log("\n========================================");
    console.log("PDF SEARCH");
    console.log("========================================");

    const pdfs = [];

    for (const query of pdfQueries) {

        console.log("\nSearching :", query);

        const results =
            await searchGoogle(
                `${query} filetype:pdf`
            );

        let added = 0;

        for (const item of results) {

            if (!item.url) {

                continue;

            }

            //--------------------------------------------------
            // Only PDF
            //--------------------------------------------------

            if (
                !item.url
                    .toLowerCase()
                    .endsWith(".pdf")
            ) {

                continue;

            }

            pdfs.push(

                normalizePdf({

                    title:
                        item.title,

                    url:
                        item.url

                })

            );

            added++;

            if (added >= 3) {

                break;

            }

        }

    }

    //--------------------------------------------------
    // Remove Duplicate PDFs
    //--------------------------------------------------

    const uniquePdfs =
        removeDuplicatePdfs(pdfs);

    console.log(
        "PDFs Found :",
        uniquePdfs.length
    );

    return uniquePdfs.slice(0, 3);

}

//====================================================
// Search Learning Resources
//====================================================

async function searchLearningResources({

    subject = "",

    className = "",

    board = "",

    language = "",

    videoQueries = [],

    pdfQueries = []

} = {}) {

    console.log("\n=================================================");
    console.log("SEARCH LEARNING RESOURCES");
    console.log("=================================================");

    console.log("Subject :", subject);
    console.log("Class :", className);
    console.log("Board :", board);
    console.log("Language :", language);

    const videos =
        await searchYoutube(videoQueries);

    const pdfs =
        await searchPdf(pdfQueries);

    console.log("\nSearch Completed");

    console.log(
        "Videos :",
        videos.length
    );

    console.log(
        "PDFs :",
        pdfs.length
    );

    return {

        videos,

        pdfs

    };

}

//====================================================
// Exports
//====================================================

module.exports = {

    searchGoogle,

    searchYoutube,

    searchPdf,

    searchLearningResources

};