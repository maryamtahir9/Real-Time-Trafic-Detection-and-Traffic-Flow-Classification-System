import { useRef, useState, useEffect } from 'react';
import { TrafficAnalyzer } from '../../lib/trafficAnalysis';
import { Camera, StopCircle } from 'lucide-react';

export function WebcamStream({ analyzer }: { analyzer: TrafficAnalyzer }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streamActive, setStreamActive] = useState(false);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' } 
      });
      
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        streamRef.current = stream;
        video.play();
        setStreamActive(true);
      }
    } catch (err) {
      console.error("Error accessing webcam:", err);
      alert("Could not access the webcam. Please ensure permissions are granted.");
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const processFrame = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.paused || video.ended) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw current webcam frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Run inference on the frame
    const boxes = await analyzer.runInference(ctx, canvas.width, canvas.height);
    
    // Draw results
    if (boxes) {
      analyzer.drawPolygons(ctx, canvas.width, canvas.height);
      analyzer.drawResults(ctx, boxes, canvas.width, canvas.height);
    }

    // Schedule next frame
    animationRef.current = requestAnimationFrame(processFrame);
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    processFrame();
  };

  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  return (
    <div>
      <h2 style={{ marginBottom: '16px', fontSize: '1.5rem' }}>Live Webcam Detection</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        Stream video directly from your webcam. The YOLO model will analyze the feed in real-time, detecting traffic and flow intensity.
      </p>

      {!streamActive ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '300px', border: '1px solid var(--glass-border)', borderRadius: '12px',
          background: 'var(--glass-bg)'
        }}>
          <Camera size={48} color="#10b981" style={{ marginBottom: '16px' }} />
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Ready to capture live traffic footage</p>
          <button className="btn-primary" onClick={startWebcam} style={{ background: '#10b981' }}>
            Enable Webcam
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="canvas-wrapper">
            <video 
              ref={videoRef} 
              style={{ display: 'none' }} 
              onLoadedMetadata={handleLoadedMetadata}
              playsInline
            />
            {/* The canvas displays both the webcam frame and the overlays */}
            <canvas ref={canvasRef} style={{ width: '100%', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'block' }}></canvas>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button className="btn-primary" onClick={stopWebcam} style={{ background: '#ef4444' }}>
              <StopCircle size={20} /> Stop Stream
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
