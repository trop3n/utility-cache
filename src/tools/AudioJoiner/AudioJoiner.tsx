import React, { useState } from 'react';
import { fetchFile } from '@ffmpeg/util';
import { useFFmpeg } from '../../hooks/useFFmpeg';

const AudioJoiner: React.FC = () => {
  const { ffmpeg, loaded, load, status, setStatus, message } = useFFmpeg();
  const [files, setFiles] = useState<File[]>([]);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles([...files, ...Array.from(e.target.files)]);
      setDownloadUrl(null);
      if (!loaded) load();
    }
  };

  const joinAudio = async () => {
    if (files.length < 2 || !loaded) return;
    setStatus('processing');
    try {
      const inputNames: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const name = `input${i}.mp3`;
        await ffmpeg.writeFile(name, await fetchFile(files[i]));
        inputNames.push(name);
      }

      // Filter complex to concat audio
      const filter = inputNames.map((_, i) => `[${i}:a]`).join('') + `concat=n=${files.length}:v=0:a=1[a]`;
      const args = inputNames.flatMap(name => ['-i', name]);
      args.push('-filter_complex', filter, '-map', '[a]', 'output.mp3');

      await ffmpeg.exec(args);
      const data = await ffmpeg.readFile('output.mp3');
      setDownloadUrl(URL.createObjectURL(new Blob([(data as Uint8Array).buffer as any], { type: 'audio/mp3' })));
      setStatus('completed');
    } catch (e) { setStatus('error'); }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>Audio Joiner</h2>
      <input type="file" accept="audio/*" multiple onChange={handleFileChange} />
      <div style={{ marginTop: '20px' }}>
        {files.map((f, i) => <div key={i}>{f.name}</div>)}
      </div>
      {files.length >= 2 && (
        <button onClick={joinAudio} className="primary" style={{ marginTop: '20px' }} disabled={status === 'processing'}>Join Files</button>
      )}
      {downloadUrl && <a href={downloadUrl} download="joined.mp3" className="button success">Download</a>}
      <p style={{ fontSize: '0.7rem' }}>{message}</p>
    </div>
  );
};

export default AudioJoiner;
