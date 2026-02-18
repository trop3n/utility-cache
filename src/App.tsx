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
import AudioJoiner from './tools/AudioJoiner/AudioJoiner'
import AudioSpeedPitch from './tools/AudioSpeedPitch/AudioSpeedPitch'
import AudioReverse from './tools/AudioReverse/AudioReverse'
import VoiceRecorder from './tools/VoiceRecorder/VoiceRecorder'
import Equalizer from './tools/Equalizer/Equalizer'
import PDFMerge from './tools/PDFMerge/PDFMerge'
import PDFSplit from './tools/PDFSplit/PDFSplit'
import PDFRotate from './tools/PDFRotate/PDFRotate'
import ImagesToPDF from './tools/ImagesToPDF/ImagesToPDF'
import PDFToImages from './tools/PDFToImages/PDFToImages'
import PDFProtect from './tools/PDFProtect/PDFProtect'
import PDFUnlock from './tools/PDFUnlock/PDFUnlock'
import PDFPageNumber from './tools/PDFPageNumber/PDFPageNumber'
import VideoMerger from './tools/VideoMerger/VideoMerger'
import VideoCropper from './tools/VideoCropper/VideoCropper'
import ImageConverter from './tools/ImageConverter/ImageConverter'
import ArchiveExtractor from './tools/ArchiveTools/ArchiveExtractor'
import HapEncoder from './tools/HapEncoder/HapEncoder'
import VideoEditor from './tools/VideoEditor/VideoEditor'
import DocumentConverter from './tools/DocumentConverter/DocumentConverter'
import FontConverter from './tools/FontConverter/FontConverter'
import EbookConverter from './tools/EbookConverter/EbookConverter'
import ExcelToPDF from './tools/ExcelToPDF/ExcelToPDF'
import PDFToOffice from './tools/PDFToOffice/PDFToOffice'
import VideoUrlDownloader from './tools/VideoUrlDownloader/VideoUrlDownloader'
import AddAudioToVideo from './tools/AddAudioToVideo/AddAudioToVideo'
import FontConverterTool from './tools/FontConverterTool/FontConverterTool'
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
          <Route path="/video-merger" element={<VideoMerger />} />
          <Route path="/video-trimmer" element={<VideoTrimmer />} />
          <Route path="/video-cropper" element={<VideoCropper />} />
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
          <Route path="/audio-joiner" element={<AudioJoiner />} />
          <Route path="/audio-speed-pitch" element={<AudioSpeedPitch />} />
          <Route path="/audio-reverse" element={<AudioReverse />} />
          <Route path="/voice-recorder" element={<VoiceRecorder />} />
          <Route path="/equalizer" element={<Equalizer />} />
          <Route path="/image-converter" element={<ImageConverter />} />
          <Route path="/archive-extractor" element={<ArchiveExtractor />} />
          <Route path="/hap-encoder" element={<HapEncoder />} />
          <Route path="/video-editor" element={<VideoEditor />} />
          <Route path="/document-converter" element={<DocumentConverter />} />
          <Route path="/font-converter" element={<FontConverter />} />
          <Route path="/ebook-converter" element={<EbookConverter />} />
          <Route path="/excel-to-pdf" element={<ExcelToPDF />} />
          <Route path="/pdf-to-office" element={<PDFToOffice />} />
          <Route path="/pdf-merge" element={<PDFMerge />} />
          <Route path="/pdf-split" element={<PDFSplit />} />
          <Route path="/pdf-rotate" element={<PDFRotate />} />
          <Route path="/images-to-pdf" element={<ImagesToPDF />} />
          <Route path="/pdf-to-images" element={<PDFToImages />} />
          <Route path="/pdf-protect" element={<PDFProtect />} />
          <Route path="/pdf-unlock" element={<PDFUnlock />} />
          <Route path="/pdf-page-number" element={<PDFPageNumber />} />
          <Route path="/video-downloader" element={<VideoUrlDownloader />} />
          <Route path="/add-audio-to-video" element={<AddAudioToVideo />} />
          <Route path="/font-converter-tool" element={<FontConverterTool />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
