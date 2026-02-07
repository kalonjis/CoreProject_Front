/**
 * Calendar Validators Barrel Export
 *
 * @description
 * Central export point for all calendar-related form validators.
 * These validators work with Angular Reactive Forms.
 *
 * @example
 * ```typescript
 * import {
 *   dateRangeValidator,
 *   futureDateValidator,
 *   colorCodeValidator
 * } from '@features/calendar/validators';
 *
 * this.form = this.fb.group({
 *   title: ['', Validators.required],
 *   startDateTime: ['', [Validators.required, futureDateValidator()]],
 *   endDateTime: ['', Validators.required],
 *   colorCode: ['#3B82F6', colorCodeValidator()]
 * }, {
 *   validators: [dateRangeValidator('startDateTime', 'endDateTime')]
 * });
 * ```
 */

// =============================================================================
// Date Range Validators
// =============================================================================

export {
  dateRangeValidator,
  dateTimeRangeValidator,
  minDurationValidator
} from './date-range.validator';

// =============================================================================
// Future Date Validators
// =============================================================================

export {
  futureDateValidator,
  maxFutureDateValidator,
  dateWithinRangeValidator,
  weekdayOnlyValidator
} from './future-date.validator';

// =============================================================================
// Color Code Validators
// =============================================================================

export {
  HEX_COLOR_REGEX,
  colorCodeValidator,
  colorFromPaletteValidator,
  colorContrastValidator,
  normalizeHexColor
} from './color-code.validator';
