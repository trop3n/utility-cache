import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';

// Configure worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

const PDFUnlock: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setDownloadUrl(null);
      setError(null);
      setPassword('');
    }
  };

  const unlockPDF = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);

    try {
      const fileArrayBuffer = await file.arrayBuffer();
      
      // Load with PDF.js (decryption happens here)
      const loadingTask = pdfjs.getDocument({ 
        data: fileArrayBuffer, 
        password: password 
      });

      const pdf = await loadingTask.promise;
      const newPdfDoc = await PDFDocument.create();

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const scale = 2.0; // Higher scale for better quality
        const viewport = page.getViewport({ scale });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) continue;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport } as any).promise;
        const imageDataUrl = canvas.toDataURL('image/png');
        
        // Convert data URL to bytes
        const imageBytes = await fetch(imageDataUrl).then(res => res.arrayBuffer());
        
        // Embed image in new PDF
        const embeddedImage = await newPdfDoc.embedPng(imageBytes);
        const { width, height } = embeddedImage.scale(1 / scale);
        
        const newPage = newPdfDoc.addPage([width, height]);
        newPage.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width,
          height,
        });
      }

      const pdfBytes = await newPdfDoc.save();
      // Fix Blob type error by casting or using just buffer
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      setDownloadUrl(URL.createObjectURL(blob));
    } catch (err: any) {
      console.error('Error unlocking PDF:', err);
      if (err.name === 'PasswordException') {
        setError('Incorrect password.');
      } else {
        setError(err.message || 'Failed to unlock PDF.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>Unlock PDF</h2>
      <p style={{ marginBottom: '20px', color: '#888' }}>
        Remove password protection from a PDF file.
      </p>
      
      <div style={{ backgroundColor: 'rgba(243, 156, 18, 0.1)', padding: '15px', borderRadius: '8px', marginBottom: '20px', color: '#e67e22', fontSize: '0.9rem' }}>
        <strong>Note:</strong> This tool re-creates the PDF by converting pages to images. 
        This successfully removes the password but will make text non-selectable.
      </div>

      <div style={{ marginBottom: '20px', border: '2px dashed #444', padding: '40px', textAlign: 'center', borderRadius: '12px' }}>
        <input 
          type="file" 
          accept="application/pdf" 
          onChange={handleFileChange} 
          style={{ display: 'none' }} 
          id="pdf-unlock-upload"
        />
        <label htmlFor="pdf-unlock-upload" style={{ cursor: 'pointer', color: '#646cff', fontWeight: 'bold' }}>
          {file ? file.name : 'Click to Upload Locked PDF'}
        </label>
      </div>

      {file && (
        <div style={{ maxWidth: '400px', margin: '0 auto 20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', textAlign: 'left' }}>Enter Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter current password"
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #444', background: '#222', color: 'white' }}
            />
          </div>
          
          <button 
            onClick={unlockPDF} 
            className="primary" 
            disabled={isProcessing}
            style={{ width: '100%' }}
          >
            {isProcessing ? 'Unlocking (Rasterizing)...' : 'Unlock PDF'}
          </button>
        </div>
      )}

      {error && (
         <div style={{ textAlign: 'center', marginTop: '20px', padding: '15px', backgroundColor: 'rgba(231, 76, 60, 0.1)', borderRadius: '8px', color: '#e74c3c' }}>
           {error}
         </div>
      )}

      {downloadUrl && (
        <div style={{ textAlign: 'center', marginTop: '20px', padding: '20px', backgroundColor: 'rgba(39, 174, 96, 0.1)', borderRadius: '12px' }}>
          <p style={{ color: '#27ae60', marginBottom: '15px' }}>PDF Unlocked Successfully!</p>
          <a 
            href={downloadUrl} 
            download={`unlocked-${file?.name}`}
            className="button success"
            style={{ textDecoration: 'none', padding: '10px 20px', borderRadius: '8px', display: 'inline-block' }}
          >
            Download Unlocked PDF
          </a>
        </div>
      )}
    </div>
  );
};

export default PDFUnlock;
