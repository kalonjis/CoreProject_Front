// src/app/features/calendar/components/calendar-event-form/calendar-event-form.component.ts

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
  UpdateCalendarEventRequest,
  AddressInput
} from '../../models';
import {
  CalendarEventApiService,
  CalendarDateService,
  CalendarEventStateService
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
import {
  AddressFormComponent,
  AddressFormConfig,
  AddressType,
  CreateAddressRequest,
  UpdateAddressRequest
} from '../../../../shared/address';
import {FeedbackService} from '../../../../shared/feedback/tools/feedback.service';

// Address form imports


/**
 * Calendar event form component for creating and editing events.
 *
 * @description
 * Handles both create and edit modes based on route data.
 * Implements HasUnsavedChanges for navigation guard.
 * Integrates address selection via AddressFormComponent.
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
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AddressFormComponent
  ],
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
  private readonly state = inject(CalendarEventStateService);
  private readonly feedback = inject(FeedbackService);

  // ===========================================================================
  // State - Event Form
  // ===========================================================================

  /** Form mode: create or edit */
  readonly mode = signal<'create' | 'edit'>('create');

  /** Loading state during submission */
  readonly loading = signal<boolean>(false);

  /** Error message from API */
  readonly error = signal<string | null>(null);

  /** Event being edited (null in create mode) */
  readonly existingEvent = signal<CalendarEvent | null>(null);

  // ===========================================================================
  // State - Address Management
  // ===========================================================================

  /** Whether to show the address form */
  readonly showAddressForm = signal<boolean>(false);

  /** Selected/entered address for the event */
  readonly selectedAddress = signal<AddressInput | null>(null);

  /** Address form mode (create/edit) */
  readonly addressFormMode = signal<'create' | 'edit'>('create');

  /** Address from the original event (for comparison) */
  readonly initialAddress = signal<AddressInput | null>(null);

  // ===========================================================================
  // Form
  // ===========================================================================

  readonly form: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.maxLength(5000)]],
    location: ['', [Validators.maxLength(300)]],

    // ✅ CORRECTION : Utiliser le format string pour les dates
    startDate: [this.formatDateForInput(new Date()), [Validators.required]],
    startTime: ['09:00', [Validators.required]],
    endDate: [this.formatDateForInput(new Date()), [Validators.required]],
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
  // Address Form Configuration
  // ===========================================================================

  /**
   * Configuration for the address form component.
   * Uses 'user' context with simplified settings for calendar events.
   */
  readonly addressFormConfig: AddressFormConfig = {
    context: 'user',
    defaultCountryCode: 'BE',
    defaultType: AddressType.OTHER,
    allowedTypes: [AddressType.OTHER, AddressType.PROFESSIONAL, AddressType.TEMPORARY],
    showComplement: true,
    showStateProvince: false,
    showLabel: false,
    showNotes: false,
    showDefaultCheckbox: false,
    showPrimaryCheckbox: false,
    showEligibilityFlags: false,
    requireStateProvince: false,
    enableAutocomplete: false
  };

  // ===========================================================================
  // Computed Properties
  // ===========================================================================

  /** Whether in edit mode */
  readonly isEditMode = computed(() => this.mode() === 'edit');

  /** Page title based on mode */
  readonly pageTitle = computed(() =>
    this.isEditMode() ? 'Modifier l\'événement' : 'Nouvel événement'
  );

  // ===========================================================================
  // Template Data
  // ===========================================================================

  /** Status options for dropdown */
  readonly statusOptions = CalendarEventStatusUtils.all().map(status => ({
    value: status,
    label: CALENDAR_EVENT_STATUS_LABELS[status]
  }));

  /** Recurrence options for dropdown */
  readonly recurrenceOptions = EventRecurrenceUtils.all().map(recurrence => ({
    value: recurrence,
    label: EVENT_RECURRENCE_LABELS[recurrence]
  }));

  /** Reminder time options */
  readonly reminderOptions = REMINDER_OPTIONS_WITH_LABELS;

  /** Color palette options */
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

      // Load address if present
      if (event.address) {
        const address: AddressInput = {
          streetName: event.address.streetName,
          streetNumber: event.address.streetNumber,
          postalCode: event.address.postalCode,
          city: event.address.city,
          countryCode: event.address.countryCode
        };
        this.selectedAddress.set(address);
        this.initialAddress.set(address);
      }
    }

    // Handle date from query params (for create from slot click)
    const dateParam = this.route.snapshot.queryParamMap.get('date');
    if (dateParam && !this.isEditMode()) {
      const date = new Date(dateParam);
      this.form.patchValue({
        startDate: this.formatDateForInput(date),
        startTime: this.dateService.formatTime(date),
        endDate: this.formatDateForInput(date),
        endTime: this.dateService.formatTime(
          new Date(date.getTime() + this.config.defaultEventDuration * 60000)
        )
      });
    }

    // Listen to allDay changes to enable/disable time fields
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

  /**
   * Checks if there are unsaved changes in the form.
   */
  hasUnsavedChanges(): boolean {
    // Vérifier si le formulaire a des changements
    if (this.form.dirty) {
      return true;
    }

    // Vérifier si l'adresse a changé par rapport à l'état initial
    const currentAddress = this.selectedAddress();
    const initialAddr = this.initialAddress();

    // Si une nouvelle adresse a été ajoutée (initial = null, current != null)
    if (initialAddr === null && currentAddress !== null) {
      return true;
    }

    // Si une adresse a été supprimée (initial != null, current = null)
    if (initialAddr !== null && currentAddress === null) {
      return true;
    }

    // Si l'adresse a été modifiée (comparer les valeurs)
    if (initialAddr !== null && currentAddress !== null) {
      return JSON.stringify(initialAddr) !== JSON.stringify(currentAddress);
    }

    return false;
  }

  /**
   * Returns the warning message for unsaved changes.
   */
  getUnsavedChangesMessage(): string {
    return 'Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter ?';
  }

  // ===========================================================================
  // Form Methods
  // ===========================================================================

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

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

      // ✅ CORRECTION : Convertir en string
      startDate: this.formatDateForInput(startDate),
      startTime: this.dateService.formatTime(startDate),
      endDate: this.formatDateForInput(endDate),
      endTime: this.dateService.formatTime(endDate),

      allDay: event.allDay,
      status: event.status,
      recurrence: event.recurrence,
      colorCode: event.colorCode || this.config.defaultEventColor,
      reminderMinutes: event.reminderMinutes
    });

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
      address: this.selectedAddress() || undefined,
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
  // Address Management
  // ===========================================================================

  /**
   * Opens the address form for adding/editing an address.
   */
  openAddressForm(): void {
    this.addressFormMode.set(this.selectedAddress() ? 'edit' : 'create');
    this.showAddressForm.set(true);
  }

  /**
   * Closes the address form without saving.
   */
  closeAddressForm(): void {
    this.showAddressForm.set(false);
  }

  /**
   * Handles address form submission.
   * Maps CreateAddressRequest to AddressInput for the event.
   */
  handleAddressSubmit(request: CreateAddressRequest | UpdateAddressRequest): void {
    // Cast to CreateAddressRequest since we always create new addresses in calendar
    const createRequest = request as CreateAddressRequest;

    const addressInput: AddressInput = {
      streetName: createRequest.streetName,
      streetNumber: createRequest.streetNumber || '',
      postalCode: createRequest.postalCode,
      city: createRequest.city,
      countryCode: createRequest.countryCode
    };

    this.selectedAddress.set(addressInput);
    this.showAddressForm.set(false);
  }

  /**
   * Removes the selected address.
   */
  removeAddress(): void {
    this.selectedAddress.set(null);
  }

  /**
   * Formats an address for display.
   */
  formatAddress(address: AddressInput | null): string {
    if (!address) return '';

    const parts = [
      address.streetNumber,
      address.streetName,
      address.postalCode,
      address.city
    ].filter(Boolean);

    return parts.join(', ');
  }

  /**
   * Converts AddressInput to AddressLink for the address form.
   * AddressFormComponent expects a nested structure with 'address' property.
   */
  convertAddressInputToAddressLink(addressInput: AddressInput | null): any {
    if (!addressInput) return null;

    return {
      address: {
        streetName: addressInput.streetName,
        streetNumber: addressInput.streetNumber,
        complement: '',
        postalCode: addressInput.postalCode,
        city: addressInput.city,
        stateProvince: '',
        countryCode: addressInput.countryCode
      },
      // Métadonnées au niveau racine
      addressType: 'OTHER' as any,
      label: '',
      notes: '',
      isDefault: false,
      isPrimary: false
    };
  }

  // ===========================================================================
  // Form Actions
  // ===========================================================================

  /**
   * Submits the form to create or update an event.
   */
  /**
   * Submits the form to create or update an event.
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
        this.initialAddress.set(this.selectedAddress());

        // ✅ AJOUT : Synchroniser avec le state service
        if (this.isEditMode()) {
          // Mettre à jour l'événement dans le state (sans recharger tous les événements)
          this.state['_events'].update(events =>
            events.map(e => e.publicId === event.publicId ? event : e)
          );
          // Mettre à jour aussi l'événement sélectionné si c'est le même
          if (this.state['_selectedEvent']()?.publicId === event.publicId) {
            this.state['_selectedEvent'].set(event);
          }
          this.feedback.showSuccess('Événement modifié avec succès', "", 5000);
        } else {
          // Ajouter le nouvel événement au state
          this.state['_events'].update(events => [...events, event]);
          this.feedback.showSuccess('Événement créé avec succès', "", 5000);
        }

        this.router.navigate(['../..'], { relativeTo: this.route });
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.message || 'Une erreur est survenue');
        this.feedback.showError(err.message || 'Une erreur est survenue');
      }
    });
  }

  /**
   * Cancels the form and navigates back.
   */
  onCancel(): void {
    this.router.navigate(['../..'], { relativeTo: this.route });
  }

  /**
   * Selects a color for the event.
   */
  selectColor(color: string): void {
    this.form.patchValue({ colorCode: color });
  }

  // ===========================================================================
  // Template Helpers
  // ===========================================================================

  /**
   * Gets validation error message for a specific field.
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
   * Gets form-level validation error message.
   */
  getFormError(): string | null {
    if (this.form.errors?.['dateRange']) {
      return this.form.errors['dateRange'].message;
    }
    return null;
  }
}
