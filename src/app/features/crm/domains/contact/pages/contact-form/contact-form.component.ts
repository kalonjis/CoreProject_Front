import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CrmContactApiService } from '../../services/crm-contact-api.service';
import { FeedbackService } from '../../../../../../shared/feedback/tools/feedback.service';
import { CreateContactRequest, UpdateContactRequest, ContactDetail } from '../../models/contact.model';
import { OrganisationPickerComponent, OrganisationPickerValue } from '../../../../shared/pickers/organisation-picker/organisation-picker.component';

@Component({
  selector: 'app-contact-form',
  imports: [FormsModule, OrganisationPickerComponent],
  templateUrl: './contact-form.component.html',
  styleUrl: './contact-form.component.scss'
})
export class ContactFormComponent implements OnInit {

  private readonly api      = inject(CrmContactApiService);
  private readonly router   = inject(Router);
  private readonly route    = inject(ActivatedRoute);
  private readonly feedback = inject(FeedbackService);

  readonly mode    = signal<'create' | 'edit'>('create');
  readonly loading = signal(false);
  readonly saving  = signal(false);

  publicId: string | null = null;

  form = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    organisationPublicId: '',
    notes: ''
  };

  ngOnInit(): void {
    const routeMode = this.route.snapshot.data['mode'] as 'create' | 'edit';
    this.mode.set(routeMode);

    if (routeMode === 'edit') {
      this.publicId = this.route.snapshot.paramMap.get('publicId')!;
      this.loading.set(true);
      this.api.getByPublicId(this.publicId).subscribe({
        next: c => { this.prefill(c); this.loading.set(false); },
        error: () => { this.feedback.showError('Contact introuvable.'); this.back(); }
      });
    }
  }

  private prefill(c: ContactDetail): void {
    this.form = {
      firstName:            c.firstName,
      lastName:             c.lastName,
      email:                c.email,
      phone:                c.phone ?? '',
      jobTitle:             c.jobTitle ?? '',
      organisationPublicId: c.organisationPublicId ?? '',
      notes:                c.notes ?? ''
    };
  }

  onOrgSelected(v: OrganisationPickerValue | null): void {
    this.form.organisationPublicId = v?.publicId ?? '';
  }

  get isValid(): boolean {
    return this.form.firstName.trim().length > 0
      && this.form.lastName.trim().length > 0
      && this.form.email.trim().length > 0;
  }

  submit(): void {
    if (!this.isValid) return;
    this.mode() === 'create' ? this.create() : this.update();
  }

  private create(): void {
    const body: CreateContactRequest = {
      firstName: this.form.firstName,
      lastName:  this.form.lastName,
      email:     this.form.email
    };
    if (this.form.phone.trim())                body.phone                = this.form.phone;
    if (this.form.jobTitle.trim())             body.jobTitle             = this.form.jobTitle;
    if (this.form.organisationPublicId.trim()) body.organisationPublicId = this.form.organisationPublicId;
    if (this.form.notes.trim())                body.notes                = this.form.notes;

    this.saving.set(true);
    this.api.create(body).subscribe({
      next: c => {
        this.saving.set(false);
        this.feedback.showSuccess('Contact créé.');
        this.router.navigate(['/crm/contacts', c.publicId]);
      },
      error: () => { this.saving.set(false); this.feedback.showError('Impossible de créer le contact.'); }
    });
  }

  private update(): void {
    const body: UpdateContactRequest = {};
    if (this.form.firstName.trim()) body.firstName = this.form.firstName;
    if (this.form.lastName.trim())  body.lastName  = this.form.lastName;
    if (this.form.email.trim())     body.email     = this.form.email;
    body.phone    = this.form.phone    || undefined;
    body.jobTitle = this.form.jobTitle || undefined;
    body.notes    = this.form.notes    || undefined;

    this.saving.set(true);
    this.api.update(this.publicId!, body).subscribe({
      next: c => {
        this.saving.set(false);
        this.feedback.showSuccess('Contact mis à jour.');
        this.router.navigate(['/crm/contacts', c.publicId]);
      },
      error: () => { this.saving.set(false); this.feedback.showError('Impossible de mettre à jour le contact.'); }
    });
  }

  back(): void {
    this.publicId
      ? this.router.navigate(['/crm/contacts', this.publicId])
      : this.router.navigate(['/crm/contacts']);
  }
}
