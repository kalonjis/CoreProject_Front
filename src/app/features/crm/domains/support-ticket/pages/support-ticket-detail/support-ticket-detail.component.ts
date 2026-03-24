import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { CrmSupportTicketApiService } from '../../services/crm-support-ticket-api.service';
import { CrmUserApiService } from '../../../../shared/services/crm-user-api.service';
import {
  SupportTicketDetail,
  SupportTicketStatus,
  SUPPORT_TICKET_STATUS_LABELS,
  SUPPORT_TICKET_TRANSITIONS
} from '../../models/support-ticket.model';
import { SupportTicketStatusBadgeComponent } from '../../components/support-ticket-status-badge/support-ticket-status-badge.component';
import { FeedbackService } from '../../../../../../shared/feedback/tools/feedback.service';
import { AuthFacade } from '../../../../../../core/auth/services/auth.facade';
import { CommercialSummary, commercialDisplayName } from '../../../../shared/models/commercial.model';

type ActivePanel = 'status' | 'assign' | 'edit' | null;

@Component({
  selector: 'app-support-ticket-detail',
  imports: [RouterLink, FormsModule, DatePipe, SupportTicketStatusBadgeComponent],
  templateUrl: './support-ticket-detail.component.html',
  styleUrl: './support-ticket-detail.component.scss'
})
export class SupportTicketDetailComponent implements OnInit {

  private readonly route      = inject(ActivatedRoute);
  private readonly router     = inject(Router);
  private readonly api        = inject(CrmSupportTicketApiService);
  private readonly userApi    = inject(CrmUserApiService);
  private readonly feedback   = inject(FeedbackService);
  private readonly authFacade = inject(AuthFacade);

  readonly ticket       = signal<SupportTicketDetail | null>(null);
  readonly loading      = signal(false);
  readonly error        = signal<string | null>(null);
  readonly saving       = signal(false);
  readonly activePanel  = signal<ActivePanel>(null);

  private publicId = '';

  // ─── Status panel ─────────────────────────────────────────────────────────
  newStatus: SupportTicketStatus | '' = '';

  // ─── Assign panel ─────────────────────────────────────────────────────────
  commercials      = signal<CommercialSummary[]>([]);
  assigneePublicId = '';

  readonly displayName = commercialDisplayName;

  // ─── Edit panel ───────────────────────────────────────────────────────────
  editSubject     = '';
  editDescription = '';

  get allowedTransitions(): SupportTicketStatus[] {
    const t = this.ticket();
    return t ? SUPPORT_TICKET_TRANSITIONS[t.status] : [];
  }

  get isClosed(): boolean {
    return this.ticket()?.status === SupportTicketStatus.CLOSED;
  }

  readonly statusLabels = SUPPORT_TICKET_STATUS_LABELS;

  ngOnInit(): void {
    this.publicId = this.route.snapshot.paramMap.get('publicId') ?? '';
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getByPublicId(this.publicId).subscribe({
      next: t => { this.ticket.set(t); this.loading.set(false); },
      error: () => { this.error.set('Ticket introuvable.'); this.loading.set(false); }
    });
  }

  togglePanel(panel: ActivePanel): void {
    if (this.activePanel() === panel) {
      this.activePanel.set(null);
      return;
    }
    const t = this.ticket();
    if (panel === 'edit' && t) {
      this.editSubject     = t.subject;
      this.editDescription = t.description ?? '';
    }
    if (panel === 'assign') {
      this.assigneePublicId = t?.assignedToPublicId ?? '';
      if (this.authFacade.isAdmin()) {
        this.userApi.getCommercials().subscribe({
          next: list => this.commercials.set(list),
          error: ()  => this.feedback.showError('Impossible de charger la liste des commerciaux.')
        });
      } else {
        const me = this.authFacade.user();
        if (me) {
          this.commercials.set([{ publicId: me.publicId, firstName: me.firstname, lastName: me.lastname, username: me.username }]);
          this.assigneePublicId = me.publicId;
        }
      }
    }
    if (panel === 'status') {
      this.newStatus = '';
    }
    this.activePanel.set(panel);
  }

  submitStatus(): void {
    if (!this.newStatus) return;
    this.saving.set(true);
    this.api.changeStatus(this.publicId, { status: this.newStatus as SupportTicketStatus }).subscribe({
      next: () => { this.saving.set(false); this.activePanel.set(null); this.load(); },
      error: () => { this.saving.set(false); this.feedback.showError('Transition invalide.'); }
    });
  }

  submitAssign(): void {
    if (!this.assigneePublicId) return;
    this.saving.set(true);
    this.api.assign(this.publicId, {
      assignedToPublicId: this.assigneePublicId
    }).subscribe({
      next: () => { this.saving.set(false); this.activePanel.set(null); this.load(); },
      error: () => { this.saving.set(false); this.feedback.showError('Erreur lors de l\'assignation.'); }
    });
  }

  submitEdit(): void {
    if (!this.editSubject.trim()) return;
    this.saving.set(true);
    this.api.update(this.publicId, {
      subject:     this.editSubject.trim(),
      description: this.editDescription.trim() || undefined
    }).subscribe({
      next: () => { this.saving.set(false); this.activePanel.set(null); this.load(); },
      error: () => { this.saving.set(false); this.feedback.showError('Erreur lors de la mise à jour.'); }
    });
  }
}
