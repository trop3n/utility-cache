import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();

  const tools = [
    {
      path: '/text-converter',
      title: 'Text Case Converter',
      description: 'Change text to UPPERCASE, lowercase, or Title Case.',
      icon: 'abc'
    },
    {
      path: '/image-resizer',
      title: 'Image Resizer',
      description: 'Resize images while maintaining aspect ratio.',
      icon: 'img'
    },
    {
      path: '/qrcode',
      title: 'QR Code Generator',
      description: 'Create custom QR codes for URLs or text.',
      icon: 'qr'
    },
    {
      path: '/video-converter',
      title: 'Video Converter',
      description: 'Convert video files to MP4, WebM, MKV, or GIF.',
      icon: 'video'
    },
    {
      path: '/video-trimmer',
      title: 'Video Trimmer',
      description: 'Trim or cut video clips by specifying start and end times.',
      icon: 'cut'
    },
    {
      path: '/video-muter',
      title: 'Mute Video',
      description: 'Remove audio track from video files.',
      icon: 'mute'
    },
    {
      path: '/video-to-audio',
      title: 'Video to Audio',
      description: 'Extract audio from video and save as MP3 or WAV.',
      icon: 'music'
    },
    {
      path: '/video-compressor',
      title: 'Video Compressor',
      description: 'Reduce video file size by adjusting quality settings.',
      icon: 'compress'
    },
    {
      path: '/video-speed',
      title: 'Video Speed',
      description: 'Speed up or slow down video playback.',
      icon: 'fast-forward'
    },
    {
      path: '/video-resizer',
      title: 'Video Resizer',
      description: 'Change video dimensions or aspect ratio.',
      icon: 'expand'
    },
    {
      path: '/video-rotator',
      title: 'Video Rotator',
      description: 'Rotate or flip video orientation.',
      icon: 'rotate'
    },
    {
      path: '/recorder',
      title: 'Screen & Camera Recorder',
      description: 'Record your screen or webcam directly from the browser.',
      icon: 'record'
    },
    {
      path: '/audio-cutter',
      title: 'Audio Cutter',
      description: 'Trim or cut audio clips.',
      icon: 'music'
    },
    {
      path: '/audio-converter',
      title: 'Audio Converter',
      description: 'Convert audio between MP3, WAV, OGG, etc.',
      icon: 'refresh'
    },
    {
      path: '/volume-changer',
      title: 'Volume Changer',
      description: 'Increase or decrease audio volume.',
      icon: 'volume-up'
    },
    {
      path: '/audio-joiner',
      title: 'Audio Joiner',
      description: 'Merge multiple audio files into one.',
      icon: 'plus'
    },
    {
      path: '/audio-speed-pitch',
      title: 'Audio Speed & Pitch',
      description: 'Change playback speed and pitch of audio.',
      icon: 'music'
    },
    {
      path: '/audio-reverse',
      title: 'Reverse Audio',
      description: 'Play audio backwards.',
      icon: 'undo'
    },
    {
      path: '/voice-recorder',
      title: 'Voice Recorder',
      description: 'Record audio from microphone.',
      icon: 'microphone'
    },
    {
      path: '/equalizer',
      title: 'Audio Equalizer',
      description: 'Adjust frequencies with a 10-band equalizer.',
      icon: 'sliders'
    },
    {
      path: '/pdf-merge',
      title: 'PDF Merge',
      description: 'Combine multiple PDF files into one.',
      icon: 'file-pdf'
    },
    {
      path: '/pdf-split',
      title: 'PDF Split',
      description: 'Extract pages or split PDF into single pages.',
      icon: 'file-pdf'
    },
    {
      path: '/pdf-rotate',
      title: 'PDF Rotate',
      description: 'Rotate PDF pages.',
      icon: 'rotate'
    },
    {
      path: '/images-to-pdf',
      title: 'Images to PDF',
      description: 'Convert JPG/PNG images into a PDF document.',
      icon: 'image'
    },
    {
      path: '/pdf-to-images',
      title: 'PDF to Images',
      description: 'Convert PDF pages into PNG images.',
      icon: 'file-image'
    }
  ];

  return (
    <div className="home-grid">
      {tools.map((tool) => (
        <div
          key={tool.path}
          className="tool-card"
          onClick={() => navigate(tool.path)}
        >
          <h3>{tool.title}</h3>
          <p>{tool.description}</p>
        </div>
      ))}
    </div>
  );
};

export default Home;
