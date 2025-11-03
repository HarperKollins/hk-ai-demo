'use client';

import React, { useState } from 'react';
import YouTube from 'react-youtube';

// Define the shape of the video data we expect
interface VideoData {
  videoId: string;
  title: string;
  thumbnailUrl: string;
}

interface YouTubeEmbedProps {
  videoData: VideoData;
}

const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({ videoData }) => {
  // State to track if the user has clicked "play"
  const [isPlaying, setIsPlaying] = useState(false);

  // This function is called when the user clicks the thumbnail
  const handlePlay = () => {
    setIsPlaying(true);
  };

  // --- (FIXED) ---
  // Merged the two 'playerVars' objects into one.
  const playerOptions = {
    height: '270', // These dimensions will be controlled by CSS
    width: '480',
    playerVars: {
      autoplay: 1, // Start playing immediately
      modestbranding: 1,
      rel: 0, // Don't show related videos
      fs: 1, // Enable fullscreen button (which also enables PiP)
    },
  };

  return (
    <div className="youtube-embed-container">
      {!isPlaying ? (
        // STATE 1: The Rich Preview (like your screenshot)
        <div className="youtube-preview" onClick={handlePlay} role="button" tabIndex={0}>
          <img 
            src={videoData.thumbnailUrl} 
            alt={videoData.title} 
            className="youtube-thumbnail" 
          />
          <div className="play-button-overlay">
            {/* SVG Play Button Icon */}
            <svg className="play-icon" viewBox="0 0 68 48">
              <path d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.0 34 0 34 0S12.21 0 6.9 1.55c-2.93.78-4.63 3.26-5.42 6.19C.0 13.26 0 24 0 24s0 10.74 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 48 34 48 34 48s21.79 0 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C68 34.74 68 24 68 24s0-10.74-1.48-16.26z"></path>
              <path d="M 27 35.5l17 -11.5l-17 -11.5z" fill="#fff"></path>
            </svg>
          </div>
          <div className="video-info">
            <p className="video-title">{videoData.title}</p>
            <p className="video-source">YouTube</p>
          </div>
        </div>
      ) : (
        // STATE 2: The Actual Player (Loads after click)
        <div className="youtube-player-wrapper">
          <YouTube
            videoId={videoData.videoId}
            opts={playerOptions}
            iframeClassName="youtube-iframe"
            // --- (FIXED) ---
            // Removed the invalid 'allow' prop from here.
            // The 'fs: 1' in playerVars handles enabling the
            // button for Picture-in-Picture.
            onReady={(event) => event.target.unMute()}
            onError={() => {
              console.error('YouTube video playback error. It might be unavailable.');
              setIsPlaying(false); // Go back to thumbnail
            }}
          />
        </div>
      )}
    </div>
  );
};

export default YouTubeEmbed;