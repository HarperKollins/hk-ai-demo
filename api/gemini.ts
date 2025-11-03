// Import Vercel's Node.js types
import type { VercelRequest, VercelResponse } from '@vercel/node';

import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  Content,
} from "@google/generative-ai";

// --- NEW FUNCTION TO CHECK YOUTUBE VIDEO STATUS (Your Layer 2) ---
async function checkVideoAvailability(videoId: string): Promise<boolean> {
  const YOUTUBE_KEY = process.env.YOUTUBE_API_KEY;
  if (!YOUTUBE_KEY) {
    console.error("YOUTUBE_API_KEY is not set.");
    return false; // Fail safe
  }

  // This is the URL from your research: videos.list
  const url = `https://www.googleapis.com/youtube/v3/videos?part=status,contentDetails&id=${videoId}&key=${YOUTUBE_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`YouTube API check failed for ${videoId}: ${response.status}`);
      return false; // 404 Not Found, etc.
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      console.log(`Video check FAILED for ${videoId}: Video does not exist.`);
      return false; // Video ID is invalid
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
      return false;
    }

    console.log(`Video check SUCCESS for ${videoId}`);
    return true; // The video is good!

  } catch (error) {
    console.error(`Video check ERROR for ${videoId}:`, error);
    return false;
  }
}
// --- END OF NEW FUNCTION ---


export default async function handler(
  req: VercelRequest, 
  res: VercelResponse
) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Get the initial user message and history
    let { history, message } = req.body;

    const apiKey = process.env.GEMINI_API_KEY; 

    if (!apiKey) {
      console.error("GEMINI_API_KEY is not set.");
      return res.status(500).json({ error: "API key not configured" });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash", // Your working model
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

    // Format the initial history
    const chatHistory: Content[] = history.map((msg: { role: string; content: string }) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // Start the chat session
    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        maxOutputTokens: 1000,
      },
    });

    // --- THIS IS THE CORRECTED "SELF-CORRECTION" LOOP ---
    
    let currentMessage = message; // This is the user's first message
    let attempts = 0;
    const MAX_ATTEMPTS = 3; 

    while (attempts < MAX_ATTEMPTS) {
      // Send the user's message (or our "try again" message)
      const result = await chat.sendMessage(currentMessage);
      const response = result.response;
      const text = response.text();

      // Check if the AI suggested a video
      if (text.startsWith("YT_VIDEO::")) {
        const videoId = text.replace("YT_VIDEO::", "");
        
        // --- CHECK THE VIDEO ---
        const isAvailable = await checkVideoAvailability(videoId);

        if (isAvailable) {
          // SUCCESS! The video is real. Send it to the user.
          // We don't need to push to history, chat.sendMessage did it.
          return res.status(200).json({ text });
        } else {
          // FAIL! The video is dead.
          attempts++;
          
          // Prepare the *next* message to send to the AI
          currentMessage = "That video ID you provided was unavailable, private, or region-locked. Please find a *different* one from a popular, active channel.";
          
          // The loop will continue, and chat.sendMessage will be called with this new message.
          // This automatically adds both the AI's bad response and our new "user" message to the history.
        }
      } else {
        // It was a normal text response, not a video.
        // Send it to the user immediately.
        return res.status(200).json({ text });
      }
    }
    
    // If we tried 3 times and still failed, give up and send a text message.
    return res.status(200).json({ text: "I'm trying to find a good video for you, but the ones I'm finding seem to be unavailable. Can I help with a text explanation instead?" });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to process chat" });
  }
}