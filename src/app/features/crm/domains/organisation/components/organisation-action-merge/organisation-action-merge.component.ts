import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CrmOrganisationApiService } from '../../services/crm-organisation-api.service';
import { FeedbackService } from '../../../../../../shared/feedback/tools/feedback.service';
import { ConfirmDialogService } from '../../../../../../shared/confirm-dialog/tools/confirm-dialog.service';

@Component({
  selector: 'app-organisation-action-merge',
  imports: [FormsModule],
  templateUrl: './organisation-action-merge.component.html',
  styleUrl: './organisation-action-merge.component.scss'
})
export class OrganisationActionMergeComponent {
  @Input({ required: true }) publicId!: string;
  @Output() merged    = new EventEmitter<string>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly api     = inject(CrmOrganisationApiService);
  private readonly feedback = inject(FeedbackService);
  private readonly confirm  = inject(ConfirmDialogService);

  readonly loading = signal(false);

  sourcePublicId = '';

  get isValid(): boolean {
    return this.sourcePublicId.trim().length > 0 && this.sourcePublicId.trim() !== this.publicId;
  }

  async submit(): Promise<void> {
    if (!this.isValid) return;

    try {
      await this.confirm.confirm({
        title: 'Fusionner les organisations',
        message: 'L\'organisation source sera supprimée. Tous ses contacts seront rattachés à cette organisation. Cette action est irréversible.',
        confirmButtonText: 'Fusionner',
        type: 'danger'
      });
    } catch { return; }

    this.loading.set(true);
    this.api.merge({ sourcePublicId: this.sourcePublicId.trim(), targetPublicId: this.publicId }).subscribe({
      next: org => {
        this.feedback.showSuccess('Organisations fusionnées avec succès.');
        this.merged.emit(org.publicId);
        this.loading.set(false);
      },
      error: () => {
        this.feedback.showError('Impossible de fusionner les organisations.');
        this.loading.set(false);
      }
    });
  }
}
