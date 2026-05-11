import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { CrmSupportTicketApiService } from '../../services/crm-support-ticket-api.service';
import { CrmUserApiService } from '../../../../shared/services/crm-user-api.service';
import { InteractionFacade } from '../../../interaction/facades/interaction.facade';
import {
  SupportTicketDetail,
  SupportTicketStatus,
  SupportTicketSource,
  SUPPORT_TICKET_STATUS_LABELS,
  SUPPORT_TICKET_TRANSITIONS
} from '../../models/support-ticket.model';
import { SupportTicketStatusBadgeComponent } from '../../components/support-ticket-status-badge/support-ticket-status-badge.component';
import { FeedbackService }        from '../../../../../../shared/feedback/tools/feedback.service';
import { ConfirmDialogService }   from '../../../../../../shared/confirm-dialog/tools/confirm-dialog.service';
import { AuthFacade }             from '../../../../../../core/auth/services/auth.facade';
import { CommercialSummary }      from '../../../../shared/models/commercial.model';
import { CrmAssignPopoverComponent }     from '../../../../shared/components/assign-popover/crm-assign-popover.component';
import { InteractionTimelineComponent }  from '../../../interaction/components/interaction-timeline/interaction-timeline.component';
import { LogNoteModalComponent }         from '../../../interaction/components/modals/log-note-modal/log-note-modal.component';
import { LogCallModalComponent }         from '../../../interaction/components/modals/log-call-modal/log-call-modal.component';
import { LogEmailModalComponent }        from '../../../interaction/components/modals/log-email-modal/log-email-modal.component';

type ActivePanel = 'status' | 'edit' | null;
type QuickIntent = 'note' | 'call' | 'email';

@Component({
  selector: 'app-support-ticket-detail',
  providers: [InteractionFacade],
  imports: [
    RouterLink, FormsModule, DatePipe,
    SupportTicketStatusBadgeComponent,
    CrmAssignPopoverComponent,
    InteractionTimelineComponent,
    LogNoteModalComponent,
    LogCallModalComponent,
    LogEmailModalComponent,
  ],
  templateUrl: './support-ticket-detail.component.html',
  styleUrl:    './support-ticket-detail.component.scss'
})
export class SupportTicketDetailComponent implements OnInit {

  readonly interactionFacade = inject(InteractionFacade);

  private readonly route      = inject(ActivatedRoute);
  private readonly router     = inject(Router);
  private readonly api        = inject(CrmSupportTicketApiService);
  private readonly userApi    = inject(CrmUserApiService);
  private readonly feedback   = inject(FeedbackService);
  private readonly confirm    = inject(ConfirmDialogService);
  private readonly authFacade = inject(AuthFacade);

  readonly ticket       = signal<SupportTicketDetail | null>(null);
  readonly loading      = signal(false);
  readonly error        = signal<string | null>(null);
  readonly saving       = signal(false);
  readonly activePanel  = signal<ActivePanel>(null);
  readonly commercials  = signal<CommercialSummary[]>([]);

  readonly showNoteModal  = signal(false);
  readonly showCallModal  = signal(false);
  readonly showEmailModal = signal(false);

  private publicId = '';

  newStatus: SupportTicketStatus | '' = '';
  editSubject     = '';
  editDescription = '';

  constructor() {
    effect(() => {
      const t = this.ticket();
      if (t?.contactPublicId) {
        this.interactionFacade.loadFor('contact', t.contactPublicId);
      }
    });
  }

  /** Display name of the ticket requester (CRM contact > reporter name > email > fallback). */
  get requesterName(): string {
    const t = this.ticket();
    return t?.contactFullName ?? t?.reporterName ?? t?.reporterEmail ?? 'Inconnu';
  }

  /** Two-letter initials derived from the requester's name. */
  get requesterInitials(): string {
    const name = this.ticket()?.contactFullName ?? this.ticket()?.reporterName;
    if (!name) return '?';
    return name.split(' ').filter(w => w).map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  get allowedTransitions(): SupportTicketStatus[] {
    const t = this.ticket();
    return t ? SUPPORT_TICKET_TRANSITIONS[t.status] : [];
  }

  get isClosed(): boolean {
    return this.ticket()?.status === SupportTicketStatus.CLOSED;
  }

  get isAdmin(): boolean {
    return this.authFacade.isAdmin();
  }

  readonly statusLabels        = SUPPORT_TICKET_STATUS_LABELS;
  readonly SupportTicketSource = SupportTicketSource;

  ngOnInit(): void {
    this.publicId = this.route.snapshot.paramMap.get('publicId') ?? '';
    this.load();
    this.loadCommercials();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getByPublicId(this.publicId).subscribe({
      next: t => { this.ticket.set(t); this.loading.set(false); },
      error: () => { this.error.set('Ticket introuvable.'); this.loading.set(false); }
    });
  }

  private loadCommercials(): void {
    if (this.authFacade.isAdmin()) {
      this.userApi.getCommercials().subscribe({
        next: list => this.commercials.set(list),
        error: ()   => this.feedback.showError('Impossible de charger les commerciaux.')
      });
    } else {
      const me = this.authFacade.user();
      if (me) {
        this.commercials.set([{
          publicId: me.publicId,
          firstName: me.firstname,
          lastName: me.lastname,
          username: me.username
        }]);
      }
    }
  }

  onAssign(commercial: CommercialSummary): void {
    this.api.assign(this.publicId, { assignedToPublicId: commercial.publicId }).subscribe({
      next: t => this.ticket.set(t),
      error: () => this.feedback.showError('Erreur lors de l\'assignation.')
    });
  }

  togglePanel(panel: ActivePanel): void {
    if (this.activePanel() === panel) { this.activePanel.set(null); return; }
    const t = this.ticket();
    if (panel === 'edit' && t) {
      this.editSubject     = t.subject;
      this.editDescription = t.description ?? '';
    }
    if (panel === 'status') this.newStatus = '';
    this.activePanel.set(panel);
  }

  submitStatus(): void {
    if (!this.newStatus) return;
    this.saving.set(true);
    this.api.changeStatus(this.publicId, { status: this.newStatus as SupportTicketStatus }).subscribe({
      next:  () => { this.saving.set(false); this.activePanel.set(null); this.load(); },
      error: () => { this.saving.set(false); this.feedback.showError('Transition invalide.'); }
    });
  }

  async deleteTicket(): Promise<void> {
    await this.confirm.confirm({
      title: 'Supprimer ce ticket',
      message: 'Cette action est irréversible. Le ticket sera définitivement supprimé.',
      confirmButtonText: 'Supprimer',
      cancelButtonText:  'Annuler',
      type: 'danger'
    }).then(() => {
      this.api.delete(this.publicId).subscribe({
        next:  () => { this.feedback.showSuccess('Ticket supprimé.'); this.router.navigate(['/crm/support-tickets']); },
        error: () => this.feedback.showError('Impossible de supprimer ce ticket.')
      });
    }).catch(() => {});
  }

  submitEdit(): void {
    if (!this.editSubject.trim()) return;
    this.saving.set(true);
    this.api.update(this.publicId, {
      subject:     this.editSubject.trim(),
      description: this.editDescription.trim() || undefined
    }).subscribe({
      next:  () => { this.saving.set(false); this.activePanel.set(null); this.load(); },
      error: () => { this.saving.set(false); this.feedback.showError('Erreur lors de la mise à jour.'); }
    });
  }

  openQuickAction(intent: QuickIntent): void {
    this.showNoteModal.set(false);
    this.showCallModal.set(false);
    this.showEmailModal.set(false);
    if (intent === 'note')  this.showNoteModal.set(true);
    if (intent === 'call')  this.showCallModal.set(true);
    if (intent === 'email') this.showEmailModal.set(true);
  }

  onLogged(): void {
    this.showNoteModal.set(false);
    this.showCallModal.set(false);
    this.showEmailModal.set(false);
    this.interactionFacade.refresh();
  }

  onInteractionDelete(publicId: string): void {
    this.interactionFacade.deleteInteraction(publicId);
  }
}