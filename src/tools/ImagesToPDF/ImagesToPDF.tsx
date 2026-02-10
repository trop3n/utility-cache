import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';

const ImagesToPDF: React.FC = () => {
  const [images, setImages] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const convertToPDF = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    try {
      const pdfDoc = await PDFDocument.create();
      for (const imageFile of images) {
        const imageBytes = await imageFile.arrayBuffer();
        let image;
        if (imageFile.type === 'image/jpeg' || imageFile.type === 'image/jpg') {
          image = await pdfDoc.embedJpg(imageBytes);
        } else if (imageFile.type === 'image/png') {
          image = await pdfDoc.embedPng(imageBytes);
        } else {
          continue; // Skip unsupported
        }

        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
      }
      const pdfBytes = await pdfDoc.save();
      setDownloadUrl(URL.createObjectURL(new Blob([pdfBytes], { type: 'application/pdf' })));
    } catch (e) { console.error(e); }
    finally { setIsProcessing(false); }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
      <h2>Images to PDF</h2>
      <input type="file" accept="image/png, image/jpeg" multiple onChange={e => setImages(Array.from(e.target.files || []))} />
      <div style={{ marginTop: '10px' }}>{images.length} images selected</div>
      {images.length > 0 && (
        <button onClick={convertToPDF} className="primary" style={{ marginTop: '20px' }} disabled={isProcessing}>Create PDF</button>
      )}
      {downloadUrl && <div style={{ marginTop: '20px' }}><a href={downloadUrl} download="images.pdf" className="button success">Download PDF</a></div>}
    </div>
  );
};

export default ImagesToPDF;
