import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/text-converter', label: 'Text' },
    { path: '/image-resizer', label: 'Image' },
    { path: '/qrcode', label: 'QR' },
    { path: '/video-converter', label: 'Video' },
  ];

  return (
    <div className="app-container">
      <header className="app-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Utility Suite</Link>
        </h1>
        <nav style={{ display: 'flex', gap: '20px' }}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                color: location.pathname === item.path ? '#646cff' : 'inherit',
                textDecoration: 'none',
                fontWeight: location.pathname === item.path ? 'bold' : 'normal',
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="app-main">
        {children}
      </main>

      <footer style={{ textAlign: 'center', padding: '20px', borderTop: '1px solid #444', marginTop: 'auto', fontSize: '0.8rem', color: '#888' }}>
        Utility Suite - Desktop & Web Toolset
      </footer>
    </div>
  );
};

export default Layout;
