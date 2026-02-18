import React, { useRef, useState, useEffect } from 'react';
import type { Clip } from './types';

interface TimelineProps {
  clips: Clip[];
  selectedClipId: string | null;
  currentTime: number;
  totalDuration: number;
  zoom: number;
  onSelectClip: (id: string | null) => void;
  onRemoveClip: (id: string) => void;
  onReorderClips: (fromIndex: number, toIndex: number) => void;
  onUpdateClip: (id: string, updates: Partial<Clip>) => void;
  onSeek: (time: number) => void;
  onZoomChange: (zoom: number) => void;
}

const Timeline: React.FC<TimelineProps> = ({
  clips,
  selectedClipId,
  currentTime,
  totalDuration,
  zoom,
  onSelectClip,
  onRemoveClip,
  onReorderClips,
  onUpdateClip,
  onSeek,
  onZoomChange,
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [trimClip, setTrimClip] = useState<{ id: string; side: 'start' | 'end'; startX: number; originalValue: number } | null>(null);

  const pixelsPerSecond = 50 * zoom;

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current || totalDuration === 0) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = (x / pixelsPerSecond);
    onSeek(time);
    onSelectClip(null);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      onReorderClips(draggedIndex, index);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleTrimMouseDown = (e: React.MouseEvent, clipId: string, side: 'start' | 'end', currentValue: number) => {
    e.stopPropagation();
    setTrimClip({ id: clipId, side, startX: e.clientX, originalValue: currentValue });
  };

  useEffect(() => {
    if (!trimClip) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = (e.clientX - trimClip.startX) / pixelsPerSecond;
      const clip = clips.find(c => c.id === trimClip.id);
      if (!clip) return;

      if (trimClip.side === 'start') {
        const newStart = Math.max(0, Math.min(trimClip.originalValue + delta, clip.endTime - 0.1));
        onUpdateClip(clip.id, { startTime: newStart });
      } else {
        const newEnd = Math.max(clip.startTime + 0.1, Math.min(trimClip.originalValue + delta, clip.duration));
        onUpdateClip(clip.id, { endTime: newEnd });
      }
    };

    const handleMouseUp = () => {
      setTrimClip(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [trimClip, clips, pixelsPerSecond, onUpdateClip]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '0.9rem', color: '#888' }}>
          Timeline - Total: {formatTime(totalDuration)}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.8rem', color: '#888' }}>Zoom:</span>
          <input
            type="range"
            min="0.5"
            max="4"
            step="0.1"
            value={zoom}
            onChange={e => onZoomChange(parseFloat(e.target.value))}
            style={{ width: '100px' }}
          />
          <span style={{ fontSize: '0.8rem', color: '#888' }}>{zoom.toFixed(1)}x</span>
        </div>
      </div>

      <div
        ref={timelineRef}
        onClick={handleTimelineClick}
        style={{
          position: 'relative',
          backgroundColor: '#1a1a1a',
          borderRadius: '8px',
          minHeight: '100px',
          padding: '10px',
          overflowX: 'auto',
          cursor: 'pointer',
        }}
      >
        {clips.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', padding: '30px' }}>
            Add videos to the timeline to start editing
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '4px', minHeight: '80px', position: 'relative' }}>
            {clips.map((clip, index) => {
              const clipDuration = clip.endTime - clip.startTime;
              const width = clipDuration * pixelsPerSecond;
              const isSelected = selectedClipId === clip.id;
              const isDragOver = dragOverIndex === index;

              return (
                <div
                  key={clip.id}
                  draggable
                  onDragStart={e => handleDragStart(e, index)}
                  onDragOver={e => handleDragOver(e, index)}
                  onDrop={e => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  onClick={e => {
                    e.stopPropagation();
                    onSelectClip(clip.id);
                  }}
                  style={{
                    position: 'relative',
                    width: `${width}px`,
                    minWidth: `${width}px`,
                    height: '80px',
                    backgroundColor: isSelected ? '#4a5568' : '#2d3748',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    cursor: 'grab',
                    border: isSelected ? '2px solid #646cff' : '2px solid transparent',
                    opacity: draggedIndex === index ? 0.5 : 1,
                    transition: isDragOver ? 'transform 0.2s' : undefined,
                    transform: isDragOver ? (index < (draggedIndex ?? 0) ? 'translateX(-10px)' : 'translateX(10px)') : undefined,
                  }}
                >
                  {clip.thumbnail && (
                    <img
                      src={clip.thumbnail}
                      alt={clip.name}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: 0.6,
                      }}
                    />
                  )}
                  
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '4px 6px',
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                    fontSize: '0.7rem',
                    color: 'white',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {clip.name}
                  </div>

                  <div
                    onMouseDown={e => handleTrimMouseDown(e, clip.id, 'start', clip.startTime)}
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '8px',
                      backgroundColor: '#646cff',
                      cursor: 'ew-resize',
                      opacity: isSelected ? 1 : 0,
                      transition: 'opacity 0.2s',
                    }}
                  />

                  <div
                    onMouseDown={e => handleTrimMouseDown(e, clip.id, 'end', clip.endTime)}
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: '8px',
                      backgroundColor: '#646cff',
                      cursor: 'ew-resize',
                      opacity: isSelected ? 1 : 0,
                      transition: 'opacity 0.2s',
                    }}
                  />

                  {isSelected && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onRemoveClip(clip.id);
                      }}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border: 'none',
                        background: 'rgba(231, 76, 60, 0.9)',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      ×
                    </button>
                  )}

                  <div style={{
                    position: 'absolute',
                    top: '4px',
                    left: '10px',
                    fontSize: '0.65rem',
                    color: 'white',
                    textShadow: '0 1px 2px black',
                  }}>
                    {formatTime(clip.startTime)} - {formatTime(clip.endTime)}
                  </div>
                </div>
              );
            })}

            <div
              style={{
                position: 'absolute',
                left: `${currentTime * pixelsPerSecond}px`,
                top: '-5px',
                bottom: '-5px',
                width: '2px',
                backgroundColor: '#e74c3c',
                pointerEvents: 'none',
                zIndex: 10,
              }}
            >
              <div style={{
                position: 'absolute',
                top: '-8px',
                left: '-5px',
                width: '12px',
                height: '12px',
                backgroundColor: '#e74c3c',
                borderRadius: '50%',
              }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Timeline;
