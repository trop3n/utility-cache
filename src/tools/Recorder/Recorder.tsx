import React, { useState, useRef } from 'react';

const Recorder: React.FC = () => {
  const [recording, setRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startRecording = async (type: 'screen' | 'camera') => {
    try {
      const newStream = type === 'screen' 
        ? await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
        : await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      
      setStream(newStream);
      if (videoRef.current) videoRef.current.srcObject = newStream;

      const recorder = new MediaRecorder(newStream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setDownloadUrl(URL.createObjectURL(blob));
        newStream.getTracks().forEach(track => track.stop());
        setStream(null);
      };

      recorder.start();
      setRecording(true);
      setDownloadUrl(null);
    } catch (err) {
      console.error("Error starting recording:", err);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
      <h2>Screen & Video Recorder</h2>
      <div style={{ marginBottom: '20px', gap: '10px', display: 'flex', justifyContent: 'center' }}>
        {!recording ? (
          <>
            <button onClick={() => startRecording('screen')} className="primary">Record Screen</button>
            <button onClick={() => startRecording('camera')} className="primary">Record Camera</button>
          </>
        ) : (
          <button onClick={stopRecording} style={{ backgroundColor: '#e74c3c', color: 'white' }}>Stop Recording</button>
        )}
      </div>

      <video ref={videoRef} autoPlay muted style={{ width: '100%', maxWidth: '600px', border: '1px solid #444', borderRadius: '8px', display: stream ? 'block' : 'none', margin: '0 auto' }} />
      
      {downloadUrl && (
        <div style={{ marginTop: '20px' }}>
          <p>Recording saved!</p>
          <a href={downloadUrl} download="recording.webm" className="button success" style={{ textDecoration: 'none', padding: '10px 20px', borderRadius: '8px', display: 'inline-block' }}>
            Download Recording
          </a>
        </div>
      )}
    </div>
  );
};

export default Recorder;
