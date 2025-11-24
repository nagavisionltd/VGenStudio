import React from 'react';
import { PRESET_TEMPLATES } from '../constants';
import { PresetTemplate } from '../types';
import { LayoutTemplate, ShoppingBag, Camera, Share2, PenTool } from 'lucide-react';

interface TemplateSelectorProps {
  onSelect: (template: PresetTemplate) => void;
  selectedTemplateId: string | null;
  mode: 'transform' | 'generate';
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onSelect, selectedTemplateId, mode }) => {
  const getIcon = (category: string) => {
    switch (category) {
      case 'ecommerce': return <ShoppingBag className="w-4 h-4" />;
      case 'social': return <Share2 className="w-4 h-4" />;
      case 'lifestyle': return <Camera className="w-4 h-4" />;
      case 'creative': return <PenTool className="w-4 h-4" />;
      default: return <LayoutTemplate className="w-4 h-4" />;
    }
  };

  const filteredTemplates = PRESET_TEMPLATES.filter(t => t.mode === mode);

  if (filteredTemplates.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <LayoutTemplate className="w-4 h-4 text-indigo-500" />
        {mode === 'transform' ? 'Edit Templates' : 'Design Templates'}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredTemplates.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelect(template)}
            className={`
              relative flex flex-col items-start p-3 rounded-xl border text-left transition-all duration-200
              ${selectedTemplateId === template.id 
                ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' 
                : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm'
              }
            `}
          >
            <div className={`
              mb-2 p-1.5 rounded-md inline-flex
              ${selectedTemplateId === template.id ? 'bg-indigo-200 text-indigo-700' : 'bg-gray-100 text-gray-500'}
            `}>
              {getIcon(template.category)}
            </div>
            <span className="text-sm font-semibold text-gray-900">{template.name}</span>
            <span className="text-xs text-gray-500 mt-1 line-clamp-2">{template.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
};