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
      // pitch change: asetrate=sample_rate*pitch,aresample=sample_rate,atempo=speed/pitch
      const sampleRate = 44100;

      // Build atempo chain - atempo only supports 0.5 to 100.0 per filter
      // For values outside 0.5-2.0, chain multiple atempo filters
      const buildAtempoChain = (tempo: number): string => {
        const filters: string[] = [];
        let remaining = tempo;
        while (remaining < 0.5) {
          filters.push('atempo=0.5');
          remaining /= 0.5;
        }
        while (remaining > 2.0) {
          filters.push('atempo=2.0');
          remaining /= 2.0;
        }
        filters.push(`atempo=${remaining.toFixed(4)}`);
        return filters.join(',');
      };

      const tempoValue = speed / pitch;
      const atempoChain = buildAtempoChain(tempoValue);
      const filter = `asetrate=${Math.round(sampleRate * pitch)},aresample=${sampleRate},${atempoChain}`;

      await ffmpeg.exec(['-i', inputName, '-af', filter, outputName]);
      const data = await ffmpeg.readFile(outputName);
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(URL.createObjectURL(new Blob([(data as Uint8Array).buffer as any], { type: 'audio/mpeg' })));
      setStatus('completed');
    } catch (e) { setStatus('error'); }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>Audio Speed & Pitch</h2>
      {!loaded && (
        <button onClick={load} className="primary" style={{ marginBottom: '20px' }}>Initialize Engine</button>
      )}
      <input type="file" accept="audio/*" onChange={e => setAudioFile(e.target.files?.[0] || null)} />
      {audioFile && loaded && (
        <div style={{ marginTop: '20px' }}>
          <div>Speed: {speed}x</div>
          <input type="range" min="0.5" max="2.0" step="0.1" value={speed} onChange={e => setSpeed(parseFloat(e.target.value))} />
          <div style={{ marginTop: '10px' }}>Pitch: {pitch}x</div>
          <input type="range" min="0.5" max="2.0" step="0.1" value={pitch} onChange={e => setPitch(parseFloat(e.target.value))} />
          
          <button onClick={processAudio} className="primary" style={{ display: 'block', margin: '20px auto' }} disabled={status === 'processing'}>Apply Changes</button>
          
          {status === 'processing' && <p>Progress: {progress}%</p>}

          {downloadUrl && <a href={downloadUrl} download="processed.mp3" className="button success">Download</a>}
          <p style={{ fontSize: '0.7rem', color: '#666' }}>{message}</p>
        </div>
      )}
    </div>
  );
};

export default AudioSpeedPitch;
