
import React, { useState, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { Button } from './components/Button';
import { TemplateSelector } from './components/TemplateSelector';
import { AspectRatioSelector } from './components/AspectRatioSelector';
import { DeckStyleSelector } from './components/DeckStyleSelector';
import { SlideGallery } from './components/SlideGallery';
import { VoiceInput } from './components/VoiceInput';
import { generateImage, generatePitchDeck, optimizePrompt, generateSingleSlide } from './services/geminiService';
import { PresetTemplate, DeckStyle, ProcessingStatus, GenerationResult, AspectRatio, AppMode, DeckInputMode, HistoryItem, SlideContent, StrategyReport } from './types';
import { Upload, X, Wand2, Download, Image as ImageIcon, AlertCircle, PenTool, Sparkles, Presentation, FileText, Globe, Link, Mic, Clock, ArrowLeft, History, FileWarning, CheckCircle } from 'lucide-react';
import { DECK_STYLES } from './constants';

export default function App() {
  const [mode, setMode] = useState<AppMode>('transform');
  const [showHistory, setShowHistory] = useState(false);
  
  const [deckInputMode, setDeckInputMode] = useState<DeckInputMode>('topic');
  const [deckFiles, setDeckFiles] = useState<File[]>([]);
  const [urlInput, setUrlInput] = useState('');
  
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [voiceFile, setVoiceFile] = useState<File | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [prompt, setPrompt] = useState('');
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedDeckStyle, setSelectedDeckStyle] = useState<DeckStyle | null>(DECK_STYLES[0]);

  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [deckResult, setDeckResult] = useState<GenerationResult[]>([]);
  const [rawDeckSlides, setRawDeckSlides] = useState<SlideContent[]>([]);
  const [strategyReport, setStrategyReport] = useState<StrategyReport | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [regeneratingSlideIndex, setRegeneratingSlideIndex] = useState<number | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('nagaxstudio_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const deckFileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storageHistory = history.map(item => ({
      ...item,
      thumbnail: item.thumbnail?.startsWith('data:') ? '' : item.thumbnail,
      results: item.results.map(r => ({ ...r, imageUrl: r.imageUrl?.startsWith('data:') ? '' : r.imageUrl }))
    }));
    localStorage.setItem('nagaxstudio_history', JSON.stringify(storageHistory));
  }, [history]);

  const addToHistory = (
    resultData: GenerationResult | GenerationResult[], 
    currentMode: AppMode,
    currentPrompt: string,
    strategy?: StrategyReport
  ) => {
    const isDeck = Array.isArray(resultData);
    const thumbnail = isDeck ? (resultData[0]?.imageUrl || '') : (resultData as GenerationResult).imageUrl || '';
    if (!thumbnail) return;

    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      mode: currentMode,
      thumbnail,
      results: isDeck ? (resultData as GenerationResult[]) : [resultData as GenerationResult],
      prompt: currentPrompt,
      strategy
    };
    setHistory(prev => [newItem, ...prev].slice(0, 20));
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setMode(item.mode);
    setPrompt(item.prompt);
    if (item.mode === 'deck') {
      setDeckResult(item.results);
      setStrategyReport(item.strategy || null);
      setRawDeckSlides([]);
    } else {
      setResult(item.results[0]);
    }
    setShowHistory(false);
    setStatus('success');
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleModeChange = (newMode: AppMode) => {
    setMode(newMode);
    setShowHistory(false);
    setResult(null);
    setDeckResult([]);
    setStrategyReport(null);
    setStatus('idle');
    setPrompt('');
    setSelectedTemplateId(null);
    setSelectedDeckStyle(newMode === 'deck' ? DECK_STYLES[0] : null);
    setErrorMsg(null);
    setDeckFiles([]);
    setUrlInput('');
    setVoiceBlob(null);
    setVoiceFile(null);
    setAspectRatio(newMode === 'deck' ? '16:9' : '1:1');
  };

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setIsEnhancingPrompt(true);
    const optimized = await optimizePrompt(prompt);
    setPrompt(optimized);
    setIsEnhancingPrompt(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setStatus('idle');
    }
  };

  const handleDeckFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setDeckFiles(prev => [...prev, ...files]);
    }
  };

  const removeDeckFile = (index: number) => {
    setDeckFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (mode === 'transform' && !selectedFile) return;
    if (mode === 'deck') {
       if (deckInputMode === 'topic' && !prompt.trim()) return;
       if (deckInputMode === 'url' && !urlInput.trim()) return;
       if (deckInputMode === 'file' && deckFiles.length === 0) return;
    }

    setStatus(mode === 'deck' ? 'analyzing' : 'generating');
    setProgressMessage('Initializing analysis...');
    
    try {
      if (mode === 'deck') {
        const styleToUse = selectedDeckStyle || DECK_STYLES[0];
        const { results, rawSlides, strategy } = await generatePitchDeck(
          prompt || urlInput, 
          deckFiles, 
          (voiceBlob || voiceFile) as Blob | null, 
          deckInputMode, 
          styleToUse,
          setProgressMessage
        );
        setRawDeckSlides(rawSlides);
        setDeckResult(results);
        setStrategyReport(strategy);
        addToHistory(results, 'deck', prompt || urlInput || "Smart Deck", strategy);
      } else {
        const data = await generateImage(prompt, mode === 'transform' ? selectedFile : null, aspectRatio);
        setResult(data);
        addToHistory(data, mode, prompt);
      }
      setStatus('success');
    } catch (error: any) {
      setStatus('error');
      setErrorMsg(error.message || "Failed to generate content.");
    }
  };

  if (showHistory) {
    return (
      <div className="min-h-screen flex flex-col font-sans text-gray-900">
        <Header />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
           <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setShowHistory(false)} className="p-2 rounded-full bg-white/40 hover:bg-white/60 backdrop-blur-sm border border-white/50"><ArrowLeft /></button>
              <h1 className="text-2xl font-bold">Design History</h1>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {history.map(item => (
                <div key={item.id} className="bg-white/60 backdrop-blur-md rounded-xl border overflow-hidden">
                  <div className="aspect-video bg-gray-100 flex items-center justify-center relative">
                    {item.thumbnail ? <img src={item.thumbnail} className="w-full h-full object-cover" /> : <FileWarning />}
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Button size="sm" onClick={() => loadHistoryItem(item)}>View</Button>
                    </div>
                  </div>
                  <div className="p-4"><p className="text-sm font-medium line-clamp-2">{item.prompt}</p></div>
                </div>
              ))}
           </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <div className="bg-white/40 backdrop-blur-md p-1 rounded-2xl shadow-lg border border-white/50 inline-flex gap-1">
            {['transform', 'generate', 'deck'].map((m) => (
              <button key={m} onClick={() => handleModeChange(m as AppMode)} className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${mode === m ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-white/50'}`}>
                {m === 'transform' ? <ImageIcon className="w-4 h-4 inline mr-2"/> : m === 'generate' ? <PenTool className="w-4 h-4 inline mr-2"/> : <Presentation className="w-4 h-4 inline mr-2"/>}
                <span className="capitalize">{m}</span>
              </button>
            ))}
          </div>
          <button onClick={() => setShowHistory(true)} className="px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 bg-white/40 border border-white/50"><History className="w-4 h-4" />History</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            {mode === 'transform' && (
              <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border p-6">
                {!previewUrl ? (
                  <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed rounded-2xl p-8 flex flex-col items-center cursor-pointer h-64 justify-center">
                    <Upload className="mb-4 text-indigo-600" />
                    <p className="text-sm font-medium">Upload Source Photo</p>
                    <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
                  </div>
                ) : (
                  <div className="relative group rounded-2xl overflow-hidden border">
                    <img src={previewUrl} className="w-full max-h-64 object-contain" />
                    <button onClick={() => setPreviewUrl(null)} className="absolute top-2 right-2 p-1 bg-white/80 rounded-full"><X className="w-4 h-4"/></button>
                  </div>
                )}
              </div>
            )}

            <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border p-6 space-y-6">
              {mode !== 'deck' && <AspectRatioSelector value={aspectRatio} onChange={setAspectRatio} />}
              {mode === 'deck' && (
                <div className="grid grid-cols-4 gap-2">
                  {['topic', 'file', 'url', 'voice'].map(m => (
                    <button key={m} onClick={() => setDeckInputMode(m as DeckInputMode)} className={`p-2 rounded-xl border text-xs font-medium transition-all ${deckInputMode === m ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white/40'}`}>
                      {m === 'topic' ? <PenTool className="w-4 h-4 mb-1 mx-auto"/> : m === 'file' ? <FileText className="w-4 h-4 mb-1 mx-auto"/> : m === 'url' ? <Globe className="w-4 h-4 mb-1 mx-auto"/> : <Mic className="w-4 h-4 mb-1 mx-auto"/>}
                      {m}
                    </button>
                  ))}
                </div>
              )}

              {mode === 'deck' && deckInputMode === 'file' ? (
                <div className="space-y-2">
                  <div onClick={() => deckFileInputRef.current?.click()} className="border-2 border-dashed rounded-xl p-4 flex flex-col items-center cursor-pointer bg-white/30">
                    <Upload className="w-6 h-6 text-indigo-500 mb-1" />
                    <span className="text-xs font-medium">Add Files (PDF, Txt, Images)</span>
                    <input ref={deckFileInputRef} type="file" multiple className="hidden" onChange={handleDeckFilesChange} />
                  </div>
                  {deckFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {deckFiles.map((f, i) => (
                        <div key={i} className="flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded text-xs border border-indigo-100">
                          <span className="truncate max-w-[100px]">{f.name}</span>
                          <button onClick={() => removeDeckFile(i)} className="text-indigo-400 hover:text-red-500"><X className="w-3 h-3"/></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : mode === 'deck' && deckInputMode === 'voice' ? (
                <VoiceInput onAudioReady={setVoiceBlob} onAudioFileSelect={setVoiceFile} />
              ) : (
                <div className="relative">
                  <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Enter details..." className="w-full rounded-xl border-white/50 bg-white/40 p-3 text-sm min-h-[120px] resize-none" />
                  <button onClick={handleEnhancePrompt} className="absolute bottom-2 right-2 text-xs flex items-center gap-1 text-indigo-600 font-medium">
                    <Sparkles className="w-3 h-3" /> Enhance
                  </button>
                </div>
              )}
              {mode === 'deck' ? <DeckStyleSelector onSelect={setSelectedDeckStyle} selectedStyleId={selectedDeckStyle?.id || null} /> : <TemplateSelector onSelect={(t) => {setPrompt(t.prompt); setAspectRatio(t.recommendedRatio || '1:1');}} selectedTemplateId={selectedTemplateId} mode={mode} />}
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col" ref={resultRef}>
            <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border flex-1 flex flex-col overflow-hidden min-h-[600px] relative">
              {status === 'idle' && <div className="flex-1 flex items-center justify-center text-gray-500">Ready to build.</div>}
              {(status === 'generating' || status === 'analyzing') && (
                <div className="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-12 h-12 border-4 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                  <h3 className="text-lg font-bold text-indigo-900">{progressMessage}</h3>
                </div>
              )}
              {status === 'success' && mode === 'deck' && deckResult.length > 0 && (
                <SlideGallery slides={deckResult} strategy={strategyReport} onRegenerateSlide={(i) => {}} regeneratingIndex={null} />
              )}
              {status === 'success' && mode !== 'deck' && result?.imageUrl && (
                <div className="flex-1 p-6 flex items-center justify-center">
                  <img src={result.imageUrl} className="max-w-full rounded-xl shadow-2xl" />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <div className="sticky bottom-0 bg-white/80 backdrop-blur-xl border-t p-4 z-40">
        <div className="max-w-7xl mx-auto flex justify-end">
          <Button onClick={handleGenerate} isLoading={status === 'generating' || status === 'analyzing'} className="w-full sm:w-64" icon={<Wand2 className="w-4 h-4"/>}>
            {mode === 'deck' ? 'Generate Deck & Strategy' : 'Generate Design'}
          </Button>
        </div>
      </div>
    </div>
  );
}
