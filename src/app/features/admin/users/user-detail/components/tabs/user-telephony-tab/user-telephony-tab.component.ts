import {
  Component,
  Input,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { AdminTelephonyApiService } from '../../../../services/admin-telephony-api.service';
import {
  AdminUserTelephonyStatus,
  AdminSaveSipConfigRequest,
} from '../../../../models/admin-telephony.model';

@Component({
  selector: 'app-user-telephony-tab',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-telephony-tab.component.html',
  styleUrl:    './user-telephony-tab.component.scss',
})
export class UserTelephonyTabComponent implements OnInit {

  @Input({ required: true }) userPublicId!: string;

  // ---------------------------------------------------------------------------
  // Dependencies
  // ---------------------------------------------------------------------------

  private readonly api = inject(AdminTelephonyApiService);
  private readonly fb  = inject(FormBuilder);

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  readonly status    = signal<AdminUserTelephonyStatus | null>(null);
  readonly isLoading = signal(true);
  readonly isSaving  = signal(false);
  readonly error     = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);

  /** Controls SIP form visibility. */
  readonly showSipForm = signal(false);
  /** True when editing an existing config, false when creating. */
  readonly isEditMode  = signal(false);

  sipForm!: FormGroup;

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  ngOnInit(): void {
    this.sipForm = this.fb.group({
      sipUsername: ['', [Validators.required, Validators.maxLength(100)]],
      sipPassword: ['', [Validators.required]],
      displayName: ['', [Validators.maxLength(100)]],
    });
    this.loadStatus();
  }

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------

  loadStatus(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.api.getStatus(this.userPublicId).subscribe({
      next: s => {
        this.status.set(s);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger la configuration téléphonique.');
        this.isLoading.set(false);
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Form controls
  // ---------------------------------------------------------------------------

  openCreateForm(): void {
    this.sipForm.reset();
    this.isEditMode.set(false);
    this.showSipForm.set(true);
    this.saveError.set(null);
  }

  openEditForm(): void {
    const cfg = this.status()?.sipConfig;
    if (!cfg) return;
    this.sipForm.reset({
      sipUsername: cfg.sipUsername,
      sipPassword: '',
      displayName: cfg.displayName ?? '',
    });
    this.isEditMode.set(true);
    this.showSipForm.set(true);
    this.saveError.set(null);
  }

  cancelForm(): void {
    this.showSipForm.set(false);
    this.saveError.set(null);
  }

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  saveSipConfig(): void {
    if (this.sipForm.invalid || this.isSaving()) return;

    const request: AdminSaveSipConfigRequest = {
      sipUsername: this.sipForm.value.sipUsername.trim(),
      sipPassword: this.sipForm.value.sipPassword,
      displayName: this.sipForm.value.displayName?.trim() || null,
    };

    this.isSaving.set(true);
    this.saveError.set(null);

    const call$ = this.isEditMode()
      ? this.api.updateSipConfig(this.userPublicId, request)
      : this.api.createSipConfig(this.userPublicId, request);

    call$.subscribe({
      next: updated => {
        this.status.set(updated);
        this.showSipForm.set(false);
        this.isSaving.set(false);
      },
      error: err => {
        const msg = err?.error?.message ?? 'Une erreur est survenue lors de la sauvegarde.';
        this.saveError.set(msg);
        this.isSaving.set(false);
      },
    });
  }

  deleteSipConfig(): void {
    if (this.isSaving()) return;
    this.isSaving.set(true);
    this.saveError.set(null);

    this.api.deleteSipConfig(this.userPublicId).subscribe({
      next: updated => {
        this.status.set(updated);
        this.isSaving.set(false);
      },
      error: err => {
        const msg = err?.error?.message ?? 'Impossible de supprimer la configuration SIP.';
        this.saveError.set(msg);
        this.isSaving.set(false);
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Display helpers
  // ---------------------------------------------------------------------------

  providerLabel(provider: string): string {
    const map: Record<string, string> = {
      SIP:     'SIP / Asterisk',
      TWILIO:  'Twilio Voice',
      NONE:    'Aucun',
      TEL_URI: 'Lien téléphonique (tel:)',
    };
    return map[provider] ?? provider;
  }
}
