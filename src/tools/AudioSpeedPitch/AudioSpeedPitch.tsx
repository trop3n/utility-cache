import React, { useState } from 'react';
import { fetchFile } from '@ffmpeg/util';
import { useFFmpeg } from '../../hooks/useFFmpeg';

const AudioSpeedPitch: React.FC = () => {
  const { ffmpeg, loaded, load, status, setStatus, progress, message } = useFFmpeg();
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(1.0); // 1.0 is normal
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const processAudio = async () => {
    if (!audioFile || !loaded) return;
    setStatus('processing');
    const inputName = 'input_audio';
    const outputName = 'processed.mp3';
    try {
      await ffmpeg.writeFile(inputName, await fetchFile(audioFile));
      // rubato/atempo for speed, asetrate for pitch
      // pitch change: asetrate=sample_rate*pitch,atempo=1/pitch
      const sampleRate = 44100; 
      const filter = `asetrate=${sampleRate * pitch},atempo=${(speed / pitch).toFixed(2)}`;
      
      await ffmpeg.exec(['-i', inputName, '-af', filter, outputName]);
      const data = await ffmpeg.readFile(outputName);
      setDownloadUrl(URL.createObjectURL(new Blob([(data as Uint8Array).buffer], { type: 'audio/mp3' })));
      setStatus('completed');
    } catch (e) { setStatus('error'); }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>Audio Speed & Pitch</h2>
      <input type="file" accept="audio/*" onChange={e => setAudioFile(e.target.files?.[0] || null)} />
      {audioFile && (
        <div style={{ marginTop: '20px' }}>
          <div>Speed: {speed}x</div>
          <input type="range" min="0.5" max="2.0" step="0.1" value={speed} onChange={e => setSpeed(parseFloat(e.target.value))} />
          <div style={{ marginTop: '10px' }}>Pitch: {pitch}x</div>
          <input type="range" min="0.5" max="2.0" step="0.1" value={pitch} onChange={e => setPitch(parseFloat(e.target.value))} />
          
          <button onClick={processAudio} className="primary" style={{ display: 'block', margin: '20px auto' }} disabled={status === 'processing'}>Apply Changes</button>
          {downloadUrl && <a href={downloadUrl} download="processed.mp3" className="button success">Download</a>}
        </div>
      )}
    </div>
  );
};

export default AudioSpeedPitch;
