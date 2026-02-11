import React, { useState } from 'react';
import * as XLSX from 'xlsx';
// @ts-ignore
import html2pdf from 'html2pdf.js';

const ExcelToPDF: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
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

  const convertToPDF = async () => {
    if (!file) return;
    setIsProcessing(true);
    setDownloadUrl(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Convert first sheet to HTML
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawHtml = XLSX.utils.sheet_to_html(worksheet);

      // Sanitize: strip any script tags or event handlers from cell content
      const div = document.createElement('div');
      div.innerHTML = rawHtml;
      div.querySelectorAll('script, iframe, object, embed').forEach(el => el.remove());
      div.querySelectorAll('*').forEach(el => {
        for (const attr of Array.from(el.attributes)) {
          if (attr.name.startsWith('on') || attr.value.trim().toLowerCase().startsWith('javascript:')) {
            el.removeAttribute(attr.name);
          }
        }
      });
      const html = div.innerHTML;

      setPreviewHtml(html);

      // Create PDF
      const element = document.createElement('div');
      element.innerHTML = html;
      
      // Style the table for PDF
      const style = document.createElement('style');
      style.innerHTML = `
        table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 12px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
      `;
      element.appendChild(style);

      const opt = {
        margin: 10,
        filename: file.name.substring(0, file.name.lastIndexOf('.')) + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' } // Landscape for excel often better
      };

      const worker = html2pdf().from(element).set(opt as any).toPdf();
      const blob = await worker.get('pdf').then((pdf: any) => {
           return pdf.output('blob');
      });
      
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(URL.createObjectURL(blob));

    } catch (error) {
      console.error('Conversion failed:', error);
      alert('Conversion failed. Ensure it is a valid Excel file.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>Excel to PDF</h2>
      <p style={{ color: '#888', marginBottom: '20px' }}>
        Convert Excel (XLSX, XLS, CSV) spreadsheets to PDF.
      </p>

      <div style={{ marginBottom: '20px', border: '2px dashed #444', padding: '40px', textAlign: 'center', borderRadius: '12px' }}>
        <input 
          type="file" 
          accept=".xlsx,.xls,.csv" 
          onChange={handleFileChange} 
          style={{ display: 'none' }} 
          id="excel-upload"
        />
        <label htmlFor="excel-upload" style={{ cursor: 'pointer', color: '#646cff', fontWeight: 'bold' }}>
          {file ? file.name : 'Click to Upload Excel File'}
        </label>
      </div>

      {file && (
        <div style={{ textAlign: 'center' }}>
          <button onClick={convertToPDF} className="primary" disabled={isProcessing}>
            {isProcessing ? 'Converting...' : 'Convert to PDF'}
          </button>

          {downloadUrl && (
            <div style={{ marginTop: '20px' }}>
              <p style={{ color: '#27ae60' }}>Conversion successful!</p>
              <a 
                href={downloadUrl} 
                download={file.name.substring(0, file.name.lastIndexOf('.')) + '.pdf'}
                className="button success"
              >
                Download PDF
              </a>
            </div>
          )}
        </div>
      )}
      
      {previewHtml && (
          <div style={{ marginTop: '40px', textAlign: 'left', border: '1px solid #444', padding: '20px', borderRadius: '8px', background: 'white', color: 'black', overflowX: 'auto' }}>
              <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '10px', marginTop: 0 }}>Preview</h3>
              <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
      )}
    </div>
  );
};

export default ExcelToPDF;
