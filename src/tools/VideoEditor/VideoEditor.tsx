import React, { useState } from 'react';
import { fetchFile } from '@ffmpeg/util';
import { useFFmpeg } from '../../hooks/useFFmpeg';
import { useNativeFFmpeg } from '../../hooks/useNativeFFmpeg';
import { useVideoEditor } from './useVideoEditor';
import Timeline from './Timeline';
import Preview from './Preview';
import type { Clip } from './types';

const VideoEditor: React.FC = () => {
  const {
    state,
    totalDuration,
    previewVideoRef,
    addClips,
    removeClip,
    selectClip,
    updateClip,
    reorderClips,
    setZoom,
    play,
    pause,
    seek,
  } = useVideoEditor();

  const { ffmpeg, loaded, load, status, setStatus, progress } = useFFmpeg();
  const { isElectron, status: nativeStatus, resetProgress } = useNativeFFmpeg();
  
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);

  const useNative = isElectron && nativeStatus.hasHap;

  React.useEffect(() => {
    const clip = state.clips.find(c => c.id === state.selectedClipId);
    setSelectedClip(clip || null);
  }, [state.selectedClipId, state.clips]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await addClips(Array.from(e.target.files));
      if (!useNative && !loaded) load();
      e.target.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('video/'));
    if (files.length > 0) {
      await addClips(files);
      if (!useNative && !loaded) load();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const exportVideo = async () => {
    if (state.clips.length === 0) return;

    setStatus('processing');
    resetProgress();
    setDownloadUrl(null);

    const filterComplexParts: string[] = [];
    const inputArgs: string[] = [];

    state.clips.forEach((clip, index) => {
      const duration = clip.endTime - clip.startTime;
      inputArgs.push('-ss', clip.startTime.toString(), '-i', `input_${index}.mp4`, '-t', duration.toString());
      filterComplexParts.push(`[${index}:v][${index}:a]`);
    });

    const concatInputs = state.clips.map((_, i) => `[${i}:v][${i}:a]`).join('');
    const filterComplex = `${concatInputs}concat=n=${state.clips.length}:v=1:a=1[outv][outa]`;

    const args = [
      ...inputArgs,
      '-filter_complex', filterComplex,
      '-map', '[outv]',
      '-map', '[outa]',
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '23',
      '-c:a', 'aac',
      '-b:a', '128k',
      'output.mp4',
    ];

    if (useNative) {
      alert('Native FFmpeg export for video editor coming soon. Using browser-based FFmpeg for now.');
    }

    if (!loaded) {
      setStatus('error');
      return;
    }

    try {
      for (let i = 0; i < state.clips.length; i++) {
        await ffmpeg.writeFile(`input_${i}.mp4`, await fetchFile(state.clips[i].file));
      }

      await ffmpeg.exec(args);

      const data = await ffmpeg.readFile('output.mp4');
      const blob = new Blob([(data as Uint8Array).buffer as ArrayBuffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      
      setDownloadUrl(url);
      setStatus('completed');

      for (let i = 0; i < state.clips.length; i++) {
        try { await ffmpeg.deleteFile(`input_${i}.mp4`); } catch { /* Ignore cleanup errors */ }
      }
      try { await ffmpeg.deleteFile('output.mp4'); } catch { /* Ignore cleanup errors */ }
    } catch (error) {
      console.error('Export failed:', error);
      setStatus('error');
    }
  };

  const getStatusMessage = () => {
    if (useNative) return 'Native FFmpeg detected - fast export available!';
    if (isElectron && nativeStatus.checked && !nativeStatus.available) {
      return 'FFmpeg not found. Install FFmpeg for faster export.';
    }
    return null;
  };

  const statusMessage = getStatusMessage();

  return (
    <div 
      style={{ maxWidth: '1000px', margin: '0 auto' }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <h2>Video Editor</h2>
      <p style={{ color: '#888', marginBottom: '20px' }}>
        Create and edit videos with a timeline-based editor. Add multiple clips, trim, reorder, and export.
      </p>

      {statusMessage && (
        <div style={{ 
          backgroundColor: useNative ? 'rgba(39, 174, 96, 0.1)' : 'rgba(243, 156, 18, 0.1)', 
          padding: '10px 15px', 
          borderRadius: '8px', 
          marginBottom: '20px', 
          color: useNative ? '#27ae60' : '#e67e22', 
          fontSize: '0.85rem' 
        }}>
          {statusMessage}
        </div>
      )}

      <Preview
        previewVideoRef={previewVideoRef}
        currentTime={state.currentTime}
        totalDuration={totalDuration}
        isPlaying={state.isPlaying}
        onPlay={play}
        onPause={pause}
        onSeek={seek}
        clipsLength={state.clips.length}
      />

      <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', flexWrap: 'wrap' }}>
        <div style={{ marginBottom: '20px', border: '2px dashed #444', padding: '20px', textAlign: 'center', borderRadius: '8px', flex: 1, minWidth: '200px' }}>
          <input
            type="file"
            accept="video/*"
            multiple
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id="video-upload"
          />
          <label htmlFor="video-upload" style={{ cursor: 'pointer', color: '#646cff', fontWeight: 'bold' }}>
            + Add Videos
          </label>
          <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '5px' }}>
            Drag & drop or click to upload
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
          {!useNative && !loaded && (
            <button onClick={load} className="primary">
              Initialize Engine
            </button>
          )}
          
          <button
            onClick={exportVideo}
            disabled={state.clips.length === 0 || status === 'processing'}
            className="primary"
            style={{ 
              opacity: state.clips.length === 0 || status === 'processing' ? 0.5 : 1,
              minWidth: '120px'
            }}
          >
            {status === 'processing' ? `Exporting... ${progress}%` : 'Export Video'}
          </button>

          {downloadUrl && status === 'completed' && (
            <a
              href={downloadUrl}
              download="edited_video.mp4"
              className="button success"
              style={{ textDecoration: 'none', padding: '10px 20px', borderRadius: '8px', textAlign: 'center' }}
            >
              Download Video
            </a>
          )}
        </div>
      </div>

      {selectedClip && (
        <div style={{ 
          backgroundColor: '#1a1a1a', 
          padding: '15px', 
          borderRadius: '8px', 
          marginBottom: '15px',
          fontSize: '0.85rem'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#646cff' }}>
            Selected: {selectedClip.name}
          </div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', color: '#888' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '3px' }}>Start Time:</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max={selectedClip.endTime - 0.1}
                value={selectedClip.startTime.toFixed(1)}
                onChange={e => updateClip(selectedClip.id, { startTime: parseFloat(e.target.value) || 0 })}
                style={{ 
                  padding: '5px 10px', 
                  borderRadius: '4px', 
                  background: '#333', 
                  border: '1px solid #444', 
                  color: 'white',
                  width: '80px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '3px' }}>End Time:</label>
              <input
                type="number"
                step="0.1"
                min={selectedClip.startTime + 0.1}
                max={selectedClip.duration}
                value={selectedClip.endTime.toFixed(1)}
                onChange={e => updateClip(selectedClip.id, { endTime: parseFloat(e.target.value) || selectedClip.duration })}
                style={{ 
                  padding: '5px 10px', 
                  borderRadius: '4px', 
                  background: '#333', 
                  border: '1px solid #444', 
                  color: 'white',
                  width: '80px'
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <span style={{ color: '#888' }}>
                Duration: {formatTime(selectedClip.endTime - selectedClip.startTime)} / {formatTime(selectedClip.duration)}
              </span>
            </div>
          </div>
        </div>
      )}

      <Timeline
        clips={state.clips}
        selectedClipId={state.selectedClipId}
        currentTime={state.currentTime}
        totalDuration={totalDuration}
        zoom={state.zoom}
        onSelectClip={selectClip}
        onRemoveClip={removeClip}
        onReorderClips={reorderClips}
        onUpdateClip={updateClip}
        onSeek={seek}
        onZoomChange={setZoom}
      />

      <div style={{ marginTop: '20px', fontSize: '0.8rem', color: '#666' }}>
        <strong>Tips:</strong>
        <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
          <li>Click on timeline to seek</li>
          <li>Drag clips to reorder</li>
          <li>Select a clip to trim by dragging its edges or using the input fields</li>
          <li>Click the × button to remove a selected clip</li>
        </ul>
      </div>
    </div>
  );
};

export default VideoEditor;
