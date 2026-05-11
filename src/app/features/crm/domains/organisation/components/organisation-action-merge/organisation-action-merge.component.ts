import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CrmOrganisationApiService } from '../../services/crm-organisation-api.service';
import { FeedbackService } from '../../../../../../shared/feedback/tools/feedback.service';
import { ConfirmDialogService } from '../../../../../../shared/confirm-dialog/tools/confirm-dialog.service';
import { OrganisationPickerComponent, OrganisationPickerValue } from '../../../../shared/pickers/organisation-picker/organisation-picker.component';

@Component({
  selector: 'app-organisation-action-merge',
  imports: [OrganisationPickerComponent],
  templateUrl: './organisation-action-merge.component.html',
  styleUrl: './organisation-action-merge.component.scss'
})
/** Form for merging two organisations: the selected source is archived and its data transferred to this organisation (the target). */
export class OrganisationActionMergeComponent {
  /** Public ID of the target organisation (the one that survives the merge). */
  @Input({ required: true }) publicId!: string;
  /** Emitted with the surviving organisation's public ID after a successful merge. */
  @Output() merged    = new EventEmitter<string>();
  /** Emitted when the user dismisses the form without merging. */
  @Output() cancelled = new EventEmitter<void>();

  private readonly api     = inject(CrmOrganisationApiService);
  private readonly feedback = inject(FeedbackService);
  private readonly confirm  = inject(ConfirmDialogService);

  /** True while the merge request is in flight. */
  readonly loading = signal(false);

  sourcePublicId = '';

  /** Updates the selected source organisation when the picker value changes. */
  onOrgSelected(v: OrganisationPickerValue | null): void {
    this.sourcePublicId = v?.publicId ?? '';
  }

  /** True when a source organisation different from the target has been selected. */
  get isValid(): boolean {
    return this.sourcePublicId.trim().length > 0 && this.sourcePublicId.trim() !== this.publicId;
  }

  /** Prompts for confirmation then triggers the merge API call. */
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
