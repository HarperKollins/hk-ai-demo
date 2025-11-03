// Import Vercel's Node.js types
import type { VercelRequest, VercelResponse } from '@vercel/node';

import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  Content,
} from "@google/generative-ai";

// --- (MODIFIED) FUNCTION TO CHECK YOUTUBE VIDEO STATUS ---
// This now returns the full video data object, not just 'true'
async function checkVideoAvailability(videoId: string) {
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
      return null; // 404 Not Found, etc.
    }

    const data = (await response.json()) as any; // Cast as 'any' to easily access properties

    if (!data.items || data.items.length === 0) {
      console.log(`Video check FAILED for ${videoId}: Video does not exist.`);
      return null; // Video ID is invalid
    }

    const video = data.items[0];

    // Check all the properties you mentioned
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
    
    // --- (NEW) RETURN THE FULL DATA OBJECT ---
    return {
      videoId: video.id,
      title: video.snippet.title,
      thumbnailUrl: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url, // Get best thumbnail
    };

  } catch (error) {
    console.error(`Video check ERROR for ${videoId}:`, error);
    return null;
  }
}
// --- END OF MODIFIED FUNCTION ---


export default async function handler(
  req: VercelRequest, 
  res: VercelResponse
) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: "Method not allowed" });
    }

    let { history, message } = req.body;

    const apiKey = process.env.GEMINI_API_KEY; 

    if (!apiKey) {
      console.error("GEMINI_API_KEY is not set.");
      return res.status(500).json({ error: "API key not configured" });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: `You are HK AI, a personal AI mentor. Your goal is to help users discover skills, create learning paths, and monetize their talents.
      
      Your first message (the greeting) has already been sent to the user. This is the user's first *reply*. 
      **DO NOT introduce yourself again.** Just continue the conversation naturally.
      
      **Be concise and impactful.** Keep your responses short and to the point, but maintain a friendly, "chill" tone. Avoid long, wordy paragraphs.
      
      **IMPORTANT VIDEO RULES:**
      1.  When you believe a YouTube video is helpful, you MUST respond with the following special format AND nothing else:
          \`YT_VIDEO::[VIDEO_ID]\`
      2.  **NEVER** invent a video ID.
      3.  Try to suggest videos from popular, well-known, and active channels (like freeCodeCamp, The Net Ninja, Fireship, etc.). These videos are less likely to be unavailable.
      
      For example: \`YT_VIDEO::jfKfPfyJRdk\`
      
      Otherwise, just respond with helpful, conversational text.`,
    });

    const chatHistory: Content[] = history.map((msg: { role: string; content: string }) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        maxOutputTokens: 1000,
      },
    });
    
    let currentMessage = message;
    let attempts = 0;
    const MAX_ATTEMPTS = 3; 

    while (attempts < MAX_ATTEMPTS) {
      const result = await chat.sendMessage(currentMessage);
      const response = result.response;
      const text = response.text();

      if (text.startsWith("YT_VIDEO::")) {
        const videoId = text.replace("YT_VIDEO::", "");
        
        // --- (MODIFIED) CHECK THE VIDEO ---
        const videoData = await checkVideoAvailability(videoId);

        if (videoData) {
          // SUCCESS! The video is real. Send the rich data object.
          return res.status(200).json({ type: 'video', data: videoData });
        } else {
          // FAIL! The video is dead.
          attempts++;
          currentMessage = "That video ID you provided was unavailable, private, or region-locked. Please find a *different* one from a popular, active channel.";
        }
      } else {
        // It was a normal text response.
        // --- (MODIFIED) Send it in the new JSON format ---
        return res.status(200).json({ type: 'text', data: text });
      }
    }
    
    // If we tried 3 times and still failed, give up.
    return res.status(200).json({ 
      type: 'text', 
      data: "I'm trying to find a good video for you, but the ones I'm finding seem to be unavailable. Can I help with a text explanation instead?" 
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to process chat" });
  }
}