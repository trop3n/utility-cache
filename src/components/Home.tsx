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
