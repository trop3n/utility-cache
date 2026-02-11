import React, { useState } from 'react';
import JSZip from 'jszip';

const ArchiveExtractor: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [entries, setEntries] = useState<{ name: string; dir: boolean; date: Date; blob?: Blob }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const f = e.target.files[0];
      setFile(f);
      setEntries([]);
      setIsProcessing(true);
      try {
        const zip = await JSZip.loadAsync(f);
        const extractedEntries: any[] = [];
        
        // Iterate and extract metadata
        zip.forEach((_, zipEntry) => {
            extractedEntries.push({
                name: zipEntry.name,
                dir: zipEntry.dir,
                date: zipEntry.date,
                entry: zipEntry
            });
        });
        
        setEntries(extractedEntries);
      } catch (error) {
        console.error(error);
        alert('Failed to read archive. Only ZIP files are supported currently.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const downloadEntry = async (entry: any) => {
      const blob = await entry.entry.async('blob');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = entry.name.split('/').pop() || entry.name;
      a.click();
      URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>Archive Extractor (ZIP)</h2>
      <div style={{ marginBottom: '20px', border: '2px dashed #444', padding: '40px', textAlign: 'center', borderRadius: '12px' }}>
        <input type="file" accept=".zip,application/zip,application/x-zip-compressed" onChange={handleFileChange} style={{ display: 'none' }} id="zip-upload" />
        <label htmlFor="zip-upload" style={{ cursor: 'pointer', color: '#646cff', fontWeight: 'bold' }}>
          {file ? file.name : 'Click to Upload ZIP Archive'}
        </label>
      </div>

      {isProcessing && <p>Processing archive...</p>}

      {entries.length > 0 && (
        <div>
           <h3>Contents ({entries.length} items)</h3>
           <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left' }}>
             {entries.map((item: any, i) => (
               <li key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #333' }}>
                 <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <span style={{ marginRight: '10px' }}>{item.dir ? '\uD83D\uDCC1' : '\uD83D\uDCC4'}</span>
                    <span>{item.name}</span>
                 </div>
                 {!item.dir && (
                     <button onClick={() => downloadEntry(item)} className="button success" style={{ padding: '5px 10px', fontSize: '0.8rem' }}>Download</button>
                 )}
               </li>
             ))}
           </ul>
        </div>
      )}
    </div>
  );
};

export default ArchiveExtractor;
