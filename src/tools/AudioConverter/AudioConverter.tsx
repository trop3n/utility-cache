import React, { useState } from 'react';
import { fetchFile } from '@ffmpeg/util';
import { useFFmpeg } from '../../hooks/useFFmpeg';

const AudioConverter: React.FC = () => {
  const { ffmpeg, loaded, load, status, setStatus, progress, message } = useFFmpeg();
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState('mp3');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const convertAudio = async () => {
    if (!audioFile || !loaded) return;
    setStatus('processing');
    const inputName = 'input_audio';
    const outputName = `converted.${outputFormat}`;
    try {
      await ffmpeg.writeFile(inputName, await fetchFile(audioFile));
      await ffmpeg.exec(['-i', inputName, outputName]);
      const data = await ffmpeg.readFile(outputName);
      setDownloadUrl(URL.createObjectURL(new Blob([(data as Uint8Array).buffer], { type: `audio/${outputFormat}` })));
      setStatus('completed');
    } catch (e) { setStatus('error'); }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>Audio Converter</h2>
      <input type="file" accept="audio/*" onChange={e => setAudioFile(e.target.files?.[0] || null)} />
      {audioFile && (
        <div style={{ marginTop: '20px' }}>
          <select value={outputFormat} onChange={e => setOutputFormat(e.target.value)} style={{ padding: '8px', marginRight: '10px' }}>
            <option value="mp3">MP3</option>
            <option value="wav">WAV</option>
            <option value="ogg">OGG</option>
            <option value="aac">AAC</option>
          </select>
          <button onClick={convertAudio} className="primary" disabled={status === 'processing'}>Convert</button>
          {downloadUrl && <a href={downloadUrl} download={`converted.${outputFormat}`} className="button success">Download</a>}
          <p style={{ fontSize: '0.7rem', color: '#666' }}>{message}</p>
        </div>
      )}
    </div>
  );
};

export default AudioConverter;
