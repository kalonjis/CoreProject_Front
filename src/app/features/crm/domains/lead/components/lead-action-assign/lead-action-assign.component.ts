import { Component, Input, Output, EventEmitter, signal, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CrmLeadApiService } from '../../services/crm-lead-api.service';
import { CrmUserApiService } from '../../../../shared/services/crm-user-api.service';
import { FeedbackService } from '../../../../../../shared/feedback/tools/feedback.service';
import { AuthFacade } from '../../../../../../core/auth/services/auth.facade';
import { CommercialSummary, commercialDisplayName } from '../../../../shared/models/commercial.model';

@Component({
  selector: 'app-lead-action-assign',
  imports: [FormsModule],
  templateUrl: './lead-action-assign.component.html',
  styleUrl: './lead-action-assign.component.scss'
})
export class LeadActionAssignComponent implements OnInit {
  @Input({ required: true }) publicId!: string;
  @Output() assigned  = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly api         = inject(CrmLeadApiService);
  private readonly userApi     = inject(CrmUserApiService);
  private readonly feedback    = inject(FeedbackService);
  private readonly authFacade  = inject(AuthFacade);

  commercials        = signal<CommercialSummary[]>([]);
  selectedPublicId   = '';
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

  submit(): void {
    if (!this.selectedPublicId) return;
    this.loading.set(true);
    this.api.assign(this.publicId, { commercialPublicId: this.selectedPublicId }).subscribe({
      next: () => {
        this.loading.set(false);
        this.feedback.showSuccess('Lead assigné avec succès.');
        this.assigned.emit();
      },
      error: () => {
        this.loading.set(false);
        this.feedback.showError("Impossible d'assigner le lead.");
      }
    });
  }
}
