import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validator that ensures end date/time is after start date/time.
 *
 * @description
 * This validator compares two form controls (start and end) to ensure
 * the end value comes after the start value. Works with both Date objects
 * and ISO string values.
 *
 * @param startControlName - Name of the start date/time control
 * @param endControlName - Name of the end date/time control
 * @returns ValidatorFn that returns error if end <= start
 *
 * @example
 * ```typescript
 * // In a reactive form
 * this.form = this.fb.group({
 *   startDateTime: ['', Validators.required],
 *   endDateTime: ['', Validators.required]
 * }, {
 *   validators: [dateRangeValidator('startDateTime', 'endDateTime')]
 * });
 *
 * // Check for error in template
 * <div *ngIf="form.hasError('dateRange')">
 *   {{ form.getError('dateRange').message }}
 * </div>
 * ```
 */
export function dateRangeValidator(
  startControlName: string,
  endControlName: string
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const startControl = control.get(startControlName);
    const endControl = control.get(endControlName);

    if (!startControl || !endControl) {
      return null;
    }

    const startValue = startControl.value;
    const endValue = endControl.value;

    // Skip validation if either value is empty
    if (!startValue || !endValue) {
      return null;
    }

    const startDate = toDate(startValue);
    const endDate = toDate(endValue);

    if (!startDate || !endDate) {
      return null;
    }

    if (endDate <= startDate) {
      return {
        dateRange: {
          message: 'La date de fin doit être postérieure à la date de début',
          startValue: startDate.toISOString(),
          endValue: endDate.toISOString()
        }
      };
    }

    return null;
  };
}

/**
 * Validator for combined date and time fields.
 *
 * @description
 * When using separate date and time inputs, this validator combines them
 * before comparison. Useful for event forms with split date/time pickers.
 *
 * @param startDateControl - Name of the start date control
 * @param startTimeControl - Name of the start time control (HH:mm)
 * @param endDateControl - Name of the end date control
 * @param endTimeControl - Name of the end time control (HH:mm)
 * @returns ValidatorFn that returns error if end <= start
 *
 * @example
 * ```typescript
 * this.form = this.fb.group({
 *   startDate: [new Date(), Validators.required],
 *   startTime: ['09:00', Validators.required],
 *   endDate: [new Date(), Validators.required],
 *   endTime: ['10:00', Validators.required]
 * }, {
 *   validators: [
 *     dateTimeRangeValidator('startDate', 'startTime', 'endDate', 'endTime')
 *   ]
 * });
 * ```
 */
export function dateTimeRangeValidator(
  startDateControl: string,
  startTimeControl: string,
  endDateControl: string,
  endTimeControl: string
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const startDate = control.get(startDateControl)?.value;
    const startTime = control.get(startTimeControl)?.value;
    const endDate = control.get(endDateControl)?.value;
    const endTime = control.get(endTimeControl)?.value;

    // Skip validation if any value is missing
    if (!startDate || !startTime || !endDate || !endTime) {
      return null;
    }

    const start = combineDateAndTime(startDate, startTime);
    const end = combineDateAndTime(endDate, endTime);

    if (!start || !end) {
      return null;
    }

    if (end <= start) {
      return {
        dateRange: {
          message: 'La date/heure de fin doit être postérieure à la date/heure de début',
          start: start.toISOString(),
          end: end.toISOString()
        }
      };
    }

    return null;
  };
}

/**
 * Validator that ensures a minimum duration between start and end.
 *
 * @param startControlName - Name of the start control
 * @param endControlName - Name of the end control
 * @param minMinutes - Minimum duration in minutes
 * @returns ValidatorFn that returns error if duration < minMinutes
 *
 * @example
 * ```typescript
 * // Ensure at least 15 minutes between start and end
 * this.form = this.fb.group({
 *   start: [''],
 *   end: ['']
 * }, {
 *   validators: [minDurationValidator('start', 'end', 15)]
 * });
 * ```
 */
export function minDurationValidator(
  startControlName: string,
  endControlName: string,
  minMinutes: number
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const startValue = control.get(startControlName)?.value;
    const endValue = control.get(endControlName)?.value;

    if (!startValue || !endValue) {
      return null;
    }

    const startDate = toDate(startValue);
    const endDate = toDate(endValue);

    if (!startDate || !endDate) {
      return null;
    }

    const durationMs = endDate.getTime() - startDate.getTime();
    const durationMinutes = durationMs / (1000 * 60);

    if (durationMinutes < minMinutes) {
      return {
        minDuration: {
          message: `La durée minimale est de ${minMinutes} minutes`,
          required: minMinutes,
          actual: Math.round(durationMinutes)
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
 * Combines a Date and time string into a single Date.
 */
function combineDateAndTime(date: Date | string, time: string): Date | null {
  const dateObj = toDate(date);
  if (!dateObj || !time) return null;

  const [hours, minutes] = time.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return null;

  const result = new Date(dateObj);
  result.setHours(hours, minutes, 0, 0);
  return result;
}
