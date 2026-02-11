import React, { useState } from 'react';
import { fetchFile } from '@ffmpeg/util';
import { useFFmpeg } from '../../hooks/useFFmpeg';

const HapEncoder: React.FC = () => {
  const { ffmpeg, loaded, load, status, setStatus, progress, message } = useFFmpeg();
  const [file, setFile] = useState<File | null>(null);
  const [hapFormat, setHapFormat] = useState('hap'); // hap, hap_alpha, hap_q
  const [chunks, setChunks] = useState(1); // 1 is default/safe. 
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setDownloadUrl(null);
      if (!loaded) load();
    }
  };

  const encodeHap = async () => {
    if (!file || !loaded) return;
    setStatus('processing');
    const inputName = 'input_video';
    const outputName = 'output_hap.mov';

    try {
      await ffmpeg.writeFile(inputName, await fetchFile(file));

      // ffmpeg -i input -c:v hap -format hap_q -chunks 4 output.mov
      const args = [
        '-i', inputName,
        '-c:v', 'hap',
        '-format', hapFormat,
        '-chunks', chunks.toString(),
        // HAP is often used without audio or with PCM/AAC. We'll copy audio or use pcm_s16le which is standard for MOV.
        '-c:a', 'pcm_s16le', 
        outputName
      ];

      await ffmpeg.exec(args);
      const data = await ffmpeg.readFile(outputName);
      
      const blob = new Blob([(data as Uint8Array).buffer as any], { type: 'video/quicktime' });
      const url = URL.createObjectURL(blob);
      
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(url);
      setStatus('completed');
    } catch (error) {
      console.error('HAP encoding failed', error);
      setStatus('error');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>HAP Encoder</h2>
      <p style={{ color: '#888', marginBottom: '20px' }}>
        Convert videos to HAP, HAP Alpha, or HAP Q codec (.mov) for high-performance playback.
      </p>

      <div style={{ backgroundColor: 'rgba(243, 156, 18, 0.1)', padding: '15px', borderRadius: '8px', marginBottom: '20px', color: '#e67e22', fontSize: '0.9rem' }}>
        <strong>Note:</strong> The HAP codec requires a custom FFmpeg build. The standard browser-based FFmpeg.wasm
        does not include HAP support. This tool will work in the Electron desktop version with a system FFmpeg
        installation that includes the HAP encoder, but may fail in the browser version.
      </div>

      {!loaded && (
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <button onClick={load} className="primary">Initialize Engine</button>
        </div>
      )}

      <div style={{ marginBottom: '20px', border: '2px dashed #444', padding: '40px', textAlign: 'center', borderRadius: '12px' }}>
        <input type="file" accept="video/*" onChange={handleFileChange} style={{ display: 'none' }} id="hap-upload" />
        <label htmlFor="hap-upload" style={{ cursor: 'pointer', color: '#646cff', fontWeight: 'bold' }}>
          {file ? file.name : 'Click to Upload Video'}
        </label>
      </div>

      {file && loaded && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>HAP Format</label>
                <select 
                    value={hapFormat} 
                    onChange={e => setHapFormat(e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', background: '#222', color: 'white' }}
                >
                    <option value="hap">HAP (Standard)</option>
                    <option value="hap_alpha">HAP Alpha (Transparency)</option>
                    <option value="hap_q">HAP Q (High Quality)</option>
                </select>
            </div>
            
            <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Chunks (CPU Threads)</label>
                <select 
                    value={chunks} 
                    onChange={e => setChunks(parseInt(e.target.value))}
                    style={{ padding: '8px', borderRadius: '4px', background: '#222', color: 'white' }}
                >
                    <option value="1">1 (Single)</option>
                    <option value="2">2</option>
                    <option value="4">4</option>
                    <option value="8">8</option>
                    <option value="16">16 (Max)</option>
                </select>
            </div>
          </div>

          <button onClick={encodeHap} className="primary" disabled={status === 'processing'}>
            {status === 'processing' ? 'Encoding...' : 'Convert to HAP'}
          </button>

          {status === 'processing' && (
             <div style={{ width: '100%', backgroundColor: '#111', borderRadius: '10px', overflow: 'hidden', height: '20px', marginTop: '20px' }}>
              <div style={{ width: `${progress}%`, backgroundColor: '#646cff', height: '100%', transition: 'width 0.3s ease' }} />
            </div>
          )}

          {status === 'completed' && downloadUrl && (
            <div style={{ marginTop: '20px' }}>
              <p style={{ color: '#27ae60' }}>Encoding successful!</p>
              <a 
                href={downloadUrl} 
                download={file.name.substring(0, file.name.lastIndexOf('.')) + '_hap.mov'}
                className="button success"
                style={{ textDecoration: 'none', padding: '10px 20px', borderRadius: '8px', display: 'inline-block' }}
              >
                Download HAP Video
              </a>
            </div>
          )}
          
           <p style={{ fontSize: '0.7rem', color: '#666', marginTop: '10px' }}>{message}</p>
        </div>
      )}
    </div>
  );
};

export default HapEncoder;
