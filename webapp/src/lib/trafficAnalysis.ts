import * as ort from 'onnxruntime-web';

// Configure ONNX Runtime to use WASM backend locally (handled by custom Vite middleware)
ort.env.wasm.wasmPaths = '/';
ort.env.wasm.numThreads = navigator.hardwareConcurrency || 4;

export interface Box {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  prob: number;
}

export class TrafficAnalyzer {
  private session: ort.InferenceSession | null = null;
  public heavyTrafficThreshold = 10;
  
  // Vertices for the ROI polygons
  public vertices1 = [[465, 350], [609, 350], [510, 630], [2, 630]];
  public vertices2 = [[678, 350], [815, 350], [1203, 630], [743, 630]];
  
  public x1 = 325;
  public x2 = 635;
  public laneThreshold = 609;
  public lastDebugInfo: string = '';

  async loadModel() {
    try {
      this.session = await ort.InferenceSession.create('/model/best.onnx', { executionProviders: ['wasm'] });
      console.log('Model loaded successfully!');
      this.lastDebugInfo = 'Model loaded successfully.';
    } catch (e: any) {
      console.error('Failed to load model', e);
      this.lastDebugInfo = `Model Load Error: ${e.message}`;
    }
  }

  // Preprocess frame (Canvas/Image/Video -> Float32Array [1, 3, 640, 640])
  preprocess(ctx: CanvasRenderingContext2D, width: number, height: number): ort.Tensor {
    const inputSize = 640;
    
    // Create a temporary canvas for resizing and masking
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = inputSize;
    tempCanvas.height = inputSize;
    const tempCtx = tempCanvas.getContext('2d')!;
    
    // We must mimic the python code's masking BEFORE resizing?
    // Python code: 
    // detection_frame[:x1, :] = 0
    // detection_frame[x2:, :] = 0
    // results = best_model.predict(detection_frame, imgsz=640)
    // Actually, in python it masks the original frame (which is likely 1280x720) THEN predicts.
    
    // Instead of squashing, we apply letterboxing (padding to maintain aspect ratio)
    const scale = Math.min(inputSize / width, inputSize / height);
    const newWidth = Math.round(width * scale);
    const newHeight = Math.round(height * scale);
    const padX = (inputSize - newWidth) / 2;
    const padY = (inputSize - newHeight) / 2;

    // Fill background with YOLOv8 default padding color
    tempCtx.fillStyle = 'rgb(114, 114, 114)';
    tempCtx.fillRect(0, 0, inputSize, inputSize);

    // Draw the resized image in the center
    tempCtx.drawImage(ctx.canvas, 0, 0, width, height, padX, padY, newWidth, newHeight);
    
    // Apply masks (in original coordinates scaled to new letterboxed coordinates)
    // The original Python code assumed a 1280x720 frame (325/720 and 635/720).
    const normalizedX1 = this.x1 / 720;
    const normalizedX2 = this.x2 / 720;
    const scaledX1 = (normalizedX1 * height) * scale + padY;
    const scaledX2 = (normalizedX2 * height) * scale + padY;
    
    tempCtx.fillStyle = 'black';
    tempCtx.fillRect(0, 0, inputSize, scaledX1);
    tempCtx.fillRect(0, scaledX2, inputSize, inputSize - scaledX2);

    const imgData = tempCtx.getImageData(0, 0, inputSize, inputSize);
    const data = imgData.data;
    
    const float32Data = new Float32Array(3 * inputSize * inputSize);
    for (let i = 0; i < data.length / 4; i++) {
      float32Data[i] = data[i * 4] / 255.0;
      float32Data[inputSize * inputSize + i] = data[i * 4 + 1] / 255.0;
      float32Data[2 * inputSize * inputSize + i] = data[i * 4 + 2] / 255.0;
    }
    
    return new ort.Tensor('float32', float32Data, [1, 3, inputSize, inputSize]);
  }

  async runInference(ctx: CanvasRenderingContext2D, width: number, height: number) {
    if (!this.session) {
      this.lastDebugInfo = this.lastDebugInfo || 'Error: Model not loaded.';
      return null;
    }
    
    try {
      const tensor = this.preprocess(ctx, width, height);
      const feeds: Record<string, ort.Tensor> = {};
      feeds[this.session.inputNames[0]] = tensor;
      
      const results = await this.session.run(feeds);
      const output = results[this.session.outputNames[0]]; // Shape: [1, 84, 8400] typically
      
      this.lastDebugInfo = `Output shape: ${output.dims.join('x')}`;
      
      return this.postprocess(output.data as Float32Array, output.dims, width, height);
    } catch (e: any) {
      this.lastDebugInfo = `Error: ${e.message}`;
      console.error('Error during inference:', e);
      return null;
    }
  }

  postprocess(data: Float32Array, dims: readonly number[], originalWidth: number, originalHeight: number): Box[] {
    // YOLOv8 output is [1, num_classes + 4, 8400]
    const numClasses = dims[1] - 4;
    const numAnchors = dims[2];
    
    const boxes: Box[] = [];
    const inputSize = 640;
    const scale = Math.min(inputSize / originalWidth, inputSize / originalHeight);
    const padX = (inputSize - originalWidth * scale) / 2;
    const padY = (inputSize - originalHeight * scale) / 2;

    // Filter array for vehicles if we have all COCO classes
    const isCoco = numClasses === 80;
    const vehicleClasses = [2, 3, 5, 7]; // car, motorcycle, bus, truck

    for (let i = 0; i < numAnchors; i++) {
      let maxClassProb = 0;
      let maxClassId = -1;
      
      for (let c = 0; c < numClasses; c++) {
        const prob = data[(4 + c) * numAnchors + i];
        if (prob > maxClassProb) {
          maxClassProb = prob;
          maxClassId = c;
        }
      }

      // Check if it's a vehicle (or if not COCO, accept anything)
      const isValidClass = !isCoco || vehicleClasses.includes(maxClassId);

      if (maxClassProb > 0.6 && isValidClass) {
        const xc = data[0 * numAnchors + i];
        const yc = data[1 * numAnchors + i];
        const w = data[2 * numAnchors + i];
        const h = data[3 * numAnchors + i];

        // Un-letterbox coordinates
        const orig_xc = (xc - padX) / scale;
        const orig_yc = (yc - padY) / scale;
        const orig_w = w / scale;
        const orig_h = h / scale;

        const x1 = orig_xc - orig_w / 2;
        const y1 = orig_yc - orig_h / 2;
        const x2 = orig_xc + orig_w / 2;
        const y2 = orig_yc + orig_h / 2;

        boxes.push({ x1, y1, x2, y2, prob: maxClassProb });
      }
    }

    return this.nms(boxes, 0.45);
  }

  nms(boxes: Box[], iouThreshold: number): Box[] {
    boxes.sort((a, b) => b.prob - a.prob);
    const selected: Box[] = [];

    for (const box of boxes) {
      let shouldSelect = true;
      for (const selectedBox of selected) {
        if (this.iou(box, selectedBox) > iouThreshold) {
          shouldSelect = false;
          break;
        }
      }
      if (shouldSelect) {
        selected.push(box);
      }
    }
    return selected;
  }

  iou(box1: Box, box2: Box): number {
    const intersectX1 = Math.max(box1.x1, box2.x1);
    const intersectY1 = Math.max(box1.y1, box2.y1);
    const intersectX2 = Math.min(box1.x2, box2.x2);
    const intersectY2 = Math.min(box1.y2, box2.y2);

    const intersectArea = Math.max(0, intersectX2 - intersectX1) * Math.max(0, intersectY2 - intersectY1);
    const area1 = (box1.x2 - box1.x1) * (box1.y2 - box1.y1);
    const area2 = (box2.x2 - box2.x1) * (box2.y2 - box2.y1);

    return intersectArea / (area1 + area2 - intersectArea);
  }

  drawPolygons(ctx: CanvasRenderingContext2D, width: number, height: number) {
    // Assuming original model is tuned for 1280x720, we scale the polygons
    const scaleX = width / 1280;
    const scaleY = height / 720;

    const drawPoly = (vertices: number[][], color: string) => {
      ctx.beginPath();
      ctx.moveTo(vertices[0][0] * scaleX, vertices[0][1] * scaleY);
      for (let i = 1; i < vertices.length; i++) {
        ctx.lineTo(vertices[i][0] * scaleX, vertices[i][1] * scaleY);
      }
      ctx.closePath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    drawPoly(this.vertices1, 'rgba(0, 255, 0, 0.7)');
    drawPoly(this.vertices2, 'rgba(255, 0, 0, 0.7)');
  }

  drawResults(ctx: CanvasRenderingContext2D, boxes: Box[], width: number) {
    if (boxes.length === 0) {
      ctx.font = '24px Outfit';
      ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
      ctx.fillRect(width / 2 - 200, 20, 400, 40);
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.fillText('No traffic detected / Not a traffic photo', width / 2, 48);
      ctx.textAlign = 'left';
      return;
    }

    let leftCount = 0;
    let rightCount = 0;
    const scaleX = width / 1280; // For lane threshold

    // Draw bounding boxes
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#00ff00';
    
    for (const box of boxes) {
      // Determine lane based on center X of the box
      const centerX = (box.x1 + box.x2) / 2;
      const scaledLaneThreshold = this.laneThreshold * scaleX;

      if (centerX < scaledLaneThreshold) {
        leftCount++;
        ctx.strokeStyle = '#00ff00';
      } else {
        rightCount++;
        ctx.strokeStyle = '#ff0000';
      }

      ctx.strokeRect(box.x1, box.y1, box.x2 - box.x1, box.y2 - box.y1);
    }

    // Draw Text Info
    const trafficIntensityLeft = leftCount > this.heavyTrafficThreshold ? 'Heavy' : 'Smooth';
    const trafficIntensityRight = rightCount > this.heavyTrafficThreshold ? 'Heavy' : 'Smooth';

    ctx.font = '24px Outfit';
    ctx.fillStyle = 'rgba(0, 0, 255, 0.8)'; // Red background for text as in Python script (BGR was 0,0,255)
    
    // Left Lane Info
    ctx.fillRect(10, 25, 460, 35);
    ctx.fillRect(10, 75, 460, 35);
    ctx.fillStyle = 'white';
    ctx.fillText(`Vehicles in Left Lane: ${leftCount}`, 20, 50);
    ctx.fillText(`Traffic Intensity: ${trafficIntensityLeft}`, 20, 100);

    // Right Lane Info
    ctx.fillStyle = 'rgba(0, 0, 255, 0.8)';
    ctx.fillRect(width - 470, 25, 460, 35);
    ctx.fillRect(width - 470, 75, 460, 35);
    ctx.fillStyle = 'white';
    ctx.fillText(`Vehicles in Right Lane: ${rightCount}`, width - 460, 50);
    ctx.fillText(`Traffic Intensity: ${trafficIntensityRight}`, width - 460, 100);
  }
}
