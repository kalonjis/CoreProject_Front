import { Component, Input, Output, EventEmitter, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DealFacade } from '../../facades/deal.facade';
import { CrmContactApiService } from '../../../contact/services/crm-contact-api.service';
import { FeedbackService } from '../../../../../../shared/feedback/tools/feedback.service';
import { ContactSummary } from '../../../contact/models/contact.model';
import {
  DealContactRoleResponse,
  ContactRole,
  CONTACT_ROLE_LABELS
} from '../../models/deal.model';

@Component({
  selector: 'app-deal-action-contacts',
  imports: [FormsModule],
  templateUrl: './deal-action-contacts.component.html',
  styleUrl: './deal-action-contacts.component.scss'
})
/** Panel for managing the contact-role associations on a deal: add, remove, update role, and set primary contact. */
export class DealActionContactsComponent implements OnInit {
  @Input({ required: true }) dealPublicId!: string;
  @Input({ required: true }) contacts!: DealContactRoleResponse[];
  @Output() changed   = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly facade     = inject(DealFacade);
  private readonly contactApi = inject(CrmContactApiService);
  private readonly feedback   = inject(FeedbackService);

  readonly contactResults = signal<ContactSummary[]>([]);
  readonly searching      = signal(false);

  keyword       = '';
  selectedContactPublicId = '';
  selectedRole: ContactRole = ContactRole.OTHER;

  readonly roleOptions = Object.values(ContactRole);
  readonly roleLabels  = CONTACT_ROLE_LABELS;

  ngOnInit(): void {}

  search(): void {
    if (!this.keyword.trim()) return;
    this.searching.set(true);
    this.contactApi.findAll({ keyword: this.keyword.trim() }, 0, 10).subscribe({
      next: page => { this.contactResults.set(page.content); this.searching.set(false); },
      error: ()  => { this.searching.set(false); this.feedback.showError('Recherche impossible.'); }
    });
  }

  selectContact(c: ContactSummary): void {
    this.selectedContactPublicId = c.publicId;
    this.keyword = `${c.firstName} ${c.lastName}`;
    this.contactResults.set([]);
  }

  addContact(): void {
    if (!this.selectedContactPublicId) return;
    this.facade.addContact(this.dealPublicId, {
      contactPublicId: this.selectedContactPublicId,
      role: this.selectedRole
    });
    this.selectedContactPublicId = '';
    this.keyword = '';
    this.selectedRole = ContactRole.OTHER;
    this.changed.emit();
  }

  removeContact(contactPublicId: string): void {
    this.facade.removeContact(this.dealPublicId, contactPublicId);
    this.changed.emit();
  }

  updateRole(contactPublicId: string, role: ContactRole): void {
    this.facade.updateContactRole(this.dealPublicId, contactPublicId, role);
  }

  setPrimary(contactPublicId: string): void {
    this.facade.setPrimaryContact(this.dealPublicId, contactPublicId);
    this.changed.emit();
  }
}
