import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validator that ensures a date is in the future.
 *
 * @description
 * Validates that the control value is a date/time after the current moment.
 * Useful for preventing users from creating events in the past.
 *
 * @param allowToday - If true, allows dates that are today (default: true)
 * @returns ValidatorFn that returns error if date is in the past
 *
 * @example
 * ```typescript
 * // Allow today but not past dates
 * this.form = this.fb.group({
 *   startDateTime: ['', [Validators.required, futureDateValidator()]]
 * });
 *
 * // Require strictly future dates (not today)
 * this.form = this.fb.group({
 *   startDateTime: ['', [Validators.required, futureDateValidator(false)]]
 * });
 *
 * // In template
 * <div *ngIf="form.get('startDateTime')?.hasError('futureDate')">
 *   {{ form.get('startDateTime')?.getError('futureDate').message }}
 * </div>
 * ```
 */
export function futureDateValidator(allowToday: boolean = true): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null; // Let required validator handle empty values
    }

    const date = toDate(value);
    if (!date) {
      return null; // Invalid date format, let other validators handle
    }

    const now = new Date();

    if (allowToday) {
      // Compare only the date part (ignore time)
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const inputDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

      if (inputDate < today) {
        return {
          futureDate: {
            message: 'La date ne peut pas être dans le passé',
            value: date.toISOString()
          }
        };
      }
    } else {
      // Strict comparison including time
      if (date <= now) {
        return {
          futureDate: {
            message: 'La date doit être dans le futur',
            value: date.toISOString()
          }
        };
      }
    }

    return null;
  };
}

/**
 * Validator that ensures a date is not too far in the future.
 *
 * @description
 * Prevents users from creating events beyond a reasonable time horizon.
 * Useful for limiting calendar range.
 *
 * @param maxYears - Maximum years in the future (default: 5)
 * @returns ValidatorFn that returns error if date is too far in the future
 *
 * @example
 * ```typescript
 * this.form = this.fb.group({
 *   startDateTime: ['', [
 *     Validators.required,
 *     futureDateValidator(),
 *     maxFutureDateValidator(2) // Max 2 years ahead
 *   ]]
 * });
 * ```
 */
export function maxFutureDateValidator(maxYears: number = 5): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null;
    }

    const date = toDate(value);
    if (!date) {
      return null;
    }

    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + maxYears);

    if (date > maxDate) {
      return {
        maxFutureDate: {
          message: `La date ne peut pas dépasser ${maxYears} ans dans le futur`,
          maxDate: maxDate.toISOString(),
          value: date.toISOString()
        }
      };
    }

    return null;
  };
}

/**
 * Validator that ensures a date falls within a specific range.
 *
 * @param minDate - Minimum allowed date (inclusive)
 * @param maxDate - Maximum allowed date (inclusive)
 * @returns ValidatorFn that returns error if date is outside range
 *
 * @example
 * ```typescript
 * const minDate = new Date('2025-01-01');
 * const maxDate = new Date('2025-12-31');
 *
 * this.form = this.fb.group({
 *   eventDate: ['', [
 *     Validators.required,
 *     dateWithinRangeValidator(minDate, maxDate)
 *   ]]
 * });
 * ```
 */
export function dateWithinRangeValidator(
  minDate: Date,
  maxDate: Date
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null;
    }

    const date = toDate(value);
    if (!date) {
      return null;
    }

    if (date < minDate) {
      return {
        dateRange: {
          message: `La date doit être après le ${formatDate(minDate)}`,
          minDate: minDate.toISOString(),
          value: date.toISOString()
        }
      };
    }

    if (date > maxDate) {
      return {
        dateRange: {
          message: `La date doit être avant le ${formatDate(maxDate)}`,
          maxDate: maxDate.toISOString(),
          value: date.toISOString()
        }
      };
    }

    return null;
  };
}

/**
 * Validator that ensures a date is a weekday (Monday-Friday).
 *
 * @returns ValidatorFn that returns error if date is on weekend
 *
 * @example
 * ```typescript
 * this.form = this.fb.group({
 *   meetingDate: ['', [Validators.required, weekdayOnlyValidator()]]
 * });
 * ```
 */
export function weekdayOnlyValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null;
    }

    const date = toDate(value);
    if (!date) {
      return null;
    }

    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return {
        weekdayOnly: {
          message: 'La date doit être un jour de semaine (lundi-vendredi)',
          value: date.toISOString(),
          dayOfWeek
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
 * Converts various date formats to a Date object.
 */
function toDate(value: unknown): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'string') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === 'number') {
    return new Date(value);
  }

  return null;
}

/**
 * Formats a date for display in error messages.
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-BE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
}
