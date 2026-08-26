import { BarChart } from 'lucide-react';

export function Overview() {
  return (
    <div style={{ paddingTop: '60px', paddingBottom: '120px' }}>
      {/* Background blobs */}
      <div className="bg-gradient-blob blob-1"></div>
      <div className="bg-gradient-blob blob-2"></div>

      <div className="container">
        {/* Website Overview & How It Works */}
        <div style={{ textAlign: 'left', background: 'var(--glass-bg)', padding: '48px', borderRadius: '24px', border: '1px solid var(--glass-border)', backdropFilter: 'blur(12px)' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BarChart color="var(--accent-primary)" size={32} />
            Website Overview & How It Works
          </h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '32px' }}>
            CrowdSight uses a custom-trained <strong>YOLOv8 Object Detection</strong> model converted to ONNX format. By utilizing WebAssembly (WASM), the entire neural network runs directly inside your web browser, ensuring complete privacy and zero server latency. 
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '32px' }}>
            <div>
              <h4 style={{ fontSize: '1.2rem', marginBottom: '12px', color: '#10b981' }}>1. Vehicle Detection</h4>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                The AI scans the frame and draws green bounding boxes around recognized vehicles (Cars, Motorcycles, Buses, and Trucks). The model dynamically scales images using <em>letterboxing</em> to maintain accuracy across any aspect ratio.
              </p>
            </div>
            
            <div>
              <h4 style={{ fontSize: '1.2rem', marginBottom: '12px', color: '#3b82f6' }}>2. Lane Segregation</h4>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Two distinct Regions of Interest (ROI) are mapped onto the road. The system uses coordinate geometry to determine if a detected vehicle's center point falls into the Left Lane or the Right Lane.
              </p>
            </div>

            <div>
              <h4 style={{ fontSize: '1.2rem', marginBottom: '12px', color: '#8b5cf6' }}>3. Traffic Intensity</h4>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                By counting the number of vehicles in each lane per frame, the system classifies the traffic flow. If the count exceeds the threshold (10 vehicles), the intensity is marked as <strong>Heavy</strong>; otherwise, it is <strong>Smooth</strong>.
              </p>
            </div>
          </div>

          <div style={{ marginTop: '48px', padding: '24px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', borderLeft: '4px solid var(--accent-primary)' }}>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Handling Non-Traffic Photos</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
              To ensure accuracy, the AI is strictly filtered to only recognize vehicle classes. If you upload a photo unrelated to traffic (e.g., a landscape or a person), the system will intelligently reject it and display a "No traffic detected" warning rather than attempting to draw arbitrary lane lines.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
