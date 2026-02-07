/**
 * Pure utility functions for color manipulation in calendar UI.
 *
 * @description
 * Provides color palette, contrast calculation, and color manipulation
 * functions for event styling.
 *
 * @example
 * ```typescript
 * import {
 *   DEFAULT_EVENT_COLORS,
 *   getContrastColor,
 *   lightenColor
 * } from '@features/calendar/utils';
 * ```
 */

// =============================================================================
// Color Palettes
// =============================================================================

/**
 * Default color palette for calendar events.
 *
 * @description
 * Carefully selected colors that:
 * - Have good contrast with white text
 * - Are distinguishable from each other
 * - Work well for colorblind users
 */
export const DEFAULT_EVENT_COLORS: readonly string[] = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#14B8A6'  // Teal
] as const;

/**
 * Extended color palette with more options.
 */
export const EXTENDED_EVENT_COLORS: readonly string[] = [
  ...DEFAULT_EVENT_COLORS,
  '#84CC16', // Lime
  '#A855F7', // Fuchsia
  '#0EA5E9', // Sky
  '#22C55E', // Emerald
  '#E11D48', // Rose
  '#7C3AED', // Violet
  '#0891B2', // Dark Cyan
  '#CA8A04', // Yellow
  '#DC2626', // Dark Red
  '#2563EB'  // Dark Blue
] as const;

/**
 * Color option with metadata for UI display.
 */
export interface ColorOption {
  value: string;
  name: string;
  textColor: string;
}

/**
 * Gets color options with names and contrast text colors.
 *
 * @param colors - Array of hex colors (default: DEFAULT_EVENT_COLORS)
 * @returns Array of ColorOption objects
 *
 * @example
 * ```typescript
 * const options = getColorOptions();
 * // [{ value: '#3B82F6', name: 'Bleu', textColor: '#FFFFFF' }, ...]
 * ```
 */
export function getColorOptions(
  colors: readonly string[] = DEFAULT_EVENT_COLORS
): ColorOption[] {
  const colorNames: Record<string, string> = {
    '#3B82F6': 'Bleu',
    '#EF4444': 'Rouge',
    '#10B981': 'Vert',
    '#F59E0B': 'Ambre',
    '#8B5CF6': 'Violet',
    '#EC4899': 'Rose',
    '#06B6D4': 'Cyan',
    '#F97316': 'Orange',
    '#6366F1': 'Indigo',
    '#14B8A6': 'Turquoise',
    '#84CC16': 'Citron',
    '#A855F7': 'Fuchsia',
    '#0EA5E9': 'Ciel',
    '#22C55E': 'Émeraude',
    '#E11D48': 'Framboise',
    '#7C3AED': 'Pourpre',
    '#0891B2': 'Océan',
    '#CA8A04': 'Or',
    '#DC2626': 'Cramoisi',
    '#2563EB': 'Cobalt'
  };

  return colors.map(color => ({
    value: color,
    name: colorNames[color] || color,
    textColor: getContrastColor(color)
  }));
}

// =============================================================================
// Contrast Calculation
// =============================================================================

/**
 * Gets the best contrast color (black or white) for a given background.
 *
 * @param hexColor - Background color in hex format
 * @returns '#000000' or '#FFFFFF'
 *
 * @example
 * ```typescript
 * getContrastColor('#3B82F6'); // '#FFFFFF'
 * getContrastColor('#FEF3C7'); // '#000000'
 * ```
 */
export function getContrastColor(hexColor: string): string {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return '#000000';

  // Calculate relative luminance (WCAG formula)
  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);

  // Use white text for dark backgrounds, black for light
  return luminance > 0.179 ? '#000000' : '#FFFFFF';
}

/**
 * Calculates the contrast ratio between two colors.
 *
 * @param color1 - First hex color
 * @param color2 - Second hex color
 * @returns Contrast ratio (1 to 21)
 *
 * @example
 * ```typescript
 * getContrastRatio('#000000', '#FFFFFF'); // 21
 * getContrastRatio('#3B82F6', '#FFFFFF'); // ~4.5
 * ```
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 1;

  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Checks if a color meets WCAG AA contrast requirements.
 *
 * @param foreground - Text color
 * @param background - Background color
 * @param largeText - Whether this is large text (>= 18pt)
 * @returns True if contrast is sufficient
 */
export function meetsContrastRequirements(
  foreground: string,
  background: string,
  largeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  const requiredRatio = largeText ? 3 : 4.5;
  return ratio >= requiredRatio;
}

// =============================================================================
// Color Manipulation
// =============================================================================

/**
 * Lightens a color by a percentage.
 *
 * @param hexColor - Original hex color
 * @param percent - Percentage to lighten (0-100)
 * @returns Lightened hex color
 *
 * @example
 * ```typescript
 * lightenColor('#3B82F6', 20); // Lighter blue
 * ```
 */
export function lightenColor(hexColor: string, percent: number): string {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return hexColor;

  const amount = Math.round(2.55 * percent);

  const r = Math.min(255, rgb.r + amount);
  const g = Math.min(255, rgb.g + amount);
  const b = Math.min(255, rgb.b + amount);

  return rgbToHex(r, g, b);
}

/**
 * Darkens a color by a percentage.
 *
 * @param hexColor - Original hex color
 * @param percent - Percentage to darken (0-100)
 * @returns Darkened hex color
 */
export function darkenColor(hexColor: string, percent: number): string {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return hexColor;

  const amount = Math.round(2.55 * percent);

  const r = Math.max(0, rgb.r - amount);
  const g = Math.max(0, rgb.g - amount);
  const b = Math.max(0, rgb.b - amount);

  return rgbToHex(r, g, b);
}

/**
 * Converts a color to its transparent variant.
 *
 * @param hexColor - Original hex color
 * @param alpha - Opacity (0-1)
 * @returns RGBA color string
 *
 * @example
 * ```typescript
 * toTransparent('#3B82F6', 0.2);
 * // 'rgba(59, 130, 246, 0.2)'
 * ```
 */
export function toTransparent(hexColor: string, alpha: number): string {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return `rgba(0, 0, 0, ${alpha})`;

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

/**
 * Gets a light background variant of a color.
 *
 * @description
 * Creates a very light version suitable for backgrounds,
 * ensuring good contrast with the original color as text.
 *
 * @param hexColor - Original hex color
 * @returns Light background hex color
 *
 * @example
 * ```typescript
 * getLightVariant('#3B82F6');
 * // Returns a very light blue suitable for background
 * ```
 */
export function getLightVariant(hexColor: string): string {
  return lightenColor(hexColor, 85);
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Converts hex color to RGB object.
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleanHex = hex.replace('#', '');

  const fullHex = cleanHex.length === 3
    ? cleanHex.split('').map(c => c + c).join('')
    : cleanHex;

  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);

  if (!result) return null;

  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  };
}

/**
 * Converts RGB values to hex color.
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Calculates relative luminance (WCAG formula).
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const sRGB = c / 255;
    return sRGB <= 0.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Generates a random color from the palette.
 */
export function getRandomEventColor(): string {
  const index = Math.floor(Math.random() * DEFAULT_EVENT_COLORS.length);
  return DEFAULT_EVENT_COLORS[index];
}

/**
 * Gets a deterministic color based on a string (useful for consistent coloring).
 *
 * @param str - Input string (e.g., event ID or title)
 * @returns Color from palette
 *
 * @example
 * ```typescript
 * // Always returns the same color for the same string
 * getColorFromString('Meeting'); // '#3B82F6'
 * getColorFromString('Meeting'); // '#3B82F6'
 * ```
 */
export function getColorFromString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % DEFAULT_EVENT_COLORS.length;
  return DEFAULT_EVENT_COLORS[index];
}
