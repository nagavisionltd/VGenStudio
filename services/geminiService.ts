
import { GoogleGenAI, Type } from "@google/genai";
import { GEMINI_MODEL_NAME } from '../constants';
import { GenerationResult, DeckStyle, SlideContent, DeckInputMode } from '../types';

// Ensure API key is available
if (!process.env.API_KEY) {
  console.error("Missing API_KEY in environment variables");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

/**
 * Utility to pause execution for a set time.
 */
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Helper to retry operations on 503 Service Unavailable errors.
 */
const retryOperation = async <T>(operation: () => Promise<T>, retries = 2, delay = 1000): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    if (retries > 0 && (error.status === 503 || error.message?.includes('503') || error.message?.includes('Overloaded'))) {
      console.warn(`Operation failed with 503, retrying in ${delay}ms...`);
      await wait(delay);
      return retryOperation(operation, retries - 1, delay * 2);
    }
    throw error;
  }
};

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
 * Optimizes a simple user prompt into a detailed image generation prompt.
 */
export const optimizePrompt = async (originalPrompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { text: `You are an expert prompt engineer for AI Image Generators. 
          Rewrite the following user prompt to be highly detailed, artistic, and professional. 
          Focus on lighting, composition, texture, color palette, and mood.
          Keep the intent of the user but make it "world-class design" quality.
          
          User Prompt: "${originalPrompt}"
          
          Output ONLY the rewritten prompt string. Do not add markdown or explanations.` }
        ]
      }
    });
    return response.text?.trim() || originalPrompt;
  } catch (e) {
    console.error("Prompt optimization failed", e);
    return originalPrompt;
  }
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
  return retryOperation(async () => {
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

      // STRICT CHECK: If no image was returned, it likely failed safety checks or model refused
      if (!imageUrl && !text) {
        throw new Error("The AI generation was blocked or returned no content. This is usually due to safety filters detecting sensitive subjects (e.g., real people/faces). Try adjusting your prompt to be more abstract.");
      }

      // If we got text but no image in an image model call, it might be a refusal message
      if (!imageUrl && text) {
         throw new Error(`Generation blocked: ${text}`);
      }

      return { imageUrl, text };
    } catch (error) {
      console.error("Error generating content:", error);
      throw error;
    }
  });
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
  Your task is to extract key information from the provided context and structure it into exactly 12 key slides for a comprehensive pitch deck.
  The slides are:
  1. Title Slide (Company Name & Tagline)
  2. The Problem (What pain point are they solving?)
  3. The Solution (Product/Service description)
  4. Why Now? (Timing and trends)
  5. Market Size (TAM/SAM/SOM or opportunity)
  6. Product Detail (Key features or tech)
  7. Business Model (How they make money)
  8. Competition (Landscape and advantage)
  9. Go-to-Market Strategy (Marketing & Sales)
  10. Traction/Financials (Milestones or projections)
  11. The Team (Key roles or structure)
  12. The Vision/Ask (Closing statement or roadmap)
  
  For each slide, provide:
  - title: The headline for the slide (Keep it short, max 5 words).
  - content: ONE or TWO powerful sentences max. Do not use bullet points unless absolutely necessary. Keep it punchy (max 20 words).
  - visualPrompt: A highly specific description of the visual scene for this slide. Describe the layout, where the text goes, and the background imagery.
  
  CRITICAL SAFETY INSTRUCTION:
  For slide 11 (The Team), the visualPrompt MUST request "abstract avatars", "minimalist icons", "geometric silhouettes", or "stylized character illustrations" to represent team members. 
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

  try {
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

    const text = response.text;
    if (!text) throw new Error("No response from analysis model");
    
    // Robust cleaning: remove potential markdown code blocks if the model includes them
    let cleanJson = text.trim();
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```(json)?/, '').replace(/```$/, '');
    }

    return JSON.parse(cleanJson) as SlideContent[];
  } catch (e) {
    console.error("Failed to parse analysis response", e);
    // Fallback if JSON parsing fails or model hallucinates format
    return [
      { title: "Title Slide", content: input || "My Presentation", visualPrompt: "A professional title slide with abstract geometric shapes" },
      { title: "The Problem", content: "Defining the core issue", visualPrompt: "Abstract representation of a problem or friction, dark tones" },
      { title: "The Solution", content: "Our innovative solution", visualPrompt: "Product shot or solution visualization in a clean environment, bright" },
      { title: "Why Now", content: "Market timing is perfect", visualPrompt: "Clock or timeline visualization, urgent and dynamic" },
      { title: "Market Size", content: "Massive opportunity ahead", visualPrompt: "Upward trending graph or map visualization, data driven" },
      { title: "Product", content: "Seamless user experience", visualPrompt: "App interface mockups or device renders, sleek" },
      { title: "Business Model", content: "Sustainable revenue streams", visualPrompt: "Abstract coin or flow chart visualization, organized" },
      { title: "Competition", content: "Our unique advantage", visualPrompt: "Chess pieces or race track metaphor, strategic" },
      { title: "Go-to-Market", content: "Scaling strategy", visualPrompt: "Network nodes or rocket launch imagery, expansive" },
      { title: "Traction", content: "Key milestones achieved", visualPrompt: "Mountain peak or flag planting, success oriented" },
      { title: "Team", content: "Our experts", visualPrompt: "Professional team structure visualization with abstract minimalist avatars, no photorealistic faces" },
      { title: "Vision", content: "Future outlook", visualPrompt: "Futuristic and inspiring imagery, horizon or light" },
    ];
  }
};

/**
 * Generates a single slide image based on content and style.
 * Used for both initial generation and regeneration.
 */
export const generateSingleSlide = async (slide: SlideContent, style: DeckStyle): Promise<GenerationResult> => {
  try {
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
    - Respect the margins and whitespace defined in the style.
    - If regenerating, try a slightly different variation of the same concept.`;

    const result = await generateImage(prompt, null, '16:9');
    return { ...result, title: slide.title };
  } catch (error) {
    console.warn(`Failed to generate slide: ${slide.title}`, error);
    // Return a special error object that allows the slide to render in error state
    return { imageUrl: null, text: "Image generation failed due to safety filters.", title: slide.title };
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
  style: DeckStyle,
  onProgress: (status: string) => void
): Promise<{results: GenerationResult[], rawSlides: SlideContent[]}> => {
  
  onProgress("Analyzing content & structuring deck...");
  // Step 1: Analyze content to get structure
  const slidesContent = await analyzeDeckContent(input, file, audio, inputMode);

  // Step 2: Generate images for each slide
  // We do this sequentially with a delay to prevent server overload (500 errors)
  const results: GenerationResult[] = [];
  
  for (let i = 0; i < slidesContent.length; i++) {
    onProgress(`Generating Slide ${i + 1} of ${slidesContent.length}...`);
    
    // Add a delay between slides to be gentle on the API and avoid rate limits/500 errors
    if (i > 0) {
      await wait(1500); // 1.5 second delay
    }

    // Individual slide failures are handled inside generateSingleSlide, returning a fallback object
    const result = await generateSingleSlide(slidesContent[i], style);
    results.push(result);
  }

  return { results, rawSlides: slidesContent };
};
