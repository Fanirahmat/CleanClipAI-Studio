interface NavbarProps {
  activeTab: 'studio' | 'pipeline' | 'models' | 'code' | 'calculator' | 'docs';
  setActiveTab: (tab: 'studio' | 'pipeline' | 'models' | 'code' | 'calculator' | 'docs') => void;
}

export default function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3.5 bg-[#0b0f17]/90 backdrop-blur-md border-b border-slate-800/80">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3">
        <a 
          href="#studio" 
          onClick={(e) => { e.preventDefault(); setActiveTab('studio'); }}
          className="text-lg font-bold tracking-tight text-white hover:text-blue-400 transition-colors"
        >
          CleanClip Studio
        </a>
        <span className="hidden sm:inline-block text-xs text-slate-400 border-l border-slate-700 pl-3">
          AI Video Inpainting & Watermark Removal Architecture
        </span>
      </div>

      {/* Zone 2: 4-6 clean text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
        <button
          onClick={() => setActiveTab('studio')}
          className={`cursor-pointer transition-colors ${
            activeTab === 'studio' ? 'text-blue-400 font-semibold' : 'hover:text-white'
          }`}
        >
          Interactive Studio
        </button>
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`cursor-pointer transition-colors ${
            activeTab === 'pipeline' ? 'text-blue-400 font-semibold' : 'hover:text-white'
          }`}
        >
          Pipeline System
        </button>
        <button
          onClick={() => setActiveTab('models')}
          className={`cursor-pointer transition-colors ${
            activeTab === 'models' ? 'text-blue-400 font-semibold' : 'hover:text-white'
          }`}
        >
          Model Matrix
        </button>
        <button
          onClick={() => setActiveTab('code')}
          className={`cursor-pointer transition-colors ${
            activeTab === 'code' ? 'text-blue-400 font-semibold' : 'hover:text-white'
          }`}
        >
          Source Code
        </button>
        <button
          onClick={() => setActiveTab('calculator')}
          className={`cursor-pointer transition-colors ${
            activeTab === 'calculator' ? 'text-blue-400 font-semibold' : 'hover:text-white'
          }`}
        >
          GPU & Cost
        </button>
        <button
          onClick={() => setActiveTab('docs')}
          className={`cursor-pointer transition-colors ${
            activeTab === 'docs' ? 'text-blue-400 font-semibold' : 'hover:text-white'
          }`}
        >
          Panduan Lengkap
        </button>
      </nav>

      {/* Zone 3: 1-2 primary actions */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => setActiveTab('code')}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 rounded-md transition-colors cursor-pointer whitespace-nowrap"
        >
          FastAPI & Celery Code
        </button>
        <button
          onClick={() => setActiveTab('studio')}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors cursor-pointer whitespace-nowrap shadow-sm shadow-blue-500/20"
        >
          Try Inpainting Demo
        </button>
      </div>
    </header>
  );
}
