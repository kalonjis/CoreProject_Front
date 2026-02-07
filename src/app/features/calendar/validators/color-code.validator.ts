import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Regular expression for validating hex color codes.
 *
 * Matches:
 * - #RGB (3 characters)
 * - #RRGGBB (6 characters)
 *
 * @example
 * ```typescript
 * HEX_COLOR_REGEX.test('#FFF');     // true
 * HEX_COLOR_REGEX.test('#FF5733');  // true
 * HEX_COLOR_REGEX.test('FF5733');   // false (missing #)
 * HEX_COLOR_REGEX.test('#GGGGGG');  // false (invalid chars)
 * ```
 */
export const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

/**
 * Validator for hex color codes (#RGB or #RRGGBB format).
 *
 * @description
 * Validates that a string is a valid CSS hex color code.
 * Allows empty values (use required validator if needed).
 *
 * @returns ValidatorFn that returns error if format is invalid
 *
 * @example
 * ```typescript
 * this.form = this.fb.group({
 *   colorCode: ['#3B82F6', [colorCodeValidator()]]
 * });
 *
 * // In template
 * <div *ngIf="form.get('colorCode')?.hasError('colorCode')">
 *   {{ form.get('colorCode')?.getError('colorCode').message }}
 * </div>
 * ```
 */
export function colorCodeValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    // Allow empty values
    if (!value || value === '') {
      return null;
    }

    if (typeof value !== 'string') {
      return {
        colorCode: {
          message: 'Le code couleur doit être une chaîne de caractères',
          value
        }
      };
    }

    if (!HEX_COLOR_REGEX.test(value)) {
      return {
        colorCode: {
          message: 'Format de couleur invalide. Utilisez #RGB ou #RRGGBB',
          value,
          expectedFormat: '#RRGGBB'
        }
      };
    }

    return null;
  };
}

/**
 * Validator that ensures the color is from a predefined palette.
 *
 * @description
 * Restricts color selection to a specific set of allowed colors.
 * Useful for maintaining design consistency.
 *
 * @param allowedColors - Array of allowed hex color codes
 * @returns ValidatorFn that returns error if color not in palette
 *
 * @example
 * ```typescript
 * const palette = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B'];
 *
 * this.form = this.fb.group({
 *   colorCode: ['', [colorFromPaletteValidator(palette)]]
 * });
 * ```
 */
export function colorFromPaletteValidator(allowedColors: string[]): ValidatorFn {
  // Normalize colors to uppercase for comparison
  const normalizedPalette = allowedColors.map(c => c.toUpperCase());

  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value || value === '') {
      return null;
    }

    const normalizedValue = value.toUpperCase();

    if (!normalizedPalette.includes(normalizedValue)) {
      return {
        colorPalette: {
          message: 'La couleur sélectionnée n\'est pas disponible',
          value,
          allowedColors
        }
      };
    }

    return null;
  };
}

/**
 * Validator that ensures sufficient contrast with a background color.
 *
 * @description
 * Checks if the selected color has enough contrast with a given background
 * for accessibility purposes (WCAG guidelines).
 *
 * @param backgroundColor - Background color to check contrast against
 * @param minRatio - Minimum contrast ratio (default: 4.5 for WCAG AA)
 * @returns ValidatorFn that returns error if contrast is insufficient
 *
 * @example
 * ```typescript
 * // Ensure text is readable on white background
 * this.form = this.fb.group({
 *   textColor: ['#000000', [colorContrastValidator('#FFFFFF', 4.5)]]
 * });
 * ```
 */
export function colorContrastValidator(
  backgroundColor: string,
  minRatio: number = 4.5
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value || value === '') {
      return null;
    }

    if (!HEX_COLOR_REGEX.test(value) || !HEX_COLOR_REGEX.test(backgroundColor)) {
      return null; // Let colorCodeValidator handle invalid formats
    }

    const ratio = calculateContrastRatio(value, backgroundColor);

    if (ratio < minRatio) {
      return {
        colorContrast: {
          message: `Le contraste est insuffisant (${ratio.toFixed(2)}:1, minimum requis: ${minRatio}:1)`,
          value,
          backgroundColor,
          ratio: ratio.toFixed(2),
          minRatio
        }
      };
    }

    return null;
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Converts a hex color to RGB values.
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Remove # if present
  const cleanHex = hex.replace('#', '');

  // Handle 3-character hex
  const fullHex = cleanHex.length === 3
    ? cleanHex.split('').map(c => c + c).join('')
    : cleanHex;

  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);

  if (!result) {
    return null;
  }

  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  };
}

/**
 * Calculates relative luminance of a color (WCAG formula).
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
 * Calculates contrast ratio between two colors (WCAG formula).
 */
function calculateContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    return 0;
  }

  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Normalizes a hex color to 6-character uppercase format.
 *
 * @example
 * ```typescript
 * normalizeHexColor('#fff');     // '#FFFFFF'
 * normalizeHexColor('#ff5733');  // '#FF5733'
 * ```
 */
export function normalizeHexColor(hex: string): string {
  const cleanHex = hex.replace('#', '').toUpperCase();

  if (cleanHex.length === 3) {
    return '#' + cleanHex.split('').map(c => c + c).join('');
  }

  return '#' + cleanHex;
}
