
import React, { useState, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { Button } from './components/Button';
import { TemplateSelector } from './components/TemplateSelector';
import { AspectRatioSelector } from './components/AspectRatioSelector';
import { DeckStyleSelector } from './components/DeckStyleSelector';
import { SlideGallery } from './components/SlideGallery';
import { VoiceInput } from './components/VoiceInput';
import { generateImage, generatePitchDeck, optimizePrompt, generateSingleSlide } from './services/geminiService';
import { PresetTemplate, DeckStyle, ProcessingStatus, GenerationResult, AspectRatio, AppMode, DeckInputMode, HistoryItem, SlideContent } from './types';
import { Upload, X, Wand2, Download, Image as ImageIcon, AlertCircle, PenTool, Sparkles, Presentation, FileText, Globe, Link, Mic, Clock, ArrowLeft, History, FileWarning } from 'lucide-react';
import { DECK_STYLES } from './constants';

export default function App() {
  const [mode, setMode] = useState<AppMode>('transform');
  const [showHistory, setShowHistory] = useState(false);
  
  // Deck Specific States
  const [deckInputMode, setDeckInputMode] = useState<DeckInputMode>('topic');
  const [deckFile, setDeckFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState('');
  
  // Voice State
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [voiceFile, setVoiceFile] = useState<File | null>(null);

  // General States
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // For Transform mode
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Prompt & Settings
  const [prompt, setPrompt] = useState('');
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  
  // Selection State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  // Initialize with a default style (First one: Glass Light) so user isn't forced to choose
  const [selectedDeckStyle, setSelectedDeckStyle] = useState<DeckStyle | null>(DECK_STYLES[0]);

  // Results State
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [result, setResult] = useState<GenerationResult | null>(null); // For Transform/Generate
  const [deckResult, setDeckResult] = useState<GenerationResult[]>([]); // For Deck
  const [rawDeckSlides, setRawDeckSlides] = useState<SlideContent[]>([]); // Keep raw structured content for regeneration
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [regeneratingSlideIndex, setRegeneratingSlideIndex] = useState<number | null>(null);

  // History State
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('nagaxstudio_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn("Failed to load history", e);
      return [];
    }
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const deckFileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Save history to local storage whenever it changes, but EXCLUDE large base64 images
  useEffect(() => {
    const saveToStorage = () => {
      try {
        // Create a lightweight version for storage (exclude base64 images to prevent QuotaExceededError)
        // We keep the entries so users see their prompt history, but images will expire on reload.
        const storageHistory = history.map(item => ({
          ...item,
          thumbnail: item.thumbnail?.startsWith('data:') ? '' : item.thumbnail,
          results: item.results.map(r => ({
            ...r,
            imageUrl: r.imageUrl?.startsWith('data:') ? '' : r.imageUrl
          }))
        }));
        localStorage.setItem('nagaxstudio_history', JSON.stringify(storageHistory));
      } catch (e) {
        console.error("Failed to save history to local storage (Storage Full)", e);
        // Optionally try to clear old items or warn
      }
    };
    saveToStorage();
  }, [history]);

  const addToHistory = (
    resultData: GenerationResult | GenerationResult[], 
    currentMode: AppMode,
    currentPrompt: string
  ) => {
    const isDeck = Array.isArray(resultData);
    // Get thumbnail from first result or single result
    const thumbnail = isDeck 
      ? (resultData[0]?.imageUrl || '') 
      : (resultData as GenerationResult).imageUrl || '';

    if (!thumbnail) return;

    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      mode: currentMode,
      thumbnail,
      results: isDeck ? (resultData as GenerationResult[]) : [resultData as GenerationResult],
      prompt: currentPrompt
    };

    setHistory(prev => [newItem, ...prev].slice(0, 20)); // Keep last 20
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setMode(item.mode);
    setPrompt(item.prompt);
    
    if (item.mode === 'deck') {
      setDeckResult(item.results);
      setRawDeckSlides([]); // Cannot regenerate old decks fully without raw content
    } else {
      setResult(item.results[0]);
    }
    
    setShowHistory(false);
    setStatus('success');
    
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleModeChange = (newMode: AppMode) => {
    setMode(newMode);
    setShowHistory(false);
    setResult(null);
    setDeckResult([]);
    setStatus('idle');
    setPrompt('');
    setSelectedTemplateId(null);
    // When switching to deck mode, ensure a default style is set
    if (newMode === 'deck') {
        setSelectedDeckStyle(DECK_STYLES[0]);
    } else {
        setSelectedDeckStyle(null);
    }
    setErrorMsg(null);
    setDeckFile(null);
    setUrlInput('');
    setVoiceBlob(null);
    setVoiceFile(null);
    setProgressMessage('');
    
    // Auto-set aspect ratio for deck
    if (newMode === 'deck') {
      setAspectRatio('16:9');
    } else {
      setAspectRatio('1:1');
    }
  };

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setIsEnhancingPrompt(true);
    const optimized = await optimizePrompt(prompt);
    setPrompt(optimized);
    setIsEnhancingPrompt(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 20 * 1024 * 1024) {
        setErrorMsg("File size too large. Please upload an image under 20MB.");
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setResult(null);
      setStatus('idle');
      setErrorMsg(null);
    }
  };

  const handleDeckFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDeckFile(file);
      setErrorMsg(null);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setStatus('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleTemplateSelect = (template: PresetTemplate) => {
    setPrompt(template.prompt);
    setSelectedTemplateId(template.id);
    if (template.recommendedRatio) {
      setAspectRatio(template.recommendedRatio);
    }
  };

  const handleDeckStyleSelect = (style: DeckStyle) => {
    setSelectedDeckStyle(style);
  };

  const handleRegenerateSlide = async (index: number) => {
    const styleToUse = selectedDeckStyle || DECK_STYLES[0];
    if (!styleToUse || rawDeckSlides.length === 0) {
      alert("Cannot regenerate slide: missing context or style.");
      return;
    }
    
    setRegeneratingSlideIndex(index);
    try {
      const newSlideResult = await generateSingleSlide(rawDeckSlides[index], styleToUse);
      
      setDeckResult(prev => {
        const updated = [...prev];
        updated[index] = newSlideResult;
        return updated;
      });
      
    } catch (error) {
      console.error("Slide regeneration failed", error);
    } finally {
      setRegeneratingSlideIndex(null);
    }
  };

  const handleGenerate = async () => {
    if (mode === 'transform' && !selectedFile) return;
    if (mode === 'deck') {
       if (deckInputMode === 'topic' && !prompt.trim()) return;
       if (deckInputMode === 'url' && !urlInput.trim()) return;
       if (deckInputMode === 'file' && !deckFile) return;
       if (deckInputMode === 'voice' && !voiceBlob && !voiceFile) return;
    }
    if (mode === 'generate' && !prompt.trim()) return;

    setStatus(mode === 'deck' ? 'analyzing' : 'generating');
    setProgressMessage(mode === 'deck' ? 'Analyzing content...' : 'Generating visuals...');
    setResult(null);
    setDeckResult([]);
    setErrorMsg(null);
    
    if (window.innerWidth < 768) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }

    try {
      if (mode === 'deck') {
        const styleToUse = selectedDeckStyle || DECK_STYLES[0];
        
        let inputData = prompt;
        if (deckInputMode === 'url') inputData = urlInput;
        if (deckInputMode === 'file') inputData = ''; 
        if (deckInputMode === 'voice') inputData = '';

        const audioSource = voiceBlob || voiceFile;

        const { results, rawSlides } = await generatePitchDeck(
          inputData, 
          deckFile, 
          audioSource as Blob | null, 
          deckInputMode, 
          styleToUse,
          (msg) => setProgressMessage(msg)
        );
        
        setRawDeckSlides(rawSlides);
        setDeckResult(results);
        addToHistory(results, 'deck', inputData || "Pitch Deck");

      } else {
        const fileToProcess = mode === 'transform' ? selectedFile : null;
        const data = await generateImage(prompt, fileToProcess, aspectRatio);
        setResult(data);
        addToHistory(data, mode, prompt);
      }
      setStatus('success');
    } catch (error: any) {
      console.error(error);
      setStatus('error');
      setErrorMsg(error.message || "Failed to generate content. Please try again.");
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // View: History List
  if (showHistory) {
    return (
      <div className="min-h-screen flex flex-col font-sans text-gray-900">
        <Header />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
           <div className="flex items-center gap-4 mb-8">
              <button 
                onClick={() => setShowHistory(false)}
                className="p-2 rounded-full bg-white/40 hover:bg-white/60 backdrop-blur-sm border border-white/50 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold">Design History</h1>
           </div>

           {history.length === 0 ? (
             <div className="text-center py-20 text-gray-500 bg-white/30 backdrop-blur-md rounded-3xl border border-white/40">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No history yet. Start creating!</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {history.map((item) => (
                  <div key={item.id} className="group bg-white/60 backdrop-blur-md rounded-xl border border-white/50 overflow-hidden hover:shadow-xl transition-all flex flex-col h-full">
                    <div className="aspect-video bg-gray-100/50 relative overflow-hidden flex items-center justify-center">
                       {item.thumbnail ? (
                         <img src={item.thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                       ) : (
                         <div className="flex flex-col items-center justify-center text-gray-400 gap-2">
                            <FileWarning className="w-8 h-8 opacity-50" />
                            <span className="text-xs font-medium uppercase tracking-wider">Image Expired</span>
                         </div>
                       )}
                       
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          {/* If image is expired, user can essentially only 'reload' the prompt settings, not the image */}
                          <Button size="sm" onClick={() => loadHistoryItem(item)}>
                            {item.thumbnail ? 'View' : 'Reload Prompt'}
                          </Button>
                       </div>
                       <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded-full backdrop-blur-md">
                          {item.mode === 'deck' ? 'Pitch Deck' : item.mode === 'transform' ? 'Transform' : 'Image'}
                       </div>
                    </div>
                    <div className="p-4 flex-1">
                       <p className="text-xs text-gray-500 mb-1">{new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString()}</p>
                       <p className="text-sm font-medium text-gray-900 line-clamp-2">{item.prompt || 'Audio/File Input'}</p>
                    </div>
                  </div>
                ))}
             </div>
           )}
        </main>
      </div>
    );
  }

  // View: Main App
  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900">
      <Header />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Mode Tabs */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <div className="bg-white/40 backdrop-blur-md p-1 rounded-2xl shadow-lg border border-white/50 inline-flex flex-wrap justify-center gap-1">
            <button
              onClick={() => handleModeChange('transform')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${
                mode === 'transform' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-white/50'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Transform Image</span>
              <span className="sm:hidden">Transform</span>
            </button>
            <button
              onClick={() => handleModeChange('generate')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${
                mode === 'generate' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-white/50'
              }`}
            >
              <PenTool className="w-4 h-4" />
              <span className="hidden sm:inline">Create from Scratch</span>
              <span className="sm:hidden">Create</span>
            </button>
            <button
              onClick={() => handleModeChange('deck')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${
                mode === 'deck' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-white/50'
              }`}
            >
              <Presentation className="w-4 h-4" />
              <span className="hidden sm:inline">Pitch Deck</span>
              <span className="sm:hidden">Deck</span>
            </button>
          </div>

          <button 
             onClick={() => setShowHistory(true)}
             className="px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all bg-white/40 hover:bg-white/60 text-gray-700 border border-white/50 backdrop-blur-sm"
          >
             <History className="w-4 h-4" />
             History
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
          
          {/* Left Column: Input & Controls */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Image Uploader - Only for Transform Mode */}
            {mode === 'transform' && (
              <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-white/40 overflow-hidden">
                <div className="p-4 border-b border-white/30 bg-white/20 flex justify-between items-center">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-indigo-600" />
                    Source Image
                  </h2>
                  {selectedFile && (
                    <button onClick={clearFile} className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1">
                      <X className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>
                
                <div className="p-6">
                  {!previewUrl ? (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300/60 bg-white/30 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-white/50 transition-all h-64"
                    >
                      <div className="bg-indigo-100/60 p-3 rounded-full mb-4 backdrop-blur-sm">
                        <Upload className="w-6 h-6 text-indigo-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-900">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500 mt-1">JPG, PNG up to 20MB</p>
                      <input 
                        ref={fileInputRef}
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileChange}
                      />
                    </div>
                  ) : (
                    <div className="relative group rounded-2xl overflow-hidden border border-white/40 bg-white/30">
                      <img 
                        src={previewUrl} 
                        alt="Source" 
                        className="w-full h-auto max-h-[400px] object-contain" 
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={() => fileInputRef.current?.click()}
                          className="mr-2"
                        >
                          Change
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Controls Card */}
            <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-white/40 p-6 space-y-6">
              
              {/* Aspect Ratio (Hidden for Deck mode as it's forced to 16:9) */}
              {mode !== 'deck' && (
                <AspectRatioSelector value={aspectRatio} onChange={setAspectRatio} />
              )}

              {/* Pitch Deck Input Sources */}
              {mode === 'deck' && (
                <div className="space-y-4">
                   <label className="block text-sm font-medium text-gray-700">Content Source</label>
                   <div className="grid grid-cols-4 gap-2">
                      <button
                        onClick={() => setDeckInputMode('topic')}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-medium transition-all backdrop-blur-sm ${deckInputMode === 'topic' ? 'bg-indigo-50/60 border-indigo-500/50 text-indigo-700' : 'bg-white/40 border-white/50 text-gray-600 hover:bg-white/60'}`}
                      >
                         <PenTool className="w-4 h-4 mb-1" />
                         Topic
                      </button>
                      <button
                        onClick={() => setDeckInputMode('file')}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-medium transition-all backdrop-blur-sm ${deckInputMode === 'file' ? 'bg-indigo-50/60 border-indigo-500/50 text-indigo-700' : 'bg-white/40 border-white/50 text-gray-600 hover:bg-white/60'}`}
                      >
                         <FileText className="w-4 h-4 mb-1" />
                         File
                      </button>
                      <button
                        onClick={() => setDeckInputMode('url')}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-medium transition-all backdrop-blur-sm ${deckInputMode === 'url' ? 'bg-indigo-50/60 border-indigo-500/50 text-indigo-700' : 'bg-white/40 border-white/50 text-gray-600 hover:bg-white/60'}`}
                      >
                         <Globe className="w-4 h-4 mb-1" />
                         Web
                      </button>
                      <button
                        onClick={() => setDeckInputMode('voice')}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-medium transition-all backdrop-blur-sm ${deckInputMode === 'voice' ? 'bg-indigo-50/60 border-indigo-500/50 text-indigo-700' : 'bg-white/40 border-white/50 text-gray-600 hover:bg-white/60'}`}
                      >
                         <Mic className="w-4 h-4 mb-1" />
                         Voice
                      </button>
                   </div>
                </div>
              )}

              {/* Dynamic Input Fields */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {mode === 'transform' ? 'How should we transform this?' : 
                    mode === 'deck' ? (
                        deckInputMode === 'topic' ? 'What is your pitch deck about?' :
                        deckInputMode === 'file' ? 'Upload a document or image' :
                        deckInputMode === 'voice' ? 'Record or Upload Voice Note' :
                        'Enter Website or Company Name'
                    ) :
                    'Describe what you want to create'}
                  </label>
                  {/* Magic Enhance Button */}
                  {(mode === 'generate' || mode === 'transform' || (mode === 'deck' && deckInputMode === 'topic')) && (
                    <button 
                      onClick={handleEnhancePrompt}
                      disabled={isEnhancingPrompt || !prompt}
                      className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50 transition-colors"
                      title="Rewrites your prompt to be more artistic and detailed using Gemini"
                    >
                       <Sparkles className={`w-3 h-3 ${isEnhancingPrompt ? 'animate-spin' : ''}`} />
                       {isEnhancingPrompt ? 'Enhancing...' : 'Magic Enhance'}
                    </button>
                  )}
                </div>

                {mode === 'deck' && deckInputMode === 'file' ? (
                  <div className="border border-white/50 rounded-xl p-4 bg-white/40 backdrop-blur-sm flex items-center justify-between">
                     <div className="flex items-center gap-3 overflow-hidden">
                       <div className="bg-indigo-100/60 p-2 rounded-lg">
                         <Upload className="w-5 h-5 text-indigo-600" />
                       </div>
                       <div className="truncate">
                         {deckFile ? (
                           <span className="text-sm font-medium text-gray-900">{deckFile.name}</span>
                         ) : (
                           <span className="text-sm text-gray-500">No file selected (PDF, Txt, Img)</span>
                         )}
                       </div>
                     </div>
                     <button 
                       onClick={() => deckFileInputRef.current?.click()}
                       className="text-sm font-medium text-indigo-600 hover:text-indigo-700 whitespace-nowrap ml-2"
                     >
                       {deckFile ? 'Change' : 'Browse'}
                     </button>
                     <input 
                        ref={deckFileInputRef}
                        type="file" 
                        accept=".pdf,.txt,.md,image/*" 
                        className="hidden" 
                        onChange={handleDeckFileChange}
                      />
                  </div>
                ) : mode === 'deck' && deckInputMode === 'voice' ? (
                  <VoiceInput 
                    onAudioReady={setVoiceBlob}
                    onAudioFileSelect={setVoiceFile}
                  />
                ) : mode === 'deck' && deckInputMode === 'url' ? (
                  <div className="relative">
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                       <Link className="h-5 w-5 text-gray-400" />
                     </div>
                     <input
                        type="text"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="e.g. www.tesla.com or 'Tesla'"
                        className="pl-10 block w-full rounded-xl border-white/50 bg-white/40 backdrop-blur-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 focus:bg-white/70 transition-colors"
                     />
                     <p className="mt-2 text-xs text-gray-500">We will use Google Search to find information.</p>
                  </div>
                ) : (
                  <textarea
                    value={prompt}
                    onChange={(e) => {
                      setPrompt(e.target.value);
                      if (mode !== 'deck') setSelectedTemplateId(null);
                    }}
                    placeholder={
                      mode === 'transform' ? "E.g., Make the background a snowy mountain, add a neon glow..." : 
                      mode === 'deck' ? "E.g., A startup creating biodegradable coffee cups from recycled bamboo..." :
                      "E.g., A professional flyer for a jazz concert, dark mood, saxophone illustration..."
                    }
                    className="w-full rounded-xl border-white/50 bg-white/40 backdrop-blur-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 min-h-[120px] p-3 text-sm resize-none focus:bg-white/70 transition-colors placeholder-gray-400"
                  />
                )}
              </div>

              {/* Template Selector based on Mode */}
              {mode === 'deck' ? (
                <DeckStyleSelector 
                  onSelect={handleDeckStyleSelect}
                  selectedStyleId={selectedDeckStyle?.id || null}
                />
              ) : (
                <TemplateSelector 
                  onSelect={handleTemplateSelect} 
                  selectedTemplateId={selectedTemplateId} 
                  mode={mode}
                />
              )}
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-7 flex flex-col" ref={resultRef}>
            <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-white/40 flex-1 flex flex-col overflow-hidden min-h-[500px]">
              <div className="p-4 border-b border-white/30 bg-white/20 flex justify-between items-center">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-indigo-600" />
                  {mode === 'deck' ? 'Generated Slides' : 'Generated Result'}
                </h2>
                
                {/* Download Button for Single Image Result */}
                {result?.imageUrl && mode !== 'deck' && (
                  <a 
                    href={result.imageUrl} 
                    download={`generated-design-${Date.now()}.png`}
                    className="inline-flex items-center px-3 py-1.5 border border-white/40 shadow-sm text-xs font-medium rounded text-gray-700 bg-white/50 hover:bg-white/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 backdrop-blur-sm"
                  >
                    <Download className="w-3 h-3 mr-1.5" />
                    Download
                  </a>
                )}
              </div>

              <div className="flex-1 flex flex-col relative">
                
                {status === 'error' && (
                  <div className="p-8 flex flex-col items-center justify-center h-full gap-4">
                    <div className="text-center max-w-md p-6 bg-red-50/70 backdrop-blur-md rounded-2xl border border-red-100/50">
                      <div className="bg-red-100/60 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                      </div>
                      <h3 className="text-red-900 font-medium mb-1">Generation Failed</h3>
                      <p className="text-red-600 text-sm mb-4">{errorMsg}</p>
                      <Button variant="danger" size="sm" onClick={handleGenerate}>
                         Try Again
                      </Button>
                    </div>
                  </div>
                )}

                {status === 'idle' && !result && deckResult.length === 0 && (
                  <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center max-w-sm text-gray-500">
                      <div className="bg-white/40 backdrop-blur-sm p-4 rounded-full shadow-lg inline-block mb-4 border border-white/40">
                        {mode === 'transform' ? <ImageIcon className="w-8 h-8 text-indigo-400" /> : 
                         mode === 'deck' ? <Presentation className="w-8 h-8 text-indigo-400" /> :
                         <Sparkles className="w-8 h-8 text-indigo-400" />}
                      </div>
                      <p className="font-medium text-gray-700 text-lg">
                        {mode === 'transform' ? 'Ready to transform' : 
                         mode === 'deck' ? 'Ready to build your deck' : 
                         'Ready to create'}
                      </p>
                      <p className="text-sm mt-2 text-gray-600">
                        {mode === 'transform' ? 'Upload an image and enter a prompt to get started.' : 
                         mode === 'deck' ? 'Choose your source (Topic, File, URL, or Voice) and style.' :
                         'Enter a detailed prompt to design your flyer or banner.'}
                      </p>
                    </div>
                  </div>
                )}

                {(status === 'generating' || status === 'analyzing') && (
                  <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-md flex items-center justify-center">
                    <div className="text-center">
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-indigo-200/50 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <SparkleIcon className="w-6 h-6 text-indigo-600 animate-pulse" />
                        </div>
                      </div>
                      <p className="text-indigo-900 font-medium animate-pulse text-lg">
                        {progressMessage || 'Processing...'}
                      </p>
                      <p className="text-indigo-600 text-xs mt-1">
                        AI is thinking...
                      </p>
                    </div>
                  </div>
                )}

                {/* Single Image Result */}
                {mode !== 'deck' && result?.imageUrl && (
                  <div className="flex-1 flex flex-col items-center justify-center p-6">
                    <img 
                      src={result.imageUrl} 
                      alt="Generated" 
                      className="max-w-full max-h-[600px] object-contain rounded-xl shadow-2xl border border-white/20"
                    />
                    {result.text && (
                      <div className="mt-4 p-4 bg-white/70 backdrop-blur-xl border border-white/50 rounded-xl max-w-2xl shadow-lg">
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold text-indigo-600 block mb-1">AI Note</span> {result.text}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Deck Result (Grid) */}
                {mode === 'deck' && deckResult.length > 0 && (
                   <SlideGallery 
                      slides={deckResult} 
                      onRegenerateSlide={handleRegenerateSlide}
                      regeneratingIndex={regeneratingSlideIndex}
                   />
                )}

              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Action Bar */}
      <div className="sticky bottom-0 bg-white/60 backdrop-blur-xl border-t border-white/40 p-4 shadow-lg z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="hidden sm:block text-sm text-gray-600 font-medium">
             {mode === 'transform' 
               ? (selectedFile ? 'Image selected ready for processing' : 'Please upload an image first')
               : mode === 'deck'
               ? (selectedDeckStyle 
                  ? (deckInputMode === 'file' && !deckFile ? 'Please select a file' : 
                     deckInputMode === 'url' && !urlInput ? 'Please enter a URL' :
                     deckInputMode === 'voice' && !voiceBlob && !voiceFile ? 'Please record or upload voice' :
                     deckInputMode === 'topic' && !prompt ? 'Please enter a topic' :
                     'Ready to generate deck')
                  : 'Please select a style')
               : 'Create a unique design from text'
             }
          </div>
          <Button 
            onClick={handleGenerate}
            disabled={
              (mode === 'transform' && !selectedFile) || 
              (mode === 'deck' && deckInputMode === 'topic' && !prompt.trim()) ||
              (mode === 'deck' && deckInputMode === 'url' && !urlInput.trim()) ||
              (mode === 'deck' && deckInputMode === 'file' && !deckFile) ||
              (mode === 'deck' && deckInputMode === 'voice' && !voiceBlob && !voiceFile) ||
              (mode === 'generate' && !prompt.trim())
            }
            isLoading={status === 'generating' || status === 'analyzing'}
            className="w-full sm:w-auto min-w-[200px] shadow-xl shadow-indigo-500/20"
            icon={mode === 'transform' ? <Wand2 className="w-4 h-4" /> : 
                  mode === 'deck' ? <Presentation className="w-4 h-4" /> : 
                  <Sparkles className="w-4 h-4" />}
          >
            {status === 'generating' || status === 'analyzing' ? 'Processing...' : 
             mode === 'transform' ? 'Transform Image' : 
             mode === 'deck' ? 'Generate Deck' :
             'Generate Design'}
          </Button>
        </div>
      </div>
    </div>
  );
}

const SparkleIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);
