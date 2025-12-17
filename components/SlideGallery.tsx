
import React, { useState } from 'react';
import { GenerationResult } from '../types';
import { Download, MonitorPlay, FileText, Package, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';

interface SlideGalleryProps {
  slides: GenerationResult[];
  onRegenerateSlide: (index: number) => void;
  regeneratingIndex: number | null;
}

export const SlideGallery: React.FC<SlideGalleryProps> = ({ slides, onRegenerateSlide, regeneratingIndex }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!slides || slides.length === 0) return null;

  const downloadPDF = async () => {
    setIsProcessing(true);
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1280, 720]
      });

      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        if (i > 0) doc.addPage();
        
        if (slide.imageUrl) {
          doc.addImage(slide.imageUrl, 'PNG', 0, 0, 1280, 720);
        } else {
          doc.text(slide.title || `Slide ${i + 1}`, 100, 100);
        }
      }

      doc.save('pitch-deck.pdf');
    } catch (e) {
      console.error('PDF generation failed', e);
      alert('Failed to generate PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadZip = async () => {
    setIsProcessing(true);
    try {
      const zip = new JSZip();
      
      slides.forEach((slide, index) => {
        if (slide.imageUrl) {
          const data = slide.imageUrl.split(',')[1];
          const filename = `slide-${index + 1}-${(slide.title || 'untitled').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
          zip.file(filename, data, { base64: true });
        }
      });

      const content = await zip.generateAsync({ type: 'blob' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = 'presentation-slides.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Zip generation failed', e);
      alert('Failed to create ZIP');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full h-full p-6 overflow-y-auto">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
         <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MonitorPlay className="w-5 h-5 text-indigo-600" />
                Pitch Deck Preview
            </h3>
            <span className="text-sm text-gray-600 bg-white/40 backdrop-blur-sm px-3 py-1 rounded-full border border-white/50">
                {slides.length} Slides
            </span>
         </div>
         
         <div className="flex items-center gap-2">
            <Button 
                variant="secondary" 
                size="sm" 
                onClick={downloadPDF} 
                disabled={isProcessing}
                className="text-xs"
                icon={<FileText className="w-4 h-4" />}
            >
                PDF
            </Button>
            <Button 
                variant="primary" 
                size="sm" 
                onClick={downloadZip} 
                disabled={isProcessing}
                className="text-xs"
                icon={<Package className="w-4 h-4" />}
            >
                ZIP
            </Button>
         </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
          {slides.map((slide, index) => (
            <div key={index} className="bg-white/60 backdrop-blur-md rounded-xl shadow-sm border border-white/50 overflow-hidden hover:shadow-lg transition-all group relative">
              <div className="border-b border-white/40 bg-white/40 px-4 py-2 flex justify-between items-center">
                 <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    {index + 1}. {slide.title || 'Untitled'}
                 </span>
                 <div className="flex gap-1">
                   {slide.imageUrl && (
                    <a 
                      href={slide.imageUrl} 
                      download={`slide-${index + 1}.png`}
                      className="text-gray-500 hover:text-indigo-600 p-1.5 rounded-md hover:bg-white/50 transition-colors"
                      title="Download Slide"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                   )}
                   <button 
                     onClick={() => onRegenerateSlide(index)}
                     disabled={regeneratingIndex === index}
                     className={`text-gray-500 hover:text-indigo-600 p-1.5 rounded-md hover:bg-white/50 transition-colors ${regeneratingIndex === index ? 'animate-spin text-indigo-600' : ''}`}
                     title="Regenerate this slide"
                   >
                     <RefreshCw className="w-4 h-4" />
                   </button>
                 </div>
              </div>
              <div className="aspect-video bg-gray-100/50 w-full relative">
                {regeneratingIndex === index && (
                  <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                      <span className="text-xs font-medium text-indigo-900">Redesigning...</span>
                    </div>
                  </div>
                )}
                {slide.imageUrl ? (
                  <img 
                    src={slide.imageUrl} 
                    alt={slide.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 text-sm gap-2">
                    <div className="p-3 rounded-full bg-gray-200/50">
                      <FileText className="w-6 h-6 text-gray-400" />
                    </div>
                    <span>No image generated</span>
                  </div>
                )}
              </div>
            </div>
          ))}
       </div>
    </div>
  );
};
