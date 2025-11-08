// api/lesson/get.ts

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getTopicBySlug } from '../_lib/config/freeCodeCampTopics.js';
import { getCheckpointsForVideo } from '../_lib/config/checkpoints.js';
import { checkVideoAvailability } from '../_lib/youtube.js';
import { GoogleGenerativeAI } from "@google/generative-ai";

// This file is now MUCH FASTER.
// It NO LONGER generates checkpoints.
// It just finds the video and returns it.

export default async function handler(
  req: VercelRequest, 
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { topicSlug } = req.body;

  if (typeof topicSlug !== 'string') {
    return res.status(400).json({ error: "Invalid request, 'topicSlug' must be a string." });
  }

  try {
    // === 1. CHECK PREFERRED LIST (freeCodeCamp) ===
    const preferredTopic = getTopicBySlug(topicSlug);

    if (preferredTopic) {
      console.log(`Found preferred topic for "${topicSlug}": ${preferredTopic.youtubeVideoId}`);
      const videoData = await checkVideoAvailability(preferredTopic.youtubeVideoId);
      
      if (!videoData) {
        console.error(`CRITICAL: Preferred video ${preferredTopic.youtubeVideoId} for slug "${topicSlug}" is unavailable!`);
        return res.status(503).json({ error: "Preferred video for this topic is currently unavailable." });
      }

      // Video is good! Get its *hardcoded* checkpoints.
      const checkpoints = getCheckpointsForVideo(videoData.videoId);

      return res.status(200).json({
        videoData: videoData,
        checkpoints: checkpoints, // Send the hardcoded checkpoints
        source: 'freecodecamp_config'
      });
    }

    // === 2. DYNAMIC YOUTUBE SEARCH (If not in config) ===
    console.log(`No preferred topic found for slug: "${topicSlug}". Falling back to dynamic search...`);
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a YouTube search expert. Find the best YouTube search query for a high-quality, full tutorial video on the topic: "${topicSlug}".
Prioritize the "freeCodeCamp.org" channel.
Respond with ONLY the search query text and nothing else.
For example, if the topic is "CSS Flexbox", a good response would be "css flexbox tutorial freecodecamp".

Topic: "${topicSlug}"
Search Query:`;

    let searchResult = await model.generateContent(prompt);
    let searchQuery = searchResult.response.text().trim().replace(/"/g, ""); 

    console.log(`Gemini suggested search query: "${searchQuery}"`);

    const YOUTUBE_KEY = process.env.YOUTUBE_API_KEY;
    if (!YOUTUBE_KEY) throw new Error("YOUTUBE_API_KEY is not set");

    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=5&key=${YOUTUBE_KEY}`;
    
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) throw new Error("YouTube Search API failed");
    
    const searchData = await searchResponse.json() as any;
    if (!searchData.items || searchData.items.length === 0) {
      return res.status(404).json({ error: `Sorry, I couldn't find any videos for "${topicSlug}".` });
    }

    // Find the first available video from the search results
    for (const item of searchData.items) {
      const videoId = item.id.videoId;
      const videoData = await checkVideoAvailability(videoId);
      
      if (videoData) {
        console.log(`Found dynamic video: ${videoData.title}`);
        
        // --- THIS IS THE FIX ---
        // We return the video IMMEDIATELY.
        // We send an EMPTY checkpoint list.
        // The frontend will be responsible for fetching them.
        return res.status(200).json({
          videoData: videoData,
          checkpoints: [], // Send empty array *for now*
          source: 'youtube_dynamic_search'
        });
      }
    }

    return res.status(404).json({ 
      error: `Sorry, I found videos for "${topicSlug}", but none seem to be available for embedding.` 
    });

  } catch (error: any) {
    console.error(`Error in /api/lesson/get for slug "${topicSlug}":`, error);
    return res.status(500).json({ error: error.message || "Failed to get lesson data." });
  }
}