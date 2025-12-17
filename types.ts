
export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';

export type AppMode = 'transform' | 'generate' | 'deck' | 'history';

export type DeckInputMode = 'topic' | 'file' | 'url' | 'voice';

export interface PresetTemplate {
  id: string;
  name: string;
  description: string;
  prompt: string;
  category: 'social' | 'ecommerce' | 'lifestyle' | 'creative';
  mode: 'transform' | 'generate';
  recommendedRatio?: AspectRatio;
}

export interface DeckStyle {
  id: string;
  name: string;
  description: string;
  promptModifier: string;
  previewColors: {
    bg: string;
    text: string;
    accent: string;
    secondary: string;
  };
}

export interface GenerationResult {
  imageUrl: string | null;
  text: string | null;
  title?: string; // Optional title for deck slides
}

export interface SlideContent {
  title: string;
  content: string;
  visualPrompt: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  mode: AppMode;
  thumbnail: string; // The first image url
  results: GenerationResult[]; // Array for decks, single item array for others
  prompt: string;
}

export type ProcessingStatus = 'idle' | 'uploading' | 'analyzing' | 'generating' | 'success' | 'error';