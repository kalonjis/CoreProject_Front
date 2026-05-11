import { Component, Input, Output, EventEmitter, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CrmDealApiService } from '../../services/crm-deal-api.service';
import { CrmUserApiService } from '../../../../shared/services/crm-user-api.service';
import { FeedbackService } from '../../../../../../shared/feedback/tools/feedback.service';
import { AuthFacade } from '../../../../../../core/auth/services/auth.facade';
import { CommercialSummary, commercialDisplayName } from '../../../../shared/models/commercial.model';

@Component({
  selector: 'app-deal-action-reassign',
  imports: [FormsModule],
  templateUrl: './deal-action-reassign.component.html',
  styleUrl: './deal-action-reassign.component.scss'
})
/** Form for reassigning a deal to another commercial. */
export class DealActionReassignComponent implements OnInit {
  /** Public ID of the deal to reassign. */
  @Input({ required: true }) publicId!: string;
  /** Emitted after the deal has been successfully reassigned. */
  @Output() reassigned = new EventEmitter<void>();
  /** Emitted when the user dismisses the form without saving. */
  @Output() cancelled  = new EventEmitter<void>();

  private readonly api        = inject(CrmDealApiService);
  private readonly userApi    = inject(CrmUserApiService);
  private readonly feedback   = inject(FeedbackService);
  private readonly authFacade = inject(AuthFacade);

  /** Available commercials for the picker. */
  commercials        = signal<CommercialSummary[]>([]);
  selectedPublicId   = '';
  /** True while the reassignment request is in flight. */
  readonly loading   = signal(false);

  readonly displayName = commercialDisplayName;

  ngOnInit(): void {
    if (this.authFacade.isAdmin()) {
      this.userApi.getCommercials().subscribe({
        next: list => this.commercials.set(list),
        error: ()  => this.feedback.showError('Impossible de charger la liste des commerciaux.')
      });
    } else {
      const me = this.authFacade.user();
      if (me) {
        this.commercials.set([{ publicId: me.publicId, firstName: me.firstname, lastName: me.lastname, username: me.username }]);
        this.selectedPublicId = me.publicId;
      }
    }
  }

  /** Submits the reassignment to the API and emits {@link reassigned} on success. */
  submit(): void {
    if (!this.selectedPublicId) return;
    this.loading.set(true);
    this.api.reassign(this.publicId, { assignedToPublicId: this.selectedPublicId }).subscribe({
      next: () => {
        this.feedback.showSuccess('Deal réassigné.');
        this.reassigned.emit();
        this.loading.set(false);
      },
      error: () => {
        this.feedback.showError('Impossible de réassigner le deal.');
        this.loading.set(false);
      }
    });
  }
}
