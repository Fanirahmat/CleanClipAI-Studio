export type InpaintingModel = 'propainter' | 'e2fgvi' | 'opencv_telea' | 'delogo';

export interface BoundingBox {
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  width: number; // percentage (0 - 100)
  height: number; // percentage (0 - 100)
}

export interface VideoMetadata {
  name: string;
  duration: number; // seconds
  width: number;
  height: number;
  fps: number;
  totalFrames: number;
  sizeBytes: number;
}

export type ProcessingStage = 
  | 'idle'
  | 'extracting_audio'
  | 'extracting_frames'
  | 'generating_masks'
  | 'optical_flow'
  | 'inpainting'
  | 'remuxing'
  | 'completed'
  | 'failed';

export interface ProcessingState {
  stage: ProcessingStage;
  progress: number; // 0 - 100
  currentFrame: number;
  totalFrames: number;
  fps: number;
  etaSeconds: number;
  statusMessage: string;
}

export interface GpuSpec {
  id: string;
  name: string;
  vramGb: number;
  tflops: number;
  hourlyCostUsd: number;
  serverlessPerSecUsd: number;
  processingSpeedFps720p: number; // frames per second on ProPainter 720p
  processingSpeedFps1080p: number;
  provider: string;
}

export interface ModelDetail {
  id: InpaintingModel;
  name: string;
  conference: string;
  qualityScore: number; // 1-10
  temporalConsistencyScore: number; // 1-10
  vramRecommended: string;
  avgFps: string;
  bestFor: string;
  description: string;
  algorithmType: string;
}
