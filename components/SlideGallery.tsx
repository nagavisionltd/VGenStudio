import React, { useState } from 'react';
import { GenerationResult } from '../types';
import { Download, MonitorPlay, FileText, Package } from 'lucide-react';
import { Button } from './Button';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';

interface SlideGalleryProps {
  slides: GenerationResult[];
}

export const SlideGallery: React.FC<SlideGalleryProps> = ({ slides }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!slides || slides.length === 0) return null;

  const downloadPDF = async () => {
    setIsProcessing(true);
    try {
      // Create landscape PDF (A4 landscape roughly 297x210mm)
      // 16:9 ratio is usually fit to width
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1280, 720] // Using 720p resolution as base for PDF size
      });

      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        if (i > 0) doc.addPage();
        
        if (slide.imageUrl) {
          // Add image to cover the full page
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
      
      // Add images to zip
      slides.forEach((slide, index) => {
        if (slide.imageUrl) {
          // Remove data:image/png;base64, prefix
          const data = slide.imageUrl.split(',')[1];
          const filename = `slide-${index + 1}-${(slide.title || 'untitled').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
          zip.file(filename, data, { base64: true });
        }
      });

      const content = await zip.generateAsync({ type: 'blob' });
      
      // Trigger download
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
    <div className="w-full h-full bg-gray-50 p-6 overflow-y-auto">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
         <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MonitorPlay className="w-5 h-5 text-indigo-600" />
                Pitch Deck Preview
            </h3>
            <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
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
                Download PDF
            </Button>
            <Button 
                variant="primary" 
                size="sm" 
                onClick={downloadZip} 
                disabled={isProcessing}
                className="text-xs"
                icon={<Package className="w-4 h-4" />}
            >
                Download All (ZIP)
            </Button>
         </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
          {slides.map((slide, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
              <div className="border-b border-gray-100 bg-gray-50 px-4 py-2 flex justify-between items-center">
                 <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {index + 1}. {slide.title || 'Untitled'}
                 </span>
                 {slide.imageUrl && (
                   <a 
                     href={slide.imageUrl} 
                     download={`slide-${index + 1}.png`}
                     className="text-gray-400 hover:text-indigo-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                     title="Download Slide"
                   >
                     <Download className="w-4 h-4" />
                   </a>
                 )}
              </div>
              <div className="aspect-video bg-gray-100 w-full relative">
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