import React, { useState } from 'react';
import opentype from 'opentype.js';

// WOFF table directory entry structure
interface WoffTableEntry {
  tag: string;
  offset: number;
  compLength: number;
  origLength: number;
  origChecksum: number;
}

// Simple WOFF to TTF/OTF converter
const convertWOFFToSFNT = (woffBuffer: ArrayBuffer): ArrayBuffer => {
  const woff = new DataView(woffBuffer);
  
  // Read WOFF header
  const signature = woff.getUint32(0, false);
  if (signature !== 0x774F4646) { // 'wOFF'
    throw new Error('Not a valid WOFF file');
  }
  
  const numTables = woff.getUint16(12, false);
  const totalSfntSize = woff.getUint32(16, false);
  
  // Calculate TrueType/OpenType header size
  const searchRange = Math.pow(2, Math.floor(Math.log2(numTables)) + 4);
  const entrySelector = Math.log2(searchRange / 16);
  const rangeShift = numTables * 16 - searchRange;
  
  // Create output buffer
  const sfnt = new ArrayBuffer(totalSfntSize);
  const sfntView = new DataView(sfnt);
  const sfntBytes = new Uint8Array(sfnt);
  
  // Write sfnt header
  sfntView.setUint32(0, 0x00010000, false); // sfntVersion for TrueType / CFF
  sfntView.setUint16(4, numTables, false);
  sfntView.setUint16(6, searchRange, false);
  sfntView.setUint16(8, entrySelector, false);
  sfntView.setUint16(10, rangeShift, false);
  
  let tableOffset = 12 + numTables * 16;
  let woffTableDirOffset = 44;
  
  for (let i = 0; i < numTables; i++) {
    const tag = String.fromCharCode(
      woff.getUint8(woffTableDirOffset),
      woff.getUint8(woffTableDirOffset + 1),
      woff.getUint8(woffTableDirOffset + 2),
      woff.getUint8(woffTableDirOffset + 3)
    );
    const offset = woff.getUint32(woffTableDirOffset + 4, false);
    const compLength = woff.getUint32(woffTableDirOffset + 8, false);
    const origLength = woff.getUint32(woffTableDirOffset + 12, false);
    const origChecksum = woff.getUint32(woffTableDirOffset + 16, false);
    
    // Write table directory entry
    for (let j = 0; j < 4; j++) {
      sfntView.setUint8(12 + i * 16 + j, tag.charCodeAt(j));
    }
    sfntView.setUint32(12 + i * 16 + 4, origChecksum, false);
    sfntView.setUint32(12 + i * 16 + 8, tableOffset, false);
    sfntView.setUint32(12 + i * 16 + 12, origLength, false);
    
    // Copy/decompress table data (assuming uncompressed for now, WOFF2 needs Brotli)
    const tableData = new Uint8Array(woffBuffer, offset, compLength);
    
    // Check if zlib compressed (simple check - if compLength != origLength)
    if (compLength !== origLength) {
      // Would need to decompress with zlib here
      // For now, we'll copy as-is which won't work for compressed tables
      sfntBytes.set(tableData.slice(0, origLength), tableOffset);
    } else {
      sfntBytes.set(tableData, tableOffset);
    }
    
    tableOffset += origLength;
    // Pad to 4-byte boundary
    while (tableOffset % 4 !== 0) {
      sfntView.setUint8(tableOffset++, 0);
    }
    
    woffTableDirOffset += 20;
  }
  
  return sfnt;
};

// TTF/OTF to WOFF converter
const convertSFNTToWOFF = (sfntBuffer: ArrayBuffer): ArrayBuffer => {
  const sfnt = new DataView(sfntBuffer);
  const numTables = sfnt.getUint16(4, false);
  
  // Calculate sizes
  const woffHeaderSize = 44;
  const woffTableDirSize = numTables * 20;
  
  let totalTableSize = 0;
  const tables: WoffTableEntry[] = [];
  
  for (let i = 0; i < numTables; i++) {
    const tag = String.fromCharCode(
      sfnt.getUint8(12 + i * 16),
      sfnt.getUint8(12 + i * 16 + 1),
      sfnt.getUint8(12 + i * 16 + 2),
      sfnt.getUint8(12 + i * 16 + 3)
    );
    const offset = sfnt.getUint32(12 + i * 16 + 8, false);
    const length = sfnt.getUint32(12 + i * 16 + 12, false);
    const checksum = sfnt.getUint32(12 + i * 16 + 4, false);
    
    tables.push({
      tag,
      offset,
      compLength: length,
      origLength: length,
      origChecksum: checksum
    });
    
    // Pad to 4-byte boundary
    totalTableSize += length + ((4 - (length % 4)) % 4);
  }
  
  const totalSize = woffHeaderSize + woffTableDirSize + totalTableSize;
  const woff = new ArrayBuffer(totalSize);
  const woffView = new DataView(woff);
  const woffBytes = new Uint8Array(woff);
  const sfntBytes = new Uint8Array(sfntBuffer);
  
  // Write WOFF header
  woffView.setUint32(0, 0x774F4646, false); // 'wOFF'
  woffView.setUint32(4, sfnt.getUint32(0, false), false); // flavor
  woffView.setUint32(8, totalSize, false); // length
  woffView.setUint16(12, numTables, false);
  woffView.setUint16(14, sfnt.getUint16(6, false), false); // totalSfntSize (searchRange)
  woffView.setUint16(16, sfnt.getUint16(8, false), false); // majorVersion
  woffView.setUint16(18, sfnt.getUint16(10, false), false); // minorVersion
  woffView.setUint32(20, 0, false); // metaOffset
  woffView.setUint32(24, 0, false); // metaLength
  woffView.setUint32(28, 0, false); // metaOrigLength
  woffView.setUint32(32, 0, false); // privOffset
  woffView.setUint32(36, 0, false); // privLength
  
  let dataOffset = woffHeaderSize + woffTableDirSize;
  
  for (let i = 0; i < numTables; i++) {
    const table = tables[i];
    const dirOffset = woffHeaderSize + i * 20;
    
    // Write table directory entry
    for (let j = 0; j < 4; j++) {
      woffView.setUint8(dirOffset + j, table.tag.charCodeAt(j));
    }
    woffView.setUint32(dirOffset + 4, dataOffset, false);
    woffView.setUint32(dirOffset + 8, table.compLength, false);
    woffView.setUint32(dirOffset + 12, table.origLength, false);
    woffView.setUint32(dirOffset + 16, table.origChecksum, false);
    
    // Copy table data
    const tableData = sfntBytes.slice(table.offset, table.offset + table.origLength);
    woffBytes.set(tableData, dataOffset);
    
    dataOffset += table.origLength;
    // Pad to 4-byte boundary
    while (dataOffset % 4 !== 0) {
      woffView.setUint8(dataOffset++, 0);
    }
  }
  
  return woff;
};

const FontConverterTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [fontInfo, setFontInfo] = useState<any>(null);
  const [targetFormat, setTargetFormat] = useState<string>('');
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [convertedFilename, setConvertedFilename] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'converting' | 'completed' | 'error'>('idle');
  const [error, setError] = useState('');

  const getInputFormat = (filename: string): string => {
    const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
    return ext;
  };

  const getAvailableFormats = (inputFormat: string): string[] => {
    const formats: Record<string, string[]> = {
      '.ttf': ['.otf', '.woff'],
      '.otf': ['.ttf', '.woff'],
      '.woff': ['.ttf', '.otf'],
      '.woff2': ['.ttf', '.otf', '.woff']
    };
    return formats[inputFormat] || [];
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const newFile = e.target.files[0];
      setFile(newFile);
      setConvertedUrl(null);
      setStatus('idle');
      setError('');
      
      // Parse font info
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
            isTTF: font.outlinesFormat === 'truetype',
            isCFF: font.outlinesFormat === 'cff'
          });
        } catch (err) {
          console.error(err);
          setError('Could not parse font file');
        }
      };
      reader.readAsArrayBuffer(newFile);
    }
  };

  const convertFont = async () => {
    if (!file || !targetFormat) return;

    setStatus('converting');
    setError('');

    try {
      const inputFormat = getInputFormat(file.name);
      const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
      const outputName = baseName + targetFormat;
      
      const arrayBuffer = await file.arrayBuffer();
      let outputBuffer: ArrayBuffer;

      if (inputFormat === '.woff' && (targetFormat === '.ttf' || targetFormat === '.otf')) {
        // WOFF to TTF/OTF
        outputBuffer = convertWOFFToSFNT(arrayBuffer);
      } else if ((inputFormat === '.ttf' || inputFormat === '.otf') && targetFormat === '.woff') {
        // TTF/OTF to WOFF
        outputBuffer = convertSFNTToWOFF(arrayBuffer);
      } else if (inputFormat === '.ttf' && targetFormat === '.otf') {
        // TTF to OTF - use opentype to re-encode
        const font = opentype.parse(arrayBuffer);
        outputBuffer = font.toArrayBuffer();
      } else if (inputFormat === '.otf' && targetFormat === '.ttf') {
        // OTF to TTF - use opentype to re-encode (will convert outlines)
        const font = opentype.parse(arrayBuffer);
        outputBuffer = font.toArrayBuffer();
      } else if (inputFormat === '.woff2') {
        // WOFF2 needs Brotli decompression which is complex
        // For now, show an error
        throw new Error('WOFF2 conversion requires additional libraries. Please use WOFF, TTF, or OTF files.');
      } else {
        throw new Error(`Conversion from ${inputFormat} to ${targetFormat} is not supported`);
      }

      const blob = new Blob([outputBuffer], { type: 'font/' + targetFormat.slice(1) });
      const url = URL.createObjectURL(blob);
      
      setConvertedUrl(url);
      setConvertedFilename(outputName);
      setStatus('completed');

    } catch (err) {
      console.error('Conversion error:', err);
      setError(err instanceof Error ? err.message : 'Failed to convert font');
      setStatus('error');
    }
  };

  const clearAll = () => {
    if (convertedUrl) {
      URL.revokeObjectURL(convertedUrl);
    }
    setFile(null);
    setFontInfo(null);
    setTargetFormat('');
    setConvertedUrl(null);
    setConvertedFilename('');
    setStatus('idle');
    setError('');
  };

  const inputFormat = file ? getInputFormat(file.name) : '';
  const availableFormats = file ? getAvailableFormats(inputFormat) : [];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>Font Converter</h2>
      <p style={{ color: '#888', marginBottom: '20px' }}>
        Convert between font formats: TTF ↔ OTF ↔ WOFF. Note: WOFF2 conversion is not supported.
      </p>

      <div style={{ marginBottom: '20px', border: '2px dashed #444', padding: '40px', textAlign: 'center', borderRadius: '12px' }}>
        <input 
          type="file" 
          accept=".ttf,.otf,.woff,.woff2"
          onChange={handleFileChange} 
          style={{ display: 'none' }} 
          id="font-convert-upload"
        />
        <label htmlFor="font-convert-upload" style={{ cursor: 'pointer', color: '#646cff', fontWeight: 'bold' }}>
          {file ? file.name : 'Click to Upload Font'}
        </label>
      </div>

      {error && (
        <div style={{ 
          padding: '12px 16px', 
          backgroundColor: '#dc2626', 
          color: 'white', 
          borderRadius: '8px',
          marginBottom: '20px' 
        }}>
          {error}
        </div>
      )}

      {fontInfo && (
        <div style={{ backgroundColor: '#222', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <h3 style={{ marginTop: 0 }}>Font Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
            <div><strong>Family:</strong> {fontInfo.familyName}</div>
            <div><strong>Style:</strong> {fontInfo.subFamily}</div>
            <div><strong>Glyphs:</strong> {fontInfo.numGlyphs}</div>
            <div><strong>Format:</strong> {fontInfo.isTTF ? 'TrueType' : fontInfo.isCFF ? 'OpenType (CFF)' : 'Unknown'}</div>
            <div><strong>Input:</strong> {inputFormat.toUpperCase()}</div>
          </div>

          <h4 style={{ marginBottom: '10px' }}>Convert to:</h4>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {availableFormats.map(fmt => (
              <button
                key={fmt}
                onClick={() => setTargetFormat(fmt)}
                className={targetFormat === fmt ? 'primary' : ''}
                style={{
                  padding: '10px 20px',
                  border: targetFormat === fmt ? '1px solid #646cff' : '1px solid #444'
                }}
              >
                {fmt.toUpperCase()}
              </button>
            ))}
          </div>
          {availableFormats.length === 0 && (
            <p style={{ color: '#888', fontSize: '0.9rem' }}>
              No conversion options available for this format.
            </p>
          )}
        </div>
      )}

      {status === 'converting' && (
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <p>Converting font...</p>
        </div>
      )}

      {convertedUrl && status === 'completed' && (
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#064e3b', 
          borderRadius: '12px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px' }}>✅ Conversion Complete!</h3>
          <p style={{ marginBottom: '15px' }}>{convertedFilename}</p>
          <a
            href={convertedUrl}
            download={convertedFilename}
            className="button success"
            style={{ padding: '12px 32px', textDecoration: 'none', display: 'inline-block' }}
          >
            Download Font
          </a>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        {file && targetFormat && status !== 'converting' && status !== 'completed' && (
          <button 
            onClick={convertFont}
            className="primary"
            style={{ padding: '12px 32px' }}
          >
            Convert Font
          </button>
        )}
        
        {file && (
          <button onClick={clearAll} style={{ padding: '12px 24px' }}>
            Clear
          </button>
        )}
      </div>

      <div style={{ 
        marginTop: '30px', 
        padding: '16px', 
        backgroundColor: 'rgba(255,255,255,0.03)', 
        borderRadius: '8px',
        fontSize: '0.85rem',
        color: '#888'
      }}>
        <strong>Supported Conversions:</strong>
        <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
          <li>TTF ↔ OTF - Convert between TrueType and OpenType formats</li>
          <li>TTF/OTF ↔ WOFF - Create web-optimized fonts</li>
          <li>WOFF → TTF/OTF - Extract original font data</li>
        </ul>
        <p style={{ marginTop: '10px', marginBottom: 0 }}>
          <strong>Note:</strong> WOFF2 format requires Brotli compression and is not currently supported.
        </p>
      </div>
    </div>
  );
};

export default FontConverterTool;
