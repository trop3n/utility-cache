import React, { useState, useRef, useCallback, useEffect } from 'react';
import { fetchFile } from '@ffmpeg/util';
import { useFFmpeg } from '../../hooks/useFFmpeg';
import { useNativeFFmpeg } from '../../hooks/useNativeFFmpeg';

interface QueueItem {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  downloadUrl: string | null;
  error?: string;
}

const HapEncoder: React.FC = () => {
  const { ffmpeg, loaded, load, progress, message } = useFFmpeg();
  const { isElectron, status: nativeStatus, progress: nativeProgress, message: nativeMessage, encode: nativeEncode, resetProgress } = useNativeFFmpeg();
  
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [hapFormat, setHapFormat] = useState('hap');
  const [chunks, setChunks] = useState(1);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const processingRef = useRef(false);
  const pauseRef = useRef(false);
  const queueRef = useRef(queue);
  const hapFormatRef = useRef(hapFormat);
  const chunksRef = useRef(chunks);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    hapFormatRef.current = hapFormat;
  }, [hapFormat]);

  useEffect(() => {
    chunksRef.current = chunks;
  }, [chunks]);

  const useNative = isElectron && nativeStatus.hasHap;
  const currentProgress = useNative ? nativeProgress : progress;
  const currentMessage = useNative ? nativeMessage : message;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newItems: QueueItem[] = Array.from(e.target.files).map(file => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        status: 'pending' as const,
        progress: 0,
        downloadUrl: null,
      }));
      setQueue(prev => [...prev, ...newItems]);
      if (!useNative && !loaded) load();
      e.target.value = '';
    }
  };

  const removeItem = (id: string) => {
    setQueue(prev => {
      const item = prev.find(i => i.id === id);
      if (item?.downloadUrl) URL.revokeObjectURL(item.downloadUrl);
      return prev.filter(i => i.id !== id);
    });
  };

  const clearCompleted = () => {
    setQueue(prev => {
      prev.forEach(item => {
        if (item.downloadUrl) URL.revokeObjectURL(item.downloadUrl);
      });
      return prev.filter(i => i.status !== 'completed');
    });
  };

  const clearAll = () => {
    queue.forEach(item => {
      if (item.downloadUrl) URL.revokeObjectURL(item.downloadUrl);
    });
    setQueue([]);
    pauseRef.current = false;
    setIsPaused(false);
  };

  const updateItem = useCallback((id: string, updates: Partial<QueueItem>) => {
    setQueue(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  const encodeSingleFile = useCallback(async (item: QueueItem): Promise<{ success: boolean; blob?: Blob; error?: string }> => {
    const ffmpegArgs = [
      '-c:v', 'hap',
      '-format', hapFormatRef.current,
      '-chunks', chunksRef.current.toString(),
      '-c:a', 'pcm_s16le',
    ];

    if (useNative) {
      resetProgress();
      const blob = await nativeEncode(item.file, ffmpegArgs, 'mov', 'video/quicktime');
      return { success: !!blob, blob: blob || undefined, error: blob ? undefined : 'Encoding failed' };
    }

    if (!loaded) return { success: false, error: 'FFmpeg not loaded' };
    
    const inputName = `input_${item.id}`;
    const outputName = `output_${item.id}.mov`;

    try {
      await ffmpeg.writeFile(inputName, await fetchFile(item.file));
      await ffmpeg.exec(['-i', inputName, ...ffmpegArgs, outputName]);
      const data = await ffmpeg.readFile(outputName);
      const blob = new Blob([(data as Uint8Array).buffer as ArrayBuffer], { type: 'video/quicktime' });
      return { success: true, blob };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }, [useNative, loaded, ffmpeg, nativeEncode, resetProgress]);

  const processNextItemRef = useRef<(() => Promise<void>) | null>(null);

  const processNextItem = useCallback(async () => {
    if (processingRef.current || pauseRef.current) return;
    
    const pendingItem = queueRef.current.find(i => i.status === 'pending');
    if (!pendingItem) {
      processingRef.current = false;
      setIsProcessingQueue(false);
      return;
    }

    processingRef.current = true;
    setIsProcessingQueue(true);
    updateItem(pendingItem.id, { status: 'processing', progress: 0 });
    
    const result = await encodeSingleFile(pendingItem);

    if (pauseRef.current) {
      updateItem(pendingItem.id, { status: 'pending', progress: 0 });
      processingRef.current = false;
      return;
    }

    if (result.success && result.blob) {
      const url = URL.createObjectURL(result.blob);
      updateItem(pendingItem.id, { 
        status: 'completed', 
        progress: 100, 
        downloadUrl: url 
      });
    } else {
      updateItem(pendingItem.id, { 
        status: 'error', 
        error: result.error || 'Unknown error' 
      });
    }

    processingRef.current = false;
    processNextItemRef.current?.();
  }, [encodeSingleFile, updateItem]);

  useEffect(() => {
    processNextItemRef.current = processNextItem;
  }, [processNextItem]);

  const startProcessing = () => {
    pauseRef.current = false;
    setIsPaused(false);
    processNextItem();
  };

  const pauseProcessing = () => {
    pauseRef.current = true;
    setIsPaused(true);
  };

  const getStatusMessage = () => {
    if (useNative) return 'Native FFmpeg with HAP support detected - encoding will be fast!';
    if (isElectron && nativeStatus.checked && !nativeStatus.hasHap) {
      return 'FFmpeg found but HAP codec not available. Install FFmpeg with HAP support for better performance.';
    }
    return null;
  };

  const completedCount = queue.filter(i => i.status === 'completed').length;
  const pendingCount = queue.filter(i => i.status === 'pending').length;
  const processingCount = queue.filter(i => i.status === 'processing').length;
  const errorCount = queue.filter(i => i.status === 'error').length;

  const statusMessage = getStatusMessage();

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <h2>HAP Encoder</h2>
      <p style={{ color: '#888', marginBottom: '20px' }}>
        Convert videos to HAP, HAP Alpha, or HAP Q codec (.mov) for high-performance playback.
      </p>

      {statusMessage && (
        <div style={{ backgroundColor: useNative ? 'rgba(39, 174, 96, 0.1)' : 'rgba(243, 156, 18, 0.1)', padding: '15px', borderRadius: '8px', marginBottom: '20px', color: useNative ? '#27ae60' : '#e67e22', fontSize: '0.9rem' }}>
          {statusMessage}
        </div>
      )}

      {!useNative && !isElectron && (
        <div style={{ backgroundColor: 'rgba(243, 156, 18, 0.1)', padding: '15px', borderRadius: '8px', marginBottom: '20px', color: '#e67e22', fontSize: '0.9rem' }}>
          <strong>Note:</strong> The HAP codec requires a custom FFmpeg build. For best results, use the Electron desktop version with a HAP-enabled FFmpeg.
        </div>
      )}

      {!useNative && !loaded && (
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <button onClick={load} className="primary">Initialize Engine</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>HAP Format</label>
          <select 
            value={hapFormat} 
            onChange={e => setHapFormat(e.target.value)}
            disabled={isProcessingQueue}
            style={{ padding: '8px', borderRadius: '4px', background: '#222', color: 'white' }}
          >
            <option value="hap">HAP (Standard)</option>
            <option value="hap_alpha">HAP Alpha (Transparency)</option>
            <option value="hap_q">HAP Q (High Quality)</option>
          </select>
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Chunks (CPU Threads)</label>
          <select 
            value={chunks} 
            onChange={e => setChunks(parseInt(e.target.value))}
            disabled={isProcessingQueue}
            style={{ padding: '8px', borderRadius: '4px', background: '#222', color: 'white' }}
          >
            <option value="1">1 (Single)</option>
            <option value="2">2</option>
            <option value="4">4</option>
            <option value="8">8</option>
            <option value="16">16 (Max)</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: '20px', border: '2px dashed #444', padding: '40px', textAlign: 'center', borderRadius: '12px' }}>
        <input 
          type="file" 
          accept="video/*" 
          multiple 
          onChange={handleFileChange} 
          style={{ display: 'none' }} 
          id="hap-upload" 
        />
        <label htmlFor="hap-upload" style={{ cursor: 'pointer', color: '#646cff', fontWeight: 'bold' }}>
          Click to Upload Videos (or drag & drop)
        </label>
        <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '10px' }}>
          Select multiple files to batch encode
        </p>
      </div>

      {queue.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '15px', fontSize: '0.9rem' }}>
              <span style={{ color: '#888' }}>Total: {queue.length}</span>
              <span style={{ color: '#27ae60' }}>Done: {completedCount}</span>
              <span style={{ color: '#f39c12' }}>Pending: {pendingCount}</span>
              {errorCount > 0 && <span style={{ color: '#e74c3c' }}>Failed: {errorCount}</span>}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {pendingCount > 0 && !isProcessingQueue && (
                <button onClick={startProcessing} className="primary">
                  Start Encoding ({pendingCount})
                </button>
              )}
              {isProcessingQueue && (
                <button onClick={pauseProcessing} className="secondary">
                  {isPaused ? 'Paused...' : 'Pause'}
                </button>
              )}
              {isPaused && pendingCount > 0 && (
                <button onClick={startProcessing} className="primary">
                  Resume
                </button>
              )}
              {completedCount > 0 && (
                <button onClick={clearCompleted} className="secondary">
                  Clear Completed
                </button>
              )}
              <button onClick={clearAll} className="secondary" style={{ color: '#e74c3c' }}>
                Clear All
              </button>
            </div>
          </div>

          {isProcessingQueue && processingCount > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '5px' }}>
                <span>Overall Progress</span>
                <span>{completedCount + 1} of {queue.length}</span>
              </div>
              <div style={{ width: '100%', backgroundColor: '#111', borderRadius: '10px', overflow: 'hidden', height: '8px' }}>
                <div 
                  style={{ 
                    width: `${((completedCount / queue.length) * 100) + (currentProgress / queue.length)}%`, 
                    backgroundColor: '#646cff', 
                    height: '100%', 
                    transition: 'width 0.3s ease' 
                  }} 
                />
              </div>
              <p style={{ fontSize: '0.7rem', color: '#666', marginTop: '5px' }}>{currentMessage}</p>
            </div>
          )}

          <div style={{ border: '1px solid #333', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 100px 120px 80px', 
              padding: '10px 15px', 
              backgroundColor: '#1a1a1a',
              fontSize: '0.8rem',
              color: '#888',
              fontWeight: 'bold'
            }}>
              <span>File</span>
              <span>Size</span>
              <span>Status</span>
              <span>Action</span>
            </div>
            
            {queue.map(item => (
              <div 
                key={item.id}
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 100px 120px 80px', 
                  padding: '12px 15px', 
                  borderTop: '1px solid #333',
                  alignItems: 'center',
                  backgroundColor: item.status === 'processing' ? 'rgba(100, 108, 255, 0.1)' : 'transparent'
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.file.name}
                </span>
                <span style={{ fontSize: '0.85rem', color: '#888' }}>
                  {(item.file.size / 1024 / 1024).toFixed(1)} MB
                </span>
                <span>
                  {item.status === 'pending' && <span style={{ color: '#888' }}>Pending</span>}
                  {item.status === 'processing' && (
                    <span style={{ color: '#646cff' }}>
                      Encoding... {currentProgress}%
                    </span>
                  )}
                  {item.status === 'completed' && <span style={{ color: '#27ae60' }}>Done</span>}
                  {item.status === 'error' && (
                    <span style={{ color: '#e74c3c' }} title={item.error}>
                      Failed
                    </span>
                  )}
                </span>
                <span>
                  {item.status === 'completed' && item.downloadUrl && (
                    <a 
                      href={item.downloadUrl} 
                      download={item.file.name.replace(/\.[^.]+$/, '_hap.mov')}
                      style={{ color: '#646cff', fontSize: '0.85rem' }}
                    >
                      Download
                    </a>
                  )}
                  {(item.status === 'pending' || item.status === 'error') && !isProcessingQueue && (
                    <button 
                      onClick={() => removeItem(item.id)}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: '#e74c3c', 
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      Remove
                    </button>
                  )}
                  {item.status === 'error' && !isProcessingQueue && (
                    <button 
                      onClick={() => updateItem(item.id, { status: 'pending', error: undefined })}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: '#646cff', 
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        marginLeft: '5px'
                      }}
                    >
                      Retry
                    </button>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HapEncoder;
