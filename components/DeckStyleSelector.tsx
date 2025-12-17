
import React from 'react';
import { DECK_STYLES } from '../constants';
import { DeckStyle } from '../types';
import { Palette } from 'lucide-react';

interface DeckStyleSelectorProps {
  onSelect: (style: DeckStyle) => void;
  selectedStyleId: string | null;
}

export const DeckStyleSelector: React.FC<DeckStyleSelectorProps> = ({ onSelect, selectedStyleId }) => {
  
  const renderThumbnailContent = (style: DeckStyle) => {
    switch (style.id) {
      case 'glass-light':
        return (
          <div className="w-full h-full relative p-2 overflow-hidden" style={{ backgroundColor: '#eef2ff' }}>
             {/* Blobs */}
             <div className="absolute top-[-10px] right-[-10px] w-16 h-16 bg-purple-300 rounded-full blur-xl opacity-60"></div>
             <div className="absolute bottom-[-10px] left-[-10px] w-12 h-12 bg-blue-300 rounded-full blur-xl opacity-60"></div>
             {/* Glass Card */}
             <div className="relative z-10 bg-white/40 backdrop-blur-md border border-white/60 rounded-lg p-2 h-full shadow-sm flex flex-col justify-center">
               <div className="h-2 w-1/2 bg-indigo-900/10 rounded mb-2"></div>
               <div className="space-y-1">
                 <div className="h-1 w-full bg-indigo-900/5 rounded"></div>
                 <div className="h-1 w-3/4 bg-indigo-900/5 rounded"></div>
               </div>
             </div>
          </div>
        );

      case 'glass-dark':
        return (
          <div className="w-full h-full relative p-2 overflow-hidden" style={{ backgroundColor: '#0f172a' }}>
             {/* Neon Blob */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-cyan-500/20 rounded-full blur-xl"></div>
             {/* Glass Card */}
             <div className="relative z-10 bg-slate-800/40 backdrop-blur-md border border-white/10 rounded-lg p-2 h-full shadow-lg flex flex-col justify-center items-center text-center">
               <div className="text-[10px] text-white font-medium mb-1 tracking-wider">FUTURE</div>
               <div className="h-0.5 w-8 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
             </div>
          </div>
        );

      case 'swiss-minimal':
        return (
          <div className="w-full h-full relative p-2 font-sans" style={{ backgroundColor: style.previewColors.bg }}>
            {/* Grid Line */}
            <div className="absolute top-0 left-[30%] bottom-0 w-px bg-red-500/20"></div>
            {/* Big Title */}
            <div className="text-[10px] font-black tracking-tighter leading-none" style={{ color: style.previewColors.text }}>
              HELVETICA<br/>GRID<br/>SYSTEM
            </div>
            {/* Accent Square */}
            <div className="absolute bottom-2 right-2 w-3 h-3" style={{ backgroundColor: style.previewColors.accent }}></div>
            {/* Body Text Block */}
            <div className="absolute bottom-2 left-[34%] right-2 space-y-1">
              <div className="h-0.5 bg-black w-full"></div>
              <div className="h-0.5 bg-black w-3/4"></div>
              <div className="h-0.5 bg-black w-1/2"></div>
            </div>
          </div>
        );

      case 'tech-noir':
        return (
          <div className="w-full h-full relative p-2 overflow-hidden font-mono" style={{ backgroundColor: style.previewColors.bg }}>
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:10px_10px]"></div>
            {/* Glowing Border */}
            <div className="absolute inset-1 border border-cyan-500/50 rounded-sm"></div>
            {/* Data Viz */}
            <div className="absolute top-3 right-3 flex gap-0.5 items-end">
               <div className="w-1 h-3 bg-cyan-500"></div>
               <div className="w-1 h-5 bg-cyan-500/50"></div>
               <div className="w-1 h-2 bg-cyan-500"></div>
            </div>
            {/* Title */}
            <div className="absolute top-3 left-3 text-[8px] text-cyan-400 tracking-widest">
              > SYSTEM_READY
            </div>
             {/* Content */}
             <div className="absolute bottom-3 left-3 w-2/3">
                <div className="h-1 w-full bg-cyan-900/50 mb-1"></div>
                <div className="h-1 w-2/3 bg-cyan-900/50"></div>
             </div>
          </div>
        );

      case 'eco-modern':
        return (
          <div className="w-full h-full relative p-2" style={{ backgroundColor: style.previewColors.bg }}>
             {/* Organic Shape */}
             <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full opacity-30" style={{ backgroundColor: style.previewColors.accent }}></div>
             {/* Image placeholder */}
             <div className="absolute top-2 right-2 w-10 h-10 rounded-tl-xl rounded-br-xl bg-green-200 opacity-50"></div>
             {/* Serif Title */}
             <div className="text-[10px] font-serif italic relative z-10" style={{ color: style.previewColors.text }}>
               Nature & <br/> Balance
             </div>
             {/* Soft Text */}
             <div className="mt-2 space-y-1 w-1/2">
                <div className="h-0.5 bg-green-800/30 w-full rounded-full"></div>
                <div className="h-0.5 bg-green-800/30 w-3/4 rounded-full"></div>
             </div>
          </div>
        );

      case 'bold-pop':
        return (
          <div className="w-full h-full relative p-2 border-2 border-black" style={{ backgroundColor: style.previewColors.bg }}>
            {/* Brutalist Shadow Box */}
            <div className="absolute top-2 right-2 w-6 h-6 border border-black bg-pink-400"></div>
            {/* Bold Title */}
            <div className="absolute bottom-2 left-2 text-[12px] font-black uppercase bg-black text-yellow-300 px-1 transform -rotate-2">
              LOUD
            </div>
            {/* Text */}
            <div className="text-[8px] font-bold mt-1">
              DISRUPT<br/>EVERYTHING
            </div>
          </div>
        );
      
      case 'saas-modern':
        return (
          <div className="w-full h-full relative overflow-hidden" style={{ backgroundColor: '#f8fafc' }}>
             {/* Gradient Blur */}
             <div className="absolute top-[-20%] right-[-20%] w-24 h-24 bg-indigo-500/30 blur-xl rounded-full"></div>
             <div className="absolute bottom-[-20%] left-[-20%] w-20 h-20 bg-purple-500/20 blur-xl rounded-full"></div>
             
             <div className="relative z-10 h-full flex flex-col justify-center px-3">
                {/* Floating Card */}
                <div className="bg-white rounded-md shadow-sm p-1.5 border border-gray-100 mb-1">
                   <div className="h-1 w-4 bg-indigo-500 rounded-full mb-1"></div>
                   <div className="h-0.5 w-8 bg-gray-200 rounded-full"></div>
                </div>
                {/* Text */}
                <div className="mt-1">
                   <div className="text-[8px] font-bold text-gray-800">Scale Faster</div>
                   <div className="h-0.5 w-12 bg-gray-300 rounded-full mt-0.5"></div>
                </div>
             </div>
          </div>
        );

      case 'luxury-editorial':
        return (
           <div className="w-full h-full relative flex" style={{ backgroundColor: style.previewColors.bg }}>
              {/* Image Side */}
              <div className="w-1/3 h-full bg-stone-300 relative">
                 <div className="absolute inset-0 bg-black/10"></div>
              </div>
              {/* Content Side */}
              <div className="flex-1 p-2 flex flex-col justify-center items-center text-center">
                 <div className="text-[6px] tracking-[0.2em] text-gray-500 uppercase mb-0.5">Collection</div>
                 <div className="text-[12px] font-serif leading-none mb-1" style={{ color: style.previewColors.text }}>VOGUE</div>
                 <div className="w-4 h-px bg-stone-400 my-1"></div>
                 <div className="h-0.5 w-8 bg-stone-200"></div>
              </div>
           </div>
        );

      case 'corporate-blue':
      default:
        return (
          <div className="w-full h-full relative p-2 flex flex-col" style={{ backgroundColor: style.previewColors.bg }}>
             {/* Header Bar */}
             <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-900"></div>
             {/* Title */}
             <div className="mt-2 text-[9px] font-bold text-blue-900">
                Annual Report
             </div>
             {/* Columns */}
             <div className="flex gap-1 mt-2">
                <div className="flex-1">
                   <div className="h-6 bg-slate-100 rounded-sm"></div>
                   <div className="h-0.5 w-full bg-slate-200 mt-1"></div>
                </div>
                <div className="flex-1">
                   <div className="h-6 bg-slate-100 rounded-sm"></div>
                   <div className="h-0.5 w-full bg-slate-200 mt-1"></div>
                </div>
             </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <Palette className="w-4 h-4 text-indigo-500" />
        Presentation Style <span className="text-xs text-gray-400 font-normal">(Auto-selected)</span>
      </h3>
      {/* Slider Carousel Container */}
      <div className="flex overflow-x-auto pb-4 gap-4 snap-x -mx-2 px-2 scroll-smooth">
        {DECK_STYLES.map((style) => (
          <button
            key={style.id}
            onClick={() => onSelect(style)}
            className={`
              flex-none w-40 sm:w-48 snap-center
              relative group flex flex-col items-start p-3 rounded-xl border text-left transition-all duration-300 backdrop-blur-sm
              ${selectedStyleId === style.id 
                ? 'border-indigo-500/50 bg-indigo-50/50 ring-1 ring-indigo-500/50 shadow-md scale-100' 
                : 'border-white/40 bg-white/40 hover:border-white/60 hover:bg-white/60 hover:shadow-md opacity-80 hover:opacity-100 scale-95 hover:scale-100'
              }
            `}
          >
            {/* Visual Thumbnail Container */}
            <div className="w-full aspect-video rounded-lg mb-3 shadow-sm relative overflow-hidden border border-white/40 bg-white/50">
               {renderThumbnailContent(style)}
            </div>

            <span className="text-sm font-semibold text-gray-900 truncate w-full">{style.name}</span>
            <span className="text-xs text-gray-500 mt-1 line-clamp-2">{style.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
