import React, { useState, useRef } from 'react';
import { fetchFile } from '@ffmpeg/util';
import { useFFmpeg } from '../../hooks/useFFmpeg';

const VideoCropper: React.FC = () => {
  const { ffmpeg, loaded, load, status, setStatus, progress, message } = useFFmpeg();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
  
  // Crop parameters
  const [cropW, setCropW] = useState(0);
  const [cropH, setCropH] = useState(0);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setVideoFile(file);
      setDownloadUrl(null);
      if (!loaded) load();
      
      // Get dimensions via video element
      const url = URL.createObjectURL(file);
      if (videoRef.current) {
        videoRef.current.src = url;
      }
    }
  };

  const onLoadedMetadata = () => {
    if (videoRef.current) {
        const { videoWidth, videoHeight } = videoRef.current;
        setVideoDimensions({ width: videoWidth, height: videoHeight });
        // Default crop: Center 50%
        const w = Math.floor(videoWidth / 2);
        const h = Math.floor(videoHeight / 2);
        setCropW(w);
        setCropH(h);
        setCropX(Math.floor((videoWidth - w) / 2));
        setCropY(Math.floor((videoHeight - h) / 2));
    }
  };

  const cropVideo = async () => {
    if (!videoFile || !loaded) return;
    setStatus('processing');
    const inputName = 'input.mp4';
    const outputName = 'cropped.mp4';

    try {
      await ffmpeg.writeFile(inputName, await fetchFile(videoFile));
      // crop=w:h:x:y
      await ffmpeg.exec(['-i', inputName, '-vf', `crop=${cropW}:${cropH}:${cropX}:${cropY}`, '-c:a', 'copy', outputName]);
      const data = await ffmpeg.readFile(outputName);
      setDownloadUrl(URL.createObjectURL(new Blob([(data as Uint8Array).buffer as any], { type: 'video/mp4' })));
      setStatus('completed');
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>Video Cropper</h2>
      
      {!loaded && (
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <button onClick={load} className="primary">Initialize Engine</button>
        </div>
      )}

      <div style={{ marginBottom: '20px', border: '2px dashed #444', padding: '40px', textAlign: 'center', borderRadius: '12px' }}>
        <input type="file" accept="video/*" onChange={handleFileChange} style={{ display: 'none' }} id="crop-upload" />
        <label htmlFor="crop-upload" style={{ cursor: 'pointer', color: '#646cff', fontWeight: 'bold' }}>
          {videoFile ? videoFile.name : 'Click to Upload Video'}
        </label>
      </div>
      
      {/* Hidden video to get dimensions */}
      <video ref={videoRef} onLoadedMetadata={onLoadedMetadata} style={{ display: 'none' }} />

      {videoFile && loaded && videoDimensions.width > 0 && (
        <div style={{ textAlign: 'center' }}>
          <p>Original Dimensions: {videoDimensions.width} x {videoDimensions.height}</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', maxWidth: '400px', margin: '20px auto', textAlign: 'left' }}>
             <div>
                <label style={{display:'block'}}>Width</label>
                <input type="number" value={cropW} onChange={e => setCropW(parseInt(e.target.value))} />
             </div>
             <div>
                <label style={{display:'block'}}>Height</label>
                <input type="number" value={cropH} onChange={e => setCropH(parseInt(e.target.value))} />
             </div>
             <div>
                <label style={{display:'block'}}>X (Left)</label>
                <input type="number" value={cropX} onChange={e => setCropX(parseInt(e.target.value))} />
             </div>
             <div>
                <label style={{display:'block'}}>Y (Top)</label>
                <input type="number" value={cropY} onChange={e => setCropY(parseInt(e.target.value))} />
             </div>
          </div>

          <button onClick={cropVideo} className="primary" disabled={status === 'processing'}>Crop Video</button>
          
          {status === 'processing' && (
             <div style={{ width: '100%', backgroundColor: '#111', borderRadius: '10px', overflow: 'hidden', height: '20px', marginTop: '20px' }}>
              <div style={{ width: `${progress}%`, backgroundColor: '#646cff', height: '100%', transition: 'width 0.3s ease' }} />
            </div>
          )}
          
          {downloadUrl && <div style={{ marginTop: '20px' }}><a href={downloadUrl} download="cropped.mp4" className="button success">Download Cropped Video</a></div>}
           <p style={{ fontSize: '0.7rem', color: '#666', marginTop: '10px' }}>{message}</p>
        </div>
      )}
    </div>
  );
};

export default VideoCropper;
