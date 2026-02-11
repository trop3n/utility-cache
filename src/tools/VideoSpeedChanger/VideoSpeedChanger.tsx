import React, { useState } from 'react';
import { fetchFile } from '@ffmpeg/util';
import { useFFmpeg } from '../../hooks/useFFmpeg';

const VideoSpeedChanger: React.FC = () => {
  const { ffmpeg, loaded, load, status, setStatus, progress, message } = useFFmpeg();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [speed, setSpeed] = useState(1.0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setVideoFile(e.target.files[0]);
      setDownloadUrl(null);
      if (!loaded) load();
    }
  };

  const changeSpeed = async () => {
    if (!videoFile || !loaded) return;

    setStatus('processing');
    const inputName = 'input.mp4';
    const outputName = 'speed_output.mp4';

    try {
      await ffmpeg.writeFile(inputName, await fetchFile(videoFile));

      // Video speed: setpts=1/speed*PTS
      // Audio speed: atempo=speed (atempo only supports 0.5 to 100.0)
      const videoFilter = `setpts=${(1/speed).toFixed(4)}*PTS`;

      // Build atempo chain for values outside 0.5-2.0 range
      const buildAtempoChain = (tempo: number): string => {
        const filters: string[] = [];
        let remaining = tempo;
        while (remaining < 0.5) {
          filters.push('atempo=0.5');
          remaining /= 0.5;
        }
        while (remaining > 2.0) {
          filters.push('atempo=2.0');
          remaining /= 2.0;
        }
        filters.push(`atempo=${remaining.toFixed(4)}`);
        return filters.join(',');
      };

      // Try with audio first, fall back to video-only
      try {
        const audioFilter = buildAtempoChain(speed);
        await ffmpeg.exec([
          '-i', inputName,
          '-filter_complex', `[0:v]${videoFilter}[v];[0:a]${audioFilter}[a]`,
          '-map', '[v]',
          '-map', '[a]',
          outputName
        ]);
      } catch {
        // No audio stream - process video only
        await ffmpeg.exec([
          '-i', inputName,
          '-vf', videoFilter,
          '-an',
          outputName
        ]);
      }

      const data = await ffmpeg.readFile(outputName);
      const url = URL.createObjectURL(new Blob([(data as Uint8Array).buffer as any], { type: 'video/mp4' }));
      
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(url);
      setStatus('completed');
    } catch (error) {
      console.error('Speed change failed', error);
      setStatus('error');
    }
  };

  const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>Video Speed Changer</h2>
      
      {!loaded && status !== 'loading' && (
        <div style={{ padding: '20px', backgroundColor: 'rgba(100, 108, 255, 0.1)', borderRadius: '8px', marginBottom: '20px' }}>
          <p>This tool uses FFmpeg.wasm to adjust playback speed. Initialize it to start.</p>
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
          id="speed-upload"
        />
        <label htmlFor="speed-upload" style={{ cursor: 'pointer', color: '#646cff', fontWeight: 'bold' }}>
          {videoFile ? videoFile.name : 'Click to Upload Video'}
        </label>
      </div>

      {videoFile && loaded && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '15px' }}>Select Speed:</label>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              {speedOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setSpeed(opt)}
                  className={speed === opt ? 'primary' : ''}
                  style={{ border: speed === opt ? '1px solid #646cff' : '1px solid #444' }}
                >
                  {opt}x
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={changeSpeed} 
            className="primary" 
            disabled={status === 'processing'}
            style={{ marginBottom: '20px' }}
          >
            {status === 'processing' ? 'Processing...' : `Apply ${speed}x Speed`}
          </button>

          {status === 'processing' && (
             <div style={{ width: '100%', backgroundColor: '#111', borderRadius: '10px', overflow: 'hidden', height: '20px' }}>
              <div style={{ width: `${progress}%`, backgroundColor: '#646cff', height: '100%', transition: 'width 0.3s ease' }} />
            </div>
          )}

          {status === 'completed' && downloadUrl && (
            <div style={{ marginTop: '20px' }}>
              <p style={{ color: '#27ae60' }}>Speed adjusted successfully!</p>
              <a 
                href={downloadUrl} 
                download={`speed-${speed}x-${videoFile.name}`}
                className="button success"
                style={{ textDecoration: 'none', padding: '10px 20px', borderRadius: '8px', display: 'inline-block' }}
              >
                Download Modified Video
              </a>
            </div>
          )}
           <p style={{ fontSize: '0.7rem', color: '#666', marginTop: '10px', height: '1.2em', overflow: 'hidden' }}>{message}</p>
        </div>
      )}
    </div>
  );
};

export default VideoSpeedChanger;
