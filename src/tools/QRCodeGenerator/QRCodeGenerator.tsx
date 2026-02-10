import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const QRCodeGenerator: React.FC = () => {
  const [text, setText] = useState('');
  const [size, setSize] = useState(256);
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const qrRef = useRef<HTMLDivElement>(null);

  const downloadQR = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = size;
      canvas.height = size;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = 'qrcode.png';
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2>QR Code Generator</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Text or URL</label>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="https://example.com"
        />
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Size (px)</label>
          <input
            type="number"
            value={size}
            onChange={(e) => setSize(parseInt(e.target.value) || 128)}
            style={{ width: '100px' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Foreground</label>
          <input
            type="color"
            value={fgColor}
            onChange={(e) => setFgColor(e.target.value)}
            style={{ height: '45px', width: '60px', padding: '2px', borderRadius: '4px', border: '1px solid #444' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Background</label>
          <input
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            style={{ height: '45px', width: '60px', padding: '2px', borderRadius: '4px', border: '1px solid #444' }}
          />
        </div>
      </div>

      {text && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <div ref={qrRef} style={{ background: bgColor, padding: '20px', display: 'inline-block', borderRadius: '8px', border: '1px solid #ddd' }}>
            <QRCodeSVG
              value={text}
              size={size}
              fgColor={fgColor}
              bgColor={bgColor}
              level="H"
              includeMargin={true}
            />
          </div>
          <div style={{ marginTop: '20px' }}>
            <button onClick={downloadQR} className="success">
              Download PNG
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCodeGenerator;
