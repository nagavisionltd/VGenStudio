import { GoogleGenAI, Type } from "@google/genai";
import { GEMINI_MODEL_NAME } from '../constants';
import { GenerationResult, DeckStyle, SlideContent, DeckInputMode } from '../types';

// Ensure API key is available
if (!process.env.API_KEY) {
  console.error("Missing API_KEY in environment variables");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

/**
 * Converts a File or Blob to a base64 string.
 */
export const fileToGenerativePart = async (file: File | Blob): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
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
 * Analyzes input (text, file, url, or audio) to extract structured slide content.
 */
const analyzeDeckContent = async (
  input: string,
  file: File | null,
  audio: Blob | null,
  mode: DeckInputMode
): Promise<SlideContent[]> => {
  const model = 'gemini-2.5-flash';
  
  const systemInstruction = `You are a world-class venture capital presentation consultant. 
  Your task is to extract key information from the provided context and structure it into exactly 6 key slides for a pitch deck.
  The slides are:
  1. Title Slide (Company Name & Tagline)
  2. The Problem (What pain point are they solving?)
  3. The Solution (Product/Service description)
  4. Market Opportunity (Target audience, size)
  5. The Team (Key roles mentioned or generic structure)
  6. The Vision/Impact (Closing statement)
  
  For each slide, provide:
  - title: The headline for the slide (Keep it short, max 5 words).
  - content: ONE or TWO powerful sentences max. Do not use bullet points unless absolutely necessary. Keep it punchy (max 20 words).
  - visualPrompt: A highly specific description of the visual scene for this slide. Describe the layout, where the text goes, and the background imagery.
  
  CRITICAL SAFETY INSTRUCTION:
  For slide 5 (The Team), the visualPrompt MUST request "abstract avatars", "minimalist icons", "geometric silhouettes", or "stylized character illustrations" to represent team members. 
  DO NOT ask for "photorealistic people", "photos of faces", "portraits of humans", or "realistic staff photos" as this will trigger safety filters and fail the generation. Keep the team visualization abstract and artistic.`;

  const parts: any[] = [];

  if (mode === 'voice' && audio) {
    const audioPart = await fileToGenerativePart(audio);
    parts.push(audioPart);
    parts.push({ text: "Listen to this audio recording and extract the key pitch deck information from it." });
  } else if (mode === 'file' && file) {
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
      { title: "Title Slide", content: input || "My Presentation", visualPrompt: "A professional title slide with abstract geometric shapes" },
      { title: "The Problem", content: "Defining the core issue", visualPrompt: "Abstract representation of a problem or friction, dark tones" },
      { title: "The Solution", content: "Our innovative solution", visualPrompt: "Product shot or solution visualization in a clean environment, bright" },
      { title: "Market", content: "Growing opportunity", visualPrompt: "Upward trending graph or map visualization, data driven" },
      { title: "Team", content: "Our experts", visualPrompt: "Professional team structure visualization with abstract minimalist avatars, no photorealistic faces" },
      { title: "Vision", content: "Future outlook", visualPrompt: "Futuristic and inspiring imagery, horizon or light" },
    ];
  }
};

/**
 * Generates a pitch deck (set of slides) based on a topic/file/url/audio and style.
 */
export const generatePitchDeck = async (
  input: string,
  file: File | null,
  audio: Blob | null,
  inputMode: DeckInputMode,
  style: DeckStyle
): Promise<GenerationResult[]> => {
  
  // Step 1: Analyze content to get structure
  const slidesContent = await analyzeDeckContent(input, file, audio, inputMode);

  // Step 2: Generate images for each slide in parallel
  const promises = slidesContent.map(async (slide) => {
    try {
      // Construct a high-fidelity prompt
      const prompt = `Create a high-quality presentation slide image.
      
      DESIGN SPECIFICATIONS:
      ${style.promptModifier}
      
      SLIDE CONTENT:
      Headline: "${slide.title}"
      Body Copy: "${slide.content}"
      
      VISUAL SCENE:
      ${slide.visualPrompt}
      
      CRITICAL:
      - The text MUST be legible, spelled correctly, and integrated into the design.
      - Do not produce a generic "slide in a computer screen" image. Generate the slide graphic itself (flat).
      - Respect the margins and whitespace defined in the style.`;
      
      const result = await generateImage(prompt, null, '16:9');
      return { ...result, title: slide.title };
    } catch (error) {
      console.warn(`Failed to generate slide: ${slide.title}`, error);
      // Return a valid result with no image so the whole deck doesn't fail
      return { imageUrl: null, text: "Image generation failed. This may be due to safety filters.", title: slide.title };
    }
  });

  return Promise.all(promises);
};