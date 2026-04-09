import { Component, Output, EventEmitter, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CrmOrganisationApiService } from '../../services/crm-organisation-api.service';
import { FeedbackService } from '../../../../../../shared/feedback/tools/feedback.service';
import {
  CreateOrganisationRequest,
  OrganisationDetail,
  OrganisationSize,
  ORGANISATION_SIZE_LABELS
} from '../../models/organisation.model';

@Component({
  selector: 'app-organisation-action-create',
  imports: [FormsModule],
  templateUrl: './organisation-action-create.component.html',
  styleUrl: './organisation-action-create.component.scss'
})
export class OrganisationActionCreateComponent {
  @Output() created   = new EventEmitter<OrganisationDetail>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly api      = inject(CrmOrganisationApiService);
  private readonly feedback = inject(FeedbackService);

  readonly saving = signal(false);

  name     = '';
  website  = '';
  industry = '';
  size: OrganisationSize | '' = '';
  phone    = '';
  notes    = '';

  readonly sizes      = Object.values(OrganisationSize);
  readonly sizeLabels = ORGANISATION_SIZE_LABELS;

  get isValid(): boolean {
    return this.name.trim().length > 0;
  }

  submit(): void {
    if (!this.isValid) return;

    const body: CreateOrganisationRequest = { name: this.name.trim() };
    if (this.website.trim())  body.website  = this.website.trim();
    if (this.industry.trim()) body.industry = this.industry.trim();
    if (this.size)            body.size     = this.size;
    if (this.phone.trim())    body.phone    = this.phone.trim();
    if (this.notes.trim())    body.notes    = this.notes.trim();

    this.saving.set(true);
    this.api.create(body).subscribe({
      next: org => {
        this.saving.set(false);
        this.feedback.showSuccess('Organisation créée.');
        this.created.emit(org);
      },
      error: () => {
        this.saving.set(false);
        this.feedback.showError('Impossible de créer l\'organisation.');
      }
    });
  }
}
