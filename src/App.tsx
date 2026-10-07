import React, { useState } from 'react';
import Navbar from './components/Navbar';
import VideoStudio from './components/VideoStudio';
import PipelineVisualizer from './components/PipelineVisualizer';
import ModelComparison from './components/ModelComparison';
import CodeViewer from './components/CodeViewer';
import CostCalculator from './components/CostCalculator';
import ArchitectureDocs from './components/ArchitectureDocs';
import { Sparkles, Layers, Cpu, FileCode, Calculator, BookOpen } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'studio' | 'pipeline' | 'models' | 'code' | 'calculator' | 'docs'>('studio');

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f17] text-slate-100">
      {/* Top Bar adhering to 3-zone contract */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Quick Nav Segmented Switcher for Mobile / Quick Access */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-lg overflow-x-auto">
          <button
            onClick={() => setActiveTab('studio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'studio' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('pipeline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'pipeline' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Pipeline System</span>
          </button>

          <button
            onClick={() => setActiveTab('models')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'models' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Model Comparison</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'code' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Production Code</span>
          </button>

          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'calculator' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>GPU & Cost Calculator</span>
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'docs' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Panduan Lengkap (ID)</span>
          </button>
        </div>

        {/* Viewport content */}
        {activeTab === 'studio' && <VideoStudio />}
        {activeTab === 'pipeline' && <PipelineVisualizer />}
        {activeTab === 'models' && <ModelComparison />}
        {activeTab === 'code' && <CodeViewer />}
        {activeTab === 'calculator' && <CostCalculator />}
        {activeTab === 'docs' && <ArchitectureDocs />}

      </main>

      {/* Clean minimal footer without mechanical pseudo-telemetry */}
      <footer className="mt-auto border-t border-slate-800/80 py-6 px-6 bg-[#080b11]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">CleanClip AI Studio</span>
            <span aria-hidden="true">·</span>
            <span>Video Inpainting Architecture & Full-Stack Blueprint</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button 
              onClick={() => setActiveTab('docs')} 
              className="hover:text-blue-400 transition-colors cursor-pointer"
            >
              Panduan Arsitektur
            </button>
            <button 
              onClick={() => setActiveTab('code')} 
              className="hover:text-blue-400 transition-colors cursor-pointer"
            >
              Source Code
            </button>
            <button 
              onClick={() => setActiveTab('calculator')} 
              className="hover:text-blue-400 transition-colors cursor-pointer"
            >
              Kalkulator Biaya
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
