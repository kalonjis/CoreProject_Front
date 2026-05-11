/**
 * Creation form for a new CRM support ticket.
 *
 * Supports optional pre-fill via the {@code contactPublicId} query parameter.
 * Uses {@link ContactPickerComponent} and {@link CommercialPickerComponent} for
 * typeahead selection of the submitter and assignee.
 * Redirects to the ticket detail page after successful creation.
 */
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CrmSupportTicketApiService } from '../../services/crm-support-ticket-api.service';
import { CrmContactApiService } from '../../../contact/services/crm-contact-api.service';
import { FeedbackService } from '../../../../../../shared/feedback/tools/feedback.service';
import { ContactPickerComponent, ContactPickerValue } from '../../../../shared/pickers/contact-picker/contact-picker.component';
import { CommercialPickerComponent } from '../../../../shared/pickers/commercial-picker/commercial-picker.component';

@Component({
  selector: 'app-support-ticket-form',
  imports: [FormsModule, RouterLink, ContactPickerComponent, CommercialPickerComponent],
  templateUrl: './support-ticket-form.component.html',
  styleUrl: './support-ticket-form.component.scss'
})
export class SupportTicketFormComponent implements OnInit {

  private readonly api        = inject(CrmSupportTicketApiService);
  private readonly contactApi = inject(CrmContactApiService);
  private readonly router     = inject(Router);
  private readonly route      = inject(ActivatedRoute);
  private readonly feedback   = inject(FeedbackService);

  /** Whether the create request is in flight. */
  readonly saving = signal(false);

  subject             = '';
  description         = '';
  /** Public ID of the contact set as ticket submitter. */
  submittedByPublicId = '';
  assignedToPublicId  = '';

  /** Display label for the contact pre-filled via query param (read-only display). */
  prefilledContactLabel = '';

  ngOnInit(): void {
    const contactPublicId = this.route.snapshot.queryParamMap.get('contactPublicId');
    if (contactPublicId) {
      this.contactApi.getByPublicId(contactPublicId).subscribe({
        next: c => {
          this.submittedByPublicId  = c.publicId;
          this.prefilledContactLabel = [c.firstName, c.lastName].filter(Boolean).join(' ');
        },
        error: () => {}
      });
    }
  }

  /** Updates submittedByPublicId when the contact picker emits a selection. */
  onContactSelected(v: ContactPickerValue | null): void {
    this.submittedByPublicId = v?.publicId ?? '';
  }

  /** Updates assignedToPublicId when the commercial picker emits a selection. */
  onCommercialSelected(publicId: string | null): void {
    this.assignedToPublicId = publicId ?? '';
  }

  /** Returns true when subject and submitter are both set. */
  get isValid(): boolean {
    return this.subject.trim().length > 0 && this.submittedByPublicId.length > 0;
  }

  /** Creates the ticket via the API, then navigates to the new ticket detail. */
  submit(): void {
    if (!this.isValid) return;

    this.saving.set(true);
    this.api.create({
      subject:             this.subject.trim(),
      submittedByPublicId: this.submittedByPublicId,
      ...(this.description.trim()       && { description:        this.description.trim() }),
      ...(this.assignedToPublicId       && { assignedToPublicId: this.assignedToPublicId }),
    }).subscribe({
      next: ticket => {
        this.saving.set(false);
        this.feedback.showSuccess('Ticket créé.');
        this.router.navigate(['/crm/support-tickets', ticket.publicId]);
      },
      error: () => {
        this.saving.set(false);
        this.feedback.showError('Erreur lors de la création.');
      }
    });
  }
}
