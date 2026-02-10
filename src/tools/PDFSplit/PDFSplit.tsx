import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';

const PDFSplit: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pageRange, setPageRange] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrls, setDownloadUrls] = useState<{ url: string; name: string }[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setDownloadUrls([]);
    }
  };

  const splitPDF = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const fileArrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(fileArrayBuffer);
      const pageCount = pdf.getPageCount();

      // For simplicity, let's implement extraction of a range like "1-3" or "1,2,5"
      // If empty, split all pages into separate files
      let pagesToExtract: number[] = [];
      if (pageRange.trim() === '') {
        pagesToExtract = Array.from({ length: pageCount }, (_, i) => i);
      } else {
        // Parse range: "1-3, 5" -> [0, 1, 2, 4]
        const parts = pageRange.split(',');
        for (const part of parts) {
          if (part.includes('-')) {
            const [start, end] = part.split('-').map(n => parseInt(n.trim()) - 1);
            for (let i = start; i <= end; i++) {
              if (i >= 0 && i < pageCount) pagesToExtract.push(i);
            }
          } else {
            const pageNum = parseInt(part.trim()) - 1;
            if (pageNum >= 0 && pageNum < pageCount) pagesToExtract.push(pageNum);
          }
        }
      }

      // Remove duplicates and sort
      pagesToExtract = [...new Set(pagesToExtract)].sort((a, b) => a - b);

      if (pageRange.trim() !== '') {
        // Extract range into a single PDF
        const newPdf = await PDFDocument.create();
        const copiedPages = await newPdf.copyPages(pdf, pagesToExtract);
        copiedPages.forEach(page => newPdf.addPage(page));
        const pdfBytes = await newPdf.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        setDownloadUrls([{ url: URL.createObjectURL(blob), name: 'extracted.pdf' }]);
      } else {
        // Split into separate files
        const newUrls: { url: string; name: string }[] = [];
        for (let i = 0; i < pagesToExtract.length; i++) {
          const newPdf = await PDFDocument.create();
          const [copiedPage] = await newPdf.copyPages(pdf, [pagesToExtract[i]]);
          newPdf.addPage(copiedPage);
          const pdfBytes = await newPdf.save();
          const blob = new Blob([pdfBytes], { type: 'application/pdf' });
          newUrls.push({ url: URL.createObjectURL(blob), name: `page-${i + 1}.pdf` });
        }
        setDownloadUrls(newUrls);
      }
    } catch (error) {
      console.error('Error splitting PDF:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>PDF Split / Extract</h2>
      <div style={{ marginBottom: '20px', border: '2px dashed #444', padding: '40px', textAlign: 'center', borderRadius: '12px' }}>
        <input 
          type="file" 
          accept="application/pdf" 
          onChange={handleFileChange} 
          style={{ display: 'none' }} 
          id="pdf-split-upload"
        />
        <label htmlFor="pdf-split-upload" style={{ cursor: 'pointer', color: '#646cff', fontWeight: 'bold' }}>
          {file ? file.name : 'Click to Upload PDF'}
        </label>
      </div>

      {file && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px' }}>
              Page Range (e.g., "1-3, 5"). Leave empty to split all pages.
            </label>
            <input 
              type="text" 
              value={pageRange} 
              onChange={e => setPageRange(e.target.value)}
              placeholder="1-3, 5"
              style={{ maxWidth: '300px' }}
            />
          </div>
          <button 
            onClick={splitPDF} 
            className="primary" 
            disabled={isProcessing}
            style={{ marginBottom: '20px' }}
          >
            {isProcessing ? 'Processing...' : 'Split PDF'}
          </button>
        </div>
      )}

      {downloadUrls.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Download Links</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
            {downloadUrls.map((item, index) => (
              <a 
                key={index}
                href={item.url} 
                download={item.name}
                className="button success"
                style={{ textDecoration: 'none', padding: '5px 10px', borderRadius: '4px', fontSize: '0.8rem' }}
              >
                {item.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFSplit;
