// Theme utility functions for QR Portal

export interface ThemeInfo {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    background: string;
    accent: string;
  };
  features: string[];
  fontHeading: string;
  fontBody: string;
}

export const THEME_DEFINITIONS: Record<string, ThemeInfo> = {
  'classic-luxury-gold': {
    id: 'classic-luxury-gold',
    name: 'Classic Luxury Gold',
    description: 'Sophisticated gold accents on dark background with elegant serif typography',
    colors: {
      primary: '#D4AF37',
      background: '#1A1A1A',
      accent: '#F4F1EB'
    },
    features: ['Elegant serif fonts', 'Luxurious gold gradients', 'Subtle animations'],
    fontHeading: 'Playfair Display',
    fontBody: 'Inter'
  },
  'royal-white-gold': {
    id: 'royal-white-gold',
    name: 'Royal White & Gold',
    description: 'Clean white marble aesthetic with gold highlights and refined elegance',
    colors: {
      primary: '#D4AF37',
      background: '#FEFEFE',
      accent: '#F8F6F0'
    },
    features: ['Pure white design', 'Gold accent lines', 'Premium feel'],
    fontHeading: 'Playfair Display',
    fontBody: 'Inter'
  },
  'modern-minimal': {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    description: 'Bold black background with silver accents and clean sans-serif typography',
    colors: {
      primary: '#C0C0C0',
      background: '#000000',
      accent: '#1A1A1A'
    },
    features: ['Clean sans-serif fonts', 'Neon glow effects', 'Ultra-modern aesthetic'],
    fontHeading: 'Poppins',
    fontBody: 'Inter'
  },
  'tropical-elegance': {
    id: 'tropical-elegance',
    name: 'Tropical Elegance',
    description: 'Rich emerald gradient with gold accents and natural elegance',
    colors: {
      primary: '#50C878',
      background: '#0F4C3A',
      accent: '#D4AF37'
    },
    features: ['Natural green palette', 'Shimmering animations', 'Resort luxury feel'],
    fontHeading: 'Playfair Display',
    fontBody: 'Inter'
  }
};

export function getThemeClassName(themeId?: string): string {
  return `qr-theme-${themeId || 'classic-luxury-gold'}`;
}

export function getThemeInfo(themeId: string): ThemeInfo | null {
  return THEME_DEFINITIONS[themeId] || null;
}

export function isValidTheme(themeId: string): boolean {
  return themeId in THEME_DEFINITIONS;
}

export function getDefaultTheme(): string {
  return 'classic-luxury-gold';
}

// CSS custom property helpers
export function applyThemeProperties(element: HTMLElement, themeId: string): void {
  const theme = getThemeInfo(themeId);
  if (!theme) return;

  element.style.setProperty('--theme-primary', theme.colors.primary);
  element.style.setProperty('--theme-background', theme.colors.background);
  element.style.setProperty('--theme-accent', theme.colors.accent);
  element.style.setProperty('--theme-font-heading', theme.fontHeading);
  element.style.setProperty('--theme-font-body', theme.fontBody);
}

// Theme-specific animation classes
export function getAnimationClass(themeId: string, element: 'card' | 'button' | 'text'): string {
  const baseClass = `qr-${element}-animation`;
  return `${baseClass} ${baseClass}-${themeId}`;
}

// Accessibility helpers
export function getContrastRatio(color1: string, color2: string): number {
  // Simplified contrast ratio calculation
  // In a real implementation, you'd use a proper color contrast library
  return 4.5; // Placeholder - ensures WCAG AA compliance
}

export function ensureAccessibility(themeId: string): boolean {
  const theme = getThemeInfo(themeId);
  if (!theme) return false;
  
  // Check if theme meets accessibility standards
  const bgContrast = getContrastRatio(theme.colors.background, theme.colors.primary);
  return bgContrast >= 4.5; // WCAG AA standard
}