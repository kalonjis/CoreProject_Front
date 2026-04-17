import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { CrmTagApiService } from '../../services/crm-tag-api.service';
import { CrmContactApiService } from '../../../contact/services/crm-contact-api.service';
import { CrmDealApiService } from '../../../deal/services/crm-deal-api.service';
import { CrmOrganisationApiService } from '../../../organisation/services/crm-organisation-api.service';
import { Tag } from '../../models/tag.model';
import { ContactSummary } from '../../../contact/models/contact.model';
import { DealSummary } from '../../../deal/models/deal.model';
import { OrganisationSummary } from '../../../organisation/models/organisation.model';
import { TagChipComponent } from '../../components/tag-chip/tag-chip.component';
import { DealStatusBadgeComponent } from '../../../deal/components/deal-status-badge/deal-status-badge.component';
import { ContactStatusBadgeComponent } from '../../../contact/components/contact-status-badge/contact-status-badge.component';
import { OrganisationSizeBadgeComponent } from '../../../organisation/components/organisation-size-badge/organisation-size-badge.component';

@Component({
  selector: 'app-tag-detail',
  imports: [
    RouterLink,
    DatePipe,
    CurrencyPipe,
    TagChipComponent,
    DealStatusBadgeComponent,
    ContactStatusBadgeComponent,
    OrganisationSizeBadgeComponent
  ],
  templateUrl: './tag-detail.component.html',
  styleUrl: './tag-detail.component.scss'
})
/** Tag detail page listing all contacts, deals, and organisations that carry this tag. */
export class TagDetailComponent implements OnInit {

  private readonly route   = inject(ActivatedRoute);
  private readonly router  = inject(Router);
  private readonly tagApi  = inject(CrmTagApiService);
  private readonly contactApi = inject(CrmContactApiService);
  private readonly dealApi    = inject(CrmDealApiService);
  private readonly orgApi     = inject(CrmOrganisationApiService);

  readonly tag          = signal<Tag | null>(null);
  readonly contacts     = signal<ContactSummary[]>([]);
  readonly deals        = signal<DealSummary[]>([]);
  readonly organisations = signal<OrganisationSummary[]>([]);
  readonly loading      = signal(true);
  readonly error        = signal<string | null>(null);

  private publicId = '';

  ngOnInit(): void {
    this.publicId = this.route.snapshot.paramMap.get('publicId') ?? '';

    forkJoin({
      tags:  this.tagApi.findAll(),
      contacts: this.contactApi.findAll({ tagPublicId: this.publicId }, 0, 100),
      deals:    this.dealApi.findAll({ tagPublicId: this.publicId }, 0, 100),
      orgs:     this.orgApi.findAll({ tagPublicId: this.publicId }, 0)
    }).subscribe({
      next: ({ tags, contacts, deals, orgs }) => {
        const found = tags.find(t => t.publicId === this.publicId) ?? null;
        if (!found) { this.error.set('Tag introuvable.'); this.loading.set(false); return; }
        this.tag.set(found);
        this.contacts.set(contacts.content);
        this.deals.set(deals.content);
        this.organisations.set(orgs.content);
        this.loading.set(false);
      },
      error: () => { this.error.set('Impossible de charger les données.'); this.loading.set(false); }
    });
  }

  viewContact(publicId: string): void      { this.router.navigate(['/crm/contacts', publicId]); }
  viewDeal(publicId: string): void         { this.router.navigate(['/crm/deals', publicId]); }
  viewOrganisation(publicId: string): void { this.router.navigate(['/crm/organisations', publicId]); }
}
