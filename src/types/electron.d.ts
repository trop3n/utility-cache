export {};

declare global {
  interface Window {
    electronAPI?: {
      ffmpeg: {
        checkAvailable: () => Promise<{
          available: boolean;
          hasHap: boolean;
          path: string;
        }>;
        writeTempFile: (data: ArrayBuffer) => Promise<string>;
        readTempFile: (filePath: string) => Promise<ArrayBuffer>;
        deleteTempFile: (filePath: string) => Promise<void>;
        encodeWithFile: (args: {
          inputPath: string;
          ffmpegArgs: string[];
          outputExtension: string;
        }) => Promise<{ success: boolean; outputPath?: string; error?: string }>;
        onProgress: (
          callback: (data: { stderr: string }) => void
        ) => () => void;
      };
    };
  }
}
