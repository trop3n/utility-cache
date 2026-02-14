import React, { useState } from 'react';
import { fetchFile } from '@ffmpeg/util';
import { useFFmpeg } from '../../hooks/useFFmpeg';

const AddAudioToVideo: React.FC = () => {
  const { ffmpeg, loaded, load, status, setStatus, progress, message } = useFFmpeg();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [outputFormat, setOutputFormat] = useState('mp4');
  const [volume, setVolume] = useState(1.0);
  const [replaceAudio, setReplaceAudio] = useState(true);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
      setDownloadUrl(null);
      if (!loaded) load();
    }
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
      setDownloadUrl(null);
      if (!loaded) load();
    }
  };

  const processVideo = async () => {
    if (!videoFile || !audioFile || !loaded) return;

    setStatus('processing');

    try {
      // Write files to FFmpeg virtual filesystem
      const videoExt = videoFile.name.substring(videoFile.name.lastIndexOf('.')) || '.mp4';
      const audioExt = audioFile.name.substring(audioFile.name.lastIndexOf('.')) || '.mp3';
      const videoInputName = `input_video${videoExt}`;
      const audioInputName = `input_audio${audioExt}`;
      const outputName = `output.${outputFormat}`;

      await ffmpeg.writeFile(videoInputName, await fetchFile(videoFile));
      await ffmpeg.writeFile(audioInputName, await fetchFile(audioFile));

      // Build FFmpeg command
      const args: string[] = ['-i', videoInputName, '-i', audioInputName];

      if (replaceAudio) {
        // Replace video's audio completely
        args.push(
          '-filter_complex', `[1:a]volume=${volume}[a]`,
          '-map', '0:v',
          '-map', '[a]',
          '-c:v', 'copy',
          '-c:a', 'aac',
          '-b:a', '192k',
          '-shortest'
        );
      } else {
        // Mix audio with existing video audio
        args.push(
          '-filter_complex', `[0:a][1:a]amix=inputs=2:duration=first:weights=1 ${volume}[a]`,
          '-map', '0:v',
          '-map', '[a]',
          '-c:v', 'copy',
          '-c:a', 'aac',
          '-b:a', '192k',
          '-shortest'
        );
      }

      args.push(outputName);

      await ffmpeg.exec(args);

      const data = await ffmpeg.readFile(outputName);
      const blob = new Blob([(data as Uint8Array).buffer as any], { type: `video/${outputFormat}` });
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(URL.createObjectURL(blob));
      setStatus('completed');

      // Cleanup
      try { await ffmpeg.deleteFile(videoInputName); } catch (e) {}
      try { await ffmpeg.deleteFile(audioInputName); } catch (e) {}
      try { await ffmpeg.deleteFile(outputName); } catch (e) {}

    } catch (error) {
      console.error('Error processing video:', error);
      setStatus('error');
    }
  };

  const clearFiles = () => {
    setVideoFile(null);
    setAudioFile(null);
    setDownloadUrl(null);
    setStatus('idle');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>Add Audio to Video</h2>
      <p style={{ color: '#888', marginBottom: '20px' }}>
        Add or replace audio in your video files. Supports MP4, MOV, AVI, and WebM formats.
      </p>

      {!loaded && (
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <button onClick={load} className="primary">Initialize Engine</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Video Upload */}
        <div style={{ border: '2px dashed #444', padding: '30px', textAlign: 'center', borderRadius: '12px' }}>
          <input 
            type="file" 
            accept="video/*" 
            onChange={handleVideoChange} 
            style={{ display: 'none' }} 
            id="video-upload"
          />
          <label htmlFor="video-upload" style={{ cursor: 'pointer', color: '#646cff', fontWeight: 'bold' }}>
            {videoFile ? '🎬 ' + videoFile.name : 'Click to Select Video'}
          </label>
          {videoFile && (
            <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '8px' }}>
              {(videoFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          )}
        </div>

        {/* Audio Upload */}
        <div style={{ border: '2px dashed #444', padding: '30px', textAlign: 'center', borderRadius: '12px' }}>
          <input 
            type="file" 
            accept="audio/*" 
            onChange={handleAudioChange} 
            style={{ display: 'none' }} 
            id="audio-upload"
          />
          <label htmlFor="audio-upload" style={{ cursor: 'pointer', color: '#646cff', fontWeight: 'bold' }}>
            {audioFile ? '🎵 ' + audioFile.name : 'Click to Select Audio'}
          </label>
          {audioFile && (
            <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '8px' }}>
              {(audioFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          )}
        </div>
      </div>

      {videoFile && audioFile && loaded && (
        <div style={{ backgroundColor: '#222', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <h3 style={{ marginTop: 0 }}>Options</h3>
          
          {/* Audio Mode */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '500' }}>Audio Mode:</label>
            <div style={{ display: 'flex', gap: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="audioMode" 
                  checked={replaceAudio} 
                  onChange={() => setReplaceAudio(true)}
                />
                Replace original audio
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="audioMode" 
                  checked={!replaceAudio} 
                  onChange={() => setReplaceAudio(false)}
                />
                Mix with original audio
              </label>
            </div>
          </div>

          {/* Volume Slider */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '500' }}>
              New Audio Volume: {Math.round(volume * 100)}%
            </label>
            <input 
              type="range" 
              min="0.1" 
              max="3" 
              step="0.1" 
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#888' }}>
              <span>Quiet (10%)</span>
              <span>Normal (100%)</span>
              <span>Loud (300%)</span>
            </div>
          </div>

          {/* Output Format */}
          <div>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '500' }}>Output Format:</label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {['mp4', 'mov', 'avi', 'webm'].map(fmt => (
                <button 
                  key={fmt}
                  onClick={() => setOutputFormat(fmt)}
                  className={outputFormat === fmt ? 'primary' : ''}
                  style={{ 
                    padding: '8px 16px',
                    border: outputFormat === fmt ? '1px solid #646cff' : '1px solid #444'
                  }}
                >
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {status === 'processing' && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ width: '100%', backgroundColor: '#111', borderRadius: '10px', overflow: 'hidden', height: '20px' }}>
            <div style={{ 
              width: `${progress}%`, 
              backgroundColor: '#646cff', 
              height: '100%', 
              transition: 'width 0.3s ease' 
            }} />
          </div>
          <p style={{ textAlign: 'center', marginTop: '10px', color: '#888', fontSize: '0.85rem' }}>
            {message || 'Processing...'}
          </p>
        </div>
      )}

      {downloadUrl && (
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#064e3b', 
          borderRadius: '12px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px' }}>✅ Processing Complete!</h3>
          <a 
            href={downloadUrl} 
            download={`audio_added.${outputFormat}`}
            className="button success"
            style={{ padding: '12px 32px', textDecoration: 'none', display: 'inline-block' }}
          >
            Download Video
          </a>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        {videoFile && audioFile && loaded && (
          <button 
            onClick={processVideo} 
            className="primary"
            disabled={status === 'processing'}
            style={{ padding: '12px 32px', opacity: status === 'processing' ? 0.6 : 1 }}
          >
            {status === 'processing' ? 'Processing...' : 'Add Audio to Video'}
          </button>
        )}
        
        {(videoFile || audioFile) && status !== 'processing' && (
          <button onClick={clearFiles} style={{ padding: '12px 24px' }}>
            Clear Files
          </button>
        )}
      </div>

      <div style={{ 
        marginTop: '30px', 
        padding: '16px', 
        backgroundColor: 'rgba(255,255,255,0.03)', 
        borderRadius: '8px',
        fontSize: '0.85rem',
        color: '#888'
      }}>
        <strong>Supported Formats:</strong>
        <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
          <li>Video: MP4, MOV, AVI, MKV, WebM</li>
          <li>Audio: MP3, WAV, AAC, OGG, FLAC</li>
          <li>Output will use the same video codec (copied) for best quality</li>
        </ul>
      </div>
    </div>
  );
};

export default AddAudioToVideo;
