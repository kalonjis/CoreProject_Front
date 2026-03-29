import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CrmOrganisationApiService } from '../../services/crm-organisation-api.service';
import { OrganisationDetail } from '../../models/organisation.model';
import { OrganisationInfoCardComponent } from '../../components/organisation-info-card/organisation-info-card.component';
import { OrganisationActionMergeComponent } from '../../components/organisation-action-merge/organisation-action-merge.component';
import { ContactActionCreateComponent } from '../../../contact/components/contact-action-create/contact-action-create.component';
import { DealActionCreateComponent } from '../../../deal/components/deal-action-create/deal-action-create.component';
import { DealMiniCardComponent } from '../../../deal/components/deal-mini-card/deal-mini-card.component';
import { CrmEmptyStateComponent } from '../../../../shared/empty-state/crm-empty-state.component';
import { TagInputComponent } from '../../../tag/components/tag-input/tag-input.component';
import { CrmTagApiService } from '../../../tag/services/crm-tag-api.service';
import { Tag } from '../../../tag/models/tag.model';
import { ContactDetail } from '../../../contact/models/contact.model';
import { DealSummary } from '../../../deal/models/deal.model';
import { ChangeLogListComponent } from '../../../crm-change-log/components/change-log-list/change-log-list.component';

type ActionPanel = 'merge' | null;
type OrgTab = 'infos' | 'modifications';

@Component({
  selector: 'app-organisation-detail',
  imports: [
    RouterLink,
    OrganisationInfoCardComponent,
    OrganisationActionMergeComponent,
    ContactActionCreateComponent,
    DealActionCreateComponent,
    DealMiniCardComponent,
    CrmEmptyStateComponent,
    TagInputComponent,
    ChangeLogListComponent
  ],
  templateUrl: './organisation-detail.component.html',
  styleUrl: './organisation-detail.component.scss'
})
export class OrganisationDetailComponent implements OnInit {

  private readonly route  = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api    = inject(CrmOrganisationApiService);
  private readonly tagApi = inject(CrmTagApiService);

  readonly organisation      = signal<OrganisationDetail | null>(null);
  readonly loading           = signal(false);
  readonly error             = signal<string | null>(null);
  readonly activeAction      = signal<ActionPanel>(null);
  readonly showCreateContact = signal(false);
  readonly showCreateDeal    = signal(false);
  readonly tags              = signal<Tag[]>([]);
  readonly activeTab         = signal<OrgTab>('infos');

  readonly deals        = signal<DealSummary[]>([]);
  readonly dealsLoading = signal(false);

  private publicId = '';

  ngOnInit(): void {
    this.publicId = this.route.snapshot.paramMap.get('publicId') ?? '';
    this.load();
    this.loadDeals();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.getByPublicId(this.publicId).subscribe({
      next: org => { this.organisation.set(org); this.tags.set(org.tags ?? []); this.loading.set(false); },
      error: () => { this.error.set('Organisation introuvable.'); this.loading.set(false); }
    });
  }

  private loadDeals(): void {
    this.dealsLoading.set(true);
    this.api.getDeals(this.publicId).subscribe({
      next: d  => { this.deals.set(d); this.dealsLoading.set(false); },
      error: () => this.dealsLoading.set(false)
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
    this.loadDeals();
  }

  onTagAdded(tag: Tag): void {
    this.tagApi.addToOrganisation(tag.publicId, this.publicId).subscribe(() =>
      this.tags.update(list => [...list, tag])
    );
  }

  onTagRemoved(tag: Tag): void {
    this.tagApi.removeFromOrganisation(tag.publicId, this.publicId).subscribe(() =>
      this.tags.update(list => list.filter(t => t.publicId !== tag.publicId))
    );
  }

  goEdit(): void { this.router.navigate(['/crm/organisations', this.publicId, 'edit']); }
}
