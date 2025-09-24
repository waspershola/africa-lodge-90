import { HotelConfiguration } from '@/types/configuration';

// Font style mappings
export const FONT_STYLE_MAP = {
  giveny: 'font-giveny',
  didot: 'font-didot',
  bodoni: 'font-bodoni',
  cormorant: 'font-cormorant',
  playfair: 'font-playfair',
  zabatana: 'font-zabatana',
  coldiac: 'font-coldiac',
  malligoe: 'font-malligoe',
} as const;

export const FONT_DESCRIPTIONS = {
  giveny: 'Classy Serif Font - Classic elegance, high-fashion inspired',
  didot: 'Timeless Parisian Fashion - Iconic in fashion magazines',
  bodoni: 'Classic Modern Luxury - Refined Italian contrast serif',
  cormorant: 'Regal & Royal - Ornamental Garamond variant',
  playfair: 'Modern Chic Serif - Editorial, contemporary yet timeless',
  zabatana: 'Bold Geometric Display - Artistic with unique flourishes',
  coldiac: 'Luxury Serif Font - Elegant all-caps serif, tall and refined',
  malligoe: 'Script Branding Font - Flowing cursive, indulgent and romantic',
} as const;

/**
 * Apply the global font style to the document root
 * This will affect all text throughout the application
 */
export const applyGlobalFontStyle = (fontStyle: HotelConfiguration['branding']['font_style']) => {
  const root = document.documentElement;
  
  // Remove all existing font classes
  Object.values(FONT_STYLE_MAP).forEach(className => {
    root.classList.remove(className);
  });
  
  // Apply the selected font class
  const fontClass = FONT_STYLE_MAP[fontStyle];
  if (fontClass) {
    root.classList.add(fontClass);
  }
};

/**
 * Get the CSS class name for a font style
 */
export const getFontClassName = (fontStyle: HotelConfiguration['branding']['font_style']) => {
  return FONT_STYLE_MAP[fontStyle] || FONT_STYLE_MAP.playfair;
};

/**
 * Get the font description
 */
export const getFontDescription = (fontStyle: HotelConfiguration['branding']['font_style']) => {
  return FONT_DESCRIPTIONS[fontStyle] || FONT_DESCRIPTIONS.playfair;
};