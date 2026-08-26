import { useRef, useState } from 'react';
import { TrafficAnalyzer } from '../../lib/trafficAnalysis';
import { Upload, Loader2 } from 'lucide-react';

export function ImageUploader({ analyzer }: { analyzer: TrafficAnalyzer }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const [debugState, setDebugState] = useState('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageSrc(url);
      setDebugState('');
    }
  };

  const handleImageLoad = async (img: HTMLImageElement) => {
    setProcessing(true);
    setDebugState('Running inference...');
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas to match image dimensions
    canvas.width = img.width;
    canvas.height = img.height;
    
    // Draw original image
    ctx.drawImage(img, 0, 0);

    // Run inference
    const boxes = await analyzer.runInference(ctx, canvas.width, canvas.height);
    setDebugState(analyzer.lastDebugInfo);
    
    // Draw polygons and results
    if (boxes) {
      analyzer.drawPolygons(ctx, canvas.width, canvas.height);
      analyzer.drawResults(ctx, boxes, canvas.width);
    }
    
    setProcessing(false);
  };

  return (
    <div>
      <h2 style={{ marginBottom: '16px', fontSize: '1.5rem' }}>Image Analysis</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        Upload a traffic image to detect vehicles, measure lane density, and classify traffic flow instantly.
      </p>

      {!imageSrc ? (
        <label style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '300px', border: '2px dashed var(--glass-border)', borderRadius: '12px',
          cursor: 'pointer', background: 'var(--glass-bg)', transition: 'var(--transition)'
        }}>
          <Upload size={48} color="var(--accent-primary)" style={{ marginBottom: '16px' }} />
          <span style={{ fontSize: '1.2rem', fontWeight: 500 }}>Click to upload image</span>
          <span style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>JPEG, PNG, WEBP</span>
          <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
        </label>
      ) : (
        <div className="canvas-wrapper">
          <img 
            src={imageSrc} 
            alt="Uploaded" 
            style={{ display: 'none' }} 
            onLoad={(e) => handleImageLoad(e.currentTarget)} 
          />
          <canvas ref={canvasRef} style={{ position: 'relative', width: '100%', borderRadius: '12px', border: '1px solid var(--glass-border)' }}></canvas>
          {processing && (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(4px)', color: 'white', zIndex: 20
            }}>
              <Loader2 size={48} className="spin" color="var(--accent-primary)" />
              <span style={{ fontSize: '1.5rem', fontWeight: 600 }}>Analyzing Image...</span>
            </div>
          )}
          
          <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.8rem' }}>
            Debug: {debugState || 'No data'}
          </div>

          <div style={{ marginTop: '24px', display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button className="btn-secondary" onClick={() => setImageSrc(null)}>Upload Another Image</button>
            <button className="btn-primary" onClick={() => {
              const link = document.createElement('a');
              link.download = 'analyzed_traffic.png';
              link.href = canvasRef.current?.toDataURL() || '';
              link.click();
            }}>Download Result</button>
          </div>
        </div>
      )}
    </div>
  );
}
