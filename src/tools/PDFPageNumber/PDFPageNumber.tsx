import React, { useState } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const PDFPageNumber: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  
  // Options
  const [position, setPosition] = useState<'bottom-center' | 'bottom-left' | 'bottom-right' | 'top-center' | 'top-left' | 'top-right'>('bottom-center');
  const [startNumber, setStartNumber] = useState(1);
  const [format, setFormat] = useState<'n' | 'of'>('of'); // 'n' => "1", 'of' => "Page 1 of 5"

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setDownloadUrl(null);
    }
  };

  const addPageNumbers = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const fileArrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileArrayBuffer);
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();
      const totalPages = pages.length;

      pages.forEach((page, index) => {
        const pageNum = (startNumber || 1) + index;
        const adjustedTotal = totalPages + (startNumber || 1) - 1;
        const text = format === 'of' ? `Page ${pageNum} of ${adjustedTotal}` : `${pageNum}`;
        const textSize = 12;
        const textWidth = helveticaFont.widthOfTextAtSize(text, textSize);
        const { width, height } = page.getSize();
        
        let x = 0;
        let y = 0;
        const margin = 30;

        switch (position) {
            case 'bottom-center':
                x = (width / 2) - (textWidth / 2);
                y = margin;
                break;
            case 'bottom-left':
                x = margin;
                y = margin;
                break;
            case 'bottom-right':
                x = width - textWidth - margin;
                y = margin;
                break;
            case 'top-center':
                x = (width / 2) - (textWidth / 2);
                y = height - margin;
                break;
            case 'top-left':
                x = margin;
                y = height - margin;
                break;
            case 'top-right':
                x = width - textWidth - margin;
                y = height - margin;
                break;
        }

        page.drawText(text, {
          x,
          y,
          size: textSize,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(URL.createObjectURL(blob));
    } catch (error) {
      console.error('Error adding page numbers:', error);
      alert('Failed to add page numbers.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>Add Page Numbers</h2>
      <p style={{ marginBottom: '20px', color: '#888' }}>
        Insert page numbers into your PDF document.
      </p>

      <div style={{ marginBottom: '20px', border: '2px dashed #444', padding: '40px', textAlign: 'center', borderRadius: '12px' }}>
        <input 
          type="file" 
          accept="application/pdf" 
          onChange={handleFileChange} 
          style={{ display: 'none' }} 
          id="pdf-pagenum-upload"
        />
        <label htmlFor="pdf-pagenum-upload" style={{ cursor: 'pointer', color: '#646cff', fontWeight: 'bold' }}>
          {file ? file.name : 'Click to Upload PDF'}
        </label>
      </div>

      {file && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px', textAlign: 'left' }}>
            <div>
                <label style={{ display: 'block', marginBottom: '8px' }}>Position</label>
                <select 
                    value={position} 
                    onChange={(e) => setPosition(e.target.value as any)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#222', color: 'white', border: '1px solid #444' }}
                >
                    <option value="bottom-center">Bottom Center</option>
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="top-center">Top Center</option>
                    <option value="top-right">Top Right</option>
                    <option value="top-left">Top Left</option>
                </select>
            </div>
            
            <div>
                <label style={{ display: 'block', marginBottom: '8px' }}>Format</label>
                <select 
                    value={format} 
                    onChange={(e) => setFormat(e.target.value as any)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#222', color: 'white', border: '1px solid #444' }}
                >
                    <option value="of">Page 1 of N</option>
                    <option value="n">1, 2, 3...</option>
                </select>
            </div>

            <div>
                <label style={{ display: 'block', marginBottom: '8px' }}>Start Number</label>
                 <input
                    type="number"
                    value={startNumber}
                    onChange={(e) => setStartNumber(parseInt(e.target.value) || 1)}
                    min="1"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #444', background: '#222', color: 'white' }}
                />
            </div>
        </div>
      )}

      {file && (
        <div style={{ textAlign: 'center' }}>
             <button 
                onClick={addPageNumbers} 
                className="primary" 
                disabled={isProcessing}
                style={{ width: '200px' }}
            >
                {isProcessing ? 'Processing...' : 'Add Numbers'}
            </button>
        </div>
      )}

      {downloadUrl && (
        <div style={{ textAlign: 'center', marginTop: '20px', padding: '20px', backgroundColor: 'rgba(39, 174, 96, 0.1)', borderRadius: '12px' }}>
          <p style={{ color: '#27ae60', marginBottom: '15px' }}>Page numbers added successfully!</p>
          <a 
            href={downloadUrl} 
            download={`numbered-${file?.name}`}
            className="button success"
            style={{ textDecoration: 'none', padding: '10px 20px', borderRadius: '8px', display: 'inline-block' }}
          >
            Download PDF
          </a>
        </div>
      )}
    </div>
  );
};

export default PDFPageNumber;
