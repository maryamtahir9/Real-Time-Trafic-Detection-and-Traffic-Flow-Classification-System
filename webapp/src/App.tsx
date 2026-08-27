import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Home } from './pages/Home';
import { Analysis } from './pages/Analysis';
import { Overview } from './pages/Overview';
import { Activity, Zap } from 'lucide-react';

function App() {
  return (
    <Router>
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Premium Header */}
        <header style={{ padding: '24px 0', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--glass-border)' }}>
          <div className="container header-container">
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ background: 'var(--accent-gradient)', padding: '8px', borderRadius: '12px' }}>
                <Activity color="white" size={24} />
              </div>
              <h2 className="text-gradient" style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>CrowdSight</h2>
            </Link>
            
            <nav className="header-nav">
              <Link to="/overview" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, transition: 'var(--transition)' }}>Overview</Link>
              <Link to="/analysis">
                <button className="btn-primary">
                  Launch Analysis <Zap size={18} />
                </button>
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Routing */}
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/overview" element={<Overview />} />
          </Routes>
        </main>
        
        {/* Detailed Footer */}
        <footer style={{ padding: '48px 0 24px', borderTop: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.4)', marginTop: 'auto' }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '32px', marginBottom: '48px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Activity color="var(--accent-primary)" size={24} />
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>CrowdSight</h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                  A state-of-the-art computer vision system running entirely in your browser. Real-time vehicle detection and traffic flow classification powered by YOLOv8 and WebAssembly.
                </p>
              </div>
              
              <div>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '16px', color: '#fff' }}>Quick Links</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <li><Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'var(--transition)' }}>Home</Link></li>
                  <li><Link to="/overview" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'var(--transition)' }}>How It Works</Link></li>
                  <li><Link to="/analysis" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'var(--transition)' }}>Analysis Workspace</Link></li>
                  <li><a href="https://github.com/maryamtahir9/Real-Time-Trafic-Detection-and-Traffic-Flow-Classification-System" target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'var(--transition)' }}>GitHub Repository</a></li>
                </ul>
              </div>

              <div>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '16px', color: '#fff' }}>Developer</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '16px' }}>
                  Designed and developed by <strong>Maryam Tahir</strong>.
                </p>
                <a href="https://www.maryamtahir.tech" target="_blank" rel="noreferrer">
                  <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                    Visit Portfolio
                  </button>
                </a>
              </div>
            </div>
            
            <div style={{ textAlign: 'center', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                &copy; {new Date().getFullYear()} CrowdSight. All rights reserved. Developed by Maryam Tahir.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
