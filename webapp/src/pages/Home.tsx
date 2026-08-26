import { Link } from 'react-router-dom';
import { ArrowRight, Video, Camera, Zap } from 'lucide-react';

export function Home() {
  return (
    <div style={{ paddingTop: '60px', paddingBottom: '120px' }}>
      {/* Background blobs */}
      <div className="bg-gradient-blob blob-1"></div>
      <div className="bg-gradient-blob blob-2"></div>

      <div className="container" style={{ textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '100px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', marginBottom: '32px', color: 'var(--text-secondary)' }}>
          <span style={{ display: 'block', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></span>
          YOLOv8 Edge Inference Powered
        </div>
        
        <h1 style={{ fontSize: '4.5rem', marginBottom: '24px', letterSpacing: '-0.02em' }}>
          Real-Time <br />
          <span className="text-gradient">Traffic & Crowd Flow</span>
          <br />Analysis.
        </h1>
        
        <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 48px', lineHeight: 1.6 }}>
          A state-of-the-art computer vision system that runs entirely in your browser. Upload images, stream videos, or use your webcam for zero-latency traffic detection and lane density classification.
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '80px' }}>
          <Link to="/analysis">
            <button className="btn-primary" style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
              Launch Workspace <ArrowRight size={20} />
            </button>
          </Link>
          <a href="https://github.com/maryamtahir9/Real-Time-Trafic-Detection-and-Traffic-Flow-Classification-System" target="_blank" rel="noreferrer">
            <button className="btn-secondary" style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
              View Source
            </button>
          </a>
        </div>

        {/* Feature Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', textAlign: 'left' }}>
          
          <div className="glass-card" style={{ padding: '32px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <Camera color="var(--accent-primary)" size={24} />
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>Image Analysis</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Upload static traffic images. Our model instantly detects vehicles, counts lane density, and determines traffic intensity.</p>
          </div>

          <div className="glass-card" style={{ padding: '32px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <Video color="var(--accent-secondary)" size={24} />
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>Video Processing</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Upload dashcam or drone footage. We process each frame locally, allowing you to export the analyzed video with bounding boxes.</p>
          </div>

          <div className="glass-card" style={{ padding: '32px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <Zap color="#10b981" size={24} />
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>Live Webcam</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Point your camera at a street. The WebGL-accelerated YOLO model performs real-time bounding box detection directly in-browser.</p>
          </div>

        </div>



      </div>
    </div>
  );
}
