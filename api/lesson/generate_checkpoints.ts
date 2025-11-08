// api/lesson/generate_checkpoints.ts

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { YoutubeTranscript } from 'youtube-transcript';
import { Checkpoint } from '../_lib/config/checkpoints.js'; // We just need the type

// --- HELPER 1: Prompt for transcript-based checkpoints (The "Good" path) ---
function createCheckpointPromptFromTranscript(transcript: string, videoTitle: string): string {
  return `
    You are an expert instructional designer. Your job is to create an interactive learning plan from a video transcript.
    The video is titled: "${videoTitle}".
    Here is the full transcript:
    ---
    ${transcript.substring(0, 10000)}... 
    ---
    (Transcript may be truncated)

    Your task is to analyze this transcript and identify 3 to 5 key learning moments.
    For each moment, create a "Checkpoint".
    
    - "type": "quiz" - Ask a specific, short question about the concept that was just explained.
    - "type": "project" - (Optional, use 1-2 times for longer videos) Give a small task asking the user to practice what they just saw.
    
    You MUST respond in strict JSON format. Do not use markdown.
    The response should be an array of "Checkpoint" objects.
    
    The JSON structure for each object is:
    {
      "id": "string", // A unique ID, e.g., "dyn_cp_1"
      "timeSeconds": number, // The time in seconds (e.g., 120 for 2 minutes)
      "type": "quiz" | "project", // 'quiz' or 'project'
      "topic": "string", // A short title for the checkpoint (e.g., "What is a Variable?")
      "question": "string" // The *actual* question or project task for the student.
    }

    Example Response:
    [
      { "id": "dyn_cp_1", "timeSeconds": 152, "type": "quiz", "topic": "What is HTML", "question": "In one sentence, what does HTML stand for and what is its main purpose?" },
      { "id": "dyn_cp_2", "timeSeconds": 310, "type": "quiz", "topic": "Basic HTML Tags", "question": "What are the two tags that all content on an HTML page must go inside?" },
      { "id": "dyn_cp_3", "timeSeconds": 900, "type": "project", "topic": "Build a Simple Page", "question": "Create a new 'index.html' file. Add a heading (h1) and a paragraph (p). Upload it to Google Drive and share the link." }
    ]

    Now, generate the checkpoints for the provided transcript.
  `;
}

// --- HELPER 2: Prompt for title-based checkpoints (The "Fallback" path) ---
function createCheckpointPromptFromTitle(videoTitle: string): string {
  return `
    You are an expert instructional designer. A video transcript was unavailable.
    Your job is to create an interactive learning plan based ONLY on the video's title.
    The video is titled: "${videoTitle}".

    Your task is to *guess* 3 to 4 logical sub-topics and appropriate timestamps (in seconds) for them.
    Assume the video is a standard tutorial, about 10-20 minutes long.
    
    1. Create 3 "quiz" checkpoints. For the "question", ask a specific, high-level question about that topic.
    2. Create 1 final "project" checkpoint. For the "question", give a simple task related to the video title.
    
    You MUST respond in strict JSON format. Do not use markdown.
    
    Example for "Learn CSS Grid":
    [
      { "id": "dyn_cp_1", "timeSeconds": 180, "type": "quiz", "topic": "What is CSS Grid", "question": "What is the main difference between CSS Grid and Flexbox?" },
      { "id": "dyn_cp_2", "timeSeconds": 420, "type": "quiz", "topic": "Grid Template Columns & Rows", "question": "What is the 'fr' unit and how is it used in grid templates?" },
      { "id": "dyn_cp_3", "timeSeconds": 700, "type": "quiz", "topic": "Grid Align & Justify", "question": "What's the difference between 'align-items' and 'justify-content' in a grid?" },
      { "id": "dyn_cp_4", "timeSeconds": 900, "type": "project", "topic": "Build a Simple Grid Layout", "question": "Create a simple 3x2 grid layout. Upload the HTML/CSS to Google Drive and share the link." }
    ]

    Now, generate the checkpoints for the video titled: "${videoTitle}".
  `;
}

// --- HELPER 3: The main generation function ---
async function generateDynamicCheckpoints(videoId: string, videoTitle: string, genAI: GoogleGenerativeAI): Promise<Checkpoint[]> {
  let transcript = "";
  let prompt = "";

  // 1. TRY to get the transcript
  try {
    console.log(`Attempting to fetch transcript for video: ${videoId}`);
    const transcriptData = await YoutubeTranscript.fetchTranscript(videoId);
    if (transcriptData && transcriptData.length > 0) {
      transcript = transcriptData.map(t => t.text).join(' ');
      prompt = createCheckpointPromptFromTranscript(transcript, videoTitle);
      console.log(`Successfully fetched transcript for ${videoId}.`);
    } else {
      console.warn(`No transcript found for ${videoId}. Falling back to title-based generation.`);
      prompt = createCheckpointPromptFromTitle(videoTitle);
    }
  } catch (error: any) {
    console.warn(`Error fetching transcript for ${videoId}: ${error.message}. Falling back to title-based generation.`);
    prompt = createCheckpointPromptFromTitle(videoTitle);
  }

  // 2. Call Gemini with whatever prompt we ended up with
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    let jsonText = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();

    // 3. Parse Checkpoints
    let checkpoints: Checkpoint[] = JSON.parse(jsonText);
    
    // 4. Clean and return
    checkpoints = checkpoints.map((cp, index) => ({
      ...cp,
      id: `dyn_${videoId}_${index}`,
      timeSeconds: Math.floor(cp.timeSeconds) // Ensure it's an integer
    }));

    console.log(`Successfully generated ${checkpoints.length} checkpoints for ${videoId}`);
    return checkpoints;

  } catch (error) {
    console.error(`Failed to generate any checkpoints for ${videoId}:`, error);
    return []; // Return empty array on total failure
  }
}


// --- MAIN API HANDLER ---
export default async function handler(
  req: VercelRequest, 
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { videoId, videoTitle } = req.body;

  if (!videoId || !videoTitle) {
    return res.status(400).json({ error: "Missing videoId or videoTitle" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set.");
    return res.status(500).json({ error: "API key not configured" });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const checkpoints = await generateDynamicCheckpoints(videoId, videoTitle, genAI);
  return res.status(200).json({ checkpoints });
}