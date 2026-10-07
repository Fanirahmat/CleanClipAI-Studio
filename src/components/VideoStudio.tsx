import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Upload, 
  Sliders, 
  Sparkles, 
  CheckCircle2, 
  Download, 
  Maximize2,
  Cpu,
  Layers,
  Zap,
  HelpCircle
} from 'lucide-react';
import { BoundingBox, InpaintingModel, ProcessingState } from '../types';
import { inpaintCanvasRegion } from '../utils/canvasInpaint';

interface PresetClip {
  id: string;
  name: string;
  aspect: '9:16' | '16:9';
  watermarkText: string;
  defaultBox: BoundingBox;
  bgGradient: string[];
  description: string;
}

const PRESET_CLIPS: PresetClip[] = [
  {
    id: 'tiktok_short',
    name: 'TikTok Video (9:16 Portrait)',
    aspect: '9:16',
    watermarkText: '@creator_viral · TikTok',
    defaultBox: { x: 55, y: 84, width: 40, height: 8 },
    bgGradient: ['#1e1b4b', '#312e81', '#4338ca'],
    description: 'Video vertikal dengan watermark dinamis di sudut kanan bawah.',
  },
  {
    id: 'vlog_landscape',
    name: 'Travel Vlog (16:9 Landscape)',
    aspect: '16:9',
    watermarkText: '© CHANNEL_HD_OFFICIAL',
    defaultBox: { x: 74, y: 86, width: 23, height: 9 },
    bgGradient: ['#0f172a', '#1e293b', '#0369a1'],
    description: 'Video lanskap dengan logo stasiun TV/kanal di pojok kanan bawah.',
  },
  {
    id: 'subtitle_promo',
    name: 'Promo Clip (Subtitle & Banner)',
    aspect: '16:9',
    watermarkText: 'PROMO CODE: SAVE50 - WWW.EXAMPLE.COM',
    defaultBox: { x: 15, y: 82, width: 70, height: 11 },
    bgGradient: ['#18181b', '#27272a', '#065f46'],
    description: 'Banner teks berjalan / subtitle mengganggu di bagian bawah video.',
  },
];

export default function VideoStudio() {
  const [selectedClip, setSelectedClip] = useState<PresetClip>(PRESET_CLIPS[0]);
  const [model, setModel] = useState<InpaintingModel>('propainter');
  const [customVideoSrc, setCustomVideoSrc] = useState<string | null>(null);
  const [customVideoFile, setCustomVideoFile] = useState<File | null>(null);
  
  // Bounding box in percentage
  const [box, setBox] = useState<BoundingBox>(PRESET_CLIPS[0].defaultBox);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);

  // Playback & Video canvas
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const duration = 12; // 12 seconds preview loop
  const [splitPosition, setSplitPosition] = useState(50); // percentage for split view
  const [viewMode, setViewMode] = useState<'split' | 'sideBySide' | 'resultOnly'>('split');

  // Processing state
  const [processing, setProcessing] = useState<ProcessingState>({
    stage: 'idle',
    progress: 0,
    currentFrame: 0,
    totalFrames: 360,
    fps: 0,
    etaSeconds: 0,
    statusMessage: 'Siap memproses video',
  });
  const [isProcessed, setIsProcessed] = useState(false);

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cleanCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Handle Preset Selection
  const handleSelectClip = (clip: PresetClip) => {
    setSelectedClip(clip);
    setBox(clip.defaultBox);
    setCustomVideoSrc(null);
    setCustomVideoFile(null);
    setIsProcessed(false);
    setCurrentTime(0);
    setIsPlaying(true);
  };

  // Handle User Video File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomVideoSrc(url);
      setCustomVideoFile(file);
      setIsProcessed(false);
      setCurrentTime(0);
      setIsPlaying(true);
    }
  };

  // Draw scene onto canvas
  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    if (customVideoSrc && videoRef.current && videoRef.current.readyState >= 2) {
      // Draw real uploaded video frame
      ctx.drawImage(videoRef.current, 0, 0, width, height);
    } else {
      // Draw simulated high-quality procedural animated video scene
      const t = currentTime;
      const grad = ctx.createLinearGradient(
        0, 0, 
        width * Math.cos(t * 0.4), 
        height * Math.sin(t * 0.4)
      );
      grad.addColorStop(0, selectedClip.bgGradient[0]);
      grad.addColorStop(0.5, selectedClip.bgGradient[1]);
      grad.addColorStop(1, selectedClip.bgGradient[2]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Draw animated dynamic visual objects (simulating complex video motion)
      for (let i = 0; i < 5; i++) {
        const radius = 35 + i * 15;
        const cx = (width * 0.5) + Math.cos(t * 1.5 + i * 1.2) * (width * 0.25);
        const cy = (height * 0.45) + Math.sin(t * 1.2 + i * 0.9) * (height * 0.2);
        
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.08 + i * 0.04})`;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = `rgba(59, 130, 246, ${0.2 + i * 0.08})`;
        ctx.stroke();
      }

      // Draw simulated foreground movement
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`Video Scene: ${selectedClip.name}`, 20, 36);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.fillText(`Timestamp: ${currentTime.toFixed(2)}s / ${duration}.00s · 30 FPS`, 20, 60);

      // Draw watermark on original canvas
      const wmBoxX = (box.x / 100) * width;
      const wmBoxY = (box.y / 100) * height;
      const wmBoxW = (box.width / 100) * width;
      const wmBoxH = (box.height / 100) * height;

      // Watermark styling (semi-transparent badge + text)
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(wmBoxX + 2, wmBoxY + 2, wmBoxW - 4, wmBoxH - 4, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        selectedClip.watermarkText, 
        wmBoxX + wmBoxW / 2, 
        wmBoxY + wmBoxH / 2
      );
      ctx.restore();
    }

    // Now render clean canvas if processed
    const cleanCanvas = cleanCanvasRef.current;
    if (cleanCanvas && isProcessed) {
      const cleanCtx = cleanCanvas.getContext('2d');
      if (cleanCtx) {
        cleanCanvas.width = width;
        cleanCanvas.height = height;
        // Copy original
        cleanCtx.drawImage(canvas, 0, 0);
        // Apply inpainting in ROI
        const inpaintX = (box.x / 100) * width;
        const inpaintY = (box.y / 100) * height;
        const inpaintW = (box.width / 100) * width;
        const inpaintH = (box.height / 100) * height;
        inpaintCanvasRegion(cleanCtx, inpaintX, inpaintY, inpaintW, inpaintH, model);
      }
    }
  }, [currentTime, selectedClip, box, customVideoSrc, isProcessed, model]);

  // Main playback animation loop
  useEffect(() => {
    let lastStamp = performance.now();

    const loop = (stamp: number) => {
      const delta = (stamp - lastStamp) / 1000;
      lastStamp = stamp;

      if (isPlaying) {
        setCurrentTime((prev) => {
          const next = prev + delta;
          if (next >= duration) return 0;
          return next;
        });
      }

      drawFrame();
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, drawFrame]);

  // Canvas drawing event handlers for interactive Bounding Box selection
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isProcessed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setIsDrawing(true);
    setDrawStart({ x, y });
    setBox({ x, y, width: 2, height: 2 });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawStart) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = ((e.clientX - rect.left) / rect.width) * 100;
    const currentY = ((e.clientY - rect.top) / rect.height) * 100;

    const x = Math.min(drawStart.x, currentX);
    const y = Math.min(drawStart.y, currentY);
    const width = Math.max(4, Math.abs(currentX - drawStart.x));
    const height = Math.max(3, Math.abs(currentY - drawStart.y));

    setBox({
      x: Math.max(0, Math.min(95, x)),
      y: Math.max(0, Math.min(95, y)),
      width: Math.min(100 - x, width),
      height: Math.min(100 - y, height),
    });
  };

  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
    setDrawStart(null);
  };

  // Run inpainting pipeline simulation
  const handleStartInpainting = () => {
    setIsProcessed(false);
    setProcessing({
      stage: 'extracting_audio',
      progress: 5,
      currentFrame: 0,
      totalFrames: 360,
      fps: 0,
      etaSeconds: 8,
      statusMessage: '1/5: Ekstraksi stream audio via FFmpeg (`-c:a copy`) untuk lossless sync...',
    });

    const stages: Array<{
      stage: ProcessingState['stage'];
      progress: number;
      fps: number;
      eta: number;
      message: string;
      delay: number;
    }> = [
      {
        stage: 'extracting_frames',
        progress: 20,
        fps: 85,
        eta: 7,
        message: '2/5: FFmpeg pipe frame RGB ke /dev/shm RAM-disk (demuxing tanpa disk I/O bottleneck)...',
        delay: 900,
      },
      {
        stage: 'generating_masks',
        progress: 35,
        fps: 92,
        eta: 6,
        message: '3/5: Binarisasi mask bboxes & temporal dilation untuk coverage watermark transparan...',
        delay: 1100,
      },
      {
        stage: 'optical_flow',
        progress: 55,
        fps: 28,
        eta: 4,
        message: `4/5: Kalkulasi RAFT bidirectional optical flow & recurrent temporal alignment (${model.toUpperCase()})...`,
        delay: 1400,
      },
      {
        stage: 'inpainting',
        progress: 85,
        fps: 22,
        eta: 2,
        message: `5/5: Deep recurrent frame inpainting (sliding window = 10 frames, VRAM: 7.2 GB)...`,
        delay: 1700,
      },
      {
        stage: 'remuxing',
        progress: 95,
        fps: 110,
        eta: 1,
        message: 'Re-encoding H.264 (libx264 CRF 18) & Muxing audio asli dengan PTS preservation...',
        delay: 1000,
      },
      {
        stage: 'completed',
        progress: 100,
        fps: 0,
        eta: 0,
        message: 'Pemrosesan selesai sempurna! Watermark berhasil dihapus tanpa distorsi audio.',
        delay: 600,
      },
    ];

    let currentDelay = 500;
    stages.forEach((s) => {
      currentDelay += s.delay;
      setTimeout(() => {
        setProcessing({
          stage: s.stage,
          progress: s.progress,
          currentFrame: Math.floor((s.progress / 100) * 360),
          totalFrames: 360,
          fps: s.fps,
          etaSeconds: s.eta,
          statusMessage: s.message,
        });

        if (s.stage === 'completed') {
          setIsProcessed(true);
          setIsPlaying(true);
        }
      }, currentDelay);
    });
  };

  // Preset box positions
  const setPresetPosition = (type: 'tiktok' | 'capcut' | 'subtitle' | 'corner') => {
    setIsProcessed(false);
    if (type === 'tiktok') {
      setBox({ x: 58, y: 84, width: 38, height: 8 });
    } else if (type === 'capcut') {
      setBox({ x: 5, y: 6, width: 32, height: 7 });
    } else if (type === 'subtitle') {
      setBox({ x: 12, y: 84, width: 76, height: 9 });
    } else if (type === 'corner') {
      setBox({ x: 75, y: 6, width: 20, height: 7 });
    }
  };

  // Download snapshot or clip
  const handleDownload = () => {
    const canvas = cleanCanvasRef.current || canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `cleanclip_${selectedClip.id}_inpainted.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const isPortrait = selectedClip.aspect === '9:16';

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Video Inpainting Workbench</span>
            <span aria-hidden="true">·</span>
            <span>Realtime ROI Canvas</span>
            <span aria-hidden="true">·</span>
            <span>Dual-Domain Temporal Flow</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white mt-1">
            Studio Inpainting & Watermark Removal
          </h2>
          <p className="text-sm text-slate-400 max-w-3xl mt-0.5">
            Pilih video sample atau unggah video milik Anda, tentukan area watermark (ROI Bounding Box), 
            pilih algoritma inpainting (ProPainter / E2FGVI / OpenCV), dan saksikan penghapusan watermark secara temporal stabil.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors cursor-pointer">
            <Upload className="w-4 h-4 text-blue-400" />
            <span>Unggah Video (MP4)</span>
            <input 
              type="file" 
              accept="video/mp4,video/webm" 
              className="hidden" 
              onChange={handleFileUpload}
            />
          </label>

          <button
            onClick={handleStartInpainting}
            disabled={processing.stage !== 'idle' && processing.stage !== 'completed'}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 rounded-md transition-colors cursor-pointer shadow-sm shadow-blue-500/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>{processing.stage === 'idle' || processing.stage === 'completed' ? 'Proses Inpainting' : 'Sedang Memproses...'}</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Video Viewport & Controls (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Preset Selector Bar */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-900/80 rounded-lg border border-slate-800">
            <span className="text-xs font-medium text-slate-400 px-2.5">Sample Video:</span>
            {PRESET_CLIPS.map((clip) => (
              <button
                key={clip.id}
                onClick={() => handleSelectClip(clip)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  selectedClip.id === clip.id && !customVideoSrc
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {clip.name}
              </button>
            ))}
            {customVideoFile && (
              <span className="text-xs text-blue-400 px-2 py-1 bg-blue-950/40 rounded border border-blue-800/50">
                File Kustom: {customVideoFile.name}
              </span>
            )}
          </div>

          {/* Interactive Canvas Viewport */}
          <div className="relative bg-[#070a0f] border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex items-center justify-center min-h-[420px] max-h-[560px]">
            
            {/* Hidden native video for file uploads */}
            {customVideoSrc && (
              <video
                ref={videoRef}
                src={customVideoSrc}
                loop
                muted
                playsInline
                className="hidden"
                onLoadedMetadata={(e) => {
                  const v = e.currentTarget;
                  if (canvasRef.current) {
                    canvasRef.current.width = v.videoWidth || 640;
                    canvasRef.current.height = v.videoHeight || 360;
                  }
                }}
              />
            )}

            {/* Split View Container */}
            <div className={`relative flex items-center justify-center ${isPortrait ? 'w-[300px] h-[520px]' : 'w-full h-[440px]'}`}>
              
              {/* Base Original Canvas with Watermark */}
              <canvas
                ref={canvasRef}
                width={isPortrait ? 360 : 720}
                height={isPortrait ? 640 : 405}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                className="max-h-full max-w-full object-contain cursor-crosshair select-none"
              />

              {/* Clean Canvas Overlay (Visible if processed) */}
              {isProcessed && (
                <div 
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{
                    clipPath: viewMode === 'split' 
                      ? `inset(0 0 0 ${splitPosition}%)` 
                      : 'none'
                  }}
                >
                  <canvas
                    ref={cleanCanvasRef}
                    className="w-full h-full object-contain select-none"
                  />
                </div>
              )}

              {/* Interactive Bounding Box Indicator (Before Inpaint) */}
              {!isProcessed && (
                <div
                  className="absolute border-2 border-dashed border-red-500 bg-red-500/20 pointer-events-none rounded transition-all"
                  style={{
                    left: `${box.x}%`,
                    top: `${box.y}%`,
                    width: `${box.width}%`,
                    height: `${box.height}%`,
                  }}
                >
                  <div className="absolute -top-6 left-0 px-1.5 py-0.5 bg-red-600 text-white text-[10px] font-mono rounded tracking-tight shadow">
                    ROI Mask: {Math.round(box.width)}% × {Math.round(box.height)}%
                  </div>
                </div>
              )}

              {/* Split Slider Control Handle (When in split view and processed) */}
              {isProcessed && viewMode === 'split' && (
                <div 
                  className="absolute top-0 bottom-0 z-20 cursor-ew-resize flex items-center justify-center"
                  style={{ left: `${splitPosition}%` }}
                >
                  <div className="w-0.5 h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                  <div className="absolute w-7 h-7 bg-white text-slate-900 rounded-full shadow-lg flex items-center justify-center text-[10px] font-bold">
                    ⟷
                  </div>
                </div>
              )}

              {/* Mode Badges */}
              {isProcessed && viewMode === 'split' && (
                <>
                  <div className="absolute top-3 left-3 px-2 py-1 bg-black/70 backdrop-blur text-slate-300 text-xs font-medium rounded border border-white/10 pointer-events-none">
                    Original (Before)
                  </div>
                  <div className="absolute top-3 right-3 px-2 py-1 bg-blue-900/80 backdrop-blur text-blue-200 text-xs font-semibold rounded border border-blue-500/30 pointer-events-none">
                    Inpainted (After: {model.toUpperCase()})
                  </div>
                </>
              )}
            </div>

            {/* Split Slider Range Overlay */}
            {isProcessed && viewMode === 'split' && (
              <input
                type="range"
                min="0"
                max="100"
                value={splitPosition}
                onChange={(e) => setSplitPosition(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
              />
            )}
          </div>

          {/* Player Timeline & Controls */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-3 space-y-2">
            
            {/* Timeline scrubber */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setCurrentTime(0)}
                className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-md transition-colors cursor-pointer"
                title="Reset to 0s"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <div className="flex-1 flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max={duration}
                  step="0.05"
                  value={currentTime}
                  onChange={(e) => setCurrentTime(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <span className="text-xs font-mono tabular-nums text-slate-400 w-24 text-right">
                {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
              </span>
            </div>

            {/* View Mode & ROI Helper Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Preset Watermark:</span>
                <button
                  onClick={() => setPresetPosition('tiktok')}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded cursor-pointer"
                >
                  TikTok Bottom-Right
                </button>
                <button
                  onClick={() => setPresetPosition('capcut')}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded cursor-pointer"
                >
                  CapCut Top-Left
                </button>
                <button
                  onClick={() => setPresetPosition('subtitle')}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded cursor-pointer"
                >
                  Bottom Subtitle
                </button>
                <button
                  onClick={() => setPresetPosition('corner')}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded cursor-pointer"
                >
                  Corner Logo
                </button>
              </div>

              {isProcessed && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 rounded hover:bg-emerald-900/60 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Frame Bersih</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Realtime Pipeline Execution Status Bar */}
          {processing.stage !== 'idle' && (
            <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-lg space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {processing.stage === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  )}
                  <span className="font-semibold text-slate-200">
                    {processing.statusMessage}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-400 font-mono tabular-nums">
                  {processing.fps > 0 && <span>{processing.fps} FPS</span>}
                  <span>{processing.progress}%</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    processing.stage === 'completed' 
                      ? 'bg-emerald-500' 
                      : 'bg-gradient-to-r from-blue-600 to-indigo-500'
                  }`}
                  style={{ width: `${processing.progress}%` }}
                />
              </div>

              {/* Telemetry info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] text-slate-400">
                <div>
                  <span className="text-slate-500">Frame Diproses: </span>
                  <span className="font-mono text-slate-200 tabular-nums">
                    {processing.currentFrame} / {processing.totalFrames}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Model: </span>
                  <span className="text-blue-400 uppercase font-semibold">{model}</span>
                </div>
                <div>
                  <span className="text-slate-500">Audio Sync: </span>
                  <span className="text-emerald-400 font-medium">Lossless (-c:a copy)</span>
                </div>
                <div>
                  <span className="text-slate-500">RAM-Disk I/O: </span>
                  <span className="text-slate-300">/dev/shm (Pipe RAM)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Model Config & Technical Parameters (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Card: Algoritma Model Inpainting */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Engine Inpainting</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pilih model deep learning atau heuristik sesuai kebutuhan kualitas dan komputasi GPU:
            </p>

            <div className="space-y-2">
              {/* Option 1: ProPainter */}
              <button
                onClick={() => setModel('propainter')}
                className={`w-full text-left p-3 rounded-md border transition-all cursor-pointer ${
                  model === 'propainter'
                    ? 'bg-blue-950/40 border-blue-500/80 text-white'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-blue-300">ProPainter (ICCV 2023)</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-blue-900/60 text-blue-300 font-semibold rounded">
                    SOTA / Paling Rapi
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Dual-domain flow propagation + recurrent transformer. Mengeliminasi flickering temporal sepenuhnya.
                </p>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 font-mono">
                  <span>VRAM: ~8-12 GB</span>
                  <span>·</span>
                  <span>Speed: 12-20 FPS (A10G)</span>
                </div>
              </button>

              {/* Option 2: E2FGVI */}
              <button
                onClick={() => setModel('e2fgvi')}
                className={`w-full text-left p-3 rounded-md border transition-all cursor-pointer ${
                  model === 'e2fgvi'
                    ? 'bg-blue-950/40 border-blue-500/80 text-white'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-200">E2FGVI (CVPR 2022)</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded">
                    Fast Deep Model
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  End-to-end flow-guided video inpainting. Cepat dan stabil untuk watermark sudut statis.
                </p>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 font-mono">
                  <span>VRAM: ~6-8 GB</span>
                  <span>·</span>
                  <span>Speed: 20-30 FPS</span>
                </div>
              </button>

              {/* Option 3: OpenCV Telea */}
              <button
                onClick={() => setModel('opencv_telea')}
                className={`w-full text-left p-3 rounded-md border transition-all cursor-pointer ${
                  model === 'opencv_telea'
                    ? 'bg-blue-950/40 border-blue-500/80 text-white'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-200">OpenCV Telea / NS</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-amber-300 rounded">
                    CPU Fast Baseline
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Metode Fast Marching. Tanpa GPU, sangat cepat, namun rentan blur/flicker jika latar belakang bergerak dinamis.
                </p>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 font-mono">
                  <span>VRAM: 0 GB (CPU only)</span>
                  <span>·</span>
                  <span>Speed: 45+ FPS</span>
                </div>
              </button>
            </div>
          </div>

          {/* Card: Koordinat Bounding Box (ROI) */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-semibold text-white">Area Watermark (ROI)</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Normalized %</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Drag mouse langsung pada video untuk menggambar kotak watermark baru, atau sesuaikan nilai berikut:
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-800/60 p-2 rounded border border-slate-700/60">
                <span className="text-slate-400 text-[10px] block">Offset X (%):</span>
                <span className="font-mono text-white text-sm tabular-nums">{box.x.toFixed(1)}%</span>
              </div>
              <div className="bg-slate-800/60 p-2 rounded border border-slate-700/60">
                <span className="text-slate-400 text-[10px] block">Offset Y (%):</span>
                <span className="font-mono text-white text-sm tabular-nums">{box.y.toFixed(1)}%</span>
              </div>
              <div className="bg-slate-800/60 p-2 rounded border border-slate-700/60">
                <span className="text-slate-400 text-[10px] block">Lebar (%):</span>
                <span className="font-mono text-white text-sm tabular-nums">{box.width.toFixed(1)}%</span>
              </div>
              <div className="bg-slate-800/60 p-2 rounded border border-slate-700/60">
                <span className="text-slate-400 text-[10px] block">Tinggi (%):</span>
                <span className="font-mono text-white text-sm tabular-nums">{box.height.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Card: Best Practice Architect Tip */}
          <div className="p-4 bg-blue-950/30 border border-blue-900/50 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-blue-300 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <span>Architect Tip: Mengatasi Moving Watermark</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Untuk video TikTok di mana logo melompat antara pojok kiri-atas dan kanan-bawah setiap 4-6 detik:
              Gunakan <strong>Mask Intermittent</strong> (aktifkan mask bounding box hanya pada time-interval spesifik) 
              atau jalankan deteksi teks otomatis berbasis <strong>YOLOv8-text / PaddleOCR</strong> per keyframe.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
