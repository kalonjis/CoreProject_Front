import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CrmLeadApiService } from '../../services/crm-lead-api.service';
import { FeedbackService } from '../../../../../../shared/feedback/tools/feedback.service';
import { ConvertLeadRequest } from '../../models/lead.model';

@Component({
  selector: 'app-lead-action-convert',
  imports: [FormsModule],
  templateUrl: './lead-action-convert.component.html',
  styleUrl: './lead-action-convert.component.scss'
})
export class LeadActionConvertComponent {
  @Input({ required: true }) publicId!: string;
  @Output() converted = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly api      = inject(CrmLeadApiService);
  private readonly feedback = inject(FeedbackService);

  form: ConvertLeadRequest = {
    firstName: '',
    lastName: '',
    jobTitle: '',
    phone: '',
    organisationPublicId: ''
  };

  readonly loading = signal(false);

  get isValid(): boolean {
    return this.form.firstName.trim().length > 0 && this.form.lastName.trim().length > 0;
  }

  submit(): void {
    if (!this.isValid) return;

    const body: ConvertLeadRequest = { firstName: this.form.firstName, lastName: this.form.lastName };
    if (this.form.jobTitle?.trim())             body.jobTitle             = this.form.jobTitle;
    if (this.form.phone?.trim())                body.phone                = this.form.phone;
    if (this.form.organisationPublicId?.trim()) body.organisationPublicId = this.form.organisationPublicId;

    this.loading.set(true);
    this.api.convert(this.publicId, body).subscribe({
      next: () => {
        this.loading.set(false);
        this.feedback.showSuccess('Lead converti en contact.');
        this.converted.emit();
      },
      error: () => {
        this.loading.set(false);
        this.feedback.showError('Impossible de convertir le lead.');
      }
    });
  }
}
