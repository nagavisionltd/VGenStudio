import { PresetTemplate, DeckStyle } from './types';

export const GEMINI_MODEL_NAME = 'gemini-2.5-flash-image';

export const PRESET_TEMPLATES: PresetTemplate[] = [
  // Transform Templates (Image-to-Image)
  {
    id: '1',
    name: 'Instagram Summer Sale',
    description: 'Bright, vibrant summer themed sale post',
    category: 'social',
    prompt: 'Transform this image into a vibrant Instagram summer sale post. Add "SUMMER SALE" text overlay in a bold, fun font. Add tropical leaves and bright yellow accents in the background.',
    mode: 'transform'
  },
  {
    id: '2',
    name: 'Luxury Product Background',
    description: 'Minimalist marble podium for e-commerce',
    category: 'ecommerce',
    prompt: 'Place this product on a sleek white marble podium. Use soft, high-key lighting to make it look expensive and luxurious. Remove the original background and replace it with a clean, blurred studio background.',
    mode: 'transform'
  },
  {
    id: '3',
    name: 'Cyberpunk Flyer',
    description: 'Neon lights and futuristic city vibes',
    category: 'creative',
    prompt: 'Edit this image to have a cyberpunk aesthetic. Add neon blue and pink lighting effects. Place the subject in a futuristic city street at night with glowing signs.',
    mode: 'transform'
  },
  {
    id: '4',
    name: 'Cozy Lifestyle',
    description: 'Warm, homey atmosphere for products',
    category: 'lifestyle',
    prompt: 'Place this object in a cozy living room setting with soft warm lighting, a wooden table surface, and a blurred fireplace in the background. Make it look like a comfortable home lifestyle shot.',
    mode: 'transform'
  },
  {
    id: '5',
    name: 'Professional Headshot Polish',
    description: 'Clean background and lighting fix',
    category: 'creative',
    prompt: 'Keep the person exactly as is but improve the lighting to be studio quality. Change the background to a professional blurred office setting.',
    mode: 'transform'
  },
  {
    id: '6',
    name: 'Flash Sale Banner',
    description: 'Urgent red and white promotional banner',
    category: 'social',
    prompt: 'Turn this into a horizontal flash sale web banner. Use a red and white color scheme. Add "FLASH SALE - 50% OFF" text clearly visible next to the subject.',
    mode: 'transform'
  },

  // Generate Templates (Text-to-Image)
  {
    id: '7',
    name: 'Grand Opening Flyer',
    description: 'Professional flyer for a cafe opening',
    category: 'social',
    prompt: 'Create a stylish flyer for a "Grand Opening" of a modern coffee shop. Use warm, inviting colors with an illustration of a latte art coffee cup. Add the text "GRAND OPENING" in elegant typography.',
    mode: 'generate'
  },
  {
    id: '8',
    name: 'Tech Conference Banner',
    description: 'Futuristic banner for tech event',
    category: 'creative',
    prompt: 'Design a wide web banner for a "Future Tech 2025" conference. Use a deep blue and purple gradient background with abstract digital circuit patterns. Include the text "FUTURE TECH 2025" in a sleek, modern font.',
    mode: 'generate'
  },
  {
    id: '9',
    name: 'Summer Music Festival',
    description: 'Vibrant concert poster design',
    category: 'creative',
    prompt: 'Generate a vibrant poster for a summer music festival. Use bright sunset colors (orange, pink, purple) and silhouette illustrations of a crowd and palm trees. Add text "SUMMER VIBES FEST" in a large, distressed font.',
    mode: 'generate'
  },
  {
    id: '10',
    name: 'Minimalist Skincare Ad',
    description: 'Clean, pastel product advertisement',
    category: 'ecommerce',
    prompt: 'Create a clean, minimalist advertisement background for skincare. Use soft pastel green and white tones. Include organic shapes like leaves and water ripples. Leave a central space for product placement.',
    mode: 'generate'
  }
];

export const DECK_STYLES: DeckStyle[] = [
  {
    id: 'swiss-minimal',
    name: 'Swiss Minimalist',
    description: 'Clean, grid-based, bold typography, high contrast.',
    promptModifier: 'in a Swiss International Style. Use a strict grid layout, lots of white space, and bold, black sans-serif typography (Helvetica style). Keep colors to black, white, and one bold accent color like red or blue. The look should be corporate but ultra-modern and clean.',
    previewColors: { bg: '#ffffff', text: '#000000', accent: '#dc2626', secondary: '#f3f4f6' }
  },
  {
    id: 'tech-noir',
    name: 'Tech Noir',
    description: 'Dark mode, neon gradients, futuristic.',
    promptModifier: 'in a dark futuristic "Tech Noir" style. Use a deep charcoal or black background with glowing neon gradients (cyan and magenta). Use sleek, thin monospaced fonts. Include abstract data visualization elements and grid lines in the background.',
    previewColors: { bg: '#0f172a', text: '#e2e8f0', accent: '#06b6d4', secondary: '#1e293b' }
  },
  {
    id: 'eco-modern',
    name: 'Eco Modern',
    description: 'Natural tones, soft shapes, organic feel.',
    promptModifier: 'in an "Eco Modern" style. Use a palette of sage greens, creams, and earth tones. Use rounded, soft shapes and organic textures (like paper or stone). The typography should be elegant serif or soft sans-serif. It should feel sustainable and premium.',
    previewColors: { bg: '#f0fdf4', text: '#14532d', accent: '#86efac', secondary: '#dcfce7' }
  },
  {
    id: 'bold-pop',
    name: 'Bold Pop',
    description: 'Vibrant colors, high energy, playful.',
    promptModifier: 'in a "Bold Pop" style. Use clashing, vibrant colors like yellow, pink, and electric blue. Use heavy, chunky fonts and collage-style elements. The layout should be energetic and dynamic, perfect for a B2C consumer brand.',
    previewColors: { bg: '#fef08a', text: '#000000', accent: '#ec4899', secondary: '#3b82f6' }
  },
  {
    id: 'corporate-blue',
    name: 'Trusted Corporate',
    description: 'Professional, trustworthy, classic blue.',
    promptModifier: 'in a classic "Trusted Corporate" style. Use a palette of navy blue, white, and grey. The layout should be traditional and structured. Use clean, professional sans-serif fonts. Include subtle geometric patterns in the background.',
    previewColors: { bg: '#ffffff', text: '#1e3a8a', accent: '#2563eb', secondary: '#eff6ff' }
  }
];
