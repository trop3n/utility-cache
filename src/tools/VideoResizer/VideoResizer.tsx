import React, { useState } from 'react';
import { fetchFile } from '@ffmpeg/util';
import { useFFmpeg } from '../../hooks/useFFmpeg';

const VideoResizer: React.FC = () => {
  const { ffmpeg, loaded, load, status, setStatus } = useFFmpeg();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [width, setWidth] = useState(1280);
  const [height, setHeight] = useState(720);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setVideoFile(e.target.files[0]);
      setDownloadUrl(null);
      if (!loaded) load();
    }
  };

  const resizeVideo = async () => {
    if (!videoFile || !loaded) return;
    setStatus('processing');
    const inputName = 'input.mp4';
    const outputName = 'resized.mp4';

    try {
      await ffmpeg.writeFile(inputName, await fetchFile(videoFile));
      // Ensure even dimensions (required by libx264 and many other codecs)
      const evenW = Math.round(width / 2) * 2;
      const evenH = Math.round(height / 2) * 2;
      await ffmpeg.exec(['-i', inputName, '-vf', `scale=${evenW}:${evenH}`, '-c:a', 'copy', outputName]);
      const data = await ffmpeg.readFile(outputName);
      const url = URL.createObjectURL(new Blob([(data as Uint8Array).buffer as any], { type: 'video/mp4' }));
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(url);
      setStatus('completed');
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>Video Resizer</h2>
      <div style={{ marginBottom: '20px', border: '2px dashed #444', padding: '40px', textAlign: 'center', borderRadius: '12px' }}>
        <input type="file" accept="video/*" onChange={handleFileChange} style={{ display: 'none' }} id="resizer-upload" />
        <label htmlFor="resizer-upload" style={{ cursor: 'pointer', color: '#646cff', fontWeight: 'bold' }}>
          {videoFile ? videoFile.name : 'Click to Upload Video'}
        </label>
      </div>
      {videoFile && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}>
            <input type="number" value={width} onChange={e => setWidth(parseInt(e.target.value))} placeholder="Width" style={{ width: '100px' }} />
            <span>x</span>
            <input type="number" value={height} onChange={e => setHeight(parseInt(e.target.value))} placeholder="Height" style={{ width: '100px' }} />
          </div>
          <button onClick={resizeVideo} className="primary" disabled={status === 'processing'}>
            {status === 'processing' ? 'Processing...' : 'Resize Video'}
          </button>
          {downloadUrl && <div style={{ marginTop: '20px' }}><a href={downloadUrl} download={`resized-${videoFile.name}`} className="button success">Download</a></div>}
        </div>
      )}
    </div>
  );
};

export default VideoResizer;
