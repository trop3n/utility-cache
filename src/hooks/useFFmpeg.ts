import { useState, useRef, useCallback, useMemo } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

export const useFFmpeg = () => {
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'processing' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const listenersAttached = useRef(false);

  const ffmpeg = useMemo(() => new FFmpeg(), []);

  const load = useCallback(async () => {
    if (loaded) return;
    setStatus('loading');
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

    if (!listenersAttached.current) {
      ffmpeg.on('log', ({ message }) => {
        setMessage(message);
      });

      ffmpeg.on('progress', ({ progress }) => {
        setProgress(Math.round(progress * 100));
      });
      listenersAttached.current = true;
    }

    try {
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      setLoaded(true);
      setStatus('idle');
    } catch (error) {
      console.error('Failed to load ffmpeg', error);
      setStatus('error');
    }
  }, [loaded, ffmpeg]);

  const resetProgress = useCallback(() => {
    setProgress(0);
    setMessage('');
  }, []);

  return { ffmpeg, loaded, load, status, setStatus, progress, setProgress, message, resetProgress };
};
