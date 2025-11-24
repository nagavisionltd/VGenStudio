import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Trash2, Upload, AlertCircle, FileAudio } from 'lucide-react';
import { Button } from './Button';

interface VoiceInputProps {
  onAudioReady: (blob: Blob | null) => void;
  onAudioFileSelect: (file: File | null) => void;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onAudioReady, onAudioFileSelect }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'record' | 'upload'>('record');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    setError(null);
    setAudioBlob(null);
    onAudioReady(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        onAudioReady(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) window.clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClear = () => {
    setAudioBlob(null);
    onAudioReady(null);
    setRecordingTime(0);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAudioFile(file);
      onAudioFileSelect(file);
    }
  };

  const clearFile = () => {
    setAudioFile(null);
    onAudioFileSelect(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="border border-white/40 rounded-xl p-4 bg-white/40 backdrop-blur-sm">
      
      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-200/50 mb-4 pb-2">
        <button 
          onClick={() => setActiveTab('record')}
          className={`text-sm font-medium pb-1 transition-colors ${activeTab === 'record' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Record Voice
        </button>
        <button 
          onClick={() => setActiveTab('upload')}
          className={`text-sm font-medium pb-1 transition-colors ${activeTab === 'upload' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Upload Audio
        </button>
      </div>

      {activeTab === 'record' && (
        <div className="flex flex-col items-center justify-center py-4 space-y-4">
          {!audioBlob && !isRecording && (
            <button
              onClick={startRecording}
              className="w-16 h-16 rounded-full bg-red-500/90 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 focus:outline-none focus:ring-4 focus:ring-red-200 backdrop-blur-sm"
            >
              <Mic className="w-8 h-8" />
            </button>
          )}

          {isRecording && (
            <div className="flex flex-col items-center space-y-3">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
                <button
                  onClick={stopRecording}
                  className="relative w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg backdrop-blur-sm"
                >
                  <Square className="w-6 h-6 fill-current" />
                </button>
              </div>
              <div className="text-red-600 font-mono text-lg font-medium animate-pulse">
                Recording {formatTime(recordingTime)}
              </div>
            </div>
          )}

          {audioBlob && (
            <div className="w-full flex flex-col items-center space-y-3">
              <div className="w-full bg-white/60 border border-white/50 rounded-lg p-3 flex items-center gap-3 backdrop-blur-sm">
                <div className="w-10 h-10 rounded-full bg-indigo-100/50 flex items-center justify-center flex-shrink-0">
                  <Play className="w-5 h-5 text-indigo-600 ml-1" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">Voice Note</p>
                  <p className="text-xs text-gray-500">{formatTime(recordingTime)} • Ready to analyze</p>
                </div>
                <audio 
                  src={URL.createObjectURL(audioBlob)} 
                  controls 
                  className="hidden" 
                />
                <button 
                  onClick={handleClear}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-green-600 font-medium">Recording captured successfully!</p>
            </div>
          )}

          {!isRecording && !audioBlob && (
            <p className="text-sm text-gray-500">Tap microphone to start recording</p>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50/50 px-3 py-2 rounded-lg backdrop-blur-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>
      )}

      {activeTab === 'upload' && (
        <div className="flex flex-col items-center justify-center py-4">
          {!audioFile ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300/50 bg-white/30 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400/50 hover:bg-white/50 transition-colors backdrop-blur-sm"
            >
              <div className="bg-indigo-100/50 p-3 rounded-full mb-3">
                <Upload className="w-6 h-6 text-indigo-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">Click to upload audio</p>
              <p className="text-xs text-gray-500 mt-1">MP3, WAV, M4A up to 10MB</p>
              <input 
                ref={fileInputRef}
                type="file" 
                accept="audio/*"
                className="hidden" 
                onChange={handleFileUpload}
              />
            </div>
          ) : (
            <div className="w-full bg-white/60 border border-white/50 rounded-lg p-3 flex items-center gap-3 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-full bg-indigo-100/50 flex items-center justify-center flex-shrink-0">
                <FileAudio className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{audioFile.name}</p>
                <p className="text-xs text-gray-500">{(audioFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button 
                onClick={clearFile}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const XIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);