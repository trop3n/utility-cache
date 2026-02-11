import React, { useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { Document, Packer, Paragraph, TextRun } from 'docx';
// @ts-ignore
import { saveAs } from 'file-saver';

// Configure worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

const PDFToOffice: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [outputFormat, setOutputFormat] = useState('docx'); // docx, txt, html

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const convertPDF = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      
      // Extract text page by page
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n\n';
      }

      const baseName = file.name.substring(0, file.name.lastIndexOf('.'));

      if (outputFormat === 'txt') {
          const blob = new Blob([fullText], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${baseName}.txt`;
          a.click();
      } else if (outputFormat === 'docx') {
          // Create DOCX
          // We split by newlines to make paragraphs
          const paragraphs = fullText.split('\n').map(line => {
              // Basic sanitization
              const cleanLine = line.replace(/[^\x00-\x7F]/g, ""); 
              return new Paragraph({
                  children: [new TextRun(cleanLine)],
              });
          });

          const doc = new Document({
              sections: [{
                  properties: {},
                  children: paragraphs,
              }],
          });

          const blob = await Packer.toBlob(doc);
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${baseName}.docx`;
          a.click();
      } else if (outputFormat === 'html') {
          const html = `<html><body><pre>${fullText}</pre></body></html>`;
          const blob = new Blob([html], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${baseName}.html`;
          a.click();
      }

    } catch (error) {
      console.error('PDF Conversion failed:', error);
      alert('Failed to extract text from PDF. It might be scanned (image-only).');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>PDF to Word/Text</h2>
      <p style={{ color: '#888', marginBottom: '20px' }}>
        Extract text from PDF and save as DOCX, Text, or HTML. 
        <br/><small>(Note: Layout preservation is limited. Good for text extraction.)</small>
      </p>

      <div style={{ marginBottom: '20px', border: '2px dashed #444', padding: '40px', textAlign: 'center', borderRadius: '12px' }}>
        <input 
          type="file" 
          accept="application/pdf" 
          onChange={handleFileChange} 
          style={{ display: 'none' }} 
          id="pdf-office-upload"
        />
        <label htmlFor="pdf-office-upload" style={{ cursor: 'pointer', color: '#646cff', fontWeight: 'bold' }}>
          {file ? file.name : 'Click to Upload PDF'}
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
              <option value="docx">Word (DOCX)</option>
              <option value="txt">Plain Text (TXT)</option>
              <option value="html">HTML</option>
            </select>
          </div>

          <button onClick={convertPDF} className="primary" disabled={isProcessing}>
            {isProcessing ? 'Converting...' : 'Convert PDF'}
          </button>
        </div>
      )}
    </div>
  );
};

export default PDFToOffice;
