import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CrmOrganisationApiService } from '../../services/crm-organisation-api.service';
import {
  OrganisationDetail,
  OrganisationSize,
  ORGANISATION_SIZE_LABELS
} from '../../models/organisation.model';
import { FeedbackService } from '../../../../../../shared/feedback/tools/feedback.service';

@Component({
  selector: 'app-organisation-form',
  imports: [FormsModule, RouterLink],
  templateUrl: './organisation-form.component.html',
  styleUrl: './organisation-form.component.scss'
})
/** Routed page for creating a new organisation or editing an existing one (mode driven by route data). */
export class OrganisationFormComponent implements OnInit {

  private readonly route    = inject(ActivatedRoute);
  private readonly router   = inject(Router);
  private readonly api      = inject(CrmOrganisationApiService);
  private readonly feedback = inject(FeedbackService);

  readonly loading = signal(false);

  mode: 'create' | 'edit' = 'create';
  private publicId = '';

  readonly sizes      = Object.values(OrganisationSize);
  readonly sizeLabels = ORGANISATION_SIZE_LABELS;

  form = {
    name:    '',
    website: '',
    industry:'',
    size:    '' as OrganisationSize | '',
    phone:   '',
    notes:   ''
  };

  get isValid(): boolean {
    return this.form.name.trim().length > 0;
  }

  ngOnInit(): void {
    this.mode = this.route.snapshot.data['mode'] ?? 'create';

    if (this.mode === 'edit') {
      this.publicId = this.route.snapshot.paramMap.get('publicId') ?? '';
      this.loadExisting();
    }
  }

  private loadExisting(): void {
    this.loading.set(true);
    this.api.getByPublicId(this.publicId).subscribe({
      next: org => {
        this.form.name     = org.name;
        this.form.website  = org.website  ?? '';
        this.form.industry = org.industry ?? '';
        this.form.size     = org.size     ?? '';
        this.form.phone    = org.phone    ?? '';
        this.form.notes    = org.notes    ?? '';
        this.loading.set(false);
      },
      error: () => {
        this.feedback.showError('Impossible de charger l\'organisation.');
        this.loading.set(false);
      }
    });
  }

  submit(): void {
    if (!this.isValid) return;

    this.loading.set(true);

    const body = {
      name:     this.form.name.trim(),
      website:  this.form.website.trim()  || undefined,
      industry: this.form.industry.trim() || undefined,
      size:     this.form.size            || undefined,
      phone:    this.form.phone.trim()    || undefined,
      notes:    this.form.notes.trim()    || undefined
    };

    if (this.mode === 'create') {
      this.api.create(body).subscribe({
        next: org => this.onSuccess(org),
        error: () => { this.feedback.showError('Erreur lors de la création.'); this.loading.set(false); }
      });
    } else {
      this.api.update(this.publicId, body).subscribe({
        next: org => this.onSuccess(org),
        error: () => { this.feedback.showError('Erreur lors de la mise à jour.'); this.loading.set(false); }
      });
    }
  }

  private onSuccess(org: OrganisationDetail): void {
    this.feedback.showSuccess(
      this.mode === 'create' ? 'Organisation créée avec succès.' : 'Organisation mise à jour.'
    );
    this.loading.set(false);
    this.router.navigate(['/crm/organisations', org.publicId]);
  }
}
