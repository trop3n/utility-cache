export interface Clip {
  id: string;
  file: File;
  name: string;
  duration: number;
  startTime: number;
  endTime: number;
  offset: number;
  thumbnail?: string;
}

export interface EditorState {
  clips: Clip[];
  selectedClipId: string | null;
  currentTime: number;
  isPlaying: boolean;
  zoom: number;
}

export interface DragItem {
  type: 'clip';
  clipId: string;
}
