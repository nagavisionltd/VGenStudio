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
            {/* CSS-based Visual Thumbnail */}
            <div 
              className="w-full aspect-video rounded-lg mb-3 shadow-inner relative overflow-hidden border border-gray-100"
              style={{ backgroundColor: style.previewColors.bg }}
            >
              {/* Abstract Header / Elements based on style */}
              <div 
                className="absolute top-4 left-4 h-2 w-1/3 rounded-sm" 
                style={{ backgroundColor: style.previewColors.text }} 
              />
              <div 
                className="absolute top-8 left-4 h-2 w-1/2 rounded-sm opacity-50" 
                style={{ backgroundColor: style.previewColors.text }} 
              />
              
              {/* Graphic Element */}
              <div 
                className="absolute bottom-4 right-4 h-12 w-12 rounded-full opacity-80" 
                style={{ backgroundColor: style.previewColors.accent }} 
              />
              
              {/* Secondary Element */}
              <div 
                 className="absolute bottom-0 left-0 w-full h-8 opacity-30"
                 style={{ backgroundColor: style.previewColors.secondary }}
              />
            </div>

            <span className="text-sm font-semibold text-gray-900">{style.name}</span>
            <span className="text-xs text-gray-500 mt-1 line-clamp-2">{style.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
