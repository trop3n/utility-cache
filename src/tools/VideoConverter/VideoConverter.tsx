import React, { useState } from 'react';
import { fetchFile } from '@ffmpeg/util';
import { useFFmpeg } from '../../hooks/useFFmpeg';
import JSZip from 'jszip';

const VideoConverter: React.FC = () => {
  const { ffmpeg, loaded, load, status, setStatus, progress, message } = useFFmpeg();
  
  // State
  const [files, setFiles] = useState<File[]>([]);
  const [convertedFiles, setConvertedFiles] = useState<{name: string, url: string}[]>([]);
  
  // Settings
  const [format, setFormat] = useState('mp4');
  const [resolution, setResolution] = useState('original'); // original, 1080, 720, 480, 360
  const [videoCodec, setVideoCodec] = useState('libx264');
  const [audioCodec, setAudioCodec] = useState('aac');
  const [quality, setQuality] = useState(23); // CRF: 18 (High) - 28 (Low). Lower is better quality.
  const [removeAudio, setRemoveAudio] = useState(false);
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

  const getOutputFilename = (originalName: string, fmt: string) => {
    return originalName.substring(0, originalName.lastIndexOf('.')) + '.' + fmt;
  };

  const convertBatch = async () => {
    if (files.length === 0 || !loaded) return;
    setStatus('processing');
    setConvertedFiles([]);

    const results: {name: string, url: string}[] = [];

    for (let i = 0; i < files.length; i++) {
        setCurrentFileIndex(i);
        const file = files[i];
        // Replace spaces to avoid ffmpeg cli issues
        const safeName = file.name.replace(/\s/g, '_');
        const inputName = `input_${i}_${safeName}`;
        const outputName = `output_${i}.${format}`;

        try {
            await ffmpeg.writeFile(inputName, await fetchFile(file));

            const args = ['-i', inputName];

            // Resolution Scale
            if (resolution !== 'original') {
                // -2 ensures width is divisible by 2 (required by some codecs)
                // scale=-2:720 maintains aspect ratio
                args.push('-vf', `scale=-2:${resolution}`);
            }

            // Codecs
            if (format === 'gif') {
                // GIF with palette generation for better quality
                const scaleFilter = resolution !== 'original' ? `scale=-2:${resolution}:flags=lanczos,` : '';
                // Remove any previously added -vf scale (we'll use filter_complex instead)
                const vfIndex = args.indexOf('-vf');
                if (vfIndex !== -1) {
                    args.splice(vfIndex, 2);
                }
                args.push('-filter_complex', `[0:v]${scaleFilter}fps=10,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`);
                args.push('-an');
            } else {
                args.push('-c:v', videoCodec);

                if (removeAudio) {
                    args.push('-an');
                } else {
                    args.push('-c:a', audioCodec);
                }

                // CRF / Quality
                if (videoCodec === 'libx264') {
                    args.push('-crf', quality.toString());
                    args.push('-preset', 'veryfast');
                } else if (videoCodec === 'libvpx' || videoCodec === 'libvpx-vp9') {
                    args.push('-crf', quality.toString(), '-b:v', '0');
                } else if (videoCodec === 'mpeg4') {
                    args.push('-q:v', Math.max(2, 31 - quality).toString());
                }
            }

            args.push(outputName);

            await ffmpeg.exec(args);
            const data = await ffmpeg.readFile(outputName);
            
            // Cleanup
            try { await ffmpeg.deleteFile(inputName); } catch (e) {}
            try { await ffmpeg.deleteFile(outputName); } catch (e) {}

            const mimeTypes: Record<string, string> = {
                mp4: 'video/mp4',
                webm: 'video/webm',
                avi: 'video/x-msvideo',
                mov: 'video/quicktime',
                mkv: 'video/x-matroska',
                gif: 'image/gif',
                mpeg: 'video/mpeg',
            };
            const blob = new Blob([(data as Uint8Array).buffer as any], { type: mimeTypes[format] || `video/${format}` });
            const url = URL.createObjectURL(blob);
            results.push({
                name: getOutputFilename(file.name, format),
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
    a.download = 'converted_videos.zip';
    a.click();
  };

  // Update defaults based on format
  const updateFormat = (newFormat: string) => {
      setFormat(newFormat);
      if (newFormat === 'mp4') {
          setVideoCodec('libx264');
          setAudioCodec('aac');
      } else if (newFormat === 'webm') {
          setVideoCodec('libvpx'); // or libvpx-vp9
          setAudioCodec('libvorbis'); // or libopus
      } else if (newFormat === 'avi') {
          setVideoCodec('mpeg4');
          setAudioCodec('libmp3lame');
      } else if (newFormat === 'mov') {
          setVideoCodec('libx264');
          setAudioCodec('aac');
      } else if (newFormat === 'mkv') {
          setVideoCodec('libx264');
          setAudioCodec('aac');
      } else if (newFormat === 'mpeg') {
          setVideoCodec('mpeg4');
          setAudioCodec('libmp3lame');
      }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>Video Converter (Advanced)</h2>
      
      {!loaded && (
         <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <button onClick={load} className="primary">Initialize Engine</button>
         </div>
      )}

      <div style={{ marginBottom: '20px', border: '2px dashed #444', padding: '40px', textAlign: 'center', borderRadius: '12px' }}>
        <input type="file" accept="video/*" multiple onChange={handleFileChange} style={{ display: 'none' }} id="adv-video-upload" />
        <label htmlFor="adv-video-upload" style={{ cursor: 'pointer', color: '#646cff', fontWeight: 'bold' }}>
           {files.length > 0 ? `${files.length} Files Selected` : 'Click to Upload Video Files'}
        </label>
      </div>

      {files.length > 0 && loaded && (
        <div>
            {/* Format Selection */}
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    {['mp4', 'avi', 'mpeg', 'mov', 'webm', 'mkv', 'gif'].map(fmt => (
                        <button 
                            key={fmt} 
                            onClick={() => updateFormat(fmt)}
                            className={format === fmt ? 'primary' : ''}
                            style={{ border: format === fmt ? '1px solid #646cff' : '1px solid #444' }}
                        >
                            {fmt.toUpperCase()}
                        </button>
                    ))}
                </div>

                <div style={{ maxWidth: '400px', margin: '20px auto' }}>
                     <label style={{ marginRight: '10px' }}>Resolution:</label>
                     <select value={resolution} onChange={e => setResolution(e.target.value)} style={{ padding: '8px', borderRadius: '4px', background: '#222', color: 'white' }}>
                        <option value="original">Same as source</option>
                        <option value="1080">HD 1080p</option>
                        <option value="720">HD 720p</option>
                        <option value="480">480p</option>
                        <option value="360">360p</option>
                        <option value="240">240p</option>
                     </select>
                </div>
            </div>

            {/* Advanced Settings Toggle */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <button onClick={() => setShowAdvanced(!showAdvanced)} style={{ fontSize: '0.9rem', background: 'none', border: 'none', color: '#646cff', cursor: 'pointer', textDecoration: 'underline' }}>
                    {showAdvanced ? 'Hide Advanced Settings' : 'Advanced Settings'}
                </button>
            </div>

            {showAdvanced && format !== 'gif' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', backgroundColor: '#222', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                    <div>
                        <label>Video Codec</label>
                        <select value={videoCodec} onChange={e => setVideoCodec(e.target.value)} style={{ width: '100%', marginTop: '5px' }}>
                            <option value="libx264">H.264 / AVC (Standard)</option>
                            <option value="mpeg4">MPEG-4 (Older)</option>
                            <option value="libvpx">VP8 (WebM)</option>
                            <option value="libvpx-vp9">VP9 (WebM High)</option>
                            {/* copy is fast but might not work with scaling/container change */}
                            {/* <option value="copy">Stream Copy (Fastest)</option> */}
                        </select>
                    </div>
                    <div>
                        <label>Audio Codec</label>
                        <select value={audioCodec} onChange={e => setAudioCodec(e.target.value)} disabled={removeAudio} style={{ width: '100%', marginTop: '5px' }}>
                            <option value="aac">AAC (Standard)</option>
                            <option value="libmp3lame">MP3</option>
                            <option value="libvorbis">Vorbis</option>
                            <option value="ac3">AC3</option>
                            <option value="copy">Stream Copy</option>
                        </select>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ display: 'block', marginBottom: '10px' }}>Approximate Quality (CRF): {quality}</label>
                        <input 
                            type="range" min="18" max="40" step="1" 
                            value={quality} onChange={e => setQuality(parseInt(e.target.value))} 
                            style={{ width: '100%' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#888' }}>
                            <span>High Quality (Large)</span>
                            <span>Low Quality (Small)</span>
                        </div>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input type="checkbox" checked={removeAudio} onChange={e => setRemoveAudio(e.target.checked)} />
                            No Audio (Mute)
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

export default VideoConverter;