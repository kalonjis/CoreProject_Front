import { Component, OnInit, inject, signal } from '@angular/core';
import { CrmCommercialActionApiService } from '../../services/crm-commercial-action-api.service';
import { CommercialActionResponse, CommercialActionStatus } from '../../models/commercial-action.model';
import { CommercialActionCardComponent } from '../../components/commercial-action-card/commercial-action-card.component';
import { CommercialActionFormComponent } from '../../components/commercial-action-form/commercial-action-form.component';
import { AuthStore } from '../../../../../../core/auth/state/auth.store';

@Component({
  selector: 'app-commercial-action-list',
  imports: [CommercialActionCardComponent, CommercialActionFormComponent],
  templateUrl: './commercial-action-list.component.html',
  styleUrl: './commercial-action-list.component.scss'
})
export class CommercialActionListComponent implements OnInit {

  private readonly api       = inject(CrmCommercialActionApiService);
  private readonly authStore = inject(AuthStore);

  readonly actions      = signal<CommercialActionResponse[]>([]);
  readonly loading      = signal(false);
  readonly showForm     = signal(false);
  readonly activeFilter = signal<CommercialActionStatus | undefined>(CommercialActionStatus.PENDING);

  readonly CommercialActionStatus = CommercialActionStatus;

  get currentUserPublicId(): string { return this.authStore.user()?.publicId ?? ''; }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.api.getMyActions(this.activeFilter()).subscribe({
      next: items => { this.actions.set(items); this.loading.set(false); },
      error: ()    => this.loading.set(false)
    });
  }

  setFilter(status: CommercialActionStatus | undefined): void {
    this.activeFilter.set(status);
    this.load();
  }

  onCreated(): void {
    this.showForm.set(false);
    this.load();
  }

  onComplete(publicId: string): void {
    this.api.complete(publicId).subscribe({ next: () => this.load() });
  }

  onCancel(publicId: string): void {
    this.api.cancel(publicId).subscribe({ next: () => this.load() });
  }
}
