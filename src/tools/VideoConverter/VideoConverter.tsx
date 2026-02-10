import React, { useState, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const VideoConverter: React.FC = () => {
  const [loaded, setLoaded] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'processing' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [outputFormat, setOutputFormat] = useState('mp4');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  
  const ffmpegRef = useRef(new FFmpeg());
  const messageRef = useRef<HTMLParagraphElement>(null);

  const load = async () => {
    setStatus('loading');
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    const ffmpeg = ffmpegRef.current;
    
    ffmpeg.on('log', ({ message }) => {
      if (messageRef.current) messageRef.current.innerHTML = message;
      console.log(message);
    });

    ffmpeg.on('progress', ({ progress }) => {
      setProgress(Math.round(progress * 100));
    });

    try {
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      setLoaded(true);
      setStatus('idle');
    } catch (error) {
      console.error('Failed to load ffmpeg', error);
      setStatus('error');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setVideoFile(e.target.files[0]);
      setDownloadUrl(null);
      setProgress(0);
      if (!loaded) load();
    }
  };

  const convert = async () => {
    if (!videoFile) return;

    setStatus('processing');
    const ffmpeg = ffmpegRef.current;
    const inputName = 'input_video';
    const outputName = `output_video.${outputFormat}`;

    try {
      await ffmpeg.writeFile(inputName, await fetchFile(videoFile));
      
      // Simple conversion command
      // -i input -c:v copy (if same format) or re-encode
      // For general "converter", we usually want to re-encode to ensure compatibility
      await ffmpeg.exec(['-i', inputName, outputName]);

      const data = await ffmpeg.readFile(outputName);
      const url = URL.createObjectURL(new Blob([(data as Uint8Array).buffer], { type: `video/${outputFormat}` }));
      
      setDownloadUrl(url);
      setStatus('completed');
    } catch (error) {
      console.error('Conversion failed', error);
      setStatus('error');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>Video Converter</h2>
      
      {!loaded && status !== 'loading' && (
        <div style={{ padding: '20px', backgroundColor: 'rgba(100, 108, 255, 0.1)', borderRadius: '8px', marginBottom: '20px' }}>
          <p>This tool uses FFmpeg.wasm for client-side video processing. It requires a one-time download of the engine (~30MB).</p>
          <button onClick={load} className="primary">Initialize Video Engine</button>
        </div>
      )}

      {status === 'loading' && <p>Loading FFmpeg engine...</p>}

      <div style={{ marginBottom: '20px', border: '2px dashed #444', padding: '40px', textAlign: 'center', borderRadius: '12px' }}>
        <input 
          type="file" 
          accept="video/*" 
          onChange={handleFileChange} 
          style={{ display: 'none' }} 
          id="video-upload"
        />
        <label htmlFor="video-upload" style={{ cursor: 'pointer', color: '#646cff', fontWeight: 'bold' }}>
          {videoFile ? videoFile.name : 'Click to Upload Video'}
        </label>
      </div>

      {videoFile && loaded && (
        <div style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', justifyContent: 'center' }}>
            <label>Output Format:</label>
            <select 
              value={outputFormat} 
              onChange={(e) => setOutputFormat(e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', background: '#1a1a1a', color: 'white', border: '1px solid #444' }}
            >
              <option value="mp4">MP4</option>
              <option value="webm">WebM</option>
              <option value="mkv">MKV</option>
              <option value="gif">GIF</option>
            </select>
            
            <button 
              onClick={convert} 
              className="primary" 
              disabled={status === 'processing'}
            >
              {status === 'processing' ? 'Converting...' : 'Convert Video'}
            </button>
          </div>

          {status === 'processing' && (
            <div style={{ width: '100%', backgroundColor: '#111', borderRadius: '10px', overflow: 'hidden', height: '20px' }}>
              <div 
                style={{ 
                  width: `${progress}%`, 
                  backgroundColor: '#646cff', 
                  height: '100%', 
                  transition: 'width 0.3s ease' 
                }} 
              />
            </div>
          )}

          {status === 'completed' && downloadUrl && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#27ae60' }}>Conversion successful!</p>
              <a 
                href={downloadUrl} 
                download={`converted-${videoFile.name.split('.')[0]}.${outputFormat}`}
                className="button success"
                style={{ textDecoration: 'none', padding: '10px 20px', borderRadius: '8px', display: 'inline-block' }}
              >
                Download Converted Video
              </a>
            </div>
          )}

          <p ref={messageRef} style={{ fontSize: '0.7rem', color: '#666', marginTop: '10px', height: '1.2em', overflow: 'hidden' }}></p>
        </div>
      )}
    </div>
  );
};

export default VideoConverter;
