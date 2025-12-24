
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
  title?: string;
}

export interface StrategyReport {
  summary: string;
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  marketStrategy: string;
  actionPlan: {
    immediate: string[];
    midTerm: string[];
    longTerm: string[];
  };
}

export interface SlideContent {
  title: string;
  content: string;
  visualPrompt: string;
}

export interface DeckGenerationResponse {
  results: GenerationResult[];
  rawSlides: SlideContent[];
  strategy: StrategyReport;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  mode: AppMode;
  thumbnail: string;
  results: GenerationResult[];
  prompt: string;
  strategy?: StrategyReport;
}

export type ProcessingStatus = 'idle' | 'uploading' | 'analyzing' | 'generating' | 'success' | 'error';
