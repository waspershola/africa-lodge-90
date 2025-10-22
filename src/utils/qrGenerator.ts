import QRCode from 'qrcode';

interface QRGeneratorOptions {
  url: string;
  size?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  primaryColor?: string;
  margin?: number;
}

interface QRCodeResult {
  svg: string;
  png: string;
  shortUrl: string;
  displayText: string;
}

/**
 * Generate high-quality QR codes optimized for low-end phone cameras
 * - Uses SVG format for scalability
 * - High error correction level (H = 30% recovery)
 * - Large size (1000px) for clarity
 * - High contrast colors
 */
export async function generateQRCode({
  url,
  size = 1000,
  errorCorrectionLevel = 'H',
  primaryColor = '#000000',
  margin = 4,
}: QRGeneratorOptions): Promise<QRCodeResult> {
  const qrOptions = {
    errorCorrectionLevel,
    margin,
    width: size,
    color: {
      dark: primaryColor,
      light: '#FFFFFF',
    },
  };

  // Generate SVG (preferred for quality and size)
  const svg = await QRCode.toString(url, {
    ...qrOptions,
    type: 'svg',
  });

  // Generate PNG fallback
  const png = await QRCode.toDataURL(url, {
    ...qrOptions,
    type: 'image/png',
  });

  // Extract short URL for display (remove protocol and www)
  const displayText = url
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('?')[0]; // Remove query params for cleaner display

  return {
    svg,
    png,
    shortUrl: url,
    displayText,
  };
}

/**
 * Generate QR code for canvas rendering
 */
export async function generateQRCodeCanvas(
  canvas: HTMLCanvasElement,
  url: string,
  options?: Partial<QRGeneratorOptions>
): Promise<void> {
  await QRCode.toCanvas(canvas, url, {
    errorCorrectionLevel: options?.errorCorrectionLevel || 'H',
    margin: options?.margin || 4,
    width: options?.size || 1000,
    color: {
      dark: options?.primaryColor || '#000000',
      light: '#FFFFFF',
    },
  });
}
