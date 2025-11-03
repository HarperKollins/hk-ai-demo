import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest, 
  res: VercelResponse
) {
  const apiKey = process.env.GEMINI_API_KEY;

  console.log("--- TEST API ---");
  console.log("Is GEMINI_API_KEY set?", apiKey ? "YES" : "NO");
  console.log("Full Key (first 5 chars):", apiKey ? apiKey.substring(0, 5) : "undefined");
  console.log("--- END TEST ---");

  if (apiKey) {
    res.status(200).send("SUCCESS: The API key was found!");
  } else {
    res.status(500).send("FAILURE: The server could not find the GEMINI_API_KEY.");
  }
}