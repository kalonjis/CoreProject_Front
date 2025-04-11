// src/app/shared/components/device-alert-banner/device-alert-banner.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {DeviceVerificationService} from '../../core/device/device-verification.service';

@Component({
  selector: 'app-device-alert-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './device-alert-banner.component.html',
  styleUrls: ['./device-alert-banner.component.scss']
})
export class DeviceAlertBannerComponent {
  private deviceVerificationService = inject(DeviceVerificationService);

  // Expose les signaux du service pour utilisation dans le template
  isDeviceVerified = this.deviceVerificationService.isDeviceVerified;
  isChecking = this.deviceVerificationService.isChecking;

  /**
   * Renvoie l'email de vérification
   */
  resendVerificationEmail(): void {
    this.deviceVerificationService.resendVerificationEmail();
  }
}
