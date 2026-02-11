import React, { useState } from 'react';
import JSZip from 'jszip';

const ImageConverter: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [format, setFormat] = useState('image/png');
  const [quality, setQuality] = useState(0.92);
  const [convertedFiles, setConvertedFiles] = useState<{name: string, url: string}[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
      setConvertedFiles([]);
      setProgress(0);
    }
  };

  const processFile = (file: File): Promise<{name: string, url: string}> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    // Convert
                    const dataUrl = canvas.toDataURL(format, quality);
                    
                    const ext = format.split('/')[1];
                    const originalName = file.name.substring(0, file.name.lastIndexOf('.'));
                    const newName = `${originalName}.${ext}`;
                    
                    resolve({ name: newName, url: dataUrl });
                } else {
                    reject(new Error('Canvas context failed'));
                }
            };
            img.onerror = reject;
            img.src = event.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
  };

  const convertBatch = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setConvertedFiles([]);
    setProgress(0);

    const results: {name: string, url: string}[] = [];

    for (let i = 0; i < files.length; i++) {
        try {
            const result = await processFile(files[i]);
            results.push(result);
        } catch (error) {
            console.error(`Error converting ${files[i].name}`, error);
        }
        setProgress(Math.round(((i + 1) / files.length) * 100));
    }

    setConvertedFiles(results);
    setIsProcessing(false);
  };

  const downloadAll = async () => {
    const zip = new JSZip();
    for (const f of convertedFiles) {
        // Data URL to Blob
        const blob = await fetch(f.url).then(r => r.blob());
        zip.file(f.name, blob);
    }
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted_images.zip';
    a.click();
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>Image Converter</h2>
      <div style={{ marginBottom: '20px', border: '2px dashed #444', padding: '40px', textAlign: 'center', borderRadius: '12px' }}>
        <input type="file" accept="image/*" multiple onChange={handleFileChange} style={{ display: 'none' }} id="img-conv-upload" />
        <label htmlFor="img-conv-upload" style={{ cursor: 'pointer', color: '#646cff', fontWeight: 'bold' }}>
          {files.length > 0 ? `${files.length} Files Selected` : 'Click to Upload Images'}
        </label>
      </div>

      {files.length > 0 && (
        <div style={{ textAlign: 'center' }}>
           <div style={{ marginBottom: '20px' }}>
              <label style={{ marginRight: '10px' }}>Format:</label>
              <select value={format} onChange={e => setFormat(e.target.value)} style={{ padding: '8px', borderRadius: '4px', background: '#222', color: 'white' }}>
                 <option value="image/png">PNG</option>
                 <option value="image/jpeg">JPEG</option>
                 <option value="image/webp">WEBP</option>
                 {/* BMP support varies, sticking to safest */}
              </select>
           </div>
           
           {(format === 'image/jpeg' || format === 'image/webp') ? (
             <div style={{ marginBottom: '20px' }}>
                <label style={{ marginRight: '10px' }}>Quality ({Math.round(quality * 100)}%):</label>
                <input type="range" min="0.1" max="1.0" step="0.01" value={quality} onChange={e => setQuality(parseFloat(e.target.value))} />
             </div>
           ) : null}

           <button onClick={convertBatch} className="primary" disabled={isProcessing} style={{ padding: '10px 30px' }}>
             {isProcessing ? 'Converting...' : 'Convert Images'}
           </button>

           {isProcessing && (
              <div style={{ marginTop: '20px', width: '100%', backgroundColor: '#111', borderRadius: '10px', overflow: 'hidden', height: '20px' }}>
                  <div style={{ width: `${progress}%`, backgroundColor: '#646cff', height: '100%', transition: 'width 0.3s ease' }} />
              </div>
           )}
           
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
        </div>
      )}
    </div>
  );
};

export default ImageConverter;