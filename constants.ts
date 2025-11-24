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
  },
  {
    id: '11',
    name: 'Podcast Cover Art',
    description: 'Bold typography and abstract shapes',
    category: 'creative',
    prompt: 'Design a trendy podcast cover art. Use bold, chunky typography for the title. Background should be an abstract collage of geometric shapes in pop colors (teal, coral, mustard).',
    mode: 'generate'
  }
];

export const DECK_STYLES: DeckStyle[] = [
  {
    id: 'swiss-minimal',
    name: 'Swiss Minimalist',
    description: 'Clean grids, bold Helvetica typography, high contrast.',
    promptModifier: 'Design Style: Swiss International / Bauhaus. LAYOUT: Strict grid system, massive negative space. TYPOGRAPHY: Huge, bold sans-serif headlines (Helvetica style) aligned left. COLORS: Stark Black and White with one bright accent (Red). VIBE: Professional, structured, architectural.',
    previewColors: { bg: '#ffffff', text: '#000000', accent: '#ef4444', secondary: '#e5e5e5' }
  },
  {
    id: 'saas-modern',
    name: 'SaaS Startup',
    description: 'Friendly, clean, gradient-heavy aesthetic.',
    promptModifier: 'Design Style: Modern SaaS / Tech Startup. LAYOUT: Clean, airy, rounded corners, soft drop shadows. TYPOGRAPHY: Friendly geometric sans-serif (Inter, circular). COLORS: White background, Blurple (Blue-Purple) gradients, vibrant primary buttons. VIBE: Optimistic, user-friendly, scalable.',
    previewColors: { bg: '#ffffff', text: '#111827', accent: '#6366f1', secondary: '#e0e7ff' }
  },
  {
    id: 'tech-noir',
    name: 'Tech Noir',
    description: 'Dark mode, neon gradients, futuristic data.',
    promptModifier: 'Design Style: Tech Noir / Cyber Future. LAYOUT: Dark mode interface style, HUD elements. TYPOGRAPHY: Sleek monospaced fonts, glowing text effects. COLORS: Deep charcoal background, Neon Cyan and Magenta gradients. VISUALS: Abstract data visualization, circuit lines. VIBE: Innovation, software, future.',
    previewColors: { bg: '#0f172a', text: '#e2e8f0', accent: '#06b6d4', secondary: '#1e293b' }
  },
  {
    id: 'luxury-editorial',
    name: 'Luxury Editorial',
    description: 'High-end fashion magazine aesthetic.',
    promptModifier: 'Design Style: Luxury Editorial / Vogue. LAYOUT: Asymmetrical, lots of whitespace, overlapping elements. TYPOGRAPHY: High-contrast Serif headlines (Didot/Bodoni) paired with small sans-serif captions. COLORS: Warm Beige, Charcoal, Gold accents. VIBE: Expensive, curated, timeless.',
    previewColors: { bg: '#fdfbf7', text: '#1c1917', accent: '#d4af37', secondary: '#e7e5e4' }
  },
  {
    id: 'eco-modern',
    name: 'Eco Modern',
    description: 'Natural tones, soft shapes, organic feel.',
    promptModifier: 'Design Style: Modern Organic. LAYOUT: Soft, fluid layouts with rounded corners. TYPOGRAPHY: Elegant serif headlines mixed with clean sans-serif body. COLORS: Sage green, cream, warm beige, earth tones. VISUALS: Natural textures (paper, stone, leaf shadows). VIBE: Sustainable, calm, premium.',
    previewColors: { bg: '#f7fee7', text: '#14532d', accent: '#86efac', secondary: '#dcfce7' }
  },
  {
    id: 'bold-pop',
    name: 'Bold Pop',
    description: 'Vibrant colors, high energy, brutalist touches.',
    promptModifier: 'Design Style: Neo-Brutalist Pop. LAYOUT: Asymmetrical, heavy borders, collage style. TYPOGRAPHY: Massive, chunky display fonts. COLORS: Clashing vibrant palette - Bright Yellow, Hot Pink, Electric Blue. VIBE: Energetic, youth-oriented, disruptor brand.',
    previewColors: { bg: '#fef08a', text: '#000000', accent: '#ec4899', secondary: '#3b82f6' }
  },
  {
    id: 'corporate-blue',
    name: 'Fortune 500',
    description: 'Trusted, professional, classic corporate structure.',
    promptModifier: 'Design Style: High-End Corporate. LAYOUT: Clean, balanced 2-column or 3-column layouts. TYPOGRAPHY: Professional sans-serif (Inter/Roboto). COLORS: Deep Navy Blue, White, Cool Grey. VISUALS: Subtle geometric overlays, glass-morphism effects. VIBE: Trustworthy, established, financial.',
    previewColors: { bg: '#ffffff', text: '#1e3a8a', accent: '#2563eb', secondary: '#f1f5f9' }
  }
];