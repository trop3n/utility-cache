import React, { useState, useRef } from 'react';

interface DownloadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

const VideoUrlDownloader: React.FC = () => {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'downloading' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [filename, setFilename] = useState('');
  const [error, setError] = useState('');
  const [downloadedUrl, setDownloadedUrl] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const getFilenameFromUrl = (url: string, contentType?: string | null): string => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const nameFromUrl = pathname.split('/').pop();
      
      if (nameFromUrl && nameFromUrl.includes('.')) {
        return decodeURIComponent(nameFromUrl);
      }
      
      // Fallback based on content type
      const ext = contentType?.includes('mp4') ? 'mp4' :
                  contentType?.includes('webm') ? 'webm' :
                  contentType?.includes('ogg') ? 'ogv' :
                  contentType?.includes('quicktime') ? 'mov' :
                  contentType?.includes('x-matroska') ? 'mkv' :
                  'mp4';
      
      return `video_${Date.now()}.${ext}`;
    } catch {
      return `video_${Date.now()}.mp4`;
    }
  };

  const downloadVideo = async () => {
    if (!url.trim()) {
      setError('Please enter a video URL');
      return;
    }

    // Basic URL validation
    let validUrl: URL;
    try {
      validUrl = new URL(url);
      if (!['http:', 'https:'].includes(validUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      setError('Please enter a valid URL (http:// or https://)');
      return;
    }

    setStatus('downloading');
    setError('');
    setProgress({ loaded: 0, total: 0, percentage: 0 });
    setDownloadedUrl(null);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(url, {
        signal: abortControllerRef.current.signal,
        headers: {
          // Some servers require a user agent
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentLength = response.headers.get('content-length');
      const contentType = response.headers.get('content-type');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      
      setFilename(getFilenameFromUrl(url, contentType));

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Unable to read response body');
      }

      const chunks: Uint8Array[] = [];
      let loaded = 0;

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        chunks.push(value);
        loaded += value.length;
        
        setProgress({
          loaded,
          total,
          percentage: total > 0 ? Math.round((loaded / total) * 100) : 0
        });
      }

      // Combine chunks
      const allChunks = new Uint8Array(loaded);
      let position = 0;
      for (const chunk of chunks) {
        allChunks.set(chunk, position);
        position += chunk.length;
      }

      // Create blob and download URL
      const blob = new Blob([allChunks], { type: contentType || 'video/mp4' });
      const downloadUrl = URL.createObjectURL(blob);
      
      setDownloadedUrl(downloadUrl);
      setStatus('completed');
      setProgress(null);

    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('Download cancelled');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to download video');
      }
      setStatus('error');
      setProgress(null);
    }
  };

  const cancelDownload = () => {
    abortControllerRef.current?.abort();
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const clearDownload = () => {
    if (downloadedUrl) {
      URL.revokeObjectURL(downloadedUrl);
    }
    setDownloadedUrl(null);
    setStatus('idle');
    setProgress(null);
    setFilename('');
    setError('');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>Video URL Downloader</h2>
      <p style={{ color: '#888', marginBottom: '20px' }}>
        Download videos from direct URLs (MP4, WebM, etc.). Works with direct video file links.
      </p>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
          Video URL:
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/video.mp4"
          disabled={status === 'downloading'}
          style={{ width: '100%', padding: '12px', fontSize: '1rem' }}
        />
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

      {status === 'downloading' && progress && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Downloading...</span>
            <span>{progress.percentage}% ({formatBytes(progress.loaded)} / {formatBytes(progress.total)})</span>
          </div>
          <div style={{ 
            width: '100%', 
            backgroundColor: '#111', 
            borderRadius: '10px', 
            overflow: 'hidden', 
            height: '20px' 
          }}>
            <div style={{ 
              width: `${progress.percentage}%`, 
              backgroundColor: '#646cff', 
              height: '100%', 
              transition: 'width 0.3s ease' 
            }} />
          </div>
          <button 
            onClick={cancelDownload}
            style={{ 
              marginTop: '10px', 
              background: 'none', 
              border: 'none', 
              color: '#ef4444', 
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {status === 'completed' && downloadedUrl && (
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#064e3b', 
          borderRadius: '12px',
          marginBottom: '20px'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '10px' }}>Download Complete!</h3>
          <p style={{ marginBottom: '15px', color: '#ddd' }}>{filename}</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <a
              href={downloadedUrl}
              download={filename}
              className="button success"
              style={{ 
                padding: '10px 24px', 
                textDecoration: 'none',
                display: 'inline-block'
              }}
            >
              Save Video
            </a>
            <button
              onClick={clearDownload}
              style={{ padding: '10px 24px' }}
            >
              Download Another
            </button>
          </div>
        </div>
      )}

      {status !== 'completed' && (
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={downloadVideo}
            disabled={status === 'downloading' || !url.trim()}
            className="primary"
            style={{ 
              padding: '12px 32px', 
              fontSize: '1rem',
              opacity: status === 'downloading' || !url.trim() ? 0.6 : 1
            }}
          >
            {status === 'downloading' ? 'Downloading...' : 'Download Video'}
          </button>
          
          {url && (
            <button
              onClick={() => { setUrl(''); setError(''); }}
              disabled={status === 'downloading'}
              style={{ padding: '12px 24px' }}
            >
              Clear
            </button>
          )}
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
        <h4 style={{ marginTop: 0, marginBottom: '10px' }}>Supported URL Types:</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#888' }}>
          <li>Direct video file links (ending in .mp4, .webm, .mov, etc.)</li>
          <li>CDN-hosted videos with direct access</li>
          <li>Video API endpoints that return video files</li>
        </ul>
        <p style={{ marginTop: '10px', marginBottom: 0, fontSize: '0.85rem', color: '#666' }}>
          <strong>Note:</strong> This tool downloads videos from direct URLs only. It does not support 
          streaming sites like YouTube, Vimeo, etc.
        </p>
      </div>
    </div>
  );
};

export default VideoUrlDownloader;
