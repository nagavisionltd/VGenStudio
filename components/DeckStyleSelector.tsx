import React from 'react';
import { DECK_STYLES } from '../constants';
import { DeckStyle } from '../types';
import { Palette } from 'lucide-react';

interface DeckStyleSelectorProps {
  onSelect: (style: DeckStyle) => void;
  selectedStyleId: string | null;
}

export const DeckStyleSelector: React.FC<DeckStyleSelectorProps> = ({ onSelect, selectedStyleId }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <Palette className="w-4 h-4 text-indigo-500" />
        Choose Presentation Style
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {DECK_STYLES.map((style) => (
          <button
            key={style.id}
            onClick={() => onSelect(style)}
            className={`
              relative group flex flex-col items-start p-3 rounded-xl border text-left transition-all duration-200
              ${selectedStyleId === style.id 
                ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' 
                : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md'
              }
            `}
          >
            {/* Advanced CSS-based Slide Thumbnail */}
            <div 
              className="w-full aspect-video rounded-lg mb-3 shadow-sm relative overflow-hidden border border-gray-100 flex flex-col justify-between p-3"
              style={{ backgroundColor: style.previewColors.bg }}
            >
              {/* Header Area */}
              <div className="flex flex-col gap-1 z-10">
                 <div 
                    className="h-2.5 w-3/4 rounded-sm" 
                    style={{ backgroundColor: style.previewColors.text }} 
                  />
                  <div 
                    className="h-1.5 w-1/2 rounded-sm opacity-60" 
                    style={{ backgroundColor: style.previewColors.text }} 
                  />
              </div>

              {/* Decorative / Graphic Elements */}
              {style.id === 'swiss-minimal' && (
                 <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20" style={{ backgroundColor: style.previewColors.accent }} />
              )}
              {style.id === 'tech-noir' && (
                 <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/10" />
              )}
              {style.id === 'eco-modern' && (
                 <div className="absolute bottom-[-10px] right-[-10px] w-12 h-12 rounded-full opacity-50" style={{ backgroundColor: style.previewColors.accent }} />
              )}
              {style.id === 'bold-pop' && (
                 <div className="absolute top-2 right-2 border-2 w-8 h-8 rounded-full" style={{ borderColor: style.previewColors.accent }} />
              )}
              {style.id === 'corporate-blue' && (
                 <div className="absolute bottom-0 left-0 right-0 h-1/4 opacity-10" style={{ backgroundColor: style.previewColors.secondary }} />
              )}

              {/* Content Mockup */}
              <div className="flex gap-2 items-end mt-2 z-10">
                 <div className="h-10 w-1/3 rounded opacity-20" style={{ backgroundColor: style.previewColors.text }}></div>
                 <div className="flex-1 space-y-1">
                    <div className="h-1 w-full rounded-full opacity-40" style={{ backgroundColor: style.previewColors.text }}></div>
                    <div className="h-1 w-5/6 rounded-full opacity-40" style={{ backgroundColor: style.previewColors.text }}></div>
                    <div className="h-1 w-4/6 rounded-full opacity-40" style={{ backgroundColor: style.previewColors.text }}></div>
                 </div>
              </div>

            </div>

            <span className="text-sm font-semibold text-gray-900">{style.name}</span>
            <span className="text-xs text-gray-500 mt-1 line-clamp-2">{style.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
};