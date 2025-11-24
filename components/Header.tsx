import React from 'react';
import { Layers, Sparkles } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white/60 backdrop-blur-xl border-b border-white/40 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600/90 backdrop-blur-sm p-2 rounded-lg shadow-lg shadow-indigo-500/20">
              <Layers className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">NAGAxStudio Ai</h1>
              <p className="text-xs text-indigo-600 font-medium">Powered by Gemini 2.5 Flash</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center space-x-4">
            <a href="#" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">Documentation</a>
            <div className="h-4 w-px bg-gray-400/50"></div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100/50 text-indigo-800 border border-indigo-200/50">
              <Sparkles className="w-3 h-3 mr-1" />
              v1.0 Beta
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};