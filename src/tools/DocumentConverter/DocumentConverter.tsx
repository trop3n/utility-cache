import React, { useState } from 'react';
import mammoth from 'mammoth';
import { marked } from 'marked';
// html2pdf.js does not have typescript types by default or sometimes tricky import
// @ts-ignore
import html2pdf from 'html2pdf.js';

const DocumentConverter: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState('pdf');
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setDownloadUrl(null);
      setPreviewHtml(null);
    }
  };

  const convertDocument = async () => {
    if (!file) return;
    setIsProcessing(true);
    setDownloadUrl(null);
    setPreviewHtml(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      let htmlContent = '';

      // 1. Convert Input to HTML
      if (file.name.endsWith('.docx')) {
        const result = await mammoth.convertToHtml({ arrayBuffer });
        htmlContent = result.value;
        // console.log('Messages:', result.messages);
      } else if (file.name.endsWith('.md') || file.name.endsWith('.markdown')) {
        const text = await file.text();
        htmlContent = await marked(text);
      } else if (file.name.endsWith('.html') || file.name.endsWith('.htm')) {
        htmlContent = await file.text();
      } else {
        alert('Unsupported file type for this converter. Please use DOCX, MD, or HTML.');
        setIsProcessing(false);
        return;
      }

      setPreviewHtml(htmlContent);

      // 2. Convert HTML to Output Format
      if (outputFormat === 'html') {
        const blob = new Blob([htmlContent], { type: 'text/html' });
        setDownloadUrl(URL.createObjectURL(blob));
      } else if (outputFormat === 'pdf') {
        const element = document.createElement('div');
        element.innerHTML = htmlContent;
        // Apply some basic styling for PDF
        element.style.padding = '20px';
        element.style.fontFamily = 'Arial, sans-serif';
        element.style.lineHeight = '1.6';
        
        // html2pdf options
        const opt = {
          margin: 10,
          filename: file.name.substring(0, file.name.lastIndexOf('.')) + '.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // We can't easily get a Blob from html2pdf directly without saving usually, 
        // but it has .output('blob') or .output('bloburl').
        const worker = html2pdf().from(element).set(opt as any).toPdf();
        const blob = await worker.get('pdf').then((pdf: any) => {
             return pdf.output('blob');
        });
        
        setDownloadUrl(URL.createObjectURL(blob));
      }

    } catch (error) {
      console.error('Conversion failed:', error);
      alert('Conversion failed. See console for details.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>Document Converter</h2>
      <p style={{ color: '#888', marginBottom: '20px' }}>
        Convert DOCX, Markdown, or HTML files to PDF or HTML.
      </p>

      <div style={{ marginBottom: '20px', border: '2px dashed #444', padding: '40px', textAlign: 'center', borderRadius: '12px' }}>
        <input 
          type="file" 
          accept=".docx,.md,.markdown,.html,.htm" 
          onChange={handleFileChange} 
          style={{ display: 'none' }} 
          id="doc-upload"
        />
        <label htmlFor="doc-upload" style={{ cursor: 'pointer', color: '#646cff', fontWeight: 'bold' }}>
          {file ? file.name : 'Click to Upload Document (DOCX, MD, HTML)'}
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
              <option value="pdf">PDF</option>
              <option value="html">HTML</option>
            </select>
          </div>

          <button onClick={convertDocument} className="primary" disabled={isProcessing}>
            {isProcessing ? 'Converting...' : 'Convert Document'}
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
      
      {previewHtml && (
          <div style={{ marginTop: '40px', textAlign: 'left', border: '1px solid #444', padding: '20px', borderRadius: '8px', background: 'white', color: 'black' }}>
              <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '10px', marginTop: 0 }}>Preview</h3>
              <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
      )}
    </div>
  );
};

export default DocumentConverter;
