import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './components/Home'
import TextCaseConverter from './tools/TextCaseConverter/TextCaseConverter'
import ImageResizer from './tools/ImageResizer/ImageResizer'
import QRCodeGenerator from './tools/QRCodeGenerator/QRCodeGenerator'
import VideoConverter from './tools/VideoConverter/VideoConverter'
import VideoTrimmer from './tools/VideoTrimmer/VideoTrimmer'
import VideoMuter from './tools/VideoMuter/VideoMuter'
import VideoToAudio from './tools/VideoToAudio/VideoToAudio'
import VideoCompressor from './tools/VideoCompressor/VideoCompressor'
import VideoSpeedChanger from './tools/VideoSpeedChanger/VideoSpeedChanger'
import VideoResizer from './tools/VideoResizer/VideoResizer'
import VideoRotator from './tools/VideoRotator/VideoRotator'
import Recorder from './tools/Recorder/Recorder'
import AudioCutter from './tools/AudioCutter/AudioCutter'
import AudioConverter from './tools/AudioConverter/AudioConverter'
import VolumeChanger from './tools/VolumeChanger/VolumeChanger'
import './App.css'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/text-converter" element={<TextCaseConverter />} />
          <Route path="/image-resizer" element={<ImageResizer />} />
          <Route path="/qrcode" element={<QRCodeGenerator />} />
          <Route path="/video-converter" element={<VideoConverter />} />
          <Route path="/video-trimmer" element={<VideoTrimmer />} />
          <Route path="/video-muter" element={<VideoMuter />} />
          <Route path="/video-to-audio" element={<VideoToAudio />} />
          <Route path="/video-compressor" element={<VideoCompressor />} />
          <Route path="/video-speed" element={<VideoSpeedChanger />} />
          <Route path="/video-resizer" element={<VideoResizer />} />
          <Route path="/video-rotator" element={<VideoRotator />} />
          <Route path="/recorder" element={<Recorder />} />
          <Route path="/audio-cutter" element={<AudioCutter />} />
          <Route path="/audio-converter" element={<AudioConverter />} />
          <Route path="/volume-changer" element={<VolumeChanger />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
