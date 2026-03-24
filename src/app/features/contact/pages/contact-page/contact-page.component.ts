// src/app/features/contact/pages/contact-page/contact-page.component.ts

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { LeadApiService } from '../../services/lead-api.service';
import { Civility, CIVILITY_LABELS, LeadSource, LeadType, LEAD_TYPE_LABELS, SubmitLeadRequest } from '../../models/lead.model';
import { FeedbackService } from '../../../../shared/feedback/tools/feedback.service';

@Component({
    selector: 'app-contact-page',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './contact-page.component.html',
    styleUrl: './contact-page.component.scss'
})
export class ContactPageComponent {

  private readonly fb       = inject(FormBuilder);
  private readonly leadApi  = inject(LeadApiService);
  private readonly feedback = inject(FeedbackService);
  private readonly router   = inject(Router);
  private readonly route    = inject(ActivatedRoute);

  private readonly detectedSource: LeadSource = this.resolveLeadSource();

  // State
  isSubmitting = signal(false);
  formError = signal<string | null>(null);

  // Lead types for dropdown
  readonly leadTypes = Object.values(LeadType);
  readonly leadTypeLabels = LEAD_TYPE_LABELS;

  readonly civilities = Object.values(Civility);
  readonly civilityLabels = CIVILITY_LABELS;

  // Form
  contactForm: FormGroup = this.fb.group({
    civility:         [null],
    firstName:        ['', [Validators.maxLength(100)]],
    lastName:         ['', [Validators.maxLength(100)]],
    phone:            ['', [Validators.maxLength(20)]],
    organisationName: ['', [Validators.maxLength(200)]],
    email:            ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    message:          ['', [Validators.required, Validators.minLength(10), Validators.maxLength(5000)]],
    leadType:         [LeadType.GENERAL, [Validators.required]],
    confirmEmail:     ['']
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

    const trim = (key: string) => this.contactForm.get(key)?.value?.trim() || undefined;

    const request: SubmitLeadRequest = {
      email:            this.contactForm.get('email')?.value.trim().toLowerCase(),
      civility:         this.contactForm.get('civility')?.value || undefined,
      firstName:        trim('firstName'),
      lastName:         trim('lastName'),
      phone:            trim('phone'),
      organisationName: trim('organisationName'),
      message:          this.contactForm.get('message')?.value.trim(),
      leadType:         this.contactForm.get('leadType')?.value,
      leadSource:       this.detectedSource,
      website:          this.contactForm.get('confirmEmail')?.value || undefined
    };

    this.leadApi.submit(request)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          const msg = response.referenceId
            ? `Message envoyé ! Référence : ${response.referenceId}`
            : 'Message envoyé avec succès !';
          this.feedback.showSuccess(msg, undefined, 8000);
          this.router.navigate(['/']);
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

  private resolveLeadSource(): LeadSource {
    const params = this.route.snapshot.queryParamMap;
    const medium = params.get('utm_medium')?.toLowerCase() ?? '';
    const source = params.get('utm_source')?.toLowerCase() ?? '';

    // utm_medium est le signal le plus fiable
    if (medium === 'cpc' || medium === 'paid' || medium === 'paidsocial') return LeadSource.PAID_CAMPAIGN;
    if (medium === 'organic')                                              return LeadSource.ORGANIC_SEARCH;
    if (medium === 'social' || medium === 'social-media')                 return LeadSource.SOCIAL_MEDIA;
    if (medium === 'email')                                               return LeadSource.EMAIL;
    if (medium === 'referral')                                            return LeadSource.REFERRAL;
    if (medium === 'event')                                               return LeadSource.EVENT;

    // Fallback sur utm_source si pas de medium reconnu
    const socialNetworks = ['linkedin', 'facebook', 'instagram', 'twitter', 'tiktok', 'youtube', 'pinterest'];
    const searchEngines  = ['google', 'bing', 'yahoo', 'duckduckgo'];
    const emailTools     = ['newsletter', 'mailchimp', 'brevo', 'sendinblue'];

    if (socialNetworks.some(n => source.includes(n))) return LeadSource.SOCIAL_MEDIA;
    if (searchEngines.some(n => source.includes(n)))  return LeadSource.ORGANIC_SEARCH;
    if (emailTools.some(n => source.includes(n)))     return LeadSource.EMAIL;

    return LeadSource.CONTACT_FORM;
  }
}
