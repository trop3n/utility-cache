import React, { useState } from 'react';
import { fetchFile } from '@ffmpeg/util';
import { useFFmpeg } from '../../hooks/useFFmpeg';

const VideoRotator: React.FC = () => {
  const { ffmpeg, loaded, load, status, setStatus, progress } = useFFmpeg();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [rotation, setRotation] = useState('1'); // 1 = 90 Clockwise
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const rotateVideo = async () => {
    if (!videoFile || !loaded) return;
    setStatus('processing');
    const inputName = 'input.mp4';
    const outputName = 'rotated.mp4';
    try {
      await ffmpeg.writeFile(inputName, await fetchFile(videoFile));
      // transpose=1: 90CW, 2: 90CCW, 3: 90CW+vflip. Or hflip/vflip
      let filter = `transpose=${rotation}`;
      if (rotation === 'hflip') filter = 'hflip';
      if (rotation === 'vflip') filter = 'vflip';
      
      await ffmpeg.exec(['-i', inputName, '-vf', filter, '-c:a', 'copy', outputName]);
      const data = await ffmpeg.readFile(outputName);
      setDownloadUrl(URL.createObjectURL(new Blob([(data as Uint8Array).buffer], { type: 'video/mp4' })));
      setStatus('completed');
    } catch (e) { setStatus('error'); }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>Video Rotator / Flipper</h2>
      <input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files?.[0] || null)} />
      {videoFile && (
        <div style={{ marginTop: '20px' }}>
          <select value={rotation} onChange={e => setRotation(e.target.value)} style={{ padding: '8px', marginRight: '10px' }}>
            <option value="1">90° Clockwise</option>
            <option value="2">90° Counter-Clockwise</option>
            <option value="hflip">Flip Horizontal</option>
            <option value="vflip">Flip Vertical</option>
          </select>
          <button onClick={rotateVideo} className="primary" disabled={status === 'processing'}>Rotate</button>
          {downloadUrl && <a href={downloadUrl} download="rotated.mp4" className="button success">Download</a>}
        </div>
      )}
    </div>
  );
};

export default VideoRotator;
