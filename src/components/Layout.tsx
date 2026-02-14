import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (path.startsWith('/#')) {
      e.preventDefault();
      const targetId = path.slice(2); // Remove '/#' to get the id
      
      // If not on home page, navigate to home first
      if (location.pathname !== '/') {
        navigate('/');
        // Wait for navigation to complete, then scroll
        setTimeout(() => {
          const element = document.getElementById(targetId);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      } else {
        // Already on home page, just scroll
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
  };

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/#video', label: 'Video' },
    { path: '/#audio', label: 'Audio' },
    { path: '/#image', label: 'Image' },
    { path: '/#pdf', label: 'PDF' },
    { path: '/#converters', label: 'Converters' },
    { path: '/#utilities', label: 'Utilities' },
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
              onClick={(e) => handleNavClick(e, item.path)}
              style={{
                color: location.pathname === item.path && !item.path.startsWith('/#') ? '#646cff' : 'inherit',
                textDecoration: 'none',
                fontWeight: location.pathname === item.path && !item.path.startsWith('/#') ? 'bold' : 'normal',
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
