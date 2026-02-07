import {
  Component,
  OnInit,
  inject,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import {
  CalendarEvent,
  CalendarEventStatus,
  EventRecurrence,
  CALENDAR_EVENT_STATUS_LABELS,
  EVENT_RECURRENCE_LABELS,
  CalendarEventStatusUtils,
  EventRecurrenceUtils,
  CreateCalendarEventRequest,
  UpdateCalendarEventRequest
} from '../../models';
import {
  CalendarEventApiService,
  CalendarDateService
} from '../../services';
import {
  CALENDAR_CONFIG,
  REMINDER_OPTIONS_WITH_LABELS
} from '../../calendar.config';
import {
  dateTimeRangeValidator,
  futureDateValidator,
  colorCodeValidator
} from '../../validators';
import { DEFAULT_EVENT_COLORS, getColorOptions } from '../../utils';
import { HasUnsavedChanges } from '../../guards/calendar-unsaved-changes.guard';

/**
 * Calendar event form component for creating and editing events.
 *
 * @description
 * Handles both create and edit modes based on route data.
 * Implements HasUnsavedChanges for navigation guard.
 *
 * @example
 * ```typescript
 * // Routes
 * { path: 'new', component: CalendarEventFormComponent, data: { mode: 'create' } }
 * { path: ':publicId/edit', component: CalendarEventFormComponent, data: { mode: 'edit' } }
 * ```
 */
@Component({
  selector: 'app-calendar-event-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './calendar-event-form.component.html',
  styleUrl: './calendar-event-form.component.scss'
})
export class CalendarEventFormComponent implements OnInit, HasUnsavedChanges {
  // ===========================================================================
  // Dependencies
  // ===========================================================================

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(CalendarEventApiService);
  private readonly dateService = inject(CalendarDateService);
  private readonly config = inject(CALENDAR_CONFIG);

  // ===========================================================================
  // State
  // ===========================================================================

  readonly mode = signal<'create' | 'edit'>('create');
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly existingEvent = signal<CalendarEvent | null>(null);

  // ===========================================================================
  // Form
  // ===========================================================================

  readonly form: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.maxLength(5000)]],
    location: ['', [Validators.maxLength(300)]],
    startDate: [new Date(), [Validators.required]],
    startTime: ['09:00', [Validators.required]],
    endDate: [new Date(), [Validators.required]],
    endTime: ['10:00', [Validators.required]],
    allDay: [false],
    status: [CalendarEventStatus.CONFIRMED],
    recurrence: [EventRecurrence.NONE],
    colorCode: [this.config.defaultEventColor, [colorCodeValidator()]],
    reminderMinutes: [this.config.defaultReminderMinutes]
  }, {
    validators: [
      dateTimeRangeValidator('startDate', 'startTime', 'endDate', 'endTime')
    ]
  });

  // ===========================================================================
  // Computed
  // ===========================================================================

  readonly isEditMode = computed(() => this.mode() === 'edit');
  readonly pageTitle = computed(() =>
    this.isEditMode() ? 'Modifier l\'événement' : 'Nouvel événement'
  );

  // ===========================================================================
  // Template Data
  // ===========================================================================

  readonly statusOptions = CalendarEventStatusUtils.all().map(status => ({
    value: status,
    label: CALENDAR_EVENT_STATUS_LABELS[status]
  }));

  readonly recurrenceOptions = EventRecurrenceUtils.all().map(recurrence => ({
    value: recurrence,
    label: EVENT_RECURRENCE_LABELS[recurrence]
  }));

  readonly reminderOptions = REMINDER_OPTIONS_WITH_LABELS;
  readonly colorOptions = getColorOptions(DEFAULT_EVENT_COLORS);

  // ===========================================================================
  // Lifecycle
  // ===========================================================================

  ngOnInit(): void {
    // Determine mode from route data
    const routeData = this.route.snapshot.data;
    this.mode.set(routeData['mode'] || 'create');

    // Load existing event for edit mode
    const event = this.route.snapshot.data['event'] as CalendarEvent | undefined;
    if (event && this.isEditMode()) {
      this.existingEvent.set(event);
      this.populateForm(event);
    }

    // Handle date from query params (for create from slot click)
    const dateParam = this.route.snapshot.queryParamMap.get('date');
    if (dateParam && !this.isEditMode()) {
      const date = new Date(dateParam);
      this.form.patchValue({
        startDate: date,
        startTime: this.dateService.formatTime(date),
        endDate: date,
        endTime: this.dateService.formatTime(
          new Date(date.getTime() + this.config.defaultEventDuration * 60000)
        )
      });
    }

    // Listen to allDay changes
    this.form.get('allDay')?.valueChanges.subscribe(allDay => {
      if (allDay) {
        this.form.get('startTime')?.disable();
        this.form.get('endTime')?.disable();
      } else {
        this.form.get('startTime')?.enable();
        this.form.get('endTime')?.enable();
      }
    });
  }

  // ===========================================================================
  // HasUnsavedChanges Implementation
  // ===========================================================================

  hasUnsavedChanges(): boolean {
    return this.form.dirty;
  }

  getUnsavedChangesMessage(): string {
    return 'Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter ?';
  }

  // ===========================================================================
  // Form Methods
  // ===========================================================================

  /**
   * Populates form with existing event data.
   */
  private populateForm(event: CalendarEvent): void {
    const startDate = new Date(event.startDateTime);
    const endDate = new Date(event.endDateTime);

    this.form.patchValue({
      title: event.title,
      description: event.description || '',
      location: event.location || '',
      startDate: startDate,
      startTime: this.dateService.formatTime(startDate),
      endDate: endDate,
      endTime: this.dateService.formatTime(endDate),
      allDay: event.allDay,
      status: event.status,
      recurrence: event.recurrence,
      colorCode: event.colorCode || this.config.defaultEventColor,
      reminderMinutes: event.reminderMinutes
    });

    // Trigger allDay handling
    if (event.allDay) {
      this.form.get('startTime')?.disable();
      this.form.get('endTime')?.disable();
    }
  }

  /**
   * Builds request payload from form values.
   */
  private buildRequest(): CreateCalendarEventRequest | UpdateCalendarEventRequest {
    const values = this.form.getRawValue();

    const startDateTime = this.dateService.combineDateTime(
      values.startDate,
      values.allDay ? '00:00' : values.startTime
    );
    const endDateTime = this.dateService.combineDateTime(
      values.endDate,
      values.allDay ? '23:59' : values.endTime
    );

    return {
      title: values.title,
      description: values.description || undefined,
      location: values.location || undefined,
      startDateTime,
      endDateTime,
      allDay: values.allDay,
      status: values.status,
      recurrence: values.recurrence,
      colorCode: values.colorCode,
      reminderMinutes: values.reminderMinutes
    };
  }

  // ===========================================================================
  // Actions
  // ===========================================================================

  /**
   * Submits the form.
   */
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const request = this.buildRequest();

    const request$ = this.isEditMode()
      ? this.api.updateEvent(this.existingEvent()!.publicId, request)
      : this.api.createEvent(request as CreateCalendarEventRequest);

    request$.subscribe({
      next: (event) => {
        this.loading.set(false);
        this.form.markAsPristine();
        this.router.navigate(['../..'], { relativeTo: this.route });
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.message || 'Une erreur est survenue');
      }
    });
  }

  /**
   * Cancels and navigates back.
   */
  onCancel(): void {
    this.router.navigate(['../..'], { relativeTo: this.route });
  }

  /**
   * Selects a color.
   */
  selectColor(color: string): void {
    this.form.patchValue({ colorCode: color });
  }

  // ===========================================================================
  // Template Helpers
  // ===========================================================================

  /**
   * Gets error message for a field.
   */
  getFieldError(fieldName: string): string | null {
    const control = this.form.get(fieldName);
    if (!control?.touched || !control.errors) return null;

    if (control.errors['required']) return 'Ce champ est requis';
    if (control.errors['maxlength']) {
      return `Maximum ${control.errors['maxlength'].requiredLength} caractères`;
    }
    if (control.errors['colorCode']) return 'Format de couleur invalide';

    return 'Valeur invalide';
  }

  /**
   * Gets form-level error message.
   */
  getFormError(): string | null {
    if (this.form.errors?.['dateRange']) {
      return this.form.errors['dateRange'].message;
    }
    return null;
  }
}
