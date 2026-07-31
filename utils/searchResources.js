const axios = require("axios");
const cheerio = require("cheerio");

const GOOGLE_URL = "https://www.google.com/search";

const USER_AGENT =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0 Safari/537.36";

const REQUEST_TIMEOUT = 20000;

const MAX_RETRY = 3;

const REQUEST_DELAY = 1200;

const client = axios.create({
    timeout: REQUEST_TIMEOUT,
    headers: {
        "User-Agent": USER_AGENT,
        "Accept":
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language":
            "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache"
    },
    validateStatus(status) {
        return status >= 200 && status < 500;
    }
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function log(message, value = "") {
    console.log(
        `[LearningResource] ${message}`,
        value
    );
}

function normalizeUrl(url = "") {

    if (!url) return "";

    try {

        url = decodeURIComponent(url);

    } catch {}

    url = url.trim();

    if (
        url.startsWith("//")
    ) {
        url = "https:" + url;
    }

    return url;

}

function isCaptcha(html = "") {

    html = html.toLowerCase();

    return (
        html.includes("our systems have detected unusual traffic") ||
        html.includes("recaptcha") ||
        html.includes("sorry...") ||
        html.includes("/sorry/") ||
        html.includes("captcha")
    );

}

function removeDuplicates(list = []) {

    const map = new Map();

    for (const item of list) {

        if (!item.url) continue;

        if (!map.has(item.url)) {

            map.set(item.url, item);

        }

    }

    return Array.from(map.values());

}

function normalizeVideo(video = {}) {

    return {

        title: video.title || "",

        url: video.url || "",

        youtubeId: video.youtubeId || "",

        thumbnail: video.thumbnail || "",

        channel: video.channel || "",

        duration: video.duration || ""

    };

}
function normalizePdf(pdf = {}) {

    return {

        title: pdf.title || "",

        url: pdf.url || "",

        source: pdf.source || ""

    };

}
async function requestGoogle(query) {

    for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {

        try {

            await sleep(
                REQUEST_DELAY * attempt
            );

            log(
                `Google Request (${attempt}/${MAX_RETRY})`,
                query
            );

            const response =
                await client.get(
                    GOOGLE_URL,
                    {
                        params: {
                            q: query,
                            hl: "en"
                        }
                    }
                );

            const html =
                response.data || "";

            if (!html) {

                throw new Error(
                    "Empty response"
                );

            }

            if (isCaptcha(html)) {

                throw new Error(
                    "Google CAPTCHA detected"
                );

            }

            return html;

        }

        catch (error) {

            log(
                "Retry Reason",
                error.message
            );

            if (
                attempt === MAX_RETRY
            ) {

                return "";

            }

        }

    }

    return "";

}


//====================================================
// Extract Google Search Results
//====================================================

function extractGoogleResults(html = "") {

    const $ = cheerio.load(html);

    const results = [];
    const visited = new Set();

    //--------------------------------------------------
    // Helper
    //--------------------------------------------------

    function pushResult(title, url) {

        url = normalizeUrl(url);

        if (!url) return;

        if (
            url.includes("google.") ||
            url.includes("/search?") ||
            url.includes("/preferences") ||
            url.includes("/setprefs") ||
            url.includes("accounts.google")
        ) {
            return;
        }

        if (visited.has(url)) {
            return;
        }

        visited.add(url);

        results.push({
            title: (title || url).trim(),
            url
        });

    }

    //--------------------------------------------------
    // Layout 1
    //--------------------------------------------------

    $("a").each((_, element) => {

        const href = $(element).attr("href");

        if (!href) return;

        if (!href.startsWith("/url?q=")) {
            return;
        }

        let url =
            href.replace("/url?q=", "");

        const index =
            url.indexOf("&");

        if (index !== -1) {
            url =
                url.substring(0, index);
        }

        const title =
            $(element).find("h3").text().trim() ||
            $(element).text().trim();

        pushResult(title, url);

    });

    //--------------------------------------------------
    // Layout 2
    //--------------------------------------------------

    $("div.g").each((_, element) => {

        const anchor =
            $(element).find("a").first();

        if (!anchor.length) {
            return;
        }

        const href =
            anchor.attr("href");

        if (!href) {
            return;
        }

        const title =
            $(element)
                .find("h3")
                .first()
                .text()
                .trim();

        pushResult(title, href);

    });

    //--------------------------------------------------
    // Layout 3
    //--------------------------------------------------

    $("div.yuRUbf").each((_, element) => {

        const anchor =
            $(element)
                .find("a")
                .first();

        if (!anchor.length) {
            return;
        }

        pushResult(

            anchor.text(),

            anchor.attr("href")

        );

    });

    //--------------------------------------------------
    // Layout 4
    //--------------------------------------------------

    $("h3").each((_, element) => {

        const anchor =
            $(element)
                .closest("a");

        if (!anchor.length) {
            return;
        }

        pushResult(

            $(element).text(),

            anchor.attr("href")

        );

    });

    //--------------------------------------------------
    // Layout 5
    //--------------------------------------------------

    $("a[href^='http']").each((_, element) => {

        pushResult(

            $(element).text(),

            $(element).attr("href")

        );

    });

    return removeDuplicates(results);

}

//====================================================
// Google Search
//====================================================

async function searchGoogle(query = "") {

    log("Google Search", query);

    const html =
        await requestGoogle(query);

    if (!html) {

        return [];

    }

    const results =
        extractGoogleResults(html);

    log(
        "Google Results",
        results.length
    );

    return results;

}


//====================================================
// Extract YouTube Video Id
//====================================================

function extractYouTubeVideoId(url = "") {

    try {

        const parsedUrl = new URL(url);

        //--------------------------------------------------
        // youtube.com/watch?v=
        //--------------------------------------------------

        const videoId =
            parsedUrl.searchParams.get("v");

        if (videoId) {

            return videoId;

        }

        //--------------------------------------------------
        // youtu.be/
        //--------------------------------------------------

        if (
            parsedUrl.hostname.includes("youtu.be")
        ) {

            return parsedUrl.pathname
                .replace("/", "")
                .trim();

        }

        //--------------------------------------------------
        // youtube.com/shorts/
        //--------------------------------------------------

        if (
            parsedUrl.pathname.startsWith("/shorts/")
        ) {

            return parsedUrl.pathname
                .replace("/shorts/", "")
                .split("/")[0];

        }

        //--------------------------------------------------
        // youtube.com/embed/
        //--------------------------------------------------

        if (
            parsedUrl.pathname.startsWith("/embed/")
        ) {

            return parsedUrl.pathname
                .replace("/embed/", "")
                .split("/")[0];

        }

    }

    catch {

        return "";

    }

    return "";

}

//====================================================
// Search YouTube
//====================================================

async function searchYoutube(videoQueries = []) {

    const videos = [];

    for (const query of videoQueries) {

        log("Searching YouTube", query);

        const results =
            await searchGoogle(
                `${query} site:youtube.com`
            );

        console.log("\n==============================");
console.log("GOOGLE RAW RESULTS");
console.log("Query :", query);
console.log("Total :", results.length);
console.dir(results, { depth: null });
console.log("==============================\n");
        
        let added = 0;

        for (const item of results) {

            if (!item.url) {

                continue;

            }

            //--------------------------------------------------
            // Accept only YouTube URLs
            //--------------------------------------------------

            if (

                !item.url.includes("youtube.com") &&

                !item.url.includes("youtu.be")

            ) {

                continue;

            }

            //--------------------------------------------------
            // Extract Video ID
            //--------------------------------------------------

            const videoId =
                extractYouTubeVideoId(
                    item.url
                );

            if (!videoId) {

                continue;

            }

            //--------------------------------------------------
            // Thumbnail
            //--------------------------------------------------

            const thumbnail =
                `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

            //--------------------------------------------------
            // Channel (best effort)
            //--------------------------------------------------

            let channel = "";

            try {

                channel =
                    new URL(item.url).hostname;

            }

            catch {

                channel = "";

            }

            videos.push(

                normalizeVideo({

    title: item.title,

    url: item.url,

    youtubeId: videoId,

    thumbnail,

    channel,

    duration: ""

})
            );

            added++;

            //--------------------------------------------------
            // Maximum 3 per query
            //--------------------------------------------------

            if (added >= 3) {

                break;

            }

        }

    }

    const uniqueVideos =
        removeDuplicates(videos);

    log(
        "Videos Found",
        uniqueVideos.length
    );

    return uniqueVideos.slice(0, 3);

}


//====================================================
// Search PDFs
//====================================================

async function searchPdf(pdfQueries = []) {

    const pdfs = [];

    for (const query of pdfQueries) {

        log("Searching PDF", query);

        const results =
            await searchGoogle(
                `${query} filetype:pdf`
            );

        let added = 0;

        for (const item of results) {

            if (!item.url) {

                continue;

            }

            const lowerUrl =
                item.url.toLowerCase();

            //--------------------------------------------------
            // Accept only PDF URLs
            //--------------------------------------------------

            if (
                !lowerUrl.endsWith(".pdf") &&
                !lowerUrl.includes(".pdf?")
            ) {

                continue;

            }

            pdfs.push(

               normalizePdf({

    title: item.title,

    url: item.url,

    source: (() => {
        try {
            return new URL(item.url).hostname;
        } catch {
            return "";
        }
    })()

})

            );

            added++;

            if (added >= 3) {

                break;

            }

        }

    }

    const uniquePdfs =
        removeDuplicates(pdfs);

    log(
        "PDFs Found",
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

    log(
        "=========================================="
    );

    log("Learning Resource Search Started");

    log("Subject", subject);

    log("Class", className);

    log("Board", board);

    log("Language", language);

    //--------------------------------------------------
    // Remove Empty Queries
    //--------------------------------------------------

    videoQueries =

        Array.from(

            new Set(

                (videoQueries || [])

                    .map(q => (q || "").trim())

                    .filter(Boolean)

            )

        );

    pdfQueries =

        Array.from(

            new Set(

                (pdfQueries || [])

                    .map(q => (q || "").trim())

                    .filter(Boolean)

            )

        );

    //--------------------------------------------------
    // Search
    //--------------------------------------------------

    const [videos, pdfs] =
    await Promise.all([
        searchYoutube(videoQueries),
        searchPdf(pdfQueries)
    ]);
    
    log("Videos", videos.length);

    log("PDFs", pdfs.length);

    log("Learning Resource Search Completed");

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
