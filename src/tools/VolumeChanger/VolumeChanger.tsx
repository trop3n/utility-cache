import React, { useState } from 'react';
import { fetchFile } from '@ffmpeg/util';
import { useFFmpeg } from '../../hooks/useFFmpeg';

const VolumeChanger: React.FC = () => {
  const { ffmpeg, loaded, load, status, setStatus, progress, message } = useFFmpeg();
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [volume, setVolume] = useState(1.0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const changeVolume = async () => {
    if (!audioFile || !loaded) return;
    setStatus('processing');
    const inputName = 'input_audio';
    const outputName = 'volume_adjusted.mp3';
    try {
      await ffmpeg.writeFile(inputName, await fetchFile(audioFile));
      await ffmpeg.exec(['-i', inputName, '-filter:a', `volume=${volume}`, outputName]);
      const data = await ffmpeg.readFile(outputName);
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(URL.createObjectURL(new Blob([(data as Uint8Array).buffer as any], { type: 'audio/mpeg' })));
      setStatus('completed');
    } catch (e) { setStatus('error'); }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>Volume Changer</h2>
      
      {!loaded && (
        <button onClick={load} className="primary" style={{ marginBottom: '20px' }}>Initialize Engine</button>
      )}

      <input type="file" accept="audio/*" onChange={e => setAudioFile(e.target.files?.[0] || null)} />
      {audioFile && loaded && (
        <div style={{ marginTop: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px' }}>Volume: {Math.round(volume * 100)}%</label>
          <input type="range" min="0" max="3" step="0.1" value={volume} onChange={e => setVolume(parseFloat(e.target.value))} style={{ width: '100%', maxWidth: '400px' }} />
          <button onClick={changeVolume} className="primary" style={{ display: 'block', margin: '20px auto' }} disabled={status === 'processing'}>Apply Volume</button>
          
          {status === 'processing' && <p>Progress: {progress}%</p>}
          
          {downloadUrl && <a href={downloadUrl} download="volume-adjusted.mp3" className="button success">Download</a>}
          <p style={{ fontSize: '0.7rem', color: '#666' }}>{message}</p>
        </div>
      )}
    </div>
  );
};

export default VolumeChanger;
