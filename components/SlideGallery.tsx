
import React, { useState } from 'react';
import { GenerationResult, StrategyReport } from '../types';
// Added AlertCircle to the imports below
import { Download, MonitorPlay, FileText, Package, RefreshCw, LayoutGrid, FileBarChart, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from './Button';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';

interface SlideGalleryProps {
  slides: GenerationResult[];
  strategy: StrategyReport | null;
  onRegenerateSlide: (index: number) => void;
  regeneratingIndex: number | null;
}

export const SlideGallery: React.FC<SlideGalleryProps> = ({ slides, strategy, onRegenerateSlide, regeneratingIndex }) => {
  const [activeTab, setActiveTab] = useState<'slides' | 'strategy'>('slides');
  const [isProcessing, setIsProcessing] = useState(false);

  const downloadStrategyPDF = () => {
    if (!strategy) return;
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("Business Strategy Report", 20, 20);
    doc.setFontSize(12);
    doc.text("Executive Summary", 20, 35);
    doc.setFont("helvetica", "normal");
    const summaryLines = doc.splitTextToSize(strategy.summary, 170);
    doc.text(summaryLines, 20, 42);

    let y = 42 + (summaryLines.length * 5) + 10;
    doc.setFont("helvetica", "bold");
    doc.text("SWOT Analysis", 20, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.text(`Strengths: ${strategy.swot.strengths.join(', ')}`, 20, y);
    doc.text(`Weaknesses: ${strategy.swot.weaknesses.join(', ')}`, 20, y + 5);
    y += 15;
    doc.setFont("helvetica", "bold");
    doc.text("30/60/90 Day Action Plan", 20, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.text(`Immediate: ${strategy.actionPlan.immediate.join('; ')}`, 20, y);
    doc.text(`Mid-term: ${strategy.actionPlan.midTerm.join('; ')}`, 20, y + 10);

    doc.save('business-strategy-report.pdf');
  };

  const downloadZip = async () => {
    setIsProcessing(true);
    const zip = new JSZip();
    slides.forEach((s, i) => s.imageUrl && zip.file(`slide-${i+1}.png`, s.imageUrl.split(',')[1], {base64: true}));
    const content = await zip.generateAsync({type: 'blob'});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = 'presentation-slides.zip';
    link.click();
    setIsProcessing(false);
  };

  return (
    <div className="w-full h-full flex flex-col">
       <div className="bg-white/40 border-b px-6 py-4 flex flex-col sm:flex-row justify-between gap-4">
         <div className="flex bg-white/50 p-1 rounded-xl border self-start">
            <button onClick={() => setActiveTab('slides')} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${activeTab === 'slides' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}>
              <LayoutGrid className="w-4 h-4"/> Slides
            </button>
            <button onClick={() => setActiveTab('strategy')} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${activeTab === 'strategy' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}>
              <FileBarChart className="w-4 h-4"/> Strategy
            </button>
         </div>
         <div className="flex gap-2">
           {activeTab === 'slides' ? (
             <Button size="sm" onClick={downloadZip} disabled={isProcessing} icon={<Package className="w-4 h-4"/>}>Download Slides</Button>
           ) : (
             <Button size="sm" onClick={downloadStrategyPDF} icon={<Download className="w-4 h-4"/>}>Download Report PDF</Button>
           )}
         </div>
       </div>

       <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'slides' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {slides.map((s, i) => (
                <div key={i} className="bg-white rounded-xl border shadow-sm overflow-hidden group">
                  <div className="bg-gray-50 px-3 py-1.5 flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b">
                    <span>{i + 1}. {s.title}</span>
                    <button onClick={() => onRegenerateSlide(i)} className="hover:text-indigo-600"><RefreshCw className="w-3 h-3"/></button>
                  </div>
                  <div className="aspect-video relative">
                    {s.imageUrl ? <img src={s.imageUrl} className="w-full h-full object-cover" /> : <div className="h-full bg-gray-100 animate-pulse" />}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            strategy && (
              <div className="max-w-4xl mx-auto space-y-8 pb-20">
                <section>
                  <h4 className="text-xl font-bold text-indigo-900 mb-3 border-b pb-2">Business Summary</h4>
                  <p className="text-gray-700 leading-relaxed text-sm bg-white p-4 rounded-xl border">{strategy.summary}</p>
                </section>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-4">
                      <h4 className="font-bold text-green-700 flex items-center gap-2"><CheckCircle2 className="w-5 h-5"/> Strengths</h4>
                      <ul className="space-y-1">{strategy.swot.strengths.map((s, i) => <li key={i} className="text-sm text-gray-600 bg-green-50/50 p-2 rounded-lg border border-green-100">• {s}</li>)}</ul>
                   </div>
                   <div className="space-y-4">
                      <h4 className="font-bold text-red-700 flex items-center gap-2"><AlertCircle className="w-5 h-5"/> Weaknesses</h4>
                      <ul className="space-y-1">{strategy.swot.weaknesses.map((s, i) => <li key={i} className="text-sm text-gray-600 bg-red-50/50 p-2 rounded-lg border border-red-100">• {s}</li>)}</ul>
                   </div>
                </div>
                <section>
                  <h4 className="text-xl font-bold text-indigo-900 mb-4 border-b pb-2">Execution Roadmap (Action Plan)</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-indigo-50/30 p-4 rounded-xl border border-indigo-100">
                       <h5 className="font-bold text-indigo-700 mb-2">Immediate (Day 0-30)</h5>
                       <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">{strategy.actionPlan.immediate.map((a, i) => <li key={i}>{a}</li>)}</ul>
                    </div>
                    <div className="bg-indigo-50/30 p-4 rounded-xl border border-indigo-100">
                       <h5 className="font-bold text-indigo-700 mb-2">Mid-Term (Day 31-90)</h5>
                       <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">{strategy.actionPlan.midTerm.map((a, i) => <li key={i}>{a}</li>)}</ul>
                    </div>
                  </div>
                </section>
              </div>
            )
          )}
       </div>
    </div>
  );
};
