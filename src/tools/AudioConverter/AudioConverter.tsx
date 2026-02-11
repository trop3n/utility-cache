import React, { useState } from 'react';
import { fetchFile } from '@ffmpeg/util';
import { useFFmpeg } from '../../hooks/useFFmpeg';
import JSZip from 'jszip';

const AudioConverter: React.FC = () => {
  const { ffmpeg, loaded, load, status, setStatus, progress, message } = useFFmpeg();
  
  // State
  const [files, setFiles] = useState<File[]>([]);
  const [convertedFiles, setConvertedFiles] = useState<{name: string, url: string}[]>([]);
  
  // Settings
  const [format, setFormat] = useState('mp3');
  const [bitrate, setBitrate] = useState(128); // kbps
  const [sampleRate, setSampleRate] = useState(44100);
  const [channels, setChannels] = useState(2); // 1 = Mono, 2 = Stereo
  const [fadeIn, setFadeIn] = useState(0); // seconds
  const [fadeOut, setFadeOut] = useState(0); // seconds
  const [isReverse, setIsReverse] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Processing state
  const [currentFileIndex, setCurrentFileIndex] = useState(-1);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
      setConvertedFiles([]);
      setCurrentFileIndex(-1);
      if (!loaded) load();
    }
  };

  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
        const objectUrl = URL.createObjectURL(file);
        const audio = new Audio(objectUrl);
        audio.onloadedmetadata = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(audio.duration);
        };
        audio.onerror = () => resolve(0);
    });
  };

  const convertBatch = async () => {
    if (files.length === 0 || !loaded) return;
    setStatus('processing');
    setConvertedFiles([]);

    const results: {name: string, url: string}[] = [];

    for (let i = 0; i < files.length; i++) {
        setCurrentFileIndex(i);
        const file = files[i];
        const inputName = `input_${i}_${file.name.replace(/\s/g, '_')}`;
        // outputExt unused
        // Actually for m4a audio, usually 'ipod' or 'mp4' container with aac. we can name it .m4a
        const outputName = `output_${i}.${format}`;

        try {
            await ffmpeg.writeFile(inputName, await fetchFile(file));

            const args = ['-i', inputName];

            // Codecs
            if (format === 'mp3') args.push('-c:a', 'libmp3lame');
            else if (format === 'm4a') args.push('-c:a', 'aac');
            else if (format === 'ogg') args.push('-c:a', 'libvorbis');
            else if (format === 'flac') args.push('-c:a', 'flac');
            else if (format === 'wav') args.push('-c:a', 'pcm_s16le');

            // Bitrate (only for lossy)
            if (['mp3', 'm4a', 'ogg'].includes(format)) {
                args.push('-b:a', `${bitrate}k`);
            }

            // Sample Rate & Channels
            args.push('-ar', sampleRate.toString());
            args.push('-ac', channels.toString());

            // Filters
            const filters: string[] = [];
            if (isReverse) filters.push('areverse');
            
            if (fadeIn > 0 || fadeOut > 0) {
                const duration = await getAudioDuration(file);
                if (duration > 0) {
                    if (fadeIn > 0) filters.push(`afade=t=in:st=0:d=${fadeIn}`);
                    if (fadeOut > 0) filters.push(`afade=t=out:st=${Math.max(0, duration - fadeOut)}:d=${fadeOut}`);
                }
            }

            if (filters.length > 0) {
                args.push('-af', filters.join(','));
            }

            args.push(outputName);

            await ffmpeg.exec(args);
            const data = await ffmpeg.readFile(outputName);
            
            // Cleanup input
            try { await ffmpeg.deleteFile(inputName); } catch (e) {}
            // Cleanup output (after reading)
             try { await ffmpeg.deleteFile(outputName); } catch (e) {}

            const mimeTypes: Record<string, string> = {
                mp3: 'audio/mpeg',
                m4a: 'audio/mp4',
                ogg: 'audio/ogg',
                flac: 'audio/flac',
                wav: 'audio/wav',
            };
            const blob = new Blob([(data as Uint8Array).buffer as any], { type: mimeTypes[format] || `audio/${format}` });
            const url = URL.createObjectURL(blob);
            results.push({
                name: file.name.substring(0, file.name.lastIndexOf('.')) + '.' + format,
                url
            });

        } catch (error) {
            console.error(`Error converting ${file.name}`, error);
        }
    }

    setConvertedFiles(results);
    setCurrentFileIndex(-1);
    setStatus('completed');
  };

  const downloadAll = async () => {
    const zip = new JSZip();
    for (const f of convertedFiles) {
        const blob = await fetch(f.url).then(r => r.blob());
        zip.file(f.name, blob);
    }
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted_audio_files.zip';
    a.click();
  };

  const qualityPresets = [
      { label: 'Economy', value: 64 },
      { label: 'Standard', value: 128 },
      { label: 'Good', value: 192 },
      { label: 'Best', value: 320 },
  ];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>Audio Converter (Advanced)</h2>
      
      {!loaded && (
         <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <button onClick={load} className="primary">Initialize Engine</button>
         </div>
      )}

      <div style={{ marginBottom: '20px', border: '2px dashed #444', padding: '40px', textAlign: 'center', borderRadius: '12px' }}>
        <input type="file" accept="audio/*" multiple onChange={handleFileChange} style={{ display: 'none' }} id="adv-audio-upload" />
        <label htmlFor="adv-audio-upload" style={{ cursor: 'pointer', color: '#646cff', fontWeight: 'bold' }}>
           {files.length > 0 ? `${files.length} Files Selected` : 'Click to Upload Audio Files'}
        </label>
      </div>

      {files.length > 0 && loaded && (
        <div>
            {/* Format Selection */}
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '10px' }}>
                    {['mp3', 'wav', 'm4a', 'flac', 'ogg'].map(fmt => (
                        <button 
                            key={fmt} 
                            onClick={() => setFormat(fmt)}
                            className={format === fmt ? 'primary' : ''}
                            style={{ border: format === fmt ? '1px solid #646cff' : '1px solid #444' }}
                        >
                            {fmt.toUpperCase()}
                        </button>
                    ))}
                </div>

                {/* Quality Slider (for lossy) */}
                {['mp3', 'm4a', 'ogg'].includes(format) && (
                    <div style={{ maxWidth: '400px', margin: '0 auto', backgroundColor: '#222', padding: '15px', borderRadius: '8px' }}>
                        <label style={{ display: 'block', marginBottom: '10px' }}>Quality: {bitrate} kbps</label>
                        <input 
                            type="range" min="32" max="320" step="32" 
                            value={bitrate} onChange={e => setBitrate(parseInt(e.target.value))} 
                            style={{ width: '100%' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#888' }}>
                            {qualityPresets.map(p => (
                                <span key={p.value} style={{ cursor: 'pointer' }} onClick={() => setBitrate(p.value)}>{p.label}</span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Advanced Settings Toggle */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <button onClick={() => setShowAdvanced(!showAdvanced)} style={{ fontSize: '0.9rem', background: 'none', border: 'none', color: '#646cff', cursor: 'pointer', textDecoration: 'underline' }}>
                    {showAdvanced ? 'Hide Advanced Settings' : 'Advanced Settings'}
                </button>
            </div>

            {showAdvanced && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', backgroundColor: '#222', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                    <div>
                        <label>Sample Rate</label>
                        <select value={sampleRate} onChange={e => setSampleRate(parseInt(e.target.value))} style={{ width: '100%', marginTop: '5px' }}>
                            <option value="22050">22050 Hz</option>
                            <option value="44100">44100 Hz</option>
                            <option value="48000">48000 Hz</option>
                            <option value="96000">96000 Hz</option>
                        </select>
                    </div>
                    <div>
                        <label>Channels</label>
                        <select value={channels} onChange={e => setChannels(parseInt(e.target.value))} style={{ width: '100%', marginTop: '5px' }}>
                            <option value="1">Mono</option>
                            <option value="2">Stereo</option>
                        </select>
                    </div>
                    <div>
                        <label>Fade In (seconds)</label>
                        <input type="number" min="0" value={fadeIn} onChange={e => setFadeIn(parseFloat(e.target.value))} style={{ width: '100%', marginTop: '5px' }} />
                    </div>
                    <div>
                        <label>Fade Out (seconds)</label>
                        <input type="number" min="0" value={fadeOut} onChange={e => setFadeOut(parseFloat(e.target.value))} style={{ width: '100%', marginTop: '5px' }} />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input type="checkbox" checked={isReverse} onChange={e => setIsReverse(e.target.checked)} />
                            Reverse Audio
                        </label>
                    </div>
                </div>
            )}

            {/* Convert Button */}
            <div style={{ textAlign: 'center' }}>
                <button onClick={convertBatch} className="primary" disabled={status === 'processing'} style={{ padding: '15px 40px', fontSize: '1.1rem' }}>
                    {status === 'processing' ? 'Converting...' : 'Convert'}
                </button>

                {status === 'processing' && (
                    <div style={{ marginTop: '20px' }}>
                        <p>Processing file {currentFileIndex + 1} of {files.length}...</p>
                        <div style={{ width: '100%', backgroundColor: '#111', borderRadius: '10px', overflow: 'hidden', height: '20px' }}>
                            <div style={{ width: `${progress}%`, backgroundColor: '#646cff', height: '100%', transition: 'width 0.3s ease' }} />
                        </div>
                    </div>
                )}
            </div>

            {/* Results */}
            {convertedFiles.length > 0 && (
                <div style={{ marginTop: '30px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3>Converted Files</h3>
                        {convertedFiles.length > 1 && (
                            <button onClick={downloadAll} className="button success">Download All (ZIP)</button>
                        )}
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {convertedFiles.map((file, i) => (
                            <li key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #444' }}>
                                <span>{file.name}</span>
                                <a href={file.url} download={file.name} className="button success" style={{ padding: '5px 15px', fontSize: '0.8rem', textDecoration: 'none' }}>Download</a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            
            <p style={{ fontSize: '0.7rem', color: '#666', marginTop: '20px', textAlign: 'center' }}>{message}</p>
        </div>
      )}
    </div>
  );
};

export default AudioConverter;