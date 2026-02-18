import { useState, useCallback, useRef, useEffect } from 'react';
import type { Clip, EditorState } from './types';

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const getVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => resolve(0);
    video.src = URL.createObjectURL(file);
  });
};

const getVideoThumbnail = (file: File, time: number = 0): Promise<string> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.currentTime = time;
    
    video.onloadeddata = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 90;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      } else {
        resolve('');
      }
      URL.revokeObjectURL(video.src);
    };
    
    video.onerror = () => resolve('');
    video.src = URL.createObjectURL(file);
  });
};

export const useVideoEditor = () => {
  const [state, setState] = useState<EditorState>({
    clips: [],
    selectedClipId: null,
    currentTime: 0,
    isPlaying: false,
    zoom: 1,
  });

  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const playStartTimeRef = useRef<number>(0);
  const playClipTimeRef = useRef<number>(0);

  const totalDuration = state.clips.reduce((acc, clip) => acc + (clip.endTime - clip.startTime), 0);

  const addClips = useCallback(async (files: File[]) => {
    const newClips: Clip[] = [];
    
    for (const file of files) {
      const duration = await getVideoDuration(file);
      const thumbnail = await getVideoThumbnail(file, duration * 0.1);
      
      newClips.push({
        id: generateId(),
        file,
        name: file.name,
        duration,
        startTime: 0,
        endTime: duration,
        offset: 0,
        thumbnail,
      });
    }
    
    setState(prev => {
      const currentOffset = prev.clips.reduce((acc, c) => acc + (c.endTime - c.startTime), 0);
      const clipsWithOffset = newClips.map(clip => ({
        ...clip,
        offset: currentOffset + prev.clips.reduce((acc, c) => acc + (c.endTime - c.startTime), 0),
      }));
      
      return {
        ...prev,
        clips: [...prev.clips, ...clipsWithOffset],
      };
    });
  }, []);

  const removeClip = useCallback((clipId: string) => {
    setState(prev => ({
      ...prev,
      clips: prev.clips.filter(c => c.id !== clipId),
      selectedClipId: prev.selectedClipId === clipId ? null : prev.selectedClipId,
    }));
  }, []);

  const selectClip = useCallback((clipId: string | null) => {
    setState(prev => ({ ...prev, selectedClipId: clipId }));
  }, []);

  const updateClip = useCallback((clipId: string, updates: Partial<Clip>) => {
    setState(prev => ({
      ...prev,
      clips: prev.clips.map(c => c.id === clipId ? { ...c, ...updates } : c),
    }));
  }, []);

  const reorderClips = useCallback((fromIndex: number, toIndex: number) => {
    setState(prev => {
      const newClips = [...prev.clips];
      const [removed] = newClips.splice(fromIndex, 1);
      newClips.splice(toIndex, 0, removed);
      return { ...prev, clips: newClips };
    });
  }, []);

  const setCurrentTime = useCallback((time: number) => {
    setState(prev => ({ ...prev, currentTime: Math.max(0, Math.min(time, totalDuration)) }));
  }, [totalDuration]);

  const setZoom = useCallback((zoom: number) => {
    setState(prev => ({ ...prev, zoom: Math.max(0.5, Math.min(zoom, 4)) }));
  }, []);

  const stopPlayback = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const findClipAtTime = useCallback((time: number): { clip: Clip; clipTime: number } | null => {
    let accumulated = 0;
    for (const clip of state.clips) {
      const clipDuration = clip.endTime - clip.startTime;
      if (time >= accumulated && time < accumulated + clipDuration) {
        return {
          clip,
          clipTime: clip.startTime + (time - accumulated),
        };
      }
      accumulated += clipDuration;
    }
    return null;
  }, [state.clips]);

  const updatePreviewRef = useRef<(() => void) | null>(null);

  const updatePreview = useCallback(() => {
    if (!previewVideoRef.current || !state.isPlaying) return;

    const now = performance.now();
    const elapsed = (now - playStartTimeRef.current) / 1000;

    const result = findClipAtTime(state.currentTime + elapsed);
    
    if (!result) {
      stopPlayback();
      setState(prev => ({ ...prev, currentTime: 0 }));
      return;
    }

    const { clip, clipTime } = result;
    const video = previewVideoRef.current;

    if (video.src !== URL.createObjectURL(clip.file)) {
      video.src = URL.createObjectURL(clip.file);
    }

    if (Math.abs(video.currentTime - clipTime) > 0.1) {
      video.currentTime = clipTime;
    }

    if (video.paused) {
      video.play().catch(() => {});
    }

    setState(prev => ({ ...prev, currentTime: prev.currentTime + elapsed }));
    playStartTimeRef.current = now;
    playClipTimeRef.current = clipTime;

    animationFrameRef.current = requestAnimationFrame(() => updatePreviewRef.current?.());
  }, [state.isPlaying, state.currentTime, findClipAtTime, stopPlayback]);

  useEffect(() => {
    updatePreviewRef.current = updatePreview;
  }, [updatePreview]);

  const play = useCallback(() => {
    if (state.clips.length === 0) return;
    
    playStartTimeRef.current = performance.now();
    
    const result = findClipAtTime(state.currentTime);
    if (result) {
      playClipTimeRef.current = result.clipTime;
    }

    setState(prev => ({ ...prev, isPlaying: true }));
  }, [state.clips.length, state.currentTime, findClipAtTime]);

  const pause = useCallback(() => {
    stopPlayback();
    if (previewVideoRef.current) {
      previewVideoRef.current.pause();
    }
  }, [stopPlayback]);

  const seek = useCallback((time: number) => {
    pause();
    const clampedTime = Math.max(0, Math.min(time, totalDuration));
    setState(prev => ({ ...prev, currentTime: clampedTime }));
    
    const result = findClipAtTime(clampedTime);
    if (result && previewVideoRef.current) {
      const { clip, clipTime } = result;
      previewVideoRef.current.src = URL.createObjectURL(clip.file);
      previewVideoRef.current.currentTime = clipTime;
    }
  }, [pause, totalDuration, findClipAtTime]);

  useEffect(() => {
    if (state.isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updatePreview);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state.isPlaying, updatePreview]);

  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, [stopPlayback]);

  return {
    state,
    totalDuration,
    previewVideoRef,
    addClips,
    removeClip,
    selectClip,
    updateClip,
    reorderClips,
    setCurrentTime,
    setZoom,
    play,
    pause,
    seek,
  };
};
