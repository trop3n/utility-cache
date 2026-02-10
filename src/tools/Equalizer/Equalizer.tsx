import React, { useState } from 'react';
import { fetchFile } from '@ffmpeg/util';
import { useFFmpeg } from '../../hooks/useFFmpeg';

const Equalizer: React.FC = () => {
  const { ffmpeg, loaded, load, status, setStatus, progress, message } = useFFmpeg();
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  
  // 10 bands: 60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000 Hz
  const [gains, setGains] = useState<number[]>(new Array(10).fill(0));
  const frequencies = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAudioFile(e.target.files[0]);
      setDownloadUrl(null);
      if (!loaded) load();
    }
  };

  const updateGain = (index: number, value: number) => {
    const newGains = [...gains];
    newGains[index] = value;
    setGains(newGains);
  };

  const applyEqualizer = async () => {
    if (!audioFile || !loaded) return;
    setStatus('processing');
    const inputName = 'input_audio';
    const outputName = 'equalized.mp3';
    
    try {
      await ffmpeg.writeFile(inputName, await fetchFile(audioFile));
      
      // Chain equalizer filters
      // equalizer=f=60:width_type=h:width=50:g=10
      const filterChain = frequencies.map((freq, i) => {
        return `equalizer=f=${freq}:width_type=o:width=2:g=${gains[i]}`;
      }).join(',');

      await ffmpeg.exec(['-i', inputName, '-af', filterChain, outputName]);
      const data = await ffmpeg.readFile(outputName);
      setDownloadUrl(URL.createObjectURL(new Blob([(data as Uint8Array).buffer as any], { type: 'audio/mp3' })));
      setStatus('completed');
    } catch (e) { 
        console.error(e);
        setStatus('error'); 
    }
  };

  const presets: Record<string, number[]> = {
    'Flat': new Array(10).fill(0),
    'Bass Boost': [10, 8, 6, 4, 0, 0, 0, 0, 0, 0],
    'Treble Boost': [0, 0, 0, 0, 0, 2, 4, 6, 8, 10],
    'Pop': [-2, -1, 2, 4, 5, 4, 2, -1, -2, -2],
    'Rock': [4, 3, 2, -2, -3, -2, 2, 3, 4, 4],
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>Audio Equalizer</h2>
      
      {!loaded && status !== 'loading' && (
        <div style={{ padding: '20px', backgroundColor: 'rgba(100, 108, 255, 0.1)', borderRadius: '8px', marginBottom: '20px' }}>
          <p>This tool uses FFmpeg.wasm. Initialize it to start.</p>
          <button onClick={load} className="primary">Initialize Engine</button>
        </div>
      )}

      {status === 'loading' && <p>Loading FFmpeg engine...</p>}

      <div style={{ marginBottom: '20px', border: '2px dashed #444', padding: '20px', textAlign: 'center', borderRadius: '12px' }}>
        <input type="file" accept="audio/*" onChange={handleFileChange} style={{ display: 'none' }} id="eq-upload" />
        <label htmlFor="eq-upload" style={{ cursor: 'pointer', color: '#646cff', fontWeight: 'bold' }}>
          {audioFile ? audioFile.name : 'Click to Upload Audio'}
        </label>
      </div>

      {audioFile && loaded && (
        <div>
           <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
             {Object.keys(presets).map(name => (
               <button key={name} onClick={() => setGains(presets[name])} style={{ padding: '5px 10px', fontSize: '0.8rem' }}>{name}</button>
             ))}
           </div>

           <div style={{ display: 'flex', justifyContent: 'space-between', height: '200px', alignItems: 'flex-end', marginBottom: '20px', padding: '0 10px' }}>
             {gains.map((gain, i) => (
               <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                 <input 
                    type="range" 
                    min="-20" 
                    max="20" 
                    value={gain} 
                    onChange={(e) => updateGain(i, parseInt(e.target.value))}
                    // orient="vertical" // Firefox specific
                    style={{ 
                        writingMode: 'bt-lr' as any, /* IE */
                        WebkitAppearance: 'slider-vertical', /* WebKit */
                        width: '8px',
                        height: '150px',
                        marginBottom: '10px'
                    }} 
                 />
                 <span style={{ fontSize: '0.7rem' }}>{frequencies[i] < 1000 ? frequencies[i] : `${frequencies[i]/1000}k`}</span>
                 <span style={{ fontSize: '0.6rem', color: '#888' }}>{gain}dB</span>
               </div>
             ))}
           </div>

          <div style={{ textAlign: 'center' }}>
            <button onClick={applyEqualizer} className="primary" disabled={status === 'processing'}>Apply Equalizer</button>
            
            {status === 'processing' && (
                <div style={{ marginTop: '10px' }}>
                    Processing... {progress}%
                </div>
            )}
            
            {downloadUrl && (
                <div style={{ marginTop: '20px' }}>
                    <a href={downloadUrl} download="equalized.mp3" className="button success">Download Processed Audio</a>
                </div>
            )}
          </div>
          <p style={{ fontSize: '0.7rem', textAlign: 'center', marginTop: '10px', color: '#666' }}>{message}</p>
        </div>
      )}
    </div>
  );
};

export default Equalizer;
