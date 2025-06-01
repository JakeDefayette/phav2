'use client';

import React, { useRef, useState, useEffect } from 'react';
import { VideoPlayerProps } from '../../types';

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  autoplay = false,
  controls = true,
  className = '',
  onPlay,
  onPause,
  onEnded,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration);
      setError(null);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      onPlay?.();
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    const handleError = () => {
      setError(
        'Failed to load video. Please check your connection and try again.'
      );
    };

    const handleVolumeChange = () => {
      setVolume(videoElement.volume);
      setIsMuted(videoElement.muted);
    };

    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('ended', handleEnded);
    videoElement.addEventListener('error', handleError);
    videoElement.addEventListener('volumechange', handleVolumeChange);

    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('ended', handleEnded);
      videoElement.removeEventListener('error', handleError);
      videoElement.removeEventListener('volumechange', handleVolumeChange);
    };
  }, [onPlay, onPause, onEnded]);

  const togglePlay = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isPlaying) {
      videoElement.pause();
    } else {
      videoElement.play();
    }
  };

  const seek = (time: number) => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    videoElement.currentTime = time;
    setCurrentTime(time);
  };

  const changeVolume = (newVolume: number) => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    videoElement.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    videoElement.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (!isFullscreen) {
      if (videoElement.requestFullscreen) {
        videoElement.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const formatTime = (timeInSeconds: number): string => {
    if (isNaN(timeInSeconds)) return '0:00';

    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (error) {
    return (
      <div
        className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}
      >
        <div className='aspect-video flex items-center justify-center'>
          <div className='text-center text-white'>
            <svg
              className='w-12 h-12 mx-auto mb-4 text-red-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
            <h3 className='text-lg font-medium mb-2'>Video Error</h3>
            <p className='text-gray-300 text-sm'>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative bg-black rounded-lg overflow-hidden group ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={video.file_url}
        autoPlay={autoplay}
        muted={autoplay} // Autoplay requires muted
        className='w-full h-full'
        poster={video.thumbnail_url}
        preload='metadata'
      />

      {/* Custom Controls Overlay */}
      {controls && (
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}
        >
          {/* Play/Pause Button Overlay */}
          <div className='absolute inset-0 flex items-center justify-center'>
            <button
              onClick={togglePlay}
              className='w-16 h-16 bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110'
            >
              {isPlaying ? (
                <svg
                  className='w-6 h-6 text-white'
                  fill='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path d='M6 4h4v16H6V4zm8 0h4v16h-4V4z' />
                </svg>
              ) : (
                <svg
                  className='w-6 h-6 text-white ml-1'
                  fill='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path d='M8 5v14l11-7z' />
                </svg>
              )}
            </button>
          </div>

          {/* Bottom Controls */}
          <div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4'>
            {/* Progress Bar */}
            <div className='mb-4'>
              <div className='flex items-center space-x-2 text-white text-sm'>
                <span>{formatTime(currentTime)}</span>
                <div className='flex-1'>
                  <div className='relative h-2 bg-gray-600 rounded-full overflow-hidden'>
                    <div
                      className='h-full bg-blue-500 transition-all duration-150'
                      style={{ width: `${progressPercentage}%` }}
                    />
                    <input
                      type='range'
                      min='0'
                      max={duration}
                      value={currentTime}
                      onChange={e => seek(Number(e.target.value))}
                      className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
                    />
                  </div>
                </div>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-4'>
                {/* Play/Pause */}
                <button
                  onClick={togglePlay}
                  className='text-white hover:text-blue-400 transition-colors'
                >
                  {isPlaying ? (
                    <svg
                      className='w-5 h-5'
                      fill='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path d='M6 4h4v16H6V4zm8 0h4v16h-4V4z' />
                    </svg>
                  ) : (
                    <svg
                      className='w-5 h-5'
                      fill='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path d='M8 5v14l11-7z' />
                    </svg>
                  )}
                </button>

                {/* Volume Controls */}
                <div className='flex items-center space-x-2'>
                  <button
                    onClick={toggleMute}
                    className='text-white hover:text-blue-400 transition-colors'
                  >
                    {isMuted || volume === 0 ? (
                      <svg
                        className='w-5 h-5'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z'
                        />
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2'
                        />
                      </svg>
                    ) : (
                      <svg
                        className='w-5 h-5'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z'
                        />
                      </svg>
                    )}
                  </button>
                  <input
                    type='range'
                    min='0'
                    max='1'
                    step='0.1'
                    value={isMuted ? 0 : volume}
                    onChange={e => changeVolume(Number(e.target.value))}
                    className='w-20 h-1 bg-gray-600 rounded-lg appearance-none slider'
                  />
                </div>
              </div>

              {/* Right Controls */}
              <div className='flex items-center space-x-4'>
                {/* Fullscreen */}
                <button
                  onClick={toggleFullscreen}
                  className='text-white hover:text-blue-400 transition-colors'
                >
                  <svg
                    className='w-5 h-5'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4'
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Info Overlay (Top) */}
      <div
        className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black to-transparent p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
      >
        <h3 className='text-white font-medium text-lg'>{video.title}</h3>
        {video.description && (
          <p className='text-gray-300 text-sm mt-1 line-clamp-2'>
            {video.description}
          </p>
        )}
      </div>
    </div>
  );
};
