import React, { useState, useRef, useEffect } from 'react';

const ImageResizer: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number } | null>(null);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [lockAspectRatio, setLockAspectRatio] = useState<boolean>(true);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          setOriginalDimensions({ width: img.width, height: img.height });
          setWidth(img.width);
          setHeight(img.height);
          setImageSrc(img.src);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(imageFile);
    }
  }, [imageFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImageFile(e.target.files[0]);
      setDownloadUrl(null);
    }
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = parseInt(e.target.value, 10) || 0;
    setWidth(newWidth);
    if (lockAspectRatio && originalDimensions) {
      const ratio = originalDimensions.height / originalDimensions.width;
      setHeight(Math.round(newWidth * ratio));
    }
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeight = parseInt(e.target.value, 10) || 0;
    setHeight(newHeight);
    if (lockAspectRatio && originalDimensions) {
      const ratio = originalDimensions.width / originalDimensions.height;
      setWidth(Math.round(newHeight * ratio));
    }
  };

  const handleResize = () => {
    if (!imageSrc || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    const img = new Image();
    img.onload = () => {
      // High quality scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      
      const resizedDataUrl = canvas.toDataURL(imageFile?.type || 'image/jpeg');
      setDownloadUrl(resizedDataUrl);
    };
    img.src = imageSrc;
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>Image Resizer</h2>
      
      <div style={{ marginBottom: '20px', border: '2px dashed #444', padding: '40px', textAlign: 'center', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleFileChange} 
          style={{ display: 'none' }} 
          id="file-upload"
        />
        <label htmlFor="file-upload" style={{ cursor: 'pointer', color: '#646cff', fontWeight: 'bold', fontSize: '1.1rem' }}>
          {imageFile ? imageFile.name : 'Click to Upload Image'}
        </label>
        {imageFile && <p style={{ marginTop: '10px', fontSize: '0.8rem', color: '#888' }}>{Math.round(imageFile.size / 1024)} KB</p>}
      </div>

      {imageSrc && (
        <div style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Width (px)</label>
              <input 
                type="number" 
                value={width} 
                onChange={handleWidthChange} 
                style={{ width: '120px' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Height (px)</label>
              <input 
                type="number" 
                value={height} 
                onChange={handleHeightChange} 
                style={{ width: '120px' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                <input 
                  type="checkbox" 
                  checked={lockAspectRatio} 
                  onChange={(e) => setLockAspectRatio(e.target.checked)} 
                />
                Lock Aspect Ratio
              </label>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            <button onClick={handleResize} className="primary" style={{ marginRight: '10px' }}>Resize Image</button>
            {downloadUrl && (
              <a 
                href={downloadUrl} 
                download={`resized-${imageFile?.name}`}
                className="button success"
                style={{ 
                  textDecoration: 'none', 
                  padding: '0.6em 1.2em', 
                  borderRadius: '8px',
                  display: 'inline-block',
                  fontWeight: 500
                }}
              >
                Download
              </a>
            )}
          </div>

          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '15px' }}>Preview</h3>
            <div style={{ maxWidth: '100%', overflow: 'auto', border: '1px solid #444', borderRadius: '8px', padding: '10px', backgroundColor: '#111' }}>
              <canvas ref={canvasRef} style={{ maxWidth: '100%', height: 'auto' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageResizer;
