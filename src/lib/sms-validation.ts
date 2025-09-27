// SMS Template Validation Utilities
// Implements real-time character counting and multi-SMS warnings

interface TruncationRules {
  [key: string]: number;
}

export interface ValidationResult {
  characterCount: number;
  estimatedSmsCount: number;
  hasWarning: boolean;
  warningType: 'none' | 'approaching' | 'exceeded';
  warningMessage: string;
  preview: string;
}

// Global truncation rules for placeholders
const TRUNCATION_RULES: TruncationRules = {
  hotel: 25,     // "The Grand Luxury Pal…"
  guest: 20,     // "Mr. Abdulwasiu O. S…"
  room: 10,      // "Deluxe…"
  ref: 15,       // "#WSR-38482…"
  staff: 20,     // "John T. – Front…"
  amount: 10,    // "₦250,000"
  link: 25,      // "luxhotel.app/o/9a7…"
  checkin: 10,   // "2025-01-15"
  checkout: 10,  // "2025-01-18"
  issue: 15,     // "Broken AC unit…"
  item: 15,      // "Room service…"
};

// Sample values for validation (max length for each placeholder)
const SAMPLE_VALUES: { [key: string]: string } = {
  hotel: "The Grand Luxury Palace…",
  guest: "Mr. Abdulwasiu O. S…",
  room: "Deluxe Sui…",
  ref: "#WSR-38482-A001…",
  staff: "John T. – Front Des…",
  amount: "₦250,000+",
  link: "luxhotel.app/o/9a7b8c…",
  checkin: "2025-01-15",
  checkout: "2025-01-18",
  issue: "Broken AC unit…",
  item: "Room service…",
};

/**
 * Extracts placeholders from template text
 */
export function extractPlaceholders(template: string): string[] {
  const matches = template.match(/\{([^}]+)\}/g);
  if (!matches) return [];
  
  return matches.map(match => match.slice(1, -1)); // Remove { and }
}

/**
 * Applies truncation rules and sample values to get accurate character count
 */
export function applyTruncationRules(template: string): string {
  let processedTemplate = template;
  
  // Replace each placeholder with its max-length sample
  const placeholders = extractPlaceholders(template);
  
  placeholders.forEach(placeholder => {
    const sampleValue = SAMPLE_VALUES[placeholder] || `[${placeholder}]`;
    const maxLength = TRUNCATION_RULES[placeholder];
    
    let finalValue = sampleValue;
    if (maxLength && sampleValue.length > maxLength) {
      finalValue = sampleValue.substring(0, maxLength - 1) + '…';
    }
    
    const regex = new RegExp(`\\{${placeholder}\\}`, 'g');
    processedTemplate = processedTemplate.replace(regex, finalValue);
  });
  
  return processedTemplate;
}

/**
 * Validates SMS template and returns comprehensive results
 */
export function validateSMSTemplate(template: string): ValidationResult {
  if (!template.trim()) {
    return {
      characterCount: 0,
      estimatedSmsCount: 0,
      hasWarning: false,
      warningType: 'none',
      warningMessage: '',
      preview: ''
    };
  }
  
  // Apply truncation rules to get accurate character count
  const processedTemplate = applyTruncationRules(template);
  const characterCount = processedTemplate.length;
  
  // Calculate estimated SMS count (160 chars per SMS)
  const estimatedSmsCount = Math.ceil(characterCount / 160);
  
  // Determine warning level
  let warningType: ValidationResult['warningType'] = 'none';
  let warningMessage = '';
  let hasWarning = false;
  
  if (characterCount > 160) {
    warningType = 'exceeded';
    hasWarning = true;
    warningMessage = `⚠️ Template exceeds 160 characters and will use ${estimatedSmsCount} SMS credits per message`;
  } else if (characterCount >= 140) {
    warningType = 'approaching';
    hasWarning = true;
    warningMessage = `🟡 Close to SMS limit (${characterCount}/160 characters)`;
  } else {
    warningMessage = `🟢 Fits in 1 SMS (${characterCount}/160 characters)`;
  }
  
  return {
    characterCount,
    estimatedSmsCount,
    hasWarning,
    warningType,
    warningMessage,
    preview: processedTemplate
  };
}

/**
 * Gets the color class for character count display
 */
export function getCharacterCountColor(validation: ValidationResult): string {
  switch (validation.warningType) {
    case 'exceeded':
      return 'text-destructive';
    case 'approaching':
      return 'text-warning';
    default:
      return 'text-success';
  }
}

/**
 * Gets the badge variant for SMS count display
 */
export function getSMSCountBadgeVariant(validation: ValidationResult): 'default' | 'secondary' | 'destructive' {
  if (validation.estimatedSmsCount > 1) {
    return 'destructive';
  }
  return 'default';
}

/**
 * Formats the SMS count display text
 */
export function formatSMSCountText(validation: ValidationResult): string {
  if (validation.estimatedSmsCount <= 1) {
    return '1 SMS';
  }
  return `${validation.estimatedSmsCount} SMS`;
}