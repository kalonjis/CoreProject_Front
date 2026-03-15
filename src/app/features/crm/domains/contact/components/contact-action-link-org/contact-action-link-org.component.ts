import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CrmContactApiService } from '../../services/crm-contact-api.service';
import { FeedbackService } from '../../../../../../shared/feedback/tools/feedback.service';
import { ConfirmDialogService } from '../../../../../../shared/confirm-dialog/tools/confirm-dialog.service';

@Component({
  selector: 'app-contact-action-link-org',
  imports: [FormsModule],
  templateUrl: './contact-action-link-org.component.html',
  styleUrl: './contact-action-link-org.component.scss'
})
export class ContactActionLinkOrgComponent {
  @Input({ required: true }) publicId!: string;
  @Input() currentOrgPublicId: string | null = null;
  @Output() linked    = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly api      = inject(CrmContactApiService);
  private readonly feedback = inject(FeedbackService);
  private readonly confirm  = inject(ConfirmDialogService);

  organisationPublicId = '';
  readonly loading = signal(false);

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

  submit(): void {
    if (!this.organisationPublicId.trim()) return;
    this.loading.set(true);
    this.api.linkOrganisation(this.publicId, { organisationPublicId: this.organisationPublicId.trim() }).subscribe({
      next: () => { this.loading.set(false); this.feedback.showSuccess('Organisation liée.'); this.linked.emit(); },
      error: () => { this.loading.set(false); this.feedback.showError('Impossible de lier l\'organisation.'); }
    });
  }
}
