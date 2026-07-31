//=====================================================
// Learning Resource Helper
// Gemini already returns videos & pdfs.
// No external search APIs are used.
//=====================================================

const normalizeVideos = (videos = []) => {

    if (!Array.isArray(videos)) {
        return [];
    }

    return videos
        .filter(video =>
            video &&
            typeof video.url === "string" &&
            video.url.trim() !== ""
        )
        .map(video => ({

            title:
                video.title || "",

            url:
                video.url || "",

            youtubeId:
                extractYoutubeId(video.url),

            thumbnail:
                buildThumbnail(video.url),

            channel:
                video.channel || "",

            duration:
                video.duration || ""

        }));

};

const normalizePdfs = (pdfs = []) => {

    if (!Array.isArray(pdfs)) {
        return [];
    }

    return pdfs
        .filter(pdf =>
            pdf &&
            typeof pdf.url === "string" &&
            pdf.url.trim() !== ""
        )
        .map(pdf => ({

            title:
                pdf.title || "",

            url:
                pdf.url || "",

            source:
                pdf.source || ""

        }));

};

function extractYoutubeId(url = "") {

    if (!url) return "";

    const match =
        url.match(
            /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/i
        );

    return match
        ? match[1]
        : "";

}

function buildThumbnail(url = "") {

    const id =
        extractYoutubeId(url);

    if (!id) {
        return "";
    }

    return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

}

module.exports = {

    normalizeVideos,

    normalizePdfs

};
