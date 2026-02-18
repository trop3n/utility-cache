import { useState, useEffect, useCallback, useRef } from 'react';

export interface NativeFFmpegStatus {
  available: boolean;
  hasHap: boolean;
  checked: boolean;
}

export const useNativeFFmpeg = () => {
  const [status, setStatus] = useState<NativeFFmpegStatus>({
    available: false,
    hasHap: false,
    checked: false,
  });
  const [encoding, setEncoding] = useState(false);
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const cleanupRef = useRef<(() => void) | null>(null);

  const isElectron = !!window.electronAPI;

  useEffect(() => {
    if (!isElectron) {
      setStatus({ available: false, hasHap: false, checked: true });
      return;
    }

    window.electronAPI!.ffmpeg.checkAvailable().then((result) => {
      setStatus({
        available: result.available,
        hasHap: result.hasHap,
        checked: true,
      });
    });
  }, [isElectron]);

  useEffect(() => {
    if (isElectron && window.electronAPI) {
      cleanupRef.current = window.electronAPI.ffmpeg.onProgress((data) => {
        setMessage(data.stderr);
        const durationMatch = data.stderr.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
        const timeMatch = data.stderr.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
        
        if (durationMatch && timeMatch) {
          const parseTime = (h: string, m: string, s: string) => 
            parseInt(h) * 3600 + parseInt(m) * 60 + parseFloat(s);
          const duration = parseTime(durationMatch[1], durationMatch[2], durationMatch[3]);
          const current = parseTime(timeMatch[1], timeMatch[2], timeMatch[3]);
          setProgress(Math.round((current / duration) * 100));
        }
      });
    }

    return () => {
      cleanupRef.current?.();
    };
  }, [isElectron]);

  const encode = useCallback(async (
    file: File,
    ffmpegArgs: string[],
    outputExtension: string,
    outputMimeType: string
  ): Promise<Blob | null> => {
    if (!isElectron || !window.electronAPI) {
      return null;
    }

    setEncoding(true);
    setProgress(0);
    setMessage('');

    let inputPath: string | null = null;
    let outputPath: string | null = null;

    try {
      const arrayBuffer = await file.arrayBuffer();
      inputPath = await window.electronAPI!.ffmpeg.writeTempFile(arrayBuffer);

      const result = await window.electronAPI!.ffmpeg.encodeWithFile({
        inputPath,
        ffmpegArgs,
        outputExtension,
      });

      if (!result.success) {
        throw new Error(result.error || 'Encoding failed');
      }

      outputPath = result.outputPath!;
      const outputData = await window.electronAPI!.ffmpeg.readTempFile(outputPath);

      setProgress(100);
      return new Blob([outputData], { type: outputMimeType });
    } catch (error) {
      console.error('Native FFmpeg encoding failed:', error);
      setMessage(error instanceof Error ? error.message : 'Encoding failed');
      return null;
    } finally {
      setEncoding(false);
      
      if (inputPath) {
        window.electronAPI!.ffmpeg.deleteTempFile(inputPath).catch(() => {});
      }
      if (outputPath) {
        window.electronAPI!.ffmpeg.deleteTempFile(outputPath).catch(() => {});
      }
    }
  }, [isElectron]);

  const resetProgress = useCallback(() => {
    setProgress(0);
    setMessage('');
  }, []);

  return {
    isElectron,
    status,
    encoding,
    progress,
    message,
    encode,
    resetProgress,
  };
};
