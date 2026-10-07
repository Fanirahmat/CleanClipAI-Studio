import React, { useState } from 'react';
import { 
  UploadCloud, 
  Crop, 
  Layers, 
  Cpu, 
  Film, 
  CheckCircle2, 
  ArrowRight, 
  Terminal, 
  AlertTriangle,
  Server,
  Zap,
  Volume2
} from 'lucide-react';

interface PipelineStep {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  inputData: string;
  outputData: string;
  technologies: string[];
  description: string;
  keyChallenge: string;
  architectSolution: string;
  codeSnippet: string;
}

const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: 'upload',
    number: '01',
    title: 'Ingestion & Video Validation',
    subtitle: 'Upload, Sanity Check & Container Demuxing',
    icon: UploadCloud,
    inputData: 'File Video Mentah (.mp4 / .mov / .webm up to 100MB)',
    outputData: 'Parsed Metadata (Codec, Duration, FPS, SAR/DAR) + Clean Audio Track',
    technologies: ['FastAPI Multipart Upload', 'FFprobe JSON', 'S3 / Local Storage'],
    description: 
      'Klien mengunggah video 1-2 menit. Server melakukan validasi durasi (maks 120s), integritas container moov atom, dan mengekstrak audio stream secara instan tanpa re-encoding (`-c:a copy`) untuk mengantisipasi audio loss.',
    keyChallenge: 
      'Penyimpanan disk lokal lambat jika video langsung diekstrak ribuan gambar PNG ke disk biasa (NVMe bottleneck).',
    architectSolution: 
      'Simpan video ke temporary memory mount `/dev/shm` (RAM-disk di Linux) untuk throughput I/O 10x lebih cepat daripada SSD.',
    codeSnippet: `// Ekstrak audio asli secara lossless sebelum video disentuh
ffmpeg -i input.mp4 -vn -c:a copy extracted_audio.aac -y

// Inspeksi metadata resolusi dan FPS
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,duration -of json input.mp4`,
  },
  {
    id: 'detection',
    number: '02',
    title: 'Watermark Localization & Masking',
    subtitle: 'Manual ROI Drag & Drop atau Otomatisasi YOLOv8 / SAM',
    icon: Crop,
    inputData: 'Video frame awal + Koordinat Bounding Box [x, y, w, h] atau deteksi teks',
    outputData: 'Mask Biner 2D (0 = pixel asli, 255 = area inpainting) berdimensi sama dengan frame',
    technologies: ['HTML5 Canvas (Frontend)', 'OpenCV cv2.inRange / Dilation', 'YOLOv8-Text / SAM'],
    description: 
      'Menentukan area yang akan dihapus. Pengguna dapat memilih preset (TikTok/CapCut) atau menggambar kotak ROI pada video preview. Server mengonversi koordinat relatif (%) menjadi koordinat pixel absolut dan membuat mask biner dengan teknik pelebaran (dilation).',
    keyChallenge: 
      'Watermark transparan (alpha channel) sering meninggalkan bayangan samar (halo effect) jika mask hanya seukuran teks.',
    architectSolution: 
      'Terapkan `cv2.dilate(mask, kernel=np.ones((7,7)))` sebanyak 2-3 iterasi agar batas blur dan alpha gradient ikut tertutup sempurna oleh inpainting.',
    codeSnippet: `# Masking dengan Dilation untuk menghilangkan halo effect
mask = np.zeros((height, width), dtype=np.uint8)
mask[y : y + h, x : x + w] = 255

# Pelebaran 5px agar border semi-transparan ikut tertutup
kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7))
dilated_mask = cv2.dilate(mask, kernel, iterations=2)`,
  },
  {
    id: 'queue',
    number: '03',
    title: 'Queue & Worker Dispatch',
    subtitle: 'Decoupling Request Web dari Heavy GPU Inpainting',
    icon: Server,
    inputData: 'Task Payload: {job_id, video_path, mask_config, model_name}',
    outputData: 'Job ID terdaftar di Redis & Celery Worker menerima job',
    technologies: ['Celery Distributed Task', 'Redis Broker / BullMQ', 'WebSocket / SSE'],
    description: 
      'Pemrosesan video 1-2 menit memerlukan 20-60 detik komputasi GPU. Permintaan TIDAK BOLEH diproses secara synchronous di HTTP thread agar server FastAPI tidak timeout/freeze. Job dikirim ke Redis Queue untuk diambil oleh worker GPU khusus.',
    keyChallenge: 
      'Server OOM (Out Of Memory) jika 10 pengguna submit video secara bersamaan ke 1 GPU.',
    architectSolution: 
      'Konfigurasi worker Celery dengan `--concurrency=1` per GPU instance, sehingga GPU memproses 1 antrean video secara bergantian (FIFO) tanpa tumpang-tindih VRAM.',
    codeSnippet: `# celery_app.py
from celery import Celery

app = Celery('video_tasks', broker='redis://localhost:6379/0', backend='redis://localhost:6379/1')
app.conf.update(
    task_acks_late=True,
    worker_prefetch_multiplier=1, # Jangan serobot task sebelum task aktif selesai
)`,
  },
  {
    id: 'inpainting',
    number: '04',
    title: 'Frame Inpainting & Optical Flow',
    subtitle: 'Deep Video Inpainting (ProPainter / E2FGVI)',
    icon: Cpu,
    inputData: 'Sequence Frames RGB + Sequence Mask Biner',
    outputData: 'Sequence Frame Bersih Hasil Rekonstruksi (Tanpa Watermark)',
    technologies: ['ProPainter (ICCV 2023)', 'RAFT Optical Flow', 'PyTorch CUDA 12', 'Torch FP16'],
    description: 
      'Jantung utama sistem. ProPainter melakukan propagasi aliran optik dua arah (dual-domain optical flow) untuk meminjam pixel latar belakang yang bergerak dari frame sebelumnya dan sesudahnya, kemudian transformer melengkapi tekstur yang hilang sehingga tidak ada flickering.',
    keyChallenge: 
      'Video 2 menit 30 FPS memiliki 3.600 frame! Memasukkan semua frame sekaligus ke GPU akan langsung menyebabkan CUDA Out Of Memory (OOM).',
    architectSolution: 
      'Gunakan teknik Sliding Window (misal: window size = 10 frames dengan overlap 2 frames). Video diproses secara streaming chunk-by-chunk.',
    codeSnippet: `# Sliding Window Memory Management
window_size = 10  # Ukuran jendela frame
overlap = 2       # Overlap untuk memastikan kontinuitas temporal

for start_idx in range(0, total_frames, window_size - overlap):
    frame_batch = frames[start_idx : start_idx + window_size]
    mask_batch = masks[start_idx : start_idx + window_size]
    
    with torch.no_grad(), torch.cuda.amp.autocast():
        # Inferensi ProPainter pada GPU FP16
        clean_batch = propainter_model(frame_batch, mask_batch)
    
    save_clean_frames(clean_batch)`,
  },
  {
    id: 'encoding',
    number: '05',
    title: 'FFmpeg Audio Sync & Re-encoding',
    subtitle: 'Re-muxing H.264/H.265 dengan Audio Asli & Web Optimization',
    icon: Film,
    inputData: 'Frame-frame bersih + File audio asli hasil ekstraksi di langkah 01',
    outputData: 'File Video Final MP4 yang siap ditonton dan diunduh',
    technologies: ['FFmpeg libx264', 'AAC Audio', 'FastStart (moov atom)'],
    description: 
      'FFmpeg merangkai kembali seluruh frame yang telah dibersihkan menjadi video stream H.264/MP4, kemudian menggabungkan audio asli secara presisi dengan flag `-c:a copy` atau re-encode AAC jika ada bitrate matching, serta menambahkan `-movflags +faststart` agar video langsung bisa di-play di browser tanpa menunggu selesai unduh.',
    keyChallenge: 
      'Audio sering desync (suara lebih cepat/lambat beberapa milidetik dari video) jika framerate berubah dari VFR (Variable Frame Rate) ke CFR.',
    architectSolution: 
      'Paksa `-vsync cfr` atau `-r {original_fps}` dan jaga timestamp PTS (Presentation Time Stamp) saat re-muxing.',
    codeSnippet: `# Merangkai frame menjadi video + menyatukan kembali audio asli tanpa desync
ffmpeg -y -r 30 -f image2 -i /dev/shm/clean_%05d.png \\
       -i extracted_audio.aac \\
       -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \\
       -c:a copy -shortest \\
       -movflags +faststart output_clean.mp4`,
  },
  {
    id: 'delivery',
    number: '06',
    title: 'Ready for Download & Cleanup',
    subtitle: 'Signed URL, WebSocket Completion & Garbage Collector',
    icon: CheckCircle2,
    inputData: 'Final MP4 File',
    outputData: 'Presigned Download URL + WebSocket Event notification',
    technologies: ['Presigned URL S3', 'Auto-delete TTL (24 Jam)', 'shutil.rmtree'],
    description: 
      'Video akhir diunggah ke storage cloud (S3 / Cloud Storage / MinIO). Pengguna menerima notifikasi via WebSocket bahwa video selesai, menampilkan preview side-by-side, dan tombol unduh. Temporary frame di RAM-disk `/dev/shm` langsung dibersihkan seketika untuk menjaga kapasitas memori server.',
    keyChallenge: 
      'Disk server penuh (disk leak) karena sisa frame sementara yang terakumulasi ribuan giga per hari.',
    architectSolution: 
      'Selalu bungkus pipeline pemrosesan dalam blok `try...finally` yang memanggil fungsi pembersihan folder sampah `/dev/shm/{job_id}` tanpa terkecuali.',
    codeSnippet: `try:
    process_video_pipeline(job_id)
finally:
    # Selalu bersihkan temporary files di RAM disk
    if os.path.exists(temp_job_dir):
        shutil.rmtree(temp_job_dir)
    torch.cuda.empty_cache()`,
  },
];

export default function PipelineVisualizer() {
  const [selectedStep, setSelectedStep] = useState<PipelineStep>(PIPELINE_STEPS[3]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>End-to-End System Architecture</span>
          <span aria-hidden="true">·</span>
          <span>Zero-Drop Audio Sync</span>
          <span aria-hidden="true">·</span>
          <span>Sliding-Window GPU Streaming</span>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-white mt-1">
          Alur Kerja Sistem (Pipeline Step-by-Step)
        </h2>
        <p className="text-sm text-slate-400 max-w-3xl mt-0.5">
          Arsitektur lengkap dari saat user mengunggah video hingga encoding akhir dengan FFmpeg. 
          Pilih salah satu tahapan di bawah untuk melihat rincian teknis, solusi anti-OOM, dan cuplikan kodenya.
        </p>
      </div>

      {/* Interactive Step Carousel / Progress Chain */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {PIPELINE_STEPS.map((step) => {
          const Icon = step.icon;
          const isSelected = selectedStep.id === step.id;
          return (
            <button
              key={step.id}
              onClick={() => setSelectedStep(step)}
              className={`text-left p-3 rounded-lg border transition-all cursor-pointer relative overflow-hidden ${
                isSelected 
                  ? 'bg-blue-950/60 border-blue-500 shadow-lg shadow-blue-500/10' 
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-mono font-bold ${isSelected ? 'text-blue-400' : 'text-slate-500'}`}>
                  {step.number}
                </span>
                <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-slate-400'}`} />
              </div>
              <h4 className={`text-xs font-semibold leading-tight line-clamp-1 ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                {step.title}
              </h4>
              <p className="text-[11px] text-slate-400 line-clamp-1 mt-1">
                {step.subtitle}
              </p>
            </button>
          );
        })}
      </div>

      {/* Selected Step Deep Dive Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-6">
        
        {/* Step Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <selectedStep.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-blue-400 font-bold">LANGKAH {selectedStep.number}</span>
                <span className="text-xs text-slate-500">·</span>
                <span className="text-xs text-slate-400">{selectedStep.subtitle}</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-0.5">
                {selectedStep.title}
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {selectedStep.technologies.map((t) => (
              <span key={t} className="px-2.5 py-1 text-xs bg-slate-800 text-slate-300 rounded border border-slate-700 font-mono">
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Description & Challenges */}
          <div className="lg:col-span-7 space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Mekanisme Kerja
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                {selectedStep.description}
              </p>
            </div>

            {/* Input & Output Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
                <span className="text-[11px] font-medium text-slate-400 block mb-1">
                  📥 Input Data:
                </span>
                <span className="text-xs text-slate-200 leading-tight">
                  {selectedStep.inputData}
                </span>
              </div>
              <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
                <span className="text-[11px] font-medium text-slate-400 block mb-1">
                  📤 Output Data:
                </span>
                <span className="text-xs text-emerald-300 leading-tight">
                  {selectedStep.outputData}
                </span>
              </div>
            </div>

            {/* Challenge & Solution */}
            <div className="space-y-2 pt-2">
              <div className="p-3.5 bg-amber-950/30 border border-amber-900/50 rounded-lg space-y-1">
                <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Potensi Bottleneck / Tantangan Kritis:</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedStep.keyChallenge}
                </p>
              </div>

              <div className="p-3.5 bg-blue-950/30 border border-blue-900/50 rounded-lg space-y-1">
                <div className="flex items-center gap-2 text-blue-300 text-xs font-semibold">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Solusi Arsitektural Senior:</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedStep.architectSolution}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Code Snippet */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Terminal className="w-3.5 h-3.5 text-blue-400" />
                <span>Implementasi Perintah / Skrip</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Bash / Python</span>
            </div>

            <div className="flex-1 bg-[#070a0f] border border-slate-800 rounded-lg p-3.5 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed shadow-inner">
              <pre className="whitespace-pre-wrap">{selectedStep.codeSnippet}</pre>
            </div>
          </div>

        </div>

      </div>

      {/* Audio Sync & Temporal Integrity Callout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Volume2 className="w-4 h-4 text-emerald-400" />
            <span>Jaminan Audio 100% Sinkron (No Desync)</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Karena inpainting hanya merekonstruksi track visual (video frame), track audio 
            tidak boleh di-decode dan di-encode berulang kali. Alur kami mengekstrak container audio 
            secara utuh (`-c:a copy`) lalu mem-pasangkan kembali ke video akhir dengan menyamakan framerate 
            CFR (Constant Frame Rate), memastikan durasi audio dan video sama persis hingga milidetik terakhir.
          </p>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Cpu className="w-4 h-4 text-purple-400" />
            <span>Anti-OOM dengan RAM-Disk & Sliding Window</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Video 2 menit 1080p berisi 3.600 frame gambar uncompressed (~22 GB jika di-load sekaligus ke RAM/GPU). 
            Dengan sliding window 10 frame dan penggunaan shared memory `/dev/shm`, server GPU hanya membutuhkan 
            VRAM 7-9 GB konstan dari awal video hingga akhir, mencegah 100% crash CUDA Out Of Memory.
          </p>
        </div>
      </div>
    </div>
  );
}
