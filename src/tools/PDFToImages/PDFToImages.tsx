import React, { useState } from 'react';
import * as pdfjs from 'pdfjs-dist';

// Configure worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

const PDFToImages: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  const convertToImages = async () => {
    if (!file) return;
    setIsProcessing(true);
    setImages([]);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const imageUrls: string[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) continue;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport } as any).promise;
        imageUrls.push(canvas.toDataURL('image/png'));
      }
      setImages(imageUrls);
    } catch (e) { console.error(e); }
    finally { setIsProcessing(false); }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
      <h2>PDF to Images</h2>
      <input type="file" accept="application/pdf" onChange={e => setFile(e.target.files?.[0] || null)} />
      {file && (
        <button onClick={convertToImages} className="primary" style={{ display: 'block', margin: '20px auto' }} disabled={isProcessing}>
          {isProcessing ? 'Converting...' : 'Convert to Images'}
        </button>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
        {images.map((src, i) => (
          <div key={i} style={{ border: '1px solid #444', padding: '10px' }}>
            <img src={src} alt={`Page ${i+1}`} style={{ width: '150px', display: 'block', marginBottom: '10px' }} />
            <a href={src} download={`page-${i+1}.png`} className="button success" style={{ fontSize: '0.7rem', padding: '5px' }}>Download Page {i+1}</a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PDFToImages;
