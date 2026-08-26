import { useRef, useState, useEffect } from 'react';
import { TrafficAnalyzer } from '../../lib/trafficAnalysis';
import { Upload, Play, Pause, Loader2, Download } from 'lucide-react';

export function VideoProcessor({ analyzer }: { analyzer: TrafficAnalyzer }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  
  // States: 'idle' | 'generating' | 'completed'
  const [status, setStatus] = useState<'idle' | 'generating' | 'completed'>('idle');
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // In-memory array of processed frame ImageBitmaps
  const framesRef = useRef<ImageBitmap[]>([]);
  const playbackLoopRef = useRef<number | null>(null);
  const currentFrameIdx = useRef(0);
  
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setStatus('idle');
      setProgress(0);
      framesRef.current = [];
      setIsPlaying(false);
    }
  };

  const generateVideo = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setStatus('generating');
    setProgress(0);
    framesRef.current = [];
    currentFrameIdx.current = 0;

    // Ensure video is ready to seek
    video.pause();
    
    // We will extract frames at 15 FPS to save memory and processing time.
    const FPS = 15;
    const duration = video.duration || 10;
    const frameInterval = 1 / FPS;
    
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = canvas.width;
    offscreenCanvas.height = canvas.height;
    const ctx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
    
    // Helper function to await a `seeked` event
    const seekVideo = (time: number) => {
      return new Promise<void>((resolve) => {
        const onSeeked = () => {
          video.removeEventListener('seeked', onSeeked);
          resolve();
        };
        video.addEventListener('seeked', onSeeked);
        video.currentTime = time;
      });
    };

    if (!ctx) return;
    
    let currentTime = 0;
    while (currentTime <= duration) {
      // Step 1: Seek video
      await seekVideo(currentTime);
      
      // Step 2: Draw original frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Step 3: Run inference
      const boxes = await analyzer.runInference(ctx, canvas.width, canvas.height);
      
      // Step 4: Draw boxes
      if (boxes && boxes.length > 0) {
        analyzer.drawPolygons(ctx, canvas.width, canvas.height);
        analyzer.drawResults(ctx, boxes, canvas.width, canvas.height);
      } else {
        analyzer.drawResults(ctx, [], canvas.width, canvas.height);
      }
      
      // Step 4.5: Draw to main canvas so the user can see the progress live!
      const mainCtx = canvas.getContext('2d');
      if (mainCtx) {
        mainCtx.drawImage(offscreenCanvas, 0, 0);
      }
      
      // Step 5: Save processed frame
      const bitmap = await createImageBitmap(offscreenCanvas);
      framesRef.current.push(bitmap);
      
      // Update progress
      setProgress(Math.round((currentTime / duration) * 100));
      
      currentTime += frameInterval;
    }
    
    setStatus('completed');
    setProgress(100);
    
    // Automatically start playing the result
    togglePlayResult(true);
  };
  
  const togglePlayResult = (forcePlay?: boolean) => {
    const shouldPlay = forcePlay !== undefined ? forcePlay : !isPlaying;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (shouldPlay) {
      setIsPlaying(true);
      
      const renderPlayback = () => {
        if (framesRef.current.length === 0) return;
        
        ctx.drawImage(framesRef.current[currentFrameIdx.current], 0, 0);
        currentFrameIdx.current = (currentFrameIdx.current + 1) % framesRef.current.length;
        
        // Accurate 15 FPS playback
        playbackLoopRef.current = window.setTimeout(() => {
          requestAnimationFrame(renderPlayback);
        }, 1000 / 15);
      };
      
      renderPlayback();
    } else {
      setIsPlaying(false);
      if (playbackLoopRef.current) {
        clearTimeout(playbackLoopRef.current);
      }
    }
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    setTimeout(() => {
        const ctx = canvas.getContext('2d');
        if(ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (playbackLoopRef.current) {
        clearTimeout(playbackLoopRef.current);
      }
    };
  }, []);

  return (
    <div>
      <h2 style={{ marginBottom: '16px', fontSize: '1.5rem' }}>Video Processing Engine</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        Upload a pre-recorded traffic video. We process the video completely offline in your browser, generating an accurate frame-by-frame analysis report.
      </p>

      {!videoSrc ? (
        <label style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '300px', border: '2px dashed var(--glass-border)', borderRadius: '12px',
          cursor: 'pointer', background: 'var(--glass-bg)', transition: 'var(--transition)'
        }}>
          <Upload size={48} color="var(--accent-secondary)" style={{ marginBottom: '16px' }} />
          <span style={{ fontSize: '1.2rem', fontWeight: 500 }}>Click to upload video</span>
          <span style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>MP4, WEBM, AVI</span>
          <input type="file" accept="video/*" onChange={handleVideoUpload} style={{ display: 'none' }} />
        </label>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="canvas-wrapper">
            <video 
              ref={videoRef} 
              src={videoSrc} 
              style={{ display: 'none' }} 
              onLoadedMetadata={handleLoadedMetadata}
              muted
              playsInline
            />
            <canvas ref={canvasRef} style={{ position: 'relative', width: '100%', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'block', backgroundColor: '#000' }}></canvas>
            
            {status === 'generating' && (
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(8px)', color: 'white', zIndex: 20, padding: '24px', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <Loader2 size={24} className="spin" color="var(--accent-primary)" />
                  <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>Generating AI Video...</span>
                </div>
                
                <div style={{ width: '80%', height: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent-gradient)', transition: 'width 0.3s ease' }}></div>
                </div>
                <span style={{ marginTop: '8px', fontSize: '1rem', color: 'var(--accent-primary)' }}>{progress}% Complete</span>
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', alignItems: 'center' }}>
            {status === 'idle' && (
              <button className="btn-primary" onClick={generateVideo} style={{ minWidth: '220px' }}>
                <Play size={20} /> Generate Analysis Video
              </button>
            )}
            
            {status === 'completed' && (
              <>
                <button className="btn-primary" onClick={() => togglePlayResult()} style={{ minWidth: '120px' }}>
                  {isPlaying ? <><Pause size={20} /> Pause</> : <><Play size={20} /> Play</>}
                </button>
                <button className="btn-primary" style={{ background: '#10b981' }} onClick={() => {
                  alert('Video generation complete! You can view the playback loop above.');
                }}>
                  <Download size={20} /> Finished
                </button>
              </>
            )}
            
            <button className="btn-secondary" onClick={() => {
              setVideoSrc(null);
              setStatus('idle');
              setProgress(0);
              framesRef.current = [];
              if (playbackLoopRef.current) clearTimeout(playbackLoopRef.current);
            }}>
              Upload Another Video
            </button>
          </div>
          
          {status === 'idle' && (
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '16px', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center' }}>
              <strong>Note:</strong> We process the video locally in your browser. Large videos may take some time depending on your hardware.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
