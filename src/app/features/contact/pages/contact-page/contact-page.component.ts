// src/app/features/contact/pages/contact-page/contact-page.component.ts

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';

import { LeadApiService } from '../../services/lead-api.service';
import { LeadType, LEAD_TYPE_LABELS, SubmitLeadRequest } from '../../models/lead.model';
import { FeedbackService } from '../../../../shared/feedback/tools/feedback.service';

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact-page.component.html',
  styleUrl: './contact-page.component.scss'
})
export class ContactPageComponent {

  private readonly fb = inject(FormBuilder);
  private readonly leadApi = inject(LeadApiService);
  private readonly feedback = inject(FeedbackService);

  // State
  isSubmitting = signal(false);
  formError = signal<string | null>(null);

  // Lead types for dropdown
  readonly leadTypes = Object.values(LeadType);
  readonly leadTypeLabels = LEAD_TYPE_LABELS;

  // Form
  contactForm: FormGroup = this.fb.group({
    name: ['', [Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    subject: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(255)]],
    message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(5000)]],
    leadType: [LeadType.GENERAL, [Validators.required]],
    confirmEmail: ['']
  });

  onSubmit(): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    // Honeypot check
    if (this.contactForm.get('confirmEmail')?.value) {
      // Fake success for bots
      this.feedback.showSuccess('Votre message a été envoyé avec succès !',"",5000 );
      this.contactForm.reset({ leadType: LeadType.GENERAL });
      return;
    }

    this.formError.set(null);
    this.isSubmitting.set(true);

    const request: SubmitLeadRequest = {
      email: this.contactForm.get('email')?.value.trim().toLowerCase(),
      name: this.contactForm.get('name')?.value?.trim() || undefined,
      subject: this.contactForm.get('subject')?.value.trim(),
      message: this.contactForm.get('message')?.value.trim(),
      leadType: this.contactForm.get('leadType')?.value,
      website: this.contactForm.get('confirmEmail')?.value || undefined // Honeypot mapped to backend field
    };

    this.leadApi.submit(request)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          const msg = response.referenceId
            ? `Message envoyé ! Référence : ${response.referenceId}`
            : 'Message envoyé avec succès !';
          this.feedback.showSuccess(msg, undefined, 8000);
          this.contactForm.reset({ leadType: LeadType.GENERAL });
        },
        error: (err: HttpErrorResponse) => {
          if (err.status === 429) {
            this.formError.set('Trop de messages envoyés. Veuillez réessayer plus tard.');
          } else if (err.error?.message) {
            this.formError.set(err.error.message);
          } else if (err.status === 0) {
            this.feedback.showError('Erreur de connexion. Vérifiez votre réseau.');
          } else {
            this.feedback.showError('Une erreur est survenue. Veuillez réessayer.');
          }
        }
      });
  }

  // Helper for template
  get f() {
    return this.contactForm.controls;
  }
}
