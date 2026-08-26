import { useState, useEffect } from 'react';
import { ImageUploader } from '../components/Analysis/ImageUploader';
import { VideoProcessor } from '../components/Analysis/VideoProcessor';
import { WebcamStream } from '../components/Analysis/WebcamStream';
import { TrafficAnalyzer } from '../lib/trafficAnalysis';
import { Camera, Video, Zap, Loader2 } from 'lucide-react';

export function Analysis() {
  const [activeTab, setActiveTab] = useState<'image' | 'video' | 'webcam'>('image');
  const [analyzer] = useState(() => new TrafficAnalyzer());
  const [modelLoaded, setModelLoaded] = useState(false);

  useEffect(() => {
    async function init() {
      await analyzer.loadModel();
      setModelLoaded(true);
    }
    init();
  }, [analyzer]);

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Analysis Workspace</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Select an input method to run the traffic flow model.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: modelLoaded ? '#10b981' : '#f59e0b', boxShadow: `0 0 10px ${modelLoaded ? '#10b981' : '#f59e0b'}` }}></div>
          <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>
            {modelLoaded ? 'YOLOv8 Engine Ready' : 'Loading Model...'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
        <TabButton active={activeTab === 'image'} onClick={() => setActiveTab('image')} icon={<Camera size={20} />} label="Image Upload" />
        <TabButton active={activeTab === 'video'} onClick={() => setActiveTab('video')} icon={<Video size={20} />} label="Video Upload" />
        <TabButton active={activeTab === 'webcam'} onClick={() => setActiveTab('webcam')} icon={<Zap size={20} />} label="Live Webcam" />
      </div>

      <div className="glass-panel" style={{ padding: '32px', minHeight: '600px' }}>
        {!modelLoaded ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '400px', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', gap: '16px' }}>
            <Loader2 size={48} className="spin" color="var(--accent-primary)" />
            <span style={{ fontSize: '1.2rem' }}>Loading YOLOv8 AI Model...</span>
            <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>This may take a few seconds on the first run.</span>
          </div>
        ) : (
          <>
            {activeTab === 'image' && <ImageUploader analyzer={analyzer} />}
            {activeTab === 'video' && <VideoProcessor analyzer={analyzer} />}
            {activeTab === 'webcam' && <WebcamStream analyzer={analyzer} />}
          </>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '12px 24px', borderRadius: '8px', border: 'none',
        background: active ? 'var(--glass-bg)' : 'transparent',
        color: active ? 'white' : 'var(--text-secondary)',
        borderBottom: active ? '2px solid var(--accent-primary)' : '2px solid transparent',
        cursor: 'pointer', transition: 'var(--transition)',
        fontSize: '1rem', fontWeight: 500
      }}
    >
      {icon} {label}
    </button>
  );
}
