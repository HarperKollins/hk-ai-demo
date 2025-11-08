// api/gemini.ts

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { cleanModelText } from './_lib/cleanModelText.js';
import { checkVideoAvailability } from './_lib/youtube.js';
// --- THIS IS THE FIX ---
// The path must start with "./" not "../"
import { getTopicBySlug } from './_lib/config/freeCodeCampTopics.js'; 

import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  Content,
} from "@google/generative-ai";

// --- checkVideoAvailability function is in _lib/youtube.ts ---

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
      
      **FORMATTING RULES:**
      Always respond in plain text only. Do not use markdown. Do not use asterisks or underscores.

      **--- SPECIAL COMMANDS ---**

      **1. LESSON REQUEST:**
      If the user's message is a request to start a lesson (e.g., "teach me html", "i want to learn python", "show me a video on css"), you MUST respond with ONLY the following special tag:
      \`LESSON::[topic_slug]\`
      
      * "teach me html" -> \`LESSON::html_basics\`
      * "i want to learn python" -> \`LESSON::python_intro\`
      * "show me css grid" -> \`LESSON::css_grid\` (This will trigger a dynamic search)

      **2. VIDEO REQUEST (YT_VIDEO):**
      If the user *only* asks for a simple video embed (e.g., "show me a cool video", "what's that video you mentioned?"), use the \`YT_VIDEO\` tag:
      \`YT_VIDEO::[VIDEO_ID]\`
      
      **3. NORMAL CHAT:**
      For any other conversation, just respond with helpful, conversational text.`,
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
      
      // Check for our special tags
      const lessonMatch = text.match(/LESSON::([\w-]+)/);
      const videoMatch = text.match(/YT_VIDEO::([\w-]+)/);

      if (lessonMatch) {
        // AI wants to start a lesson
        console.log(`Gemini responded with lesson tag: ${lessonMatch[1]}`);
        return res.status(200).json({ type: 'lesson', data: lessonMatch[1] });
      
      } else if (videoMatch) {
        // AI wants to embed a simple video
        const videoId = videoMatch[1]; 
        const videoData = await checkVideoAvailability(videoId);

        if (videoData) {
          return res.status(200).json({ type: 'video', data: videoData });
        } else {
          attempts++;
          currentMessage = "That video ID was unavailable. Please find a *different* one.";
        }
      } else {
        // It's a normal text response
        const cleanedText = cleanModelText(text);
        return res.status(200).json({ type: 'text', data: cleanedText });
      }
    }
    
    const fallbackMessage = "I'm having trouble finding that resource. Can I help with a text explanation instead?";
    return res.status(200).json({ 
      type: 'text', 
      data: cleanModelText(fallbackMessage)
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to process chat" });
  }
}