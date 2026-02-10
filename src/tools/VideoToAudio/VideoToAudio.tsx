import React, { useState } from 'react';
import { fetchFile } from '@ffmpeg/util';
import { useFFmpeg } from '../../hooks/useFFmpeg';

const VideoToAudio: React.FC = () => {
  const { ffmpeg, loaded, load, status, setStatus, progress, message } = useFFmpeg();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState('mp3');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setVideoFile(e.target.files[0]);
      setDownloadUrl(null);
      if (!loaded) load();
    }
  };

  const extractAudio = async () => {
    if (!videoFile || !loaded) return;

    setStatus('processing');
    const inputName = 'input_video';
    const outputName = `output_audio.${outputFormat}`;

    try {
      await ffmpeg.writeFile(inputName, await fetchFile(videoFile));
      
      // -vn disables video recording, -acodec libmp3lame for mp3
      // For wav, we can use pcm_s16le or copy if source is compatible
      let args = ['-i', inputName, '-vn', outputName];
      if (outputFormat === 'mp3') {
          args = ['-i', inputName, '-vn', '-acodec', 'libmp3lame', outputName];
      }

      await ffmpeg.exec(args);

      const data = await ffmpeg.readFile(outputName);
      const url = URL.createObjectURL(new Blob([(data as Uint8Array).buffer], { type: `audio/${outputFormat}` }));
      
      setDownloadUrl(url);
      setStatus('completed');
    } catch (error) {
      console.error('Extraction failed', error);
      setStatus('error');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>Video to Audio Converter</h2>
      
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
          id="audio-upload"
        />
        <label htmlFor="audio-upload" style={{ cursor: 'pointer', color: '#646cff', fontWeight: 'bold' }}>
          {videoFile ? videoFile.name : 'Click to Upload Video'}
        </label>
      </div>

      {videoFile && loaded && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ marginRight: '10px' }}>Output Format:</label>
            <select 
              value={outputFormat} 
              onChange={(e) => setOutputFormat(e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', background: '#1a1a1a', color: 'white', border: '1px solid #444' }}
            >
              <option value="mp3">MP3</option>
              <option value="wav">WAV</option>
            </select>
          </div>

          <button 
            onClick={extractAudio} 
            className="primary" 
            disabled={status === 'processing'}
            style={{ marginBottom: '20px' }}
          >
            {status === 'processing' ? 'Extracting...' : 'Extract Audio'}
          </button>

          {status === 'processing' && (
             <div style={{ width: '100%', backgroundColor: '#111', borderRadius: '10px', overflow: 'hidden', height: '20px' }}>
              <div style={{ width: `${progress}%`, backgroundColor: '#646cff', height: '100%', transition: 'width 0.3s ease' }} />
            </div>
          )}

          {status === 'completed' && downloadUrl && (
            <div style={{ marginTop: '20px' }}>
              <p style={{ color: '#27ae60' }}>Audio extracted successfully!</p>
              <a 
                href={downloadUrl} 
                download={`extracted-audio.${outputFormat}`}
                className="button success"
                style={{ textDecoration: 'none', padding: '10px 20px', borderRadius: '8px', display: 'inline-block' }}
              >
                Download Audio
              </a>
            </div>
          )}
           <p style={{ fontSize: '0.7rem', color: '#666', marginTop: '10px' }}>{message}</p>
        </div>
      )}
    </div>
  );
};

export default VideoToAudio;
