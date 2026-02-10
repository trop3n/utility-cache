import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './components/Home'
import TextCaseConverter from './tools/TextCaseConverter/TextCaseConverter'
import ImageResizer from './tools/ImageResizer/ImageResizer'
import QRCodeGenerator from './tools/QRCodeGenerator/QRCodeGenerator'
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
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
