// src/components/VideoLessonPlayer.tsx

import React, { useEffect, useRef, useState } from 'react';
import YouTube from 'react-youtube';
import type { YouTubePlayer } from 'react-youtube';
import { Checkpoint } from '@/types/lesson'; // We created this type in the last step

// This defines the functions this component needs from its parent
interface VideoLessonPlayerProps {
  videoId: string;
  checkpoints: Checkpoint[]; // The list of pause times
  onCheckpointReached: (checkpoint: Checkpoint) => void; // Function to call when we pause
  onReady: () => void; // Function to call when the player is loaded
  onTimeUpdate: (time: number) => void; // Function to send the current time back
  startTime: number; // Where to start the video
}

// This defines the functions the PARENT can call on this component (e.g., "playVideo")
export interface VideoPlayerHandle {
  playVideo: () => void;
  pauseVideo: () => void;
}

// Use React.forwardRef to allow parent to access player functions
export const VideoLessonPlayer = React.forwardRef<
  VideoPlayerHandle,
  VideoLessonPlayerProps
>(
  (
    {
      videoId,
      checkpoints,
      onCheckpointReached,
      onReady,
      onTimeUpdate,
      startTime,
    },
    ref
  ) => {
    const playerRef = useRef<YouTubePlayer | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    
    // We need to keep track of which checkpoints we've already triggered
    // so we don't pause 100 times for the same one.
    const [triggeredCheckpoints, setTriggeredCheckpoints] = useState<Set<string>>(new Set());

    // This exposes our `playVideo` function to the parent (ChatInterface)
    // So the parent can tell the video to resume after the quiz is done.
    React.useImperativeHandle(ref, () => ({
      playVideo: () => {
        playerRef.current?.playVideo();
      },
      pauseVideo: () => {
        playerRef.current?.pauseVideo();
      }
    }));

    // Find the next checkpoint that hasn't been triggered yet
    const getNextCheckpoint = () => {
      // Find the next checkpoint in the list that isn't in our "triggered" set
      return checkpoints.find(cp => !triggeredCheckpoints.has(cp.id));
    };

    // This function runs every 1 second while the video is playing
    const startWatcher = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(() => {
        const player = playerRef.current;
        if (!player || typeof player.getCurrentTime !== 'function') {
          return;
        }

        const currentTime = Math.floor(player.getCurrentTime());
        onTimeUpdate(currentTime); // Send the time to the parent (for saving progress)

        const nextCheckpoint = getNextCheckpoint();

        // Check if we hit the next checkpoint time
        if (nextCheckpoint && currentTime >= nextCheckpoint.timeSeconds) {
          player.pauseVideo(); // PAUSE!
          // Add this ID to the set so we don't trigger it again
          setTriggeredCheckpoints(prev => new Set(prev).add(nextCheckpoint.id));
          onCheckpointReached(nextCheckpoint); // Tell the parent to open the quiz modal
        }
      }, 1000); // Check every second
    };

    const stopWatcher = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };

    // This runs when the YouTube player first loads
    const onPlayerReady = (event: { target: YouTubePlayer }) => {
      playerRef.current = event.target;
      if (startTime > 0) {
        playerRef.current.seekTo(startTime, true);
      }
      onReady();
    };

    // This runs when the player state changes (play, pause, etc.)
    const onPlayerStateChange = (event: { data: number }) => {
      if (event.data === 1) { // 1 = Playing
        startWatcher(); // Start watching the time
      } else { // 0 = Ended, 2 = Paused, etc.
        stopWatcher(); // Stop watching
      }
    };

    // YouTube player options
    const playerOptions = {
      // We removed height/width, it will now fill its container
      playerVars: {
        autoplay: 1, // Start playing immediately
        modestbranding: 1, // Hide YouTube logo
        rel: 0, // Don't show related videos
        fs: 1, // Enable fullscreen
        enablejsapi: 1, // IMPORTANT: Allows us to control the player
        start: startTime, // Tell player where to start
      },
    };

    // Clean up the interval when the component is removed
    useEffect(() => {
      return () => {
        stopWatcher();
      };
    }, []);
    
    // Reset triggered checkpoints if the videoId changes
    useEffect(() => {
      setTriggeredCheckpoints(new Set());
    }, [videoId])

    return (
      // --- THIS IS THE FIX ---
      // We removed "aspect-video" and are letting the parent control the size
      <div className="w-full h-full bg-black rounded-lg overflow-hidden relative">
        <YouTube
          videoId={videoId}
          opts={playerOptions}
          onReady={onPlayerReady}
          onStateChange={onPlayerStateChange}
          className="w-full h-full" // Fills the container
          iframeClassName="absolute top-0 left-0 w-full h-full"
        />
      </div>
    );
  }
);