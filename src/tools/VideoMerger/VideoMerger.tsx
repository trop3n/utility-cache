import React, { useState } from 'react';
import { fetchFile } from '@ffmpeg/util';
import { useFFmpeg } from '../../hooks/useFFmpeg';

const VideoMerger: React.FC = () => {
  const { ffmpeg, loaded, load, status, setStatus, progress, message } = useFFmpeg();
  const [files, setFiles] = useState<File[]>([]);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles([...files, ...Array.from(e.target.files)]);
      setDownloadUrl(null);
      if (!loaded) load();
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    setDownloadUrl(null);
  };

  const mergeVideos = async () => {
    if (files.length < 2 || !loaded) return;
    setStatus('processing');
    try {
      const inputNames: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const name = `input${i}.mp4`;
        await ffmpeg.writeFile(name, await fetchFile(files[i]));
        inputNames.push(name);
      }

      // Filter complex to concat video and audio
      // [0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[v][a]
      // Note: This assumes all videos have audio. If one lacks audio, it might fail or desync.
      // A robust solution would add silence to silent videos, but we'll stick to basic concat.
      // Also assumes same resolution/sar/frame rate. If not, ffmpeg might fail or output garbage.
      // We will add scale filter to standardize? For now, we trust ffmpeg's permissive concat or user inputs.
      
      const filter = inputNames.map((_, i) => `[${i}:v][${i}:a]`).join('') + `concat=n=${files.length}:v=1:a=1[v][a]`;
      
      const args = inputNames.flatMap(name => ['-i', name]);
      args.push('-filter_complex', filter, '-map', '[v]', '-map', '[a]', 'output.mp4');

      await ffmpeg.exec(args);
      const data = await ffmpeg.readFile('output.mp4');
      setDownloadUrl(URL.createObjectURL(new Blob([(data as Uint8Array).buffer as any], { type: 'video/mp4' })));
      setStatus('completed');
    } catch (e) { 
        console.error(e);
        setStatus('error'); 
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>Video Merger</h2>
      
      {!loaded && (
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
             <button onClick={load} className="primary">Initialize Engine</button>
        </div>
      )}

      <div style={{ marginBottom: '20px', border: '2px dashed #444', padding: '40px', textAlign: 'center', borderRadius: '12px' }}>
        <input type="file" accept="video/*" multiple onChange={handleFileChange} style={{ display: 'none' }} id="merge-upload" />
        <label htmlFor="merge-upload" style={{ cursor: 'pointer', color: '#646cff', fontWeight: 'bold' }}>
          Click to Upload Videos
        </label>
      </div>

      {files.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
           <h3>Selected Videos ({files.length})</h3>
           <ul style={{ listStyle: 'none', padding: 0 }}>
             {files.map((file, index) => (
               <li key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #444' }}>
                 <span>{file.name}</span>
                 <button onClick={() => removeFile(index)} style={{ padding: '5px 10px', backgroundColor: '#e74c3c', fontSize: '0.8rem' }}>Remove</button>
               </li>
             ))}
           </ul>
        </div>
      )}

      {files.length >= 2 && loaded && (
        <div style={{ textAlign: 'center' }}>
            <button onClick={mergeVideos} className="primary" style={{ marginTop: '20px' }} disabled={status === 'processing'}>Merge Videos</button>
            
            {status === 'processing' && (
                <div style={{ width: '100%', backgroundColor: '#111', borderRadius: '10px', overflow: 'hidden', height: '20px', marginTop: '20px' }}>
                  <div style={{ width: `${progress}%`, backgroundColor: '#646cff', height: '100%', transition: 'width 0.3s ease' }} />
                </div>
            )}
            
            {downloadUrl && <div style={{ marginTop: '20px' }}><a href={downloadUrl} download="merged.mp4" className="button success">Download Merged Video</a></div>}
            <p style={{ fontSize: '0.7rem', color: '#666', marginTop: '10px' }}>{message}</p>
        </div>
      )}
    </div>
  );
};

export default VideoMerger;
