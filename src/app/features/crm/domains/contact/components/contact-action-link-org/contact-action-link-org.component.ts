import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CrmContactApiService } from '../../services/crm-contact-api.service';
import { FeedbackService } from '../../../../../../shared/feedback/tools/feedback.service';
import { ConfirmDialogService } from '../../../../../../shared/confirm-dialog/tools/confirm-dialog.service';
import { OrganisationPickerComponent, OrganisationPickerValue } from '../../../../shared/pickers/organisation-picker/organisation-picker.component';

@Component({
  selector: 'app-contact-action-link-org',
  imports: [OrganisationPickerComponent],
  templateUrl: './contact-action-link-org.component.html',
  styleUrl: './contact-action-link-org.component.scss'
})
/** Form for linking or unlinking a contact to an organisation, with confirmation before unlinking. */
export class ContactActionLinkOrgComponent {
  /** Public ID of the contact to link. */
  @Input({ required: true }) publicId!: string;
  /** Public ID of the currently linked organisation, or null if none. */
  @Input() currentOrgPublicId: string | null = null;
  /** Emitted after a successful link or unlink operation. */
  @Output() linked    = new EventEmitter<void>();
  /** Emitted when the user dismisses the form without saving. */
  @Output() cancelled = new EventEmitter<void>();

  private readonly api      = inject(CrmContactApiService);
  private readonly feedback = inject(FeedbackService);
  private readonly confirm  = inject(ConfirmDialogService);

  organisationPublicId = '';
  /** True while the HTTP request is in flight. */
  readonly loading = signal(false);

  /** Updates the selected organisation when the picker value changes. */
  onOrgSelected(v: OrganisationPickerValue | null): void {
    this.organisationPublicId = v?.publicId ?? '';
  }

  /** Prompts for confirmation and removes the organisation link from this contact. */
  async unlink(): Promise<void> {
    try {
      await this.confirm.confirm({ title: 'Délier l\'organisation', message: 'Retirer l\'organisation de ce contact ?', type: 'warning' });
    } catch { return; }

    this.loading.set(true);
    this.api.linkOrganisation(this.publicId, { organisationPublicId: null }).subscribe({
      next: () => { this.loading.set(false); this.feedback.showSuccess('Organisation retirée.'); this.linked.emit(); },
      error: () => { this.loading.set(false); this.feedback.showError('Impossible de délier l\'organisation.'); }
    });
  }

  /** Links the selected organisation to this contact. */
  submit(): void {
    if (!this.organisationPublicId.trim()) return;
    this.loading.set(true);
    this.api.linkOrganisation(this.publicId, { organisationPublicId: this.organisationPublicId.trim() }).subscribe({
      next: () => { this.loading.set(false); this.feedback.showSuccess('Organisation liée.'); this.linked.emit(); },
      error: () => { this.loading.set(false); this.feedback.showError('Impossible de lier l\'organisation.'); }
    });
  }
}
