import QRCode from 'qrcode';
import { getThemeInfo } from './themeUtils';

export interface QRGenerationOptions {
  size?: number;
  margin?: number;
  themeId?: string;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

export const generateThemedQRCode = async (
  url: string, 
  canvas: HTMLCanvasElement, 
  options: QRGenerationOptions = {}
): Promise<string> => {
  const {
    size = 256,
    margin = 2,
    themeId = 'classic-luxury-gold',
    errorCorrectionLevel = 'M'
  } = options;

  const themeInfo = getThemeInfo(themeId);
  const isDarkTheme = themeInfo?.colors.background === '#000000' || 
                     themeInfo?.colors.background === '#1A1A1A' || 
                     themeInfo?.colors.background === '#0F4C3A';

  const qrOptions = {
    width: size,
    margin,
    color: {
      dark: themeInfo?.colors.primary || '#000000',
      light: isDarkTheme ? themeInfo?.colors.background || '#FFFFFF' : '#FFFFFF'
    },
    errorCorrectionLevel
  };

  await QRCode.toCanvas(canvas, url, qrOptions);
  return canvas.toDataURL('image/png');
};

export const generateThemedQRDataURL = async (
  url: string,
  options: QRGenerationOptions = {}
): Promise<string> => {
  const {
    size = 256,
    margin = 2,
    themeId = 'classic-luxury-gold',
    errorCorrectionLevel = 'M'
  } = options;

  const themeInfo = getThemeInfo(themeId);
  const isDarkTheme = themeInfo?.colors.background === '#000000' || 
                     themeInfo?.colors.background === '#1A1A1A' || 
                     themeInfo?.colors.background === '#0F4C3A';

  const qrOptions = {
    width: size,
    margin,
    color: {
      dark: themeInfo?.colors.primary || '#000000',
      light: isDarkTheme ? themeInfo?.colors.background || '#FFFFFF' : '#FFFFFF'
    },
    errorCorrectionLevel
  };

  return await QRCode.toDataURL(url, qrOptions);
};

export const getQRCodeColorScheme = (themeId: string) => {
  const themeInfo = getThemeInfo(themeId);
  const isDarkTheme = themeInfo?.colors.background === '#000000' || 
                     themeInfo?.colors.background === '#1A1A1A' || 
                     themeInfo?.colors.background === '#0F4C3A';

  return {
    foreground: themeInfo?.colors.primary || '#000000',
    background: isDarkTheme ? themeInfo?.colors.background || '#FFFFFF' : '#FFFFFF',
    isDarkTheme
  };
};