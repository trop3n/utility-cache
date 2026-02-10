import React, { useState } from 'react';

const TextCaseConverter: React.FC = () => {
  const [text, setText] = useState('');

  const handleUpperCase = () => setText(text.toUpperCase());
  const handleLowerCase = () => setText(text.toLowerCase());
  const handleTitleCase = () => {
    setText(
      text
        .toLowerCase()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    );
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>Text Case Converter</h2>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={12}
        placeholder="Enter text here..."
        style={{ marginBottom: '20px' }}
      />
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={handleUpperCase} className="primary">UPPERCASE</button>
        <button onClick={handleLowerCase} className="primary">lowercase</button>
        <button onClick={handleTitleCase} className="primary">Title Case</button>
        <button onClick={() => setText('')} style={{ marginLeft: 'auto' }}>Clear</button>
      </div>
    </div>
  );
};

export default TextCaseConverter;
