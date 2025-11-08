// api/_lib/youtube.ts

// This function checks if a YouTube video is public and embeddable
export async function checkVideoAvailability(videoId: string) {
  const YOUTUBE_KEY = process.env.YOUTUBE_API_KEY;
  if (!YOUTUBE_KEY) {
    console.error("YOUTUBE_API_KEY is not set.");
    return null; // Fail safe
  }

  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,status,contentDetails&id=${videoId}&key=${YOUTUBE_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`YouTube API check failed for ${videoId}: ${response.status}`);
      return null;
    }

    const data = (await response.json()) as any;

    if (!data.items || data.items.length === 0) {
      console.log(`Video check FAILED for ${videoId}: Video does not exist.`);
      return null;
    }

    const video = data.items[0];

    if (
      video.status.privacyStatus !== "public" ||
      video.status.embeddable !== true ||
      video.status.uploadStatus !== "processed" ||
      (video.contentDetails && video.contentDetails.regionRestriction)
    ) {
      console.log(`Video check FAILED for ${videoId}: Not embeddable or is private/restricted.`);
      return null;
    }

    console.log(`Video check SUCCESS for ${videoId}`);
    
    return {
      videoId: video.id,
      title: video.snippet.title,
      thumbnailUrl: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url,
    };

  } catch (error) {
    console.error(`Video check ERROR for ${videoId}:`, error);
    return null;
  }
}