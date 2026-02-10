import React, { useState, useRef } from 'react';

const VoiceRecorder: React.FC = () => {
  const [recording, setRecording] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setDownloadUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
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
      <h2>Voice Recorder</h2>
      <div style={{ marginTop: '40px', marginBottom: '20px' }}>
        {!recording ? (
          <button onClick={startRecording} className="primary" style={{ borderRadius: '50%', width: '80px', height: '80px', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', backgroundColor: '#e74c3c' }}>
             🎤
          </button>
        ) : (
          <button onClick={stopRecording} style={{ borderRadius: '50%', width: '80px', height: '80px', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', backgroundColor: '#333', border: '2px solid #e74c3c', color: 'white' }}>
            ⬛
          </button>
        )}
      </div>
      
      <p>{recording ? 'Recording... click stop when done.' : 'Click the microphone to start recording.'}</p>

      {downloadUrl && (
        <div style={{ marginTop: '20px' }}>
          <h3>Recording Finished</h3>
          <audio controls src={downloadUrl} style={{ marginTop: '10px', marginBottom: '10px' }} />
          <br />
          <a href={downloadUrl} download="recording.webm" className="button success" style={{ textDecoration: 'none', padding: '10px 20px', borderRadius: '8px', display: 'inline-block' }}>
            Download Recording
          </a>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
