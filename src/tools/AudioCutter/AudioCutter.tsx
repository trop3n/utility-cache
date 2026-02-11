import React, { useState } from 'react';
import { fetchFile } from '@ffmpeg/util';
import { useFFmpeg } from '../../hooks/useFFmpeg';

const AudioCutter: React.FC = () => {
  const { ffmpeg, loaded, load, status, setStatus, progress, message } = useFFmpeg();
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [startTime, setStartTime] = useState('00:00:00');
  const [endTime, setEndTime] = useState('00:00:30');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAudioFile(e.target.files[0]);
      setDownloadUrl(null);
      if (!loaded) load();
    }
  };

  const cutAudio = async () => {
    if (!audioFile || !loaded) return;
    setStatus('processing');
    const inputName = 'input_audio';
    const outputName = `trimmed_${audioFile.name}`;

    try {
      await ffmpeg.writeFile(inputName, await fetchFile(audioFile));
      // -ss start -to end -c copy (if same format) or re-encode
      await ffmpeg.exec(['-i', inputName, '-ss', startTime, '-to', endTime, '-c', 'copy', outputName]);
      const data = await ffmpeg.readFile(outputName);
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(URL.createObjectURL(new Blob([(data as Uint8Array).buffer as any], { type: audioFile.type || 'audio/mpeg' })));
      setStatus('completed');
    } catch (e) { setStatus('error'); }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>Audio Cutter</h2>
      <div style={{ marginBottom: '20px', border: '2px dashed #444', padding: '40px', textAlign: 'center', borderRadius: '12px' }}>
        <input type="file" accept="audio/*" onChange={handleFileChange} style={{ display: 'none' }} id="audio-upload" />
        <label htmlFor="audio-upload" style={{ cursor: 'pointer', color: '#646cff', fontWeight: 'bold' }}>
          {audioFile ? audioFile.name : 'Click to Upload Audio'}
        </label>
      </div>
      {audioFile && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem' }}>Start (HH:MM:SS)</label>
              <input type="text" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem' }}>End (HH:MM:SS)</label>
              <input type="text" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>
          <button onClick={cutAudio} className="primary" disabled={status === 'processing'}>Trim Audio</button>
          {status === 'processing' && <div style={{ marginTop: '10px' }}>Progress: {progress}%</div>}
          {downloadUrl && <div style={{ marginTop: '20px' }}><a href={downloadUrl} download={`trimmed-${audioFile.name}`} className="button success">Download</a></div>}
          <p style={{ fontSize: '0.7rem', color: '#666', marginTop: '10px' }}>{message}</p>
        </div>
      )}
    </div>
  );
};

export default AudioCutter;
