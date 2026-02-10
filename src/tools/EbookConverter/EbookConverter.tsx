import React, { useState } from 'react';
import ePub from 'epubjs';
import { PDFDocument, StandardFonts } from 'pdf-lib';

const EbookConverter: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [outputFormat, setOutputFormat] = useState('txt'); // txt or pdf

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setDownloadUrl(null);
    }
  };

  const convertEbook = async () => {
    if (!file) return;
    setIsProcessing(true);
    setDownloadUrl(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const book = ePub(arrayBuffer);
      await book.ready;

      // Iterate over spine to get all text
      let fullText = '';
      const spine = book.spine;
      
      for (const section of (spine as any).items) {
         // section.load(book.load.bind(book)) ... epubjs extraction is async and tricky
         // We can use the 'url' to fetch text if we can access the internal zip.
         // epubjs abstracts this.
         // Simpler approach: Iterate spine items, load them, extract textContent.
         const item = book.spine.get(section.href);
         if (item) {
             const doc = await item.load(book.load.bind(book)) as any;
             // doc is a Document/XML
             if (doc && 'body' in doc) {
                 fullText += (doc.body.textContent || '') + '\n\n';
             } else if (doc && 'textContent' in doc) {
                 fullText += (doc.textContent || '') + '\n\n';
             }
         }
      }

      if (outputFormat === 'txt') {
          const blob = new Blob([fullText], { type: 'text/plain' });
          setDownloadUrl(URL.createObjectURL(blob));
      } else if (outputFormat === 'pdf') {
          const pdfDoc = await PDFDocument.create();
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
          let page = pdfDoc.addPage();
          const { height } = page.getSize();
          const fontSize = 12;
          
          const lines = fullText.split('\n');
          let y = height - 50;
          
          for (const line of lines) {
              // Very basic text wrapping/pagination logic needed
              // For MVP, we just dump text and add pages if y < 50
              // Ideally use a library that handles wrapping. pdf-lib drawText does not wrap automatically easily.
              // We will just print lines and create new page.
              if (y < 50) {
                  page = pdfDoc.addPage();
                  y = height - 50;
              }
              // Basic sanitization
              const cleanLine = line.replace(/[^\x00-\x7F]/g, ""); // Remove non-ascii for standard font
              
              if (cleanLine.trim().length > 0) {
                  page.drawText(cleanLine.substring(0, 90), { x: 50, y, size: fontSize, font }); // Truncate line for now
                  y -= 15;
              }
          }
          
          const pdfBytes = await pdfDoc.save();
          setDownloadUrl(URL.createObjectURL(new Blob([pdfBytes as any], { type: 'application/pdf' })));
      }

    } catch (error) {
      console.error('Ebook conversion failed:', error);
      alert('Failed to convert EPUB. It might be DRM protected or invalid.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>Ebook Converter (EPUB)</h2>
      <p style={{ color: '#888', marginBottom: '20px' }}>
        Convert EPUB ebooks to Plain Text or simple PDF.
      </p>

      <div style={{ marginBottom: '20px', border: '2px dashed #444', padding: '40px', textAlign: 'center', borderRadius: '12px' }}>
        <input 
          type="file" 
          accept=".epub" 
          onChange={handleFileChange} 
          style={{ display: 'none' }} 
          id="ebook-upload"
        />
        <label htmlFor="ebook-upload" style={{ cursor: 'pointer', color: '#646cff', fontWeight: 'bold' }}>
          {file ? file.name : 'Click to Upload EPUB'}
        </label>
      </div>

      {file && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ marginRight: '10px' }}>Output Format:</label>
            <select 
              value={outputFormat} 
              onChange={(e) => setOutputFormat(e.target.value)} 
              style={{ padding: '8px', borderRadius: '4px', background: '#222', color: 'white' }}
            >
              <option value="txt">Plain Text (TXT)</option>
              <option value="pdf">PDF (Simple)</option>
            </select>
          </div>

          <button onClick={convertEbook} className="primary" disabled={isProcessing}>
            {isProcessing ? 'Converting...' : 'Convert Ebook'}
          </button>

          {downloadUrl && (
            <div style={{ marginTop: '20px' }}>
              <p style={{ color: '#27ae60' }}>Conversion successful!</p>
              <a 
                href={downloadUrl} 
                download={file.name.substring(0, file.name.lastIndexOf('.')) + '.' + outputFormat}
                className="button success"
              >
                Download Converted File
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EbookConverter;
