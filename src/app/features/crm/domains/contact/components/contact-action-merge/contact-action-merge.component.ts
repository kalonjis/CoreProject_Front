import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CrmContactApiService } from '../../services/crm-contact-api.service';
import { FeedbackService } from '../../../../../../shared/feedback/tools/feedback.service';
import { ConfirmDialogService } from '../../../../../../shared/confirm-dialog/tools/confirm-dialog.service';
import { ContactPickerComponent, ContactPickerValue } from '../../../../shared/pickers/contact-picker/contact-picker.component';

@Component({
  selector: 'app-contact-action-merge',
  imports: [ContactPickerComponent],
  templateUrl: './contact-action-merge.component.html',
  styleUrl: './contact-action-merge.component.scss'
})
export class ContactActionMergeComponent {
  /** Ce contact est la cible (le survivant) */
  @Input({ required: true }) publicId!: string;
  @Output() merged    = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly api      = inject(CrmContactApiService);
  private readonly feedback = inject(FeedbackService);
  private readonly confirm  = inject(ConfirmDialogService);

  sourcePublicId = '';
  readonly loading = signal(false);

  onContactSelected(v: ContactPickerValue | null): void {
    this.sourcePublicId = v?.publicId ?? '';
  }

  async submit(): Promise<void> {
    if (!this.sourcePublicId.trim()) return;

    try {
      await this.confirm.confirm({
        title: 'Fusionner les contacts',
        message: 'Le contact source sera supprimé. Cette action est irréversible.',
        confirmButtonText: 'Fusionner',
        type: 'danger'
      });
    } catch { return; }

    this.loading.set(true);
    this.api.merge({ sourcePublicId: this.sourcePublicId.trim(), targetPublicId: this.publicId }).subscribe({
      next: () => {
        this.loading.set(false);
        this.feedback.showSuccess('Contacts fusionnés.');
        this.merged.emit();
      },
      error: () => { this.loading.set(false); this.feedback.showError('Impossible de fusionner les contacts.'); }
    });
  }
}
