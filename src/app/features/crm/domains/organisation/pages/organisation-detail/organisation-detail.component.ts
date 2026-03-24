import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CrmOrganisationApiService } from '../../services/crm-organisation-api.service';
import { OrganisationDetail } from '../../models/organisation.model';
import { OrganisationInfoCardComponent } from '../../components/organisation-info-card/organisation-info-card.component';
import { OrganisationActionMergeComponent } from '../../components/organisation-action-merge/organisation-action-merge.component';
import { ContactActionCreateComponent } from '../../../contact/components/contact-action-create/contact-action-create.component';
import { DealActionCreateComponent } from '../../../deal/components/deal-action-create/deal-action-create.component';
import { ContactDetail } from '../../../contact/models/contact.model';

type ActionPanel = 'merge' | null;

@Component({
  selector: 'app-organisation-detail',
  imports: [
    RouterLink,
    OrganisationInfoCardComponent,
    OrganisationActionMergeComponent,
    ContactActionCreateComponent,
    DealActionCreateComponent
  ],
  templateUrl: './organisation-detail.component.html',
  styleUrl: './organisation-detail.component.scss'
})
export class OrganisationDetailComponent implements OnInit {

  private readonly route  = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api    = inject(CrmOrganisationApiService);

  readonly organisation   = signal<OrganisationDetail | null>(null);
  readonly loading        = signal(false);
  readonly error          = signal<string | null>(null);
  readonly activeAction   = signal<ActionPanel>(null);
  readonly showCreateContact = signal(false);
  readonly showCreateDeal    = signal(false);

  private publicId = '';

  ngOnInit(): void {
    this.publicId = this.route.snapshot.paramMap.get('publicId') ?? '';
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.getByPublicId(this.publicId).subscribe({
      next: org => { this.organisation.set(org); this.loading.set(false); },
      error: () => { this.error.set('Organisation introuvable.'); this.loading.set(false); }
    });
  }

  setAction(action: ActionPanel): void {
    this.activeAction.set(this.activeAction() === action ? null : action);
  }

  onMerged(survivingId: string): void {
    this.activeAction.set(null);
    this.router.navigate(['/crm/organisations', survivingId]);
  }

  onContactCreated(contact: ContactDetail): void {
    this.showCreateContact.set(false);
    this.router.navigate(['/crm/contacts', contact.publicId]);
  }

  onDealCreated(): void {
    this.showCreateDeal.set(false);
  }

  goEdit(): void { this.router.navigate(['/crm/organisations', this.publicId, 'edit']); }
}
