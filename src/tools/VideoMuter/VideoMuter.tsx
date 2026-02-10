import React, { useState } from 'react';
import { fetchFile } from '@ffmpeg/util';
import { useFFmpeg } from '../../hooks/useFFmpeg';

const VideoMuter: React.FC = () => {
  const { ffmpeg, loaded, load, status, setStatus, progress, message } = useFFmpeg();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setVideoFile(e.target.files[0]);
      setDownloadUrl(null);
      if (!loaded) load();
    }
  };

  const muteVideo = async () => {
    if (!videoFile || !loaded) return;

    setStatus('processing');
    const inputName = 'input.mp4';
    const outputName = 'muted_output.mp4';

    try {
      await ffmpeg.writeFile(inputName, await fetchFile(videoFile));
      
      // -an removes audio, -c copy copies the video stream without re-encoding
      await ffmpeg.exec(['-i', inputName, '-c', 'copy', '-an', outputName]);

      const data = await ffmpeg.readFile(outputName);
      const url = URL.createObjectURL(new Blob([(data as Uint8Array).buffer as any], { type: 'video/mp4' }));
      
      setDownloadUrl(url);
      setStatus('completed');
    } catch (error) {
      console.error('Mute failed', error);
      setStatus('error');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>Mute Video</h2>
      
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
          id="mute-upload"
        />
        <label htmlFor="mute-upload" style={{ cursor: 'pointer', color: '#646cff', fontWeight: 'bold' }}>
          {videoFile ? videoFile.name : 'Click to Upload Video'}
        </label>
      </div>

      {videoFile && loaded && (
        <div style={{ textAlign: 'center' }}>
          <button 
            onClick={muteVideo} 
            className="primary" 
            disabled={status === 'processing'}
            style={{ marginBottom: '20px' }}
          >
            {status === 'processing' ? 'Muting...' : 'Remove Audio'}
          </button>

          {status === 'processing' && (
             <div style={{ width: '100%', backgroundColor: '#111', borderRadius: '10px', overflow: 'hidden', height: '20px' }}>
              <div style={{ width: `${progress}%`, backgroundColor: '#646cff', height: '100%', transition: 'width 0.3s ease' }} />
            </div>
          )}

          {status === 'completed' && downloadUrl && (
            <div style={{ marginTop: '20px' }}>
              <p style={{ color: '#27ae60' }}>Audio removed successfully!</p>
              <a 
                href={downloadUrl} 
                download={`muted-${videoFile.name}`}
                className="button success"
                style={{ textDecoration: 'none', padding: '10px 20px', borderRadius: '8px', display: 'inline-block' }}
              >
                Download Muted Video
              </a>
            </div>
          )}
           <p style={{ fontSize: '0.7rem', color: '#666', marginTop: '10px' }}>{message}</p>
        </div>
      )}
    </div>
  );
};

export default VideoMuter;
