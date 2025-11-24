import React from 'react';
import { Square, RectangleHorizontal, RectangleVertical } from 'lucide-react';
import { AspectRatio } from '../types';

interface AspectRatioSelectorProps {
  value: AspectRatio;
  onChange: (ratio: AspectRatio) => void;
}

export const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({ value, onChange }) => {
  const ratios: { id: AspectRatio; label: string; icon: React.ReactNode }[] = [
    { id: '1:1', label: 'Square (1:1)', icon: <Square className="w-4 h-4" /> },
    { id: '16:9', label: 'Landscape (16:9)', icon: <RectangleHorizontal className="w-4 h-4" /> },
    { id: '9:16', label: 'Portrait (9:16)', icon: <RectangleVertical className="w-4 h-4" /> },
    { id: '4:3', label: 'Standard (4:3)', icon: <RectangleHorizontal className="w-4 h-4" /> },
    { id: '3:4', label: 'Vertical (3:4)', icon: <RectangleVertical className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">Image Format</label>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {ratios.map((ratio) => (
          <button
            key={ratio.id}
            onClick={() => onChange(ratio.id)}
            className={`
              flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-medium transition-all backdrop-blur-sm
              ${value === ratio.id 
                ? 'bg-indigo-50/50 border-indigo-500/50 text-indigo-700 ring-1 ring-indigo-500/50' 
                : 'bg-white/40 border-white/40 text-gray-600 hover:border-indigo-200/50 hover:bg-white/60'
              }
            `}
          >
            <div className={`mb-1.5 ${value === ratio.id ? 'text-indigo-600' : 'text-gray-500'}`}>
              {ratio.icon}
            </div>
            {ratio.id}
          </button>
        ))}
      </div>
    </div>
  );
};