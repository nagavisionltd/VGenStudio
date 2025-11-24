import React from 'react';
import { GenerationResult } from '../types';
import { Download, MonitorPlay } from 'lucide-react';

interface SlideGalleryProps {
  slides: GenerationResult[];
}

export const SlideGallery: React.FC<SlideGalleryProps> = ({ slides }) => {
  if (!slides || slides.length === 0) return null;

  return (
    <div className="w-full h-full bg-gray-50 p-6 overflow-y-auto">
       <div className="flex items-center justify-between mb-6">
         <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MonitorPlay className="w-5 h-5 text-indigo-600" />
            Your Pitch Deck Preview
         </h3>
         <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
            {slides.length} Slides Generated
         </span>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {slides.map((slide, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="border-b border-gray-100 bg-gray-50 px-4 py-2 flex justify-between items-center">
                 <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Slide {index + 1}: {slide.title || 'Untitled'}
                 </span>
                 {slide.imageUrl && (
                   <a 
                     href={slide.imageUrl} 
                     download={`slide-${index + 1}.png`}
                     className="text-indigo-600 hover:text-indigo-700 p-1"
                     title="Download Slide"
                   >
                     <Download className="w-4 h-4" />
                   </a>
                 )}
              </div>
              <div className="aspect-video bg-gray-100 w-full relative group">
                {slide.imageUrl ? (
                  <img 
                    src={slide.imageUrl} 
                    alt={slide.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                    No image generated
                  </div>
                )}
              </div>
            </div>
          ))}
       </div>
    </div>
  );
};
