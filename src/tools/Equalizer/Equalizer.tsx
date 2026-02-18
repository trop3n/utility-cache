import React, { useState } from 'react';
import { fetchFile } from '@ffmpeg/util';
import { useFFmpeg } from '../../hooks/useFFmpeg';

const Equalizer: React.FC = () => {
  const { ffmpeg, loaded, load, status, setStatus, progress, message } = useFFmpeg();
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  
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
      
      const filterChain = frequencies.map((freq, i) => {
        return `equalizer=f=${freq}:width_type=o:width=2:g=${gains[i]}`;
      }).join(',');

      await ffmpeg.exec(['-i', inputName, '-af', filterChain, outputName]);
      const data = await ffmpeg.readFile(outputName);
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(URL.createObjectURL(new Blob([(data as Uint8Array).buffer as any], { type: 'audio/mpeg' })));
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

  const resetGains = () => setGains(new Array(10).fill(0));

  const sliderContainerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: '20px 10px',
    backgroundColor: '#0a0a0a',
    borderRadius: '12px',
    marginTop: '20px',
  };

  const bandStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
    gap: '8px',
  };

  const sliderWrapperStyle: React.CSSProperties = {
    height: '180px',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    cursor: 'pointer',
  };

  const sliderTrackStyle: React.CSSProperties = {
    width: '4px',
    height: '100%',
    backgroundColor: '#333',
    borderRadius: '2px',
    position: 'relative',
  };

  const sliderFillStyle = (gain: number): React.CSSProperties => ({
    width: '100%',
    position: 'absolute',
    left: 0,
    backgroundColor: gain >= 0 ? '#fff' : '#888',
    borderRadius: '2px',
    ...(gain >= 0 
      ? { bottom: '50%', height: `${(gain / 20) * 50}%` }
      : { top: '50%', height: `${(Math.abs(gain) / 20) * 50}%` }
    ),
  });

  const sliderThumbStyle = (gain: number): React.CSSProperties => ({
    width: '16px',
    height: '8px',
    backgroundColor: '#fff',
    borderRadius: '2px',
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    top: `${100 - ((gain + 20) / 40) * 100}%`,
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
  });

  const handleSliderClick = (index: number, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const percent = y / rect.height;
    const newGain = Math.round(((1 - percent) * 40 - 20) / 2) * 2;
    updateGain(index, Math.max(-20, Math.min(20, newGain)));
  };

  const handleSliderDrag = (index: number, e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return;
    handleSliderClick(index, e);
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.7rem',
    color: '#888',
  };

  const gainStyle: React.CSSProperties = {
    fontSize: '0.65rem',
    color: '#555',
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ color: '#fff' }}>Audio Equalizer</h2>
      
      {!loaded && status !== 'loading' && (
        <div style={{ padding: '20px', backgroundColor: '#1a1a1a', borderRadius: '8px', marginBottom: '20px', border: '1px solid #333' }}>
          <p style={{ color: '#888' }}>This tool uses FFmpeg.wasm. Initialize it to start.</p>
          <button onClick={load} className="primary">Initialize Engine</button>
        </div>
      )}

      {status === 'loading' && <p style={{ color: '#888' }}>Loading FFmpeg engine...</p>}

      <div style={{ marginBottom: '20px', border: '2px dashed #333', padding: '20px', textAlign: 'center', borderRadius: '12px', backgroundColor: '#0a0a0a' }}>
        <input type="file" accept="audio/*" onChange={handleFileChange} style={{ display: 'none' }} id="eq-upload" />
        <label htmlFor="eq-upload" style={{ cursor: 'pointer', color: '#888', fontWeight: 'bold' }}>
          {audioFile ? audioFile.name : 'Click to Upload Audio'}
        </label>
      </div>

      {audioFile && loaded && (
        <div>
           <div style={{ marginBottom: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
             {Object.keys(presets).map(name => (
               <button 
                 key={name} 
                 onClick={() => setGains(presets[name])} 
                 style={{ 
                   padding: '6px 12px', 
                   fontSize: '0.75rem',
                   backgroundColor: '#1a1a1a',
                   border: '1px solid #333',
                   color: '#888',
                   borderRadius: '4px',
                   cursor: 'pointer',
                 }}
                 onMouseEnter={(e) => {
                   e.currentTarget.style.borderColor = '#555';
                   e.currentTarget.style.color = '#fff';
                 }}
                 onMouseLeave={(e) => {
                   e.currentTarget.style.borderColor = '#333';
                   e.currentTarget.style.color = '#888';
                 }}
               >
                 {name}
               </button>
             ))}
             <button 
               onClick={resetGains} 
               style={{ 
                 padding: '6px 12px', 
                 fontSize: '0.75rem',
                 backgroundColor: 'transparent',
                 border: '1px solid #444',
                 color: '#666',
                 borderRadius: '4px',
                 cursor: 'pointer',
               }}
             >
               Reset
             </button>
           </div>

            <div style={sliderContainerStyle}>
              {gains.map((gain, i) => (
                <div key={i} style={bandStyle}>
                  <div 
                    style={sliderWrapperStyle}
                    onClick={(e) => handleSliderClick(i, e)}
                    onMouseMove={(e) => handleSliderDrag(i, e)}
                  >
                    <div style={sliderTrackStyle}>
                      <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', backgroundColor: '#444' }} />
                      <div style={sliderFillStyle(gain)} />
                     <div style={sliderThumbStyle(gain)} />
                   </div>
                 </div>
                 <span style={labelStyle}>{frequencies[i] < 1000 ? frequencies[i] : `${frequencies[i]/1000}k`}</span>
                 <span style={gainStyle}>{gain > 0 ? `+${gain}` : gain}dB</span>
               </div>
             ))}
           </div>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button 
              onClick={applyEqualizer} 
              className="primary" 
              disabled={status === 'processing'}
              style={{
                backgroundColor: '#fff',
                color: '#000',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '6px',
                cursor: status === 'processing' ? 'not-allowed' : 'pointer',
                opacity: status === 'processing' ? 0.6 : 1,
              }}
            >
              Apply Equalizer
            </button>
            
            {status === 'processing' && (
                <div style={{ marginTop: '10px', color: '#888' }}>
                    Processing... {progress}%
                </div>
            )}
            
            {downloadUrl && (
                <div style={{ marginTop: '20px' }}>
                    <a 
                      href={downloadUrl} 
                      download="equalized.mp3" 
                      style={{
                        backgroundColor: '#333',
                        color: '#fff',
                        padding: '10px 24px',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        display: 'inline-block',
                      }}
                    >
                      Download Processed Audio
                    </a>
                </div>
            )}
          </div>
          <p style={{ fontSize: '0.7rem', textAlign: 'center', marginTop: '10px', color: '#555' }}>{message}</p>
        </div>
      )}
    </div>
  );
};

export default Equalizer;
