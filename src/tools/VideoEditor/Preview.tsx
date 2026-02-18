import React, { useEffect, useRef, useCallback } from 'react';

interface PreviewProps {
  previewVideoRef: React.RefObject<HTMLVideoElement | null>;
  currentTime: number;
  totalDuration: number;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  clipsLength: number;
}

const Preview: React.FC<PreviewProps> = ({
  previewVideoRef,
  currentTime,
  totalDuration,
  isPlaying,
  onPlay,
  onPause,
  onSeek,
  clipsLength,
}) => {
  const progressRef = useRef<HTMLDivElement>(null);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const handleProgressClick = (e: React.MouseEvent) => {
    if (!progressRef.current || totalDuration === 0) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    onSeek(percent * totalDuration);
  };

  const handleEnded = useCallback(() => {
    onSeek(0);
  }, [onSeek]);

  useEffect(() => {
    const video = previewVideoRef.current;
    if (video) {
      video.onended = handleEnded;
    }
    return () => {
      if (video) {
        video.onended = null;
      }
    };
  }, [previewVideoRef, handleEnded]);

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{
        position: 'relative',
        backgroundColor: '#000',
        borderRadius: '8px',
        overflow: 'hidden',
        aspectRatio: '16/9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {clipsLength === 0 ? (
          <div style={{ color: '#666', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🎬</div>
            <div>Add videos to preview</div>
          </div>
        ) : (
          <video
            ref={previewVideoRef}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              display: 'block',
            }}
            playsInline
          />
        )}
      </div>

      <div style={{ marginTop: '15px' }}>
        <div
          ref={progressRef}
          onClick={handleProgressClick}
          style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#333',
            borderRadius: '4px',
            cursor: 'pointer',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%`,
              height: '100%',
              backgroundColor: '#646cff',
              transition: 'width 0.1s linear',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
          <span style={{ fontSize: '0.85rem', color: '#888' }}>
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </span>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => onSeek(0)}
              disabled={clipsLength === 0}
              style={{
                padding: '8px 12px',
                background: '#333',
                border: 'none',
                borderRadius: '4px',
                color: clipsLength === 0 ? '#666' : 'white',
                cursor: clipsLength === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              ⏮ Start
            </button>
            
            {isPlaying ? (
              <button
                onClick={onPause}
                className="primary"
                style={{ padding: '8px 20px' }}
              >
                ⏸ Pause
              </button>
            ) : (
              <button
                onClick={onPlay}
                disabled={clipsLength === 0}
                className="primary"
                style={{ padding: '8px 20px', opacity: clipsLength === 0 ? 0.5 : 1 }}
              >
                ▶ Play
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preview;
