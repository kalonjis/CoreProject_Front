import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CrmSupportTicketApiService } from '../../services/crm-support-ticket-api.service';
import { FeedbackService } from '../../../../../../shared/feedback/tools/feedback.service';

@Component({
  selector: 'app-support-ticket-form',
  imports: [RouterLink, FormsModule],
  templateUrl: './support-ticket-form.component.html',
  styleUrl: './support-ticket-form.component.scss'
})
export class SupportTicketFormComponent {

  private readonly api      = inject(CrmSupportTicketApiService);
  private readonly router   = inject(Router);
  private readonly feedback = inject(FeedbackService);

  readonly saving = signal(false);

  subject             = '';
  description         = '';
  submittedByPublicId = '';   // publicId d'un Contact
  assignedToPublicId  = '';   // publicId d'un User (optionnel)

  submit(): void {
    if (!this.subject.trim() || !this.submittedByPublicId.trim()) return;

    this.saving.set(true);
    this.api.create({
      subject:             this.subject.trim(),
      submittedByPublicId: this.submittedByPublicId.trim(),
      ...(this.description.trim()        && { description: this.description.trim() }),
      ...(this.assignedToPublicId.trim() && { assignedToPublicId: this.assignedToPublicId.trim() }),
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
