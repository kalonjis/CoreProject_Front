import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FeedbackService } from '../../../../../../shared/feedback/tools/feedback.service';
import { CrmLeadApiService } from '../../services/crm-lead-api.service';
import { LeadDetail, LeadStatus } from '../../models/lead.model';
import { LeadInfoCardComponent } from '../../components/lead-info-card/lead-info-card.component';
import { LeadActionAssignComponent } from '../../components/lead-action-assign/lead-action-assign.component';
import { LeadActionRejectComponent } from '../../components/lead-action-reject/lead-action-reject.component';
import { LeadActionConvertComponent } from '../../components/lead-action-convert/lead-action-convert.component';

type ActiveAction = 'assign' | 'convert' | 'reject' | null;

@Component({
  selector: 'app-lead-detail',
  imports: [LeadInfoCardComponent, LeadActionAssignComponent, LeadActionRejectComponent, LeadActionConvertComponent],
  templateUrl: './lead-detail.component.html',
  styleUrl: './lead-detail.component.scss'
})
export class LeadDetailComponent implements OnInit {

  private readonly api      = inject(CrmLeadApiService);
  private readonly route    = inject(ActivatedRoute);
  private readonly router   = inject(Router);
  private readonly feedback = inject(FeedbackService);

  readonly lead          = signal<LeadDetail | null>(null);
  readonly loading       = signal(false);
  readonly actionLoading = signal(false);
  readonly error         = signal<string | null>(null);
  readonly activeAction  = signal<ActiveAction>(null);

  readonly isTerminal = computed(() => {
    const s = this.lead()?.status;
    return s === LeadStatus.CONVERTED || s === LeadStatus.REJECTED;
  });

  readonly canConvert = computed(() => this.lead()?.status === LeadStatus.IN_REVIEW);

  readonly LeadStatus = LeadStatus;

  ngOnInit(): void {
    const publicId = this.route.snapshot.paramMap.get('publicId')!;
    this.loading.set(true);
    this.api.getByPublicId(publicId).subscribe({
      next: lead => { this.lead.set(lead); this.loading.set(false); },
      error: ()   => { this.error.set('Lead introuvable.'); this.loading.set(false); }
    });
  }

  back(): void {
    this.router.navigate(['/crm/leads']);
  }

  toggleAction(action: ActiveAction): void {
    this.activeAction.set(this.activeAction() === action ? null : action);
  }

  markInReview(): void {
    const lead = this.lead();
    if (!lead) return;
    this.actionLoading.set(true);
    this.api.markInReview(lead.publicId).subscribe({
      next: updated => {
        this.lead.set(updated);
        this.actionLoading.set(false);
        this.feedback.showSuccess('Lead passé en revue.');
      },
      error: () => {
        this.actionLoading.set(false);
        this.feedback.showError('Impossible de mettre le lead en revue.');
      }
    });
  }

  onActionDone(): void {
    const publicId = this.lead()!.publicId;
    this.activeAction.set(null);
    this.api.getByPublicId(publicId).subscribe(updated => this.lead.set(updated));
  }
}
