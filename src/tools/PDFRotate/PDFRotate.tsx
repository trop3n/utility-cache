import React, { useState } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';

const PDFRotate: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [rotation, setRotation] = useState(90);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const rotatePDF = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const pdf = await PDFDocument.load(await file.arrayBuffer());
      const pages = pdf.getPages();
      pages.forEach(page => {
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees(currentRotation + rotation));
      });
      const pdfBytes = await pdf.save();
      setDownloadUrl(URL.createObjectURL(new Blob([pdfBytes], { type: 'application/pdf' })));
    } catch (e) { console.error(e); }
    finally { setIsProcessing(false); }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
      <h2>PDF Rotate</h2>
      <input type="file" accept="application/pdf" onChange={e => setFile(e.target.files?.[0] || null)} />
      {file && (
        <div style={{ marginTop: '20px' }}>
          <select value={rotation} onChange={e => setRotation(parseInt(e.target.value))} style={{ padding: '8px', marginRight: '10px' }}>
            <option value="90">90° Clockwise</option>
            <option value="180">180°</option>
            <option value="270">270° Clockwise</option>
          </select>
          <button onClick={rotatePDF} className="primary" disabled={isProcessing}>Rotate PDF</button>
          {downloadUrl && <div style={{ marginTop: '20px' }}><a href={downloadUrl} download="rotated.pdf" className="button success">Download Rotated PDF</a></div>}
        </div>
      )}
    </div>
  );
};

export default PDFRotate;
