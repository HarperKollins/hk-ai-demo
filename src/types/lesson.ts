// src/types/lesson.ts

export type CheckpointType = "quiz" | "project";

export interface Checkpoint {
  id: string;
  videoId: string;
  timeSeconds: number;
  type: CheckpointType;
  topic: string; // The "title" of the quiz
  question: string; // <-- THIS IS THE NEW, MOST IMPORTANT FIELD
}

// This defines the "shape" of the video data
export interface VideoData {
  videoId: string;
  title: string;
  thumbnailUrl: string;
}

// This is the "shape" of the full lesson payload from /api/lesson/get
export interface LessonPayload {
  videoData: VideoData;
  checkpoints: Checkpoint[];
  source: string;
}