import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  CalendarEvent,
  ExternalCalendarProvider,
  EXTERNAL_CALENDAR_PROVIDER_LABELS,
  EXTERNAL_CALENDAR_PROVIDER_ICONS
} from '../../models';
import { CalendarExportApiService } from '../../services';

/**
 * Export option for the modal.
 */
interface ExportOption {
  provider: ExternalCalendarProvider;
  label: string;
  icon: string;
  description: string;
}

/**
 * Calendar export modal component.
 *
 * @description
 * Modal dialog for exporting calendar events to external services
 * or downloading as ICS files.
 *
 * @example
 * ```html
 * <app-calendar-export-modal
 *   [event]="selectedEvent"
 *   [isOpen]="exportModalOpen"
 *   (close)="closeExportModal()"
 * />
 * ```
 */
@Component({
  selector: 'app-calendar-export-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar-export-modal.component.html',
  styleUrl: './calendar-export-modal.component.scss'
})
export class CalendarExportModalComponent {
  // ===========================================================================
  // Dependencies
  // ===========================================================================

  private readonly exportService = inject(CalendarExportApiService);

  // ===========================================================================
  // Inputs
  // ===========================================================================

  /** Event to export (null for export all) */
  @Input() event: CalendarEvent | null = null;

  /** Whether the modal is open */
  @Input() isOpen: boolean = false;

  // ===========================================================================
  // Outputs
  // ===========================================================================

  /** Emits when modal should close */
  @Output() close = new EventEmitter<void>();

  // ===========================================================================
  // State
  // ===========================================================================

  readonly loading = signal<ExternalCalendarProvider | null>(null);
  readonly error = signal<string | null>(null);

  // ===========================================================================
  // Export Options
  // ===========================================================================

  readonly exportOptions: ExportOption[] = [
    {
      provider: ExternalCalendarProvider.GOOGLE,
      label: EXTERNAL_CALENDAR_PROVIDER_LABELS[ExternalCalendarProvider.GOOGLE],
      icon: '📅',
      description: 'Ouvrir dans Google Calendar'
    },
    {
      provider: ExternalCalendarProvider.OUTLOOK,
      label: EXTERNAL_CALENDAR_PROVIDER_LABELS[ExternalCalendarProvider.OUTLOOK],
      icon: '📧',
      description: 'Ouvrir dans Outlook Web'
    },
    {
      provider: ExternalCalendarProvider.APPLE,
      label: EXTERNAL_CALENDAR_PROVIDER_LABELS[ExternalCalendarProvider.APPLE],
      icon: '🍎',
      description: 'Télécharger pour Apple Calendar'
    },
    {
      provider: ExternalCalendarProvider.ICS,
      label: EXTERNAL_CALENDAR_PROVIDER_LABELS[ExternalCalendarProvider.ICS],
      icon: '📥',
      description: 'Télécharger le fichier .ics'
    }
  ];

  // ===========================================================================
  // Computed
  // ===========================================================================

  /** Modal title */
  get modalTitle(): string {
    return this.event
      ? `Exporter "${this.event.title}"`
      : 'Exporter tous les événements';
  }

  /** Whether exporting a single event */
  get isSingleEvent(): boolean {
    return this.event !== null;
  }

  // ===========================================================================
  // Actions
  // ===========================================================================

  /**
   * Handles export option click.
   */
  onExportClick(option: ExportOption): void {
    this.loading.set(option.provider);
    this.error.set(null);

    try {
      if (this.event) {
        // Single event export
        this.exportService.export({
          provider: option.provider,
          exportAll: false,
          eventPublicId: this.event.publicId
        });
      } else {
        // Export all (only ICS supported)
        if (option.provider === ExternalCalendarProvider.ICS) {
          this.exportService.downloadAllEventsIcs();
        } else {
          this.error.set('L\'export de tous les événements n\'est disponible qu\'en format ICS');
          this.loading.set(null);
          return;
        }
      }

      // Close after short delay for URL-based exports
      if (option.provider !== ExternalCalendarProvider.ICS &&
        option.provider !== ExternalCalendarProvider.APPLE) {
        setTimeout(() => {
          this.loading.set(null);
          this.close.emit();
        }, 500);
      } else {
        this.loading.set(null);
        this.close.emit();
      }
    } catch (err) {
      this.error.set('Erreur lors de l\'export');
      this.loading.set(null);
    }
  }

  /**
   * Closes the modal.
   */
  onClose(): void {
    this.error.set(null);
    this.close.emit();
  }

  /**
   * Handles backdrop click.
   */
  onBackdropClick(event: Event): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.onClose();
    }
  }

  /**
   * Checks if an option is loading.
   */
  isLoading(provider: ExternalCalendarProvider): boolean {
    return this.loading() === provider;
  }

  /**
   * Checks if an option is disabled.
   */
  isDisabled(option: ExportOption): boolean {
    // Disable non-ICS options when exporting all
    if (!this.isSingleEvent && option.provider !== ExternalCalendarProvider.ICS) {
      return true;
    }
    return this.loading() !== null;
  }
}
