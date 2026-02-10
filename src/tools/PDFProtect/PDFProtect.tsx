import React, { useState } from 'react';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt-lite';

const PDFProtect: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setDownloadUrl(null);
    }
  };

  const protectPDF = async () => {
    if (!file || !password) return;
    setIsProcessing(true);

    try {
      const fileArrayBuffer = await file.arrayBuffer();
      // encryptPDF takes Uint8Array or ArrayBuffer
      const encryptedPdfBytes = await encryptPDF(new Uint8Array(fileArrayBuffer), password);

      const blob = new Blob([encryptedPdfBytes as any], { type: 'application/pdf' });
      setDownloadUrl(URL.createObjectURL(blob));
    } catch (error) {
      console.error('Error protecting PDF:', error);
      alert('Failed to protect PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>Protect PDF</h2>
      <p style={{ marginBottom: '20px', color: '#888' }}>
        Encrypt your PDF with a password to restrict access.
      </p>

      <div style={{ marginBottom: '20px', border: '2px dashed #444', padding: '40px', textAlign: 'center', borderRadius: '12px' }}>
        <input 
          type="file" 
          accept="application/pdf" 
          onChange={handleFileChange} 
          style={{ display: 'none' }} 
          id="pdf-protect-upload"
        />
        <label htmlFor="pdf-protect-upload" style={{ cursor: 'pointer', color: '#646cff', fontWeight: 'bold' }}>
          {file ? file.name : 'Click to Upload PDF'}
        </label>
      </div>

      {file && (
        <div style={{ maxWidth: '400px', margin: '0 auto 20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', textAlign: 'left' }}>Set Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #444', background: '#222', color: 'white' }}
            />
          </div>
          
          <button 
            onClick={protectPDF} 
            className="primary" 
            disabled={isProcessing || !password}
            style={{ width: '100%' }}
          >
            {isProcessing ? 'Protecting...' : 'Protect PDF'}
          </button>
        </div>
      )}

      {downloadUrl && (
        <div style={{ textAlign: 'center', marginTop: '20px', padding: '20px', backgroundColor: 'rgba(39, 174, 96, 0.1)', borderRadius: '12px' }}>
          <p style={{ color: '#27ae60', marginBottom: '15px' }}>PDF Protected Successfully!</p>
          <a 
            href={downloadUrl} 
            download={`protected-${file?.name}`}
            className="button success"
            style={{ textDecoration: 'none', padding: '10px 20px', borderRadius: '8px', display: 'inline-block' }}
          >
            Download Protected PDF
          </a>
        </div>
      )}
    </div>
  );
};

export default PDFProtect;
