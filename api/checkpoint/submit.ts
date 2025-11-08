// api/checkpoint/submit.ts

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { cleanModelText } from '../_lib/cleanModelText.js';
// We NO LONGER need to import the hardcoded checkpoints. This API is now "dumb".

// Helper interface for the expected JSON response from Gemini
interface GraderResponse {
  passed: boolean;
  feedback: string;
}

// --- THIS IS THE NEW, SMARTER PROMPT BUILDER ---
// It uses the "topic" and "type" sent from the frontend
function getGradingPrompt(topic: string, type: 'quiz' | 'project', answerText: string): string {
  
  if (type === 'project') {
    // This is a project submission
    return `
      You are an expert AI tutor acting as an exam grader.
      Your response MUST be in strict JSON format.
      Do not use any markdown or plain text outside of the JSON.

      The learning objective is: "${topic}"
      A student was asked to complete this project, upload it to Google Drive, and share the link.
      
      Here is the student's submission:
      "${answerText}" 
      (This contains their description and the public Google Drive link)

      You cannot open the link.
      Based *only* on the student's description and the fact they provided a link, evaluate if they likely completed the task.
      Be very lenient. If they provided a link and a plausible description, pass them.
      
      Respond with the following JSON structure:
      {
        "passed": true or false,
        "feedback": "A short, one-sentence feedback for the student. If they pass, congratulate them on completing the project."
      }
    `;
  } else {
    // This is a standard quiz submission
    return `
      You are an expert AI tutor acting as an exam grader.
      Your response MUST be in strict JSON format.
      Do not use any markdown or plain text outside of the JSON.

      The learning objective is: "${topic}"
      
      Here is the student's answer:
      "${answerText}"

      Evaluate if the student's answer correctly demonstrates understanding of the learning objective.
      Be lenient; as long as they seem to grasp the core concept, let them pass.
      
      Respond with the following JSON structure:
      {
        "passed": true or false,
        "feedback": "A short, one-sentence feedback for the student, explaining why they passed or what they missed. Keep it friendly and concise."
      }
    `;
  }
}
// --- END OF NEW HELPER FUNCTION ---


export default async function handler(
  req: VercelRequest, 
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // --- NEW: We now get the topic and type *from the frontend* ---
  const { checkpointId, checkpointTopic, checkpointType, answerText } = req.body;

  if (!checkpointId || !checkpointTopic || !checkpointType || answerText === undefined) {
    return res.status(400).json({ error: "Missing required fields (id, topic, type, or answer)" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set.");
    return res.status(500).json({ error: "API key not configured" });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    // 2. Create a specific prompt for grading (now fully dynamic)
    const gradingPrompt = getGradingPrompt(checkpointTopic, checkpointType, answerText);

    // 3. Call Gemini
    const result = await model.generateContent(gradingPrompt);
    const response = result.response;
    let geminiText = response.text();

    // 4. Clean and Parse the JSON response
    geminiText = geminiText.replace(/```json/g, "").replace(/```/g, "").trim();

    let graderResponse: GraderResponse;
    
    try {
      graderResponse = JSON.parse(geminiText);
    } catch (parseError) {
      console.error("Failed to parse JSON from Gemini:", geminiText, parseError);
      return res.status(500).json({ error: "The AI grader gave an invalid response. Please try again." });
    }

    // 5. Clean the feedback text
    graderResponse.feedback = cleanModelText(graderResponse.feedback);

    // 6. Send the structured response back to the frontend
    return res.status(200).json(graderResponse);

  } catch (error) {
    console.error(`Error in /api/checkpoint/submit for checkpoint "${checkpointId}":`, error);
    return res.status(500).json({ error: "Failed to grade submission." });
  }
}