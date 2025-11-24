import { GoogleGenAI, Type } from "@google/genai";
import { GEMINI_MODEL_NAME } from '../constants';
import { GenerationResult, DeckStyle, SlideContent } from '../types';

// Ensure API key is available
if (!process.env.API_KEY) {
  console.error("Missing API_KEY in environment variables");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

/**
 * Converts a File object to a base64 string.
 */
export const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Generates an image based on the prompt using Gemini 2.5 Flash Image.
 * Supports both Image-to-Image (if imageFile provided) and Text-to-Image.
 */
export const generateImage = async (
  prompt: string,
  imageFile?: File | null,
  aspectRatio: string = '1:1'
): Promise<GenerationResult> => {
  try {
    const parts: any[] = [];

    // If there is an image, add it to the parts
    if (imageFile) {
      const imagePart = await fileToGenerativePart(imageFile);
      parts.push(imagePart);
    }
    
    // Always add the text prompt
    parts.push({ text: prompt });
    
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: {
        parts: parts
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio
        }
      }
    });

    let imageUrl: string | null = null;
    let text: string | null = null;

    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          // Determine mime type if possible, default to png if not provided in part
          const mimeType = part.inlineData.mimeType || 'image/png';
          imageUrl = `data:${mimeType};base64,${base64EncodeString}`;
        } else if (part.text) {
          text = part.text;
        }
      }
    }

    return { imageUrl, text };
  } catch (error) {
    console.error("Error generating content:", error);
    throw error;
  }
};

/**
 * Analyzes input (text, file, or url) to extract structured slide content.
 */
const analyzeDeckContent = async (
  input: string,
  file: File | null,
  mode: 'topic' | 'file' | 'url'
): Promise<SlideContent[]> => {
  const model = 'gemini-2.5-flash';
  
  const systemInstruction = `You are a professional pitch deck creator. 
  Your task is to extract key information from the provided context and structure it into exactly 6 key slides for a presentation:
  1. Title Slide (Company Name & Tagline)
  2. The Problem (What pain point are they solving?)
  3. The Solution (Product/Service description)
  4. Market Opportunity (Target audience, size)
  5. The Team (Key roles mentioned or generic structure)
  6. The Vision/Impact (Closing statement)
  
  For each slide, provide:
  - title: The headline for the slide.
  - content: Brief, punchy bullet points or text (max 30 words).
  - visualPrompt: A detailed description of the imagery for this slide. Do NOT ask for text in the image in this field, just the visual scene.`;

  const parts: any[] = [];

  if (mode === 'file' && file) {
    const filePart = await fileToGenerativePart(file);
    parts.push(filePart);
    parts.push({ text: "Analyze this document to create a pitch deck." });
  } else if (mode === 'url') {
    parts.push({ text: `Research this website/company: ${input}. Create a pitch deck structure based on what you find.` });
  } else {
    parts.push({ text: `Create a pitch deck based on this topic: ${input}` });
  }

  const response = await ai.models.generateContent({
    model: model,
    contents: { parts },
    config: {
      systemInstruction: systemInstruction,
      tools: mode === 'url' ? [{ googleSearch: {} }] : undefined,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING },
            visualPrompt: { type: Type.STRING }
          }
        }
      }
    }
  });

  try {
    const text = response.text;
    if (!text) throw new Error("No response from analysis model");
    return JSON.parse(text) as SlideContent[];
  } catch (e) {
    console.error("Failed to parse analysis response", e);
    // Fallback if JSON parsing fails or model hallucinates format
    return [
      { title: "Title Slide", content: input, visualPrompt: "A professional title slide" },
      { title: "The Problem", content: "Defining the core issue", visualPrompt: "Abstract representation of a problem" },
      { title: "The Solution", content: "Our innovative solution", visualPrompt: "Product shot or solution visualization" },
      { title: "Market", content: "Growing opportunity", visualPrompt: "Growth chart or map" },
      { title: "Team", content: "Our experts", visualPrompt: "Professional team photos" },
      { title: "Vision", content: "Future outlook", visualPrompt: "Futuristic and inspiring imagery" },
    ];
  }
};

/**
 * Generates a pitch deck (set of slides) based on a topic/file/url and style.
 */
export const generatePitchDeck = async (
  input: string,
  file: File | null,
  inputMode: 'topic' | 'file' | 'url',
  style: DeckStyle
): Promise<GenerationResult[]> => {
  
  // Step 1: Analyze content to get structure
  const slidesContent = await analyzeDeckContent(input, file, inputMode);

  // Step 2: Generate images for each slide in parallel
  const promises = slidesContent.map(async (slide) => {
    // Construct a specific prompt for the image model that combines content + style
    const prompt = `Design a presentation slide.
    Style: ${style.promptModifier}
    Slide Type: ${slide.title}
    
    TEXT TO INCLUDE ON SLIDE:
    Headline: "${slide.title}"
    Body: "${slide.content}"
    
    VISUALS:
    ${slide.visualPrompt}
    
    Ensure the text is legible and follows the requested style colors.`;
    
    const result = await generateImage(prompt, null, '16:9');
    return { ...result, title: slide.title };
  });

  return Promise.all(promises);
};