import React, { useState } from 'react';
import { fetchFile } from '@ffmpeg/util';
import { useFFmpeg } from '../../hooks/useFFmpeg';

const VideoTrimmer: React.FC = () => {
  const { ffmpeg, loaded, load, status, setStatus, progress, message } = useFFmpeg();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [startTime, setStartTime] = useState('00:00:00');
  const [endTime, setEndTime] = useState('00:00:10');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setVideoFile(e.target.files[0]);
      setDownloadUrl(null);
      if (!loaded) load();
    }
  };

  const trimVideo = async () => {
    if (!videoFile || !loaded) return;

    setStatus('processing');
    const inputName = 'input.mp4';
    const outputName = 'output.mp4';

    try {
      await ffmpeg.writeFile(inputName, await fetchFile(videoFile));
      
      // -ss before -i enables fast seek (input seeking), then -to for end time
      await ffmpeg.exec(['-ss', startTime, '-i', inputName, '-to', endTime, '-c', 'copy', '-avoid_negative_ts', 'make_zero', outputName]);

      const data = await ffmpeg.readFile(outputName);
      const url = URL.createObjectURL(new Blob([(data as Uint8Array).buffer as any], { type: 'video/mp4' }));
      
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(url);
      setStatus('completed');
    } catch (error) {
      console.error('Trim failed', error);
      setStatus('error');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>Video Trimmer</h2>
      
      {!loaded && status !== 'loading' && (
        <div style={{ padding: '20px', backgroundColor: 'rgba(100, 108, 255, 0.1)', borderRadius: '8px', marginBottom: '20px' }}>
          <p>This tool uses FFmpeg.wasm. Initialize it to start.</p>
          <button onClick={load} className="primary">Initialize Engine</button>
        </div>
      )}

      {status === 'loading' && <p>Loading FFmpeg engine...</p>}

      <div style={{ marginBottom: '20px', border: '2px dashed #444', padding: '40px', textAlign: 'center', borderRadius: '12px' }}>
        <input 
          type="file" 
          accept="video/*" 
          onChange={handleFileChange} 
          style={{ display: 'none' }} 
          id="trim-upload"
        />
        <label htmlFor="trim-upload" style={{ cursor: 'pointer', color: '#646cff', fontWeight: 'bold' }}>
          {videoFile ? videoFile.name : 'Click to Upload Video'}
        </label>
      </div>

      {videoFile && loaded && (
        <div>
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', justifyContent: 'center' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Start Time (HH:MM:SS)</label>
              <input 
                type="text" 
                value={startTime} 
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="00:00:00"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>End Time (HH:MM:SS)</label>
              <input 
                type="text" 
                value={endTime} 
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="00:00:10"
              />
            </div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <button 
              onClick={trimVideo} 
              className="primary" 
              disabled={status === 'processing'}
            >
              {status === 'processing' ? 'Trimming...' : 'Trim Video'}
            </button>
          </div>

          {status === 'processing' && (
             <div style={{ width: '100%', backgroundColor: '#111', borderRadius: '10px', overflow: 'hidden', height: '20px' }}>
              <div style={{ width: `${progress}%`, backgroundColor: '#646cff', height: '100%', transition: 'width 0.3s ease' }} />
            </div>
          )}

          {status === 'completed' && downloadUrl && (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <p style={{ color: '#27ae60' }}>Trim successful!</p>
              <a 
                href={downloadUrl} 
                download={`trimmed-${videoFile.name}`}
                className="button success"
                style={{ textDecoration: 'none', padding: '10px 20px', borderRadius: '8px', display: 'inline-block' }}
              >
                Download Trimmed Video
              </a>
            </div>
          )}
          
           <p style={{ fontSize: '0.7rem', color: '#666', marginTop: '10px' }}>{message}</p>
        </div>
      )}
    </div>
  );
};

export default VideoTrimmer;
