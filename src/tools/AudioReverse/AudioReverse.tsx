import React, { useState } from 'react';
import { fetchFile } from '@ffmpeg/util';
import { useFFmpeg } from '../../hooks/useFFmpeg';

const AudioReverse: React.FC = () => {
  const { ffmpeg, loaded, load, status, setStatus, progress, message } = useFFmpeg();
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const reverseAudio = async () => {
    if (!audioFile || !loaded) return;
    setStatus('processing');
    try {
      await ffmpeg.writeFile('input', await fetchFile(audioFile));
      await ffmpeg.exec(['-i', 'input', '-af', 'areverse', 'output.mp3']);
      const data = await ffmpeg.readFile('output.mp3');
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(URL.createObjectURL(new Blob([(data as Uint8Array).buffer as any], { type: 'audio/mpeg' })));
      setStatus('completed');
    } catch (e) { setStatus('error'); }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
      <h2>Reverse Audio</h2>
      {!loaded && (
        <button onClick={load} className="primary" style={{ marginBottom: '20px' }}>Initialize Engine</button>
      )}
      <input type="file" accept="audio/*" onChange={e => setAudioFile(e.target.files?.[0] || null)} />
      {audioFile && loaded && (
        <div style={{ marginTop: '20px' }}>
          <button onClick={reverseAudio} className="primary" disabled={status === 'processing'}>Reverse Audio</button>
          
          {status === 'processing' && <p>Progress: {progress}%</p>}

          {downloadUrl && <div style={{ marginTop: '20px' }}><a href={downloadUrl} download="reversed.mp3" className="button success">Download Reversed</a></div>}
          
          <p style={{ fontSize: '0.7rem', color: '#666' }}>{message}</p>
        </div>
      )}
    </div>
  );
};

export default AudioReverse;
