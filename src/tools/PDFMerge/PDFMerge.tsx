import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';

const PDFMerge: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles([...files, ...Array.from(e.target.files)]);
      setDownloadUrl(null);
    }
  };

  const mergePDFs = async () => {
    if (files.length < 2) return;
    setIsProcessing(true);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const file of files) {
        const fileArrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(fileArrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setDownloadUrl(URL.createObjectURL(blob));
    } catch (error) {
      console.error('Error merging PDFs:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    setDownloadUrl(null);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>PDF Merge</h2>
      <div style={{ marginBottom: '20px', border: '2px dashed #444', padding: '40px', textAlign: 'center', borderRadius: '12px' }}>
        <input 
          type="file" 
          accept="application/pdf" 
          multiple 
          onChange={handleFileChange} 
          style={{ display: 'none' }} 
          id="pdf-upload"
        />
        <label htmlFor="pdf-upload" style={{ cursor: 'pointer', color: '#646cff', fontWeight: 'bold' }}>
          Click to Upload PDF Files
        </label>
      </div>

      {files.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Selected Files ({files.length})</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {files.map((file, index) => (
              <li key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #444' }}>
                <span>{file.name}</span>
                <button onClick={() => removeFile(index)} style={{ padding: '5px 10px', backgroundColor: '#e74c3c', fontSize: '0.8rem' }}>Remove</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {files.length >= 2 && (
        <div style={{ textAlign: 'center' }}>
          <button 
            onClick={mergePDFs} 
            className="primary" 
            disabled={isProcessing}
            style={{ marginBottom: '20px' }}
          >
            {isProcessing ? 'Merging...' : 'Merge PDFs'}
          </button>
        </div>
      )}

      {downloadUrl && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p style={{ color: '#27ae60' }}>PDFs merged successfully!</p>
          <a 
            href={downloadUrl} 
            download="merged.pdf"
            className="button success"
            style={{ textDecoration: 'none', padding: '10px 20px', borderRadius: '8px', display: 'inline-block' }}
          >
            Download Merged PDF
          </a>
        </div>
      )}
    </div>
  );
};

export default PDFMerge;
