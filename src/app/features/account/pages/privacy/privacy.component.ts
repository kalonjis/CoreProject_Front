// src/app/features/account/pages/privacy/privacy.component.ts

import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DeactivateAccountModalComponent
} from '../../components/deactivate-account-modal/deactivate-account-modal.component';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [CommonModule, DeactivateAccountModalComponent],
  templateUrl: './privacy.component.html',
  styleUrl: './privacy.component.scss'
})
export class PrivacyComponent {

  showDeactivationModal = signal(false);
  deactivationEmailSent = signal(false);

  openDeactivationModal(): void {
    this.showDeactivationModal.set(true);
  }

  closeDeactivationModal(): void {
    this.showDeactivationModal.set(false);
  }

  onDeactivationRequested(): void {
    this.showDeactivationModal.set(false);
    this.deactivationEmailSent.set(true);
  }
}
