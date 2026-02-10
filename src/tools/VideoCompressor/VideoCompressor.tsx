import React, { useState } from 'react';
import { fetchFile } from '@ffmpeg/util';
import { useFFmpeg } from '../../hooks/useFFmpeg';

const VideoCompressor: React.FC = () => {
  const { ffmpeg, loaded, load, status, setStatus, progress, message } = useFFmpeg();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [quality, setQuality] = useState(28); // CRF value: 18-30 is standard, higher is more compression
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setVideoFile(e.target.files[0]);
      setDownloadUrl(null);
      if (!loaded) load();
    }
  };

  const compressVideo = async () => {
    if (!videoFile || !loaded) return;

    setStatus('processing');
    const inputName = 'input.mp4';
    const outputName = 'compressed_output.mp4';

    try {
      await ffmpeg.writeFile(inputName, await fetchFile(videoFile));
      
      // -crf (Constant Rate Factor): 0-51. 23 is default, 28 is great for compression, 18 is visually lossless.
      // -preset: ultrafast, superfast, veryfast, faster, fast, medium (default), slow, slower, veryslow
      await ffmpeg.exec([
        '-i', inputName, 
        '-vcodec', 'libx264', 
        '-crf', quality.toString(), 
        '-preset', 'veryfast', 
        outputName
      ]);

      const data = await ffmpeg.readFile(outputName);
      const url = URL.createObjectURL(new Blob([(data as Uint8Array).buffer as any], { type: 'video/mp4' }));
      
      setDownloadUrl(url);
      setStatus('completed');
    } catch (error) {
      console.error('Compression failed', error);
      setStatus('error');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>Video Compressor</h2>
      
      {!loaded && status !== 'loading' && (
        <div style={{ padding: '20px', backgroundColor: 'rgba(100, 108, 255, 0.1)', borderRadius: '8px', marginBottom: '20px' }}>
          <p>This tool uses FFmpeg.wasm for compression. Initialize it to start.</p>
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
          id="compress-upload"
        />
        <label htmlFor="compress-upload" style={{ cursor: 'pointer', color: '#646cff', fontWeight: 'bold' }}>
          {videoFile ? videoFile.name : 'Click to Upload Video'}
        </label>
        {videoFile && <p style={{ marginTop: '10px', fontSize: '0.8rem' }}>Original size: {Math.round(videoFile.size / 1024 / 1024 * 100) / 100} MB</p>}
      </div>

      {videoFile && loaded && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
            <label style={{ display: 'block', marginBottom: '15px' }}>
              Compression Level (CRF): <strong>{quality}</strong>
            </label>
            <input 
              type="range" 
              min="18" 
              max="40" 
              step="1" 
              value={quality} 
              onChange={(e) => setQuality(parseInt(e.target.value))}
              style={{ width: '100%', maxWidth: '400px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: '400px', margin: '0 auto', fontSize: '0.8rem', color: '#888', marginTop: '5px' }}>
              <span>High Quality</span>
              <span>Small File</span>
            </div>
          </div>

          <button 
            onClick={compressVideo} 
            className="primary" 
            disabled={status === 'processing'}
            style={{ marginBottom: '20px' }}
          >
            {status === 'processing' ? 'Compressing...' : 'Compress Video'}
          </button>

          {status === 'processing' && (
             <div style={{ width: '100%', backgroundColor: '#111', borderRadius: '10px', overflow: 'hidden', height: '20px' }}>
              <div style={{ width: `${progress}%`, backgroundColor: '#646cff', height: '100%', transition: 'width 0.3s ease' }} />
            </div>
          )}

          {status === 'completed' && downloadUrl && (
            <div style={{ marginTop: '20px' }}>
              <p style={{ color: '#27ae60' }}>Compression successful!</p>
              <a 
                href={downloadUrl} 
                download={`compressed-${videoFile.name}`}
                className="button success"
                style={{ textDecoration: 'none', padding: '10px 20px', borderRadius: '8px', display: 'inline-block' }}
              >
                Download Compressed Video
              </a>
            </div>
          )}
           <p style={{ fontSize: '0.7rem', color: '#666', marginTop: '10px', height: '1.2em', overflow: 'hidden' }}>{message}</p>
        </div>
      )}
    </div>
  );
};

export default VideoCompressor;
