const axios = require('axios');

// YouTube Search page se data parse karne ke liye function
async function searchYouTubeVideos(query) {
    try {
        const encodedQuery = encodeURIComponent(query);
        const url = `https://www.youtube.com/results?search_query=${encodedQuery}`;

        const response = await axios.get(url, {

    timeout: 15000,

    headers: {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        });

        const html = response.data;
        
        // ytInitialData ko extract karne ke liye regex
       const match = html.match(
    /(?:var\s+)?ytInitialData\s*=\s*(\{.*?\});/s
);
        if (!match) {
            throw new Error('ytInitialData not found on the page structure.');
        }

        const ytInitialData = JSON.parse(match[1]);
        
        // JSON path traverse karke video results nikalna
        const contents = ytInitialData
            ?.contents?.twoColumnSearchResultsRenderer
            ?.primaryContents?.sectionListRenderer
            ?.contents?.[0]?.itemSectionRenderer
            ?.contents;

        if (!contents) {
            return [];
        }

        const videos = [];

        for (const item of contents) {
            if (item.videoRenderer) {
                const videoData = item.videoRenderer;
                videos.push({
                    videoId: videoData.videoId,
                    title: videoData.title?.runs?.[0]?.text || '',
                    duration: videoData.lengthText?.simpleText || 'N/A',
                    thumbnail: videoData.thumbnail?.thumbnails?.pop()?.url || "",
                    channelTitle: videoData.ownerText?.runs?.[0]?.text || '',
                    videoUrl: `https://www.youtube.com/watch?v=${videoData.videoId}`
                });
            }
        }

       return videos.slice(0, 3);
    } catch (error) {
        console.error('Error parsing YouTube data:', error.message);
        return [];
    }
}

module.exports = { searchYouTubeVideos };
