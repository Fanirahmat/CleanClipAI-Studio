import React, { useState } from 'react';
import { 
  Calculator, 
  Cpu, 
  DollarSign, 
  Clock, 
  HardDrive, 
  Server, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  HelpCircle,
  Zap
} from 'lucide-react';
import { GpuSpec, InpaintingModel } from '../types';

const GPU_OPTIONS: GpuSpec[] = [
  {
    id: 't4',
    name: 'NVIDIA T4 (16 GB)',
    vramGb: 16,
    tflops: 65,
    hourlyCostUsd: 0.526, // AWS g4dn.xlarge
    serverlessPerSecUsd: 0.00018, // RunPod / Modal
    processingSpeedFps720p: 18,
    processingSpeedFps1080p: 9,
    provider: 'AWS g4dn.xlarge / GCP n1-standard-4',
  },
  {
    id: 'a10g',
    name: 'NVIDIA A10G (24 GB) - Rekomendasi',
    vramGb: 24,
    tflops: 125,
    hourlyCostUsd: 1.006, // AWS g5.xlarge
    serverlessPerSecUsd: 0.00028,
    processingSpeedFps720p: 38,
    processingSpeedFps1080p: 22,
    provider: 'AWS g5.xlarge / RunPod / Modal',
  },
  {
    id: 'l4',
    name: 'NVIDIA L4 (24 GB Ada)',
    vramGb: 24,
    tflops: 240,
    hourlyCostUsd: 0.85,
    serverlessPerSecUsd: 0.00024,
    processingSpeedFps720p: 46,
    processingSpeedFps1080p: 28,
    provider: 'GCP g2-standard-4',
  },
  {
    id: 'rtx4090',
    name: 'NVIDIA RTX 4090 (24 GB)',
    vramGb: 24,
    tflops: 330,
    hourlyCostUsd: 0.44, // RunPod Community Cloud
    serverlessPerSecUsd: 0.00022,
    processingSpeedFps720p: 65,
    processingSpeedFps1080p: 40,
    provider: 'RunPod / Vast.ai / Lambda Labs',
  },
];

export default function CostCalculator() {
  const [durationSec, setDurationSec] = useState<number>(60); // 60 seconds (1 minute default)
  const [resolution, setResolution] = useState<'720p' | '1080p'>('1080p');
  const [fps, setFps] = useState<number>(30);
  const [monthlyVolume, setMonthlyVolume] = useState<number>(2500); // 2,500 videos/month
  const [selectedGpuId, setSelectedGpuId] = useState<string>('a10g');
  const [modelType, setModelType] = useState<InpaintingModel>('propainter');

  const selectedGpu = GPU_OPTIONS.find((g) => g.id === selectedGpuId) || GPU_OPTIONS[1];

  // Calculations
  const totalFramesPerVideo = durationSec * fps;
  
  // Speed multiplier based on model
  let modelSpeedMultiplier = 1.0;
  if (modelType === 'e2fgvi') modelSpeedMultiplier = 1.45; // 45% faster
  if (modelType === 'opencv_telea') modelSpeedMultiplier = 3.5; // CPU fast

  const baseFps = resolution === '720p' 
    ? selectedGpu.processingSpeedFps720p 
    : selectedGpu.processingSpeedFps1080p;

  const actualFps = baseFps * modelSpeedMultiplier;
  
  // Inpainting processing time in seconds
  const processingTimeSec = Math.round(totalFramesPerVideo / actualFps);
  const timePerMinuteVideoSec = Math.round((60 * fps) / actualFps);

  // VRAM consumption estimates
  const minVramGb = resolution === '720p' ? 8 : 12;
  const isVramSufficient = selectedGpu.vramGb >= minVramGb;

  // Costs
  const serverlessCostPerVideoUsd = processingTimeSec * selectedGpu.serverlessPerSecUsd;
  const monthlyServerlessTotalUsd = serverlessCostPerVideoUsd * monthlyVolume;
  
  // Dedicated server (running 24/7 = 720 hours/month)
  const monthlyDedicatedCostUsd = selectedGpu.hourlyCostUsd * 730;

  // Max capacity of 1 dedicated server
  const maxVideosPerMonthDedicated = Math.floor((730 * 3600) / (processingTimeSec + 5)); // +5s for I/O

  // Break-even volume
  const breakEvenVolume = Math.ceil(monthlyDedicatedCostUsd / Math.max(0.0001, serverlessCostPerVideoUsd));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Infrastructure Sizing & Financial Modeling</span>
          <span aria-hidden="true">·</span>
          <span>GPU VRAM Planning</span>
          <span aria-hidden="true">·</span>
          <span>Serverless vs Dedicated</span>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-white mt-1">
          Kalkulator Kebutuhan Komputasi & Estimasi Biaya Cloud
        </h2>
        <p className="text-sm text-slate-400 max-w-3xl mt-0.5">
          Simulasikan estimasi waktu render, kebutuhan VRAM agar server tidak crash/OOM, 
          dan perbandingan biaya serverless (RunPod/Modal) vs dedicated instance (AWS EC2 / GCP).
        </p>
      </div>

      {/* Main Grid: Parameters on Left, Output Metrics on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Parameters (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-sm font-semibold text-white">
            <Calculator className="w-4 h-4 text-blue-400" />
            <span>Parameter Video & Beban Kerja</span>
          </div>

          {/* 1. Video Duration Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Durasi Rata-rata Video:</span>
              <span className="font-mono text-blue-400 font-semibold">{durationSec} Detik ({Math.round(durationSec / 60 * 10) / 10} Menit)</span>
            </div>
            <input
              type="range"
              min="15"
              max="180"
              step="15"
              value={durationSec}
              onChange={(e) => setDurationSec(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>30s (Shorts)</span>
              <span>60s (1 Menit)</span>
              <span>120s (2 Menit)</span>
              <span>180s (3 Menit)</span>
            </div>
          </div>

          {/* 2. Resolution Selector */}
          <div className="space-y-1.5">
            <span className="text-slate-300 text-xs font-medium block">Resolusi Video:</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setResolution('720p')}
                className={`py-2 px-3 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                  resolution === '720p'
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                720p HD (1280×720)
              </button>
              <button
                onClick={() => setResolution('1080p')}
                className={`py-2 px-3 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                  resolution === '1080p'
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                1080p Full HD (1920×1080)
              </button>
            </div>
          </div>

          {/* 3. Framerate */}
          <div className="space-y-1.5">
            <span className="text-slate-300 text-xs font-medium block">Frame Rate (FPS):</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setFps(30)}
                className={`py-1.5 px-3 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                  fps === 30
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                30 FPS (Standar TikTok/Reels)
              </button>
              <button
                onClick={() => setFps(60)}
                className={`py-1.5 px-3 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                  fps === 60
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                60 FPS (High Motion)
              </button>
            </div>
          </div>

          {/* 4. Model Selection */}
          <div className="space-y-1.5">
            <span className="text-slate-300 text-xs font-medium block">Algoritma Inpainting:</span>
            <div className="space-y-1.5">
              <button
                onClick={() => setModelType('propainter')}
                className={`w-full text-left p-2.5 rounded-md border text-xs transition-colors cursor-pointer ${
                  modelType === 'propainter'
                    ? 'bg-blue-950/60 border-blue-500 text-white'
                    : 'bg-slate-800/40 border-slate-700 text-slate-300'
                }`}
              >
                <div className="font-semibold text-blue-300">ProPainter (Dual-Domain Flow)</div>
                <div className="text-[11px] text-slate-400">Paling rapi & temporal konsisten (Standar industri)</div>
              </button>

              <button
                onClick={() => setModelType('e2fgvi')}
                className={`w-full text-left p-2.5 rounded-md border text-xs transition-colors cursor-pointer ${
                  modelType === 'e2fgvi'
                    ? 'bg-blue-950/60 border-blue-500 text-white'
                    : 'bg-slate-800/40 border-slate-700 text-slate-300'
                }`}
              >
                <div className="font-semibold text-slate-200">E2FGVI (Fast Flow-Guided)</div>
                <div className="text-[11px] text-slate-400">45% lebih cepat, konsumsi VRAM lebih rendah</div>
              </button>
            </div>
          </div>

          {/* 5. Monthly Volume Slider */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Estimasi Volume Video / Bulan:</span>
              <span className="font-mono text-emerald-400 font-semibold">{monthlyVolume.toLocaleString()} Video</span>
            </div>
            <input
              type="range"
              min="200"
              max="20000"
              step="200"
              value={monthlyVolume}
              onChange={(e) => setMonthlyVolume(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>500 (MVP)</span>
              <span>5,000 (Growth)</span>
              <span>20,000+ (Scale)</span>
            </div>
          </div>

        </div>

        {/* Right Column: Hardware Metrics & Cost Breakdown (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Hardware Sizing & Speeds */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Cpu className="w-4 h-4 text-purple-400" />
                <span>Pilih Instance GPU Server</span>
              </div>
              <span className="text-xs text-slate-400">Total Frame: {totalFramesPerVideo.toLocaleString()} frame</span>
            </div>

            {/* GPU Radio Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {GPU_OPTIONS.map((gpu) => {
                const isSelected = gpu.id === selectedGpuId;
                return (
                  <button
                    key={gpu.id}
                    onClick={() => setSelectedGpuId(gpu.id)}
                    className={`text-left p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-950/40 border-blue-500 text-white shadow-sm shadow-blue-500/10'
                        : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-100">{gpu.name}</span>
                      <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                        ${gpu.hourlyCostUsd}/jam
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 font-mono">
                      VRAM: {gpu.vramGb} GB · {gpu.provider}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Core KPI Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-slate-800/40 border border-slate-700/60 rounded-lg">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Waktu Render / Video</span>
                </div>
                <div className="text-lg font-bold font-mono text-white tabular-nums">
                  {processingTimeSec} Detik
                </div>
                <span className="text-[10px] text-slate-400">
                  (~{timePerMinuteVideoSec}s per menit durasi)
                </span>
              </div>

              <div className="p-3 bg-slate-800/40 border border-slate-700/60 rounded-lg">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Kecepatan Render (FPS)</span>
                </div>
                <div className="text-lg font-bold font-mono text-amber-300 tabular-nums">
                  {actualFps.toFixed(1)} FPS
                </div>
                <span className="text-[10px] text-slate-400">
                  {actualFps >= fps ? '⚡ Lebih cepat dari realtime!' : '1.2x - 1.5x durasi asli'}
                </span>
              </div>

              <div className="p-3 bg-slate-800/40 border border-slate-700/60 rounded-lg">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                  <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                  <span>Kebutuhan VRAM</span>
                </div>
                <div className={`text-lg font-bold font-mono tabular-nums ${isVramSufficient ? 'text-emerald-400' : 'text-red-400'}`}>
                  {minVramGb} GB Min.
                </div>
                <span className="text-[10px] text-slate-400">
                  {isVramSufficient ? '✅ Aman dari CUDA OOM' : '⚠️ Berisiko OOM pada 1080p'}
                </span>
              </div>
            </div>
          </div>

          {/* Cloud Cost Financial Breakdown */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Analisis Biaya Cloud & Rekomendasi Arsitektur</span>
              </div>
              <span className="text-xs font-mono text-emerald-400">
                ${serverlessCostPerVideoUsd.toFixed(4)} / Video
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Option A: Serverless GPU */}
              <div className="p-4 bg-blue-950/30 border border-blue-900/50 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-300 uppercase">
                    Opsi A: Serverless GPU (RunPod / Modal)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 bg-blue-900/70 text-blue-200 rounded font-semibold">
                    Rekomendasi Tahap Awal
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Bayar per detik pemrosesan video aktual (tidak ada biaya server idle 24/7).
                </p>
                <div className="pt-2 border-t border-blue-900/40">
                  <div className="text-xs text-slate-400">Total Biaya Bulanan ({monthlyVolume.toLocaleString()} video):</div>
                  <div className="text-xl font-bold font-mono text-white mt-0.5">
                    ${monthlyServerlessTotalUsd.toFixed(2)} / Bulan
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Biaya per video: <strong>${serverlessCostPerVideoUsd.toFixed(3)}</strong> (~Rp {Math.round(serverlessCostPerVideoUsd * 16200)} per video)
                  </div>
                </div>
              </div>

              {/* Option B: Dedicated Cloud Instance */}
              <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 uppercase">
                    Opsi B: Dedicated Cloud Instance (AWS / GCP)
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Instance menyala terus 24/7 (AWS EC2 g5.xlarge). Mampu memproses hingga ~{maxVideosPerMonthDedicated.toLocaleString()} video/bulan.
                </p>
                <div className="pt-2 border-t border-slate-700/50">
                  <div className="text-xs text-slate-400">Biaya Tetap Bulanan (730 jam):</div>
                  <div className="text-xl font-bold font-mono text-slate-200 mt-0.5">
                    ${monthlyDedicatedCostUsd.toFixed(2)} / Bulan
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Titik Impas (Break-Even): Di atas <strong>{breakEvenVolume.toLocaleString()} video/bulan</strong> baru lebih hemat dedicated.
                  </div>
                </div>
              </div>

            </div>

            {/* Architect Verdict */}
            <div className="p-3.5 bg-slate-800/60 rounded-lg text-xs text-slate-300 space-y-1">
              <span className="font-semibold text-white">💡 Kesimpulan Arsitektur Solusi:</span>
              <p className="text-slate-400 leading-relaxed">
                Untuk peluncuran produk atau volume di bawah {breakEvenVolume.toLocaleString()} video per bulan, 
                <strong> Serverless GPU (Modal Labs atau RunPod Serverless) jauh lebih hemat hingga 70-85%</strong> 
                karena Anda hanya membayar sekitar $0.01 - $0.02 per video tanpa risiko membayar ribuan dolar untuk server idle saat trafik sepi.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
