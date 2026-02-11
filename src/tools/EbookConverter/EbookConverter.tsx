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
         // Use the spine item index for reliable lookup
         const item = book.spine.get(section.index);
         if (item) {
             try {
               const doc = await item.load(book.load.bind(book)) as any;
               if (doc && 'body' in doc) {
                   fullText += (doc.body.textContent || '') + '\n\n';
               } else if (doc && 'textContent' in doc) {
                   fullText += (doc.textContent || '') + '\n\n';
               }
             } catch (e) {
               console.warn('Failed to load spine item:', section.href, e);
             }
         }
      }

      if (outputFormat === 'txt') {
          const blob = new Blob([fullText], { type: 'text/plain' });
          if (downloadUrl) URL.revokeObjectURL(downloadUrl);
          setDownloadUrl(URL.createObjectURL(blob));
      } else if (outputFormat === 'pdf') {
          const pdfDoc = await PDFDocument.create();
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
          let page = pdfDoc.addPage();
          const { height } = page.getSize();
          const fontSize = 12;
          
          // Simple text wrapping: break lines at a max character width
          const maxCharsPerLine = 80;
          const lineHeight = fontSize + 3;
          const pageMargin = 50;

          const wrapText = (text: string): string[] => {
            const wrapped: string[] = [];
            for (const rawLine of text.split('\n')) {
              // Replace non-ASCII chars that Helvetica can't render with '?'
              const line = rawLine.replace(/[^\x20-\x7E\t]/g, '');
              if (line.trim().length === 0) {
                wrapped.push('');
                continue;
              }
              for (let i = 0; i < line.length; i += maxCharsPerLine) {
                wrapped.push(line.substring(i, i + maxCharsPerLine));
              }
            }
            return wrapped;
          };

          const lines = wrapText(fullText);
          let y = height - pageMargin;

          for (const line of lines) {
              if (y < pageMargin) {
                  page = pdfDoc.addPage();
                  y = height - pageMargin;
              }
              if (line.trim().length > 0) {
                  page.drawText(line, { x: pageMargin, y, size: fontSize, font });
              }
              y -= lineHeight;
          }
          
          const pdfBytes = await pdfDoc.save();
          if (downloadUrl) URL.revokeObjectURL(downloadUrl);
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
