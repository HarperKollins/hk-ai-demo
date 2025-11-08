// src/config/checkpoints.ts

export type CheckpointType = "quiz" | "project";

export interface Checkpoint {
  id: string;
  videoId: string;
  timeSeconds: number; // The time in seconds to pause the video
  type: CheckpointType;
  topic: string; // The topic for the AI to ask about
}

// Checkpoints for the freeCodeCamp HTML video ("dD2EISBDjWM")
export const videoCheckpoints: Checkpoint[] = [
  {
    id: "html_cp1_quiz",
    videoId: "dD2EISBDjWM",
    timeSeconds: 120, // Pause at 2:00
    type: "quiz",
    topic: "Introduction to HTML and basic tags"
  },
  {
    id: "html_cp2_quiz",
    videoId: "dD2EISBDjWM",
    timeSeconds: 480, // Pause at 8:00
    type: "quiz",
    topic: "HTML Headings and Paragraphs"
  },
  {
    id: "html_cp3_project",
    videoId: "dD2EISBDjWM",
    timeSeconds: 900, // Pause at 15:00
    type: "project",
    topic: "Simple HTML Page Project"
  }
];

// Helper function to get the correct checkpoints for a video
export const getCheckpointsForVideo = (videoId: string) => {
  return videoCheckpoints
    .filter(cp => cp.videoId === videoId)
    .sort((a, b) => a.timeSeconds - b.timeSeconds); // Ensure they are in order
};