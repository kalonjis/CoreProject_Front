import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CrmContactApiService } from '../../services/crm-contact-api.service';
import { FeedbackService } from '../../../../../../shared/feedback/tools/feedback.service';
import { ContactDetail, CreateContactRequest } from '../../models/contact.model';

@Component({
  selector: 'app-contact-action-create',
  imports: [FormsModule],
  templateUrl: './contact-action-create.component.html',
  styleUrl: './contact-action-create.component.scss'
})
export class ContactActionCreateComponent {
  /** Pre-filled organisation — the created contact will be linked to it. */
  @Input() organisationPublicId: string | null = null;
  /** Display name for the organisation (shown as hint in the form). */
  @Input() organisationName = '';
  @Output() created   = new EventEmitter<ContactDetail>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly contactApi = inject(CrmContactApiService);
  private readonly feedback   = inject(FeedbackService);

  readonly loading = signal(false);

  firstName = '';
  lastName  = '';
  email     = '';
  phone     = '';
  jobTitle  = '';
  notes     = '';

  get isValid(): boolean {
    return this.firstName.trim().length > 0
      && this.lastName.trim().length > 0
      && this.email.trim().length > 0;
  }

  submit(): void {
    if (!this.isValid) return;

    const body: CreateContactRequest = {
      firstName: this.firstName.trim(),
      lastName:  this.lastName.trim(),
      email:     this.email.trim()
    };
    if (this.phone.trim())    body.phone    = this.phone.trim();
    if (this.jobTitle.trim()) body.jobTitle = this.jobTitle.trim();
    if (this.notes.trim())    body.notes    = this.notes.trim();
    if (this.organisationPublicId) body.organisationPublicId = this.organisationPublicId;

    this.loading.set(true);
    this.contactApi.create(body).subscribe({
      next: contact => {
        this.loading.set(false);
        this.feedback.showSuccess('Contact créé avec succès.');
        this.created.emit(contact);
      },
      error: () => {
        this.loading.set(false);
        this.feedback.showError('Impossible de créer le contact.');
      }
    });
  }
}
