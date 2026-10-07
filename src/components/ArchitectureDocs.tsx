import React from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  Cpu, 
  Server, 
  Film, 
  ShieldCheck, 
  Zap, 
  AlertTriangle,
  Layers,
  Clock,
  DollarSign
} from 'lucide-react';

export default function ArchitectureDocs() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Technical Architecture Whitepaper</span>
          <span aria-hidden="true">·</span>
          <span>Bahasa Indonesia</span>
          <span aria-hidden="true">·</span>
          <span>Production Blueprint</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
          Panduan Lengkap Arsitektur Sistem Video Inpainting & Watermark Removal
        </h2>
        <p className="text-sm text-slate-400 mt-1 leading-relaxed">
          Dokumen teknis komprehensif rancangan aplikasi penghapus watermark video 1-2 menit secara otomatis, bersih, dan temporal stabil.
        </p>
      </div>

      {/* Bagian 1: Rekomendasi Tech Stack */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5 text-lg font-bold text-white">
          <span className="flex items-center justify-center w-7 h-7 rounded-md bg-blue-600/20 text-blue-400 text-xs font-mono font-bold border border-blue-500/30">
            01
          </span>
          <h3>Rekomendasi Tech Stack & Alasan Pemilihan</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Frontend */}
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold">
              <Film className="w-4 h-4" />
              <span>Frontend Layer</span>
            </div>
            <p className="text-xs font-mono text-slate-200">React / Next.js + Tailwind CSS + HTML5 Canvas API</p>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4 leading-relaxed">
              <li><strong>HTML5 Canvas:</strong> Memberikan pengalaman interaktif bagi user untuk menggambar Bounding Box (ROI) langsung di atas video player.</li>
              <li><strong>WebSocket / SSE:</strong> Menerima update status per frame dari server (progress bar & estimasi waktu selesai).</li>
              <li><strong>Lightweight:</strong> Tidak membebani browser pengguna karena komputasi berat 100% dipindahkan ke server worker.</li>
            </ul>
          </div>

          {/* Backend & Queue */}
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-purple-400 text-sm font-semibold">
              <Server className="w-4 h-4" />
              <span>Backend & Worker</span>
            </div>
            <p className="text-xs font-mono text-slate-200">FastAPI + Redis + Celery / BullMQ</p>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4 leading-relaxed">
              <li><strong>FastAPI (Asynchronous):</strong> Cepat menangani upload video berukuran besar secara streaming tanpa memblokir event loop.</li>
              <li><strong>Celery + Redis:</strong> Mengisolasi pemrosesan video berat ke background worker. Server HTTP tetap responsif meskipun 100 user sedang upload.</li>
              <li><strong>Worker Concurrency 1:</strong> Membatasi pemrosesan 1 task per GPU instance untuk mencegah tabrakan VRAM (Out Of Memory).</li>
            </ul>
          </div>

          {/* AI Model Engine */}
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
              <Cpu className="w-4 h-4" />
              <span>AI Inpainting Engine</span>
            </div>
            <p className="text-xs font-mono text-slate-200">ProPainter (ICCV 2023) / E2FGVI</p>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4 leading-relaxed">
              <li><strong>ProPainter (Rekomendasi Utama):</strong> Menggunakan aliran optik dua arah (dual-domain flow) yang meminjam pixel latar belakang dari frame lain. Video tidak bergetar/flicker.</li>
              <li><strong>E2FGVI:</strong> Alternatif yang 40% lebih cepat dengan konsumsi VRAM lebih hemat untuk throughput massal.</li>
              <li><strong>OpenCV Telea (Fallback):</strong> Digunakan untuk user tier gratis tanpa GPU pada video latar belakang statis.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Bagian 2: Pipeline Alur Kerja Sistem */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5 text-lg font-bold text-white">
          <span className="flex items-center justify-center w-7 h-7 rounded-md bg-blue-600/20 text-blue-400 text-xs font-mono font-bold border border-blue-500/30">
            02
          </span>
          <h3>Alur Kerja Sistem (Pipeline End-to-End)</h3>
        </div>

        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4 text-xs text-slate-300 leading-relaxed">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="font-mono text-blue-400 font-bold text-sm">1.</span>
              <div>
                <strong className="text-white text-sm block">Unggah Video & Ekstraksi Audio Lossless</strong>
                User mengunggah video 1-2 menit via frontend. Server segera mengekstrak track audio asli secara lossless menggunakan perintah FFmpeg <code>-vn -c:a copy</code> ke file terpisah. Langkah ini menjamin audio tidak mengalami penurunan kualitas atau perubahan bitrate.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="font-mono text-blue-400 font-bold text-sm">2.</span>
              <div>
                <strong className="text-white text-sm block">Deteksi / Seleksi Area Watermark & Dilation Mask</strong>
                User menentukan kotak ROI (bisa preset TikTok/CapCut atau manual). Server mengonversi koordinat relatif ke ukuran pixel absolut frame. Mask biner diperlebar (dilation) sebesar 5-7 pixel menggunakan <code>cv2.dilate</code> agar batas semi-transparan dan drop shadow watermark ikut tertutup sempurna.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="font-mono text-blue-400 font-bold text-sm">3.</span>
              <div>
                <strong className="text-white text-sm block">Dekomposisi Frame ke RAM-Disk (/dev/shm)</strong>
                Alih-alih menyimpan 3.600 gambar PNG ke harddisk/SSD yang lambat, FFmpeg mengekstrak frame ke shared memory Linux (<code>/dev/shm</code>). Kecepatan baca-tulis mencapai ribuan MB/detik, menghilangkan 90% waktu tunggu I/O disk.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="font-mono text-blue-400 font-bold text-sm">4.</span>
              <div>
                <strong className="text-white text-sm block">Inferensi Inpainting dengan Sliding Window</strong>
                Worker GPU memproses frame dalam batch kecil (misal: 10 frame per sliding window dengan overlap 2 frame). ProPainter menghitung optical flow RAFT untuk menyalin tekstur latar belakang yang bergerak, lalu transformer mengisi area kosong. VRAM GPU tetap stabil di kisaran 8-12 GB tanpa risiko crash.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="font-mono text-blue-400 font-bold text-sm">5.</span>
              <div>
                <strong className="text-white text-sm block">Re-encoding Video & Audio Muxing Presisi</strong>
                FFmpeg merangkai kembali seluruh frame bersih menjadi stream H.264 dengan flag <code>-pix_fmt yuv420p -crf 18</code>, lalu menyatukan kembali file audio asli dari langkah 1 dengan flag <code>-c:a copy -shortest -movflags +faststart</code>. Video langsung siap diputar di browser web tanpa buffering lama.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="font-mono text-blue-400 font-bold text-sm">6.</span>
              <div>
                <strong className="text-white text-sm block">Delivery Hasil & Otomatisasi Pembersihan (Cleanup)</strong>
                Video disimpan ke storage cloud (S3 / Cloud Storage) dan tautan unduh dikirim ke user via WebSocket. Seluruh sisa file sementara di <code>/dev/shm</code> langsung dihapus melalui blok <code>finally: shutil.rmtree()</code>.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bagian 3: Solusi Masalah Nyata */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5 text-lg font-bold text-white">
          <span className="flex items-center justify-center w-7 h-7 rounded-md bg-blue-600/20 text-blue-400 text-xs font-mono font-bold border border-blue-500/30">
            03
          </span>
          <h3>Solusi Arsitektur untuk Tantangan Dunia Nyata</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
              <Zap className="w-4 h-4" />
              <span>Watermark Bergerak (TikTok)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Pada video TikTok, logo sering berpindah antara pojok kanan-bawah dan kiri-atas setiap beberapa detik. 
              <strong> Solusi:</strong> Jalankan deteksi teks otomatis berbasis <strong>YOLOv8-text</strong> atau buat <strong>Timeline Keyframe Mask</strong> (misal: Mask A aktif di detik 0-4s, Mask B aktif di detik 5-9s).
            </p>
          </div>

          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Pencegahan Audio Desync</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Audio desync terjadi jika video input memiliki Variable Frame Rate (VFR) dan di-encode ulang menjadi Constant Frame Rate (CFR).
              <strong> Solusi:</strong> Gunakan opsi FFmpeg <code>-vsync cfr</code> pada ekstraksi frame awal dan jaga Presentation Time Stamp (PTS) tetap identik.
            </p>
          </div>

          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4" />
              <span>Pencegahan Server Crash (Anti-OOM)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Video 2 menit 1080p terdiri dari 3.600 frame gambar (~22 GB memori uncompressed).
              <strong> Solusi:</strong> Aktifkan PyTorch <code>torch.cuda.amp.autocast(dtype=torch.float16)</code> dan batasi window inpainting maksimal 10-15 frame per iterasi.
            </p>
          </div>
        </div>
      </section>

      {/* Bagian 4: Estimasi Hardware & Biaya */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5 text-lg font-bold text-white">
          <span className="flex items-center justify-center w-7 h-7 rounded-md bg-blue-600/20 text-blue-400 text-xs font-mono font-bold border border-blue-500/30">
            04
          </span>
          <h3>Kebutuhan Komputasi, VRAM, dan Estimasi Waktu Proses</h3>
        </div>

        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4 text-xs text-slate-300 leading-relaxed">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-white text-sm">Spesifikasi Minimal Server / GPU:</h4>
              <ul className="space-y-1.5 list-disc pl-4 text-slate-400">
                <li><strong>GPU VRAM:</strong> Minimal <strong>16 GB VRAM</strong> (NVIDIA T4 atau A10G) untuk video 720p/1080p dengan ProPainter. Jika video 720p saja, 8 GB VRAM (RTX 3070/4060) sudah mencukupi.</li>
                <li><strong>CPU:</strong> Minimal 4 vCPU (untuk menangani demuxing FFmpeg dan encode H.264).</li>
                <li><strong>Sistem RAM:</strong> Minimal 16 GB RAM (alokasikan minimal 6 GB untuk mount <code>/dev/shm</code>).</li>
                <li><strong>Disk Storage:</strong> SSD 50 GB (sebagai temporary swap dan model weights).</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-white text-sm">Estimasi Waktu Proses per Menit Video:</h4>
              <ul className="space-y-1.5 list-disc pl-4 text-slate-400">
                <li><strong>NVIDIA A10G (24 GB) / L4:</strong> Memproses video 1 menit (1.800 frame 30 FPS) dalam waktu <strong>~25 - 35 detik</strong> (kecepatan 0.5x durasi asli, lebih cepat dari pemutaran realtime!).</li>
                <li><strong>NVIDIA T4 (16 GB):</strong> Memproses video 1 menit dalam waktu <strong>~80 - 100 detik</strong> (kecepatan 1.5x durasi asli).</li>
                <li><strong>CPU-Only (OpenCV Telea):</strong> Memproses video 1 menit dalam waktu <strong>~25 - 40 detik</strong> pada 8-core CPU (namun kualitas visual hanya batas heuristik).</li>
              </ul>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800">
            <div className="p-3.5 bg-emerald-950/30 border border-emerald-900/50 rounded-lg flex items-center justify-between">
              <div>
                <span className="font-semibold text-emerald-300 block">Rekomendasi Skalabilitas Produksi:</span>
                <span className="text-slate-300 text-[11px]">
                  Gunakan platform <strong>Serverless GPU (Modal Labs atau RunPod Serverless)</strong>. Biaya per 1 menit video hanya sekitar <strong>$0.008 - $0.012</strong> (sekitar Rp 130 - Rp 190 per video).
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
