
import { GoogleGenAI, Type } from "@google/genai";
import { GEMINI_MODEL_NAME } from '../constants';
import { GenerationResult, DeckStyle, SlideContent, DeckInputMode, StrategyReport, DeckGenerationResponse } from '../types';

// Initialize the Google GenAI SDK using strictly the environment variable as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const retryOperation = async <T>(operation: () => Promise<T>, retries = 2, delay = 1000): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    if (retries > 0 && (error.status === 503 || error.message?.includes('503') || error.message?.includes('Overloaded'))) {
      await wait(delay);
      return retryOperation(operation, retries - 1, delay * 2);
    }
    throw error;
  }
};

export const fileToGenerativePart = async (file: File | Blob): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type || 'application/octet-stream',
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const optimizePrompt = async (originalPrompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { text: `You are an expert prompt engineer. Optimize this prompt for world-class AI image generation: "${originalPrompt}". Focus on lighting, mood, and composition. Output ONLY the optimized prompt.` }
        ]
      }
    });
    return response.text?.trim() || originalPrompt;
  } catch (e) {
    return originalPrompt;
  }
};

export const generateImage = async (
  prompt: string,
  imageFile?: File | null,
  aspectRatio: string = '1:1'
): Promise<GenerationResult> => {
  return retryOperation(async () => {
    const parts: any[] = [];
    if (imageFile) {
      parts.push(await fileToGenerativePart(imageFile));
    }
    parts.push({ text: prompt });
    
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: { parts },
      config: { imageConfig: { aspectRatio: aspectRatio as any } }
    });

    let imageUrl: string | null = null;
    let text: string | null = null;

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        } else if (part.text) {
          text = part.text;
        }
      }
    }

    if (!imageUrl && !text) throw new Error("Safety filters blocked the generation.");
    return { imageUrl, text };
  });
};

const analyzeDeckContent = async (
  input: string,
  files: File[],
  audio: Blob | null,
  mode: DeckInputMode
): Promise<{ slides: SlideContent[], strategy: StrategyReport }> => {
  const model = 'gemini-3-pro-preview';
  
  const systemInstruction = `You are a world-class venture capital consultant. Analyze all provided inputs (text, multiple files, search results, or audio) to create:
  1. A 12-slide Pitch Deck structure.
  2. A comprehensive Business Strategy Report.

  STRICT SCHEMA REQUIREMENTS:
  - Slide Content: 12 slides (Title, Problem, Solution, Why Now, Market, Product, Business Model, Competition, Go-to-Market, Traction, Team, Vision).
  - visualPrompt: Must be abstract/artistic for 'Team' slides (no photorealistic faces).
  - Strategy Report: Summary, SWOT, Market Strategy, and 30/60/90 day Action Plan.`;

  const parts: any[] = [];

  if (mode === 'voice' && audio) {
    parts.push(await fileToGenerativePart(audio));
    parts.push({ text: "Extract pitch information from this audio recording." });
  } else if (mode === 'file' && files.length > 0) {
    for (const file of files) {
      parts.push(await fileToGenerativePart(file));
    }
    parts.push({ text: "Analyze these documents comprehensively to extract a business plan and pitch details." });
  } else if (mode === 'url') {
    parts.push({ text: `Research "${input}" using Google Search and synthesize a full deck and strategy.` });
  } else {
    parts.push({ text: `Create a pitch deck and strategy for this topic: ${input}` });
  }

  const response = await ai.models.generateContent({
    model: model,
    contents: { parts },
    config: {
      systemInstruction,
      tools: mode === 'url' ? [{ googleSearch: {} }] : undefined,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          slides: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                content: { type: Type.STRING },
                visualPrompt: { type: Type.STRING }
              }
            }
          },
          strategy: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              swot: {
                type: Type.OBJECT,
                properties: {
                  strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                  weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                  opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
                  threats: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              },
              marketStrategy: { type: Type.STRING },
              actionPlan: {
                type: Type.OBJECT,
                properties: {
                  immediate: { type: Type.ARRAY, items: { type: Type.STRING } },
                  midTerm: { type: Type.ARRAY, items: { type: Type.STRING } },
                  longTerm: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            }
          }
        }
      }
    }
  });

  const json = JSON.parse(response.text || '{}');
  return {
    slides: json.slides || [],
    strategy: json.strategy || {
      summary: "Could not generate full summary.",
      swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
      marketStrategy: "Analysis pending.",
      actionPlan: { immediate: [], midTerm: [], longTerm: [] }
    }
  };
};

export const generateSingleSlide = async (slide: SlideContent, style: DeckStyle): Promise<GenerationResult> => {
  const prompt = `Style: ${style.promptModifier}. Slide: "${slide.title}". Content: "${slide.content}". Visual: ${slide.visualPrompt}. Output high-res professional slide graphic.`;
  return await generateImage(prompt, null, '16:9');
};

export const generatePitchDeck = async (
  input: string,
  files: File[],
  audio: Blob | null,
  inputMode: DeckInputMode,
  style: DeckStyle,
  onProgress: (status: string) => void
): Promise<DeckGenerationResponse> => {
  onProgress("Deeply analyzing all inputs & crafting strategy...");
  const { slides, strategy } = await analyzeDeckContent(input, files, audio, inputMode);

  const results: GenerationResult[] = [];
  for (let i = 0; i < slides.length; i++) {
    onProgress(`Generating Slide ${i + 1} of ${slides.length}...`);
    if (i > 0) await wait(1200);
    const result = await generateSingleSlide(slides[i], style);
    results.push({ ...result, title: slides[i].title });
  }

  return { results, rawSlides: slides, strategy };
};
