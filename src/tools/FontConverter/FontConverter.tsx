import React, { useState, useEffect, useRef } from 'react';
import opentype from 'opentype.js';

const FontConverter: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [fontInfo, setFontInfo] = useState<any>(null);
  const [previewText, setPreviewText] = useState('The quick brown fox jumps over the lazy dog');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const buffer = e.target?.result as ArrayBuffer;
        try {
          const font = opentype.parse(buffer);
          setFontInfo({
            familyName: font.names.fontFamily?.en || 'Unknown',
            subFamily: font.names.fontSubfamily?.en || 'Unknown',
            numGlyphs: font.numGlyphs,
            unitsPerEm: font.unitsPerEm,
            copyright: font.names.copyright?.en,
            fontObj: font
          });
        } catch (err) {
          console.error(err);
          alert('Could not parse font.');
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }, [file]);

  useEffect(() => {
    if (fontInfo && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        // Draw text using the font path
        const path = fontInfo.fontObj.getPath(previewText, 20, 80, 48); // x, y, fontSize
        path.draw(ctx);
      }
    }
  }, [fontInfo, previewText]);

  const generateCss = () => {
    if (!file) return '';
    return `@font-face {
  font-family: '${fontInfo?.familyName || 'MyFont'}';
  src: url('${file.name}'); /* Ensure file is in same directory */
}`;
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>Font Viewer</h2>
      <p style={{ color: '#888', marginBottom: '20px' }}>
        Inspect TTF/OTF/WOFF fonts and preview glyphs. (WOFF2 is not supported.)
      </p>

      <div style={{ marginBottom: '20px', border: '2px dashed #444', padding: '40px', textAlign: 'center', borderRadius: '12px' }}>
        <input 
          type="file" 
          accept=".ttf,.otf,.woff"
          onChange={handleFileChange} 
          style={{ display: 'none' }} 
          id="font-upload"
        />
        <label htmlFor="font-upload" style={{ cursor: 'pointer', color: '#646cff', fontWeight: 'bold' }}>
          {file ? file.name : 'Click to Upload Font'}
        </label>
      </div>

      {fontInfo && (
        <div style={{ textAlign: 'left', backgroundColor: '#222', padding: '20px', borderRadius: '8px' }}>
          <h3>Font Info</h3>
          <p><strong>Family:</strong> {fontInfo.familyName}</p>
          <p><strong>Subfamily:</strong> {fontInfo.subFamily}</p>
          <p><strong>Glyphs:</strong> {fontInfo.numGlyphs}</p>
          <p><strong>Units Per Em:</strong> {fontInfo.unitsPerEm}</p>
          <p><strong>Copyright:</strong> {fontInfo.copyright}</p>

          <hr style={{ borderColor: '#444', margin: '20px 0' }} />

          <h3>Preview</h3>
          <input 
            type="text" 
            value={previewText} 
            onChange={(e) => setPreviewText(e.target.value)} 
            style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
          />
          <div style={{ background: 'white', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
             <canvas ref={canvasRef} width="700" height="120" style={{ display: 'block' }}></canvas>
          </div>

          <hr style={{ borderColor: '#444', margin: '20px 0' }} />
          
          <h3>CSS Snippet</h3>
          <pre style={{ background: '#111', padding: '10px', borderRadius: '4px', overflowX: 'auto' }}>
            {generateCss()}
          </pre>
        </div>
      )}
    </div>
  );
};

export default FontConverter;
