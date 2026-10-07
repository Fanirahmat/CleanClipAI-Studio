import React, { useState } from 'react';
import { 
  Cpu, 
  Check, 
  X, 
  Sparkles, 
  Flame, 
  Zap, 
  HelpCircle, 
  ExternalLink,
  Code2,
  Sliders
} from 'lucide-react';
import { ModelDetail } from '../types';

const MODELS: ModelDetail[] = [
  {
    id: 'propainter',
    name: 'ProPainter (ICCV 2023)',
    conference: 'ICCV 2023 (SOTA)',
    qualityScore: 9.6,
    temporalConsistencyScore: 9.8,
    vramRecommended: '8 GB - 12 GB',
    avgFps: '12 - 20 FPS (A10G)',
    bestFor: 'Watermark bergerak (TikTok/CapCut), video berdurasi 1-2 menit dengan dynamic background.',
    algorithmType: 'Dual-Domain Propagation + Sparse-Flow Recurrent Transformer',
    description: 
      'Model open-source terbaik saat ini untuk video inpainting. Menggabungkan image propagation berbasis optical flow dengan video transformer untuk mengisi kekosongan tekstur. Menghasilkan video yang sangat mulus tanpa ada flickering atau ghosting.',
  },
  {
    id: 'e2fgvi',
    name: 'E2FGVI / E2FGVI-HQ (CVPR 2022)',
    conference: 'CVPR 2022',
    qualityScore: 8.8,
    temporalConsistencyScore: 8.9,
    vramRecommended: '6 GB - 8 GB',
    avgFps: '22 - 32 FPS (A10G)',
    bestFor: 'Watermark sudut statis, logo stasiun TV, pemrosesan throughput tinggi dengan budget GPU lebih hemat.',
    algorithmType: 'End-to-End Flow-Guided Video Inpainting with Deformable Alignment',
    description: 
      'Model end-to-end yang mengintegrasikan estimasi aliran optik dan rekonstruksi fitur secara serempak. Kecepatan inferensi 40-50% lebih cepat daripada ProPainter dengan konsumsi VRAM lebih rendah.',
  },
  {
    id: 'opencv_telea',
    name: 'OpenCV Inpaint (Telea / NS)',
    conference: 'Fast Marching Method',
    qualityScore: 5.8,
    temporalConsistencyScore: 4.5,
    vramRecommended: '0 GB (Hanya butuh CPU)',
    avgFps: '45 - 80 FPS (Multi-core CPU)',
    bestFor: 'Watermark sangat kecil pada latar belakang polos/statis, server murah tanpa GPU.',
    algorithmType: 'Heuristic Boundary Diffusion (Alexandru Telea / Navier-Stokes PDE)',
    description: 
      'Metode difusi pixel dari batas luar ke dalam tanpa pemahaman semantik atau temporal tracking. Jika latar belakang bergerak cepat atau bertekstur, hasil akan terlihat seperti bercak blur/smudge dan bergetar (flicker) antar frame.',
  },
  {
    id: 'delogo',
    name: 'FFmpeg Delogo Filter',
    conference: 'Spatial Interpolation',
    qualityScore: 5.0,
    temporalConsistencyScore: 4.0,
    vramRecommended: '0 GB (Hanya butuh CPU)',
    avgFps: '100+ FPS (CPU libavfilter)',
    bestFor: 'Hanya untuk pengaburan (blurring/pixelation) darurat tanpa AI.',
    algorithmType: 'Direct 4-corner Linear Pixel Interpolation',
    description: 
      'Bawaan filter standar FFmpeg (`-vf delogo=x=..:y=..:w=..:h=..`). Tidak melakukan rekonstruksi AI, melainkan hanya meratakan warna dari keempat sisi kotak. Watermark hilang namun digantikan kotak blur yang kentara.',
  },
];

export default function ModelComparison() {
  const [selectedModel, setSelectedModel] = useState<ModelDetail>(MODELS[0]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Comparative Model Benchmark</span>
          <span aria-hidden="true">·</span>
          <span>Open-Source Inpainting Engines</span>
          <span aria-hidden="true">·</span>
          <span>Hardware Efficiency</span>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-white mt-1">
          Rekomendasi Model AI & Engine Pemrosesan
        </h2>
        <p className="text-sm text-slate-400 max-w-3xl mt-0.5">
          Perbandingan mendalam antara model AI open-source (ProPainter vs E2FGVI vs OpenCV Telea vs FFmpeg).
          Temukan model yang tepat untuk skala bisnis, kualitas visual, dan anggaran komputasi Anda.
        </p>
      </div>

      {/* Comparison Grid Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-800/80 border-b border-slate-700 text-slate-300 font-semibold">
                <th className="p-3.5 pl-4">Model Engine</th>
                <th className="p-3.5">Mekanisme Utama</th>
                <th className="p-3.5 text-center">Skor Kualitas Visual</th>
                <th className="p-3.5 text-center">Konsistensi Temporal (Anti-Flicker)</th>
                <th className="p-3.5 text-center">VRAM Minimal</th>
                <th className="p-3.5 text-right pr-4">Inferensi Speed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {MODELS.map((m) => {
                const isSelected = selectedModel.id === m.id;
                return (
                  <tr 
                    key={m.id}
                    onClick={() => setSelectedModel(m)}
                    className={`cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-blue-950/40 text-white font-medium' 
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="p-3.5 pl-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${isSelected ? 'text-blue-400' : 'text-slate-100'}`}>
                          {m.name}
                        </span>
                        {m.id === 'propainter' && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-blue-900/60 text-blue-300 rounded font-semibold border border-blue-500/30">
                            Rekomendasi Utama
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-0.5">{m.conference}</span>
                    </td>
                    <td className="p-3.5 text-slate-300 max-w-xs truncate" title={m.algorithmType}>
                      {m.algorithmType}
                    </td>
                    <td className="p-3.5 text-center font-mono font-bold">
                      <span className={`px-2 py-0.5 rounded ${
                        m.qualityScore >= 9 ? 'bg-emerald-950 text-emerald-300' :
                        m.qualityScore >= 8 ? 'bg-blue-950 text-blue-300' :
                        'bg-amber-950 text-amber-300'
                      }`}>
                        {m.qualityScore}/10
                      </span>
                    </td>
                    <td className="p-3.5 text-center font-mono font-bold">
                      <span className={`px-2 py-0.5 rounded ${
                        m.temporalConsistencyScore >= 9 ? 'bg-emerald-950 text-emerald-300' :
                        m.temporalConsistencyScore >= 8 ? 'bg-blue-950 text-blue-300' :
                        'bg-amber-950 text-amber-300'
                      }`}>
                        {m.temporalConsistencyScore}/10
                      </span>
                    </td>
                    <td className="p-3.5 text-center font-mono text-slate-200">
                      {m.vramRecommended}
                    </td>
                    <td className="p-3.5 text-right pr-4 font-mono font-semibold text-slate-200">
                      {m.avgFps}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Model Deep Dive Focus Card */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-blue-400 font-bold uppercase">{selectedModel.id}</span>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs text-slate-400">{selectedModel.conference}</span>
            </div>
            <h3 className="text-lg font-bold text-white mt-0.5">{selectedModel.name}</h3>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Arsitektur:</span>
            <span className="px-2.5 py-1 bg-slate-800 text-blue-300 rounded border border-slate-700 font-mono">
              {selectedModel.algorithmType}
            </span>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">
          {selectedModel.description}
        </p>

        {/* Feature comparison highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3.5 bg-slate-800/40 rounded-lg border border-slate-700/50 space-y-1">
            <span className="text-xs font-semibold text-blue-400 block">Sangat Cocok Untuk:</span>
            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedModel.bestFor}
            </p>
          </div>

          <div className="p-3.5 bg-slate-800/40 rounded-lg border border-slate-700/50 space-y-1">
            <span className="text-xs font-semibold text-slate-400 block">Kebutuhan Hardware:</span>
            <p className="text-xs text-slate-300 font-mono leading-relaxed">
              VRAM: {selectedModel.vramRecommended} <br />
              Target GPU: Nvidia T4 / A10G / L4 (FP16 Torch)
            </p>
          </div>

          <div className="p-3.5 bg-slate-800/40 rounded-lg border border-slate-700/50 space-y-1">
            <span className="text-xs font-semibold text-emerald-400 block">Keunggulan Temporal:</span>
            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedModel.id === 'propainter' 
                ? 'Pixel optical flow digaransi konsisten antar frame berkat recurrent mask propagation.' 
                : selectedModel.id === 'e2fgvi' 
                ? 'Deformable alignment mencegah garis patah pada objek berkecepatan sedang.'
                : 'Tidak ada temporal tracking. Setiap frame diproses terpisah secara independen.'}
            </p>
          </div>
        </div>

        {/* Integration Instructions */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Code2 className="w-4 h-4 text-blue-400" />
              <span>Cara Integrasi Inferensi di Backend (Python PyTorch):</span>
            </div>
          </div>

          <div className="bg-[#070a0f] border border-slate-800 rounded-lg p-3.5 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
            {selectedModel.id === 'propainter' ? (
              <pre className="whitespace-pre-wrap">{`# Cara Install & Load Model ProPainter di Python:
# git clone https://github.com/sczhou/ProPainter.git
from model.propainter import InpaintGenerator
import torch

# Inisialisasi model pada GPU dengan half-precision (FP16)
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = InpaintGenerator().to(device).eval()
checkpoint = torch.load('weights/ProPainter.pth', map_location=device)
model.load_state_dict(checkpoint['params_ema'])

# Inferensi dengan sliding window batch (misal 10 frame per batch)
with torch.no_grad(), torch.cuda.amp.autocast():
    # frames: [B, C, T, H, W], masks: [B, 1, T, H, W]
    clean_frames = model(video_frames_tensor, binary_masks_tensor)`}</pre>
            ) : selectedModel.id === 'e2fgvi' ? (
              <pre className="whitespace-pre-wrap">{`# Integrasi Model E2FGVI (CVPR 2022):
# git clone https://github.com/MCG-NKU/E2FGVI.git
from core.trainer import InpaintingModel
import torch

device = torch.device('cuda')
net = InpaintingModel().to(device).eval()
net.load_state_dict(torch.load('weights/E2FGVI_CVPR2022.pth'))

# Inferensi batch tensor
with torch.no_grad():
    output_frames = net(frames_batch, masks_batch)`}</pre>
            ) : (
              <pre className="whitespace-pre-wrap">{`# Integrasi OpenCV Inpaint Telea (CPU Baseline - Sangat Cepat):
import cv2
import numpy as np

def inpaint_frame(frame: np.ndarray, mask: np.ndarray) -> np.ndarray:
    # inpaintRadius: 3-5px, INPAINT_TELEA menggunakan Fast Marching
    cleaned = cv2.inpaint(frame, mask, inpaintRadius=3, flags=cv2.INPAINT_TELEA)
    return cleaned`}</pre>
            )}
          </div>
        </div>
      </div>

      {/* Decision Tree Recommendation */}
      <div className="p-4 bg-blue-950/20 border border-blue-900/40 rounded-xl space-y-3">
        <h4 className="text-sm font-semibold text-blue-300">
          💡 Rekomendasi Arsitek untuk Proyek Anda:
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="space-y-1">
            <span className="font-semibold text-white">1. Jika Anda Mengincar Kualitas Commercial / SaaS:</span>
            <p className="text-slate-400 leading-relaxed">
              Gunakan <strong>ProPainter</strong> sebagai engine default. Kualitasnya sangat rapi, tidak ada artefak blur kotor, dan mampu menangani watermark TikTok yang bergerak atau memiliki gradien transparan.
            </p>
          </div>
          <div className="space-y-1">
            <span className="font-semibold text-white">2. Jika Anda Mengincar Kecepatan Ekstrem & Biaya Murah:</span>
            <p className="text-slate-400 leading-relaxed">
              Gunakan <strong>E2FGVI</strong> untuk server GPU tier menengah (Nvidia T4), atau sediakan opsi fallback <strong>OpenCV Telea</strong> untuk user gratisan / free tier agar server tidak terbebani komputasi GPU berat.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
