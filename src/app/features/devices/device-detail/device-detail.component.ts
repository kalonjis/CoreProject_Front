import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Device } from '../../../data/models/device/device';
import { DeviceTrustLevel } from '../../../data/models/device/device-trust-level';
import { DeviceService } from '../../../data/services/device-service';
import { FeedbackComponent } from '../../../shared/feedback/feedback.component';
import { FeedbackBase } from '../../../shared/feedback/tools/feedback.base';
import { HttpErrorResponse } from '@angular/common/http';
import { DeviceUtilsService } from '../../../shared/services/device-utils.service';

@Component({
  selector: 'app-device-detail',
  standalone: true,
  imports: [CommonModule, FeedbackComponent],
  templateUrl: './device-detail.component.html',
  styleUrl: './device-detail.component.scss'
})
export class DeviceDetailComponent extends FeedbackBase {
  private deviceService = inject(DeviceService);
  private deviceUtils = inject(DeviceUtilsService);

  // Inputs and outputs
  @Input() device!: Device;
  @Input() isCurrentDevice = false;
  @Output() deviceUpdated = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  // UI state
  isProcessing = false;

  // Trust level options
  get trustLevelOptions() {
    return this.deviceUtils.trustLevelOptions;
  }

  // Method to request device disconnection
  disconnectDevice(): void {
    if (this.isCurrentDevice || this.device.loggedOut) {
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir déconnecter cet appareil ? L\'utilisateur connecté sur cet appareil devra se reconnecter.')) {
      return;
    }

    this.isProcessing = true;
    this.deviceService.disconnectDevice(this.device.id).subscribe({
      next: () => {
        this.displaySuccess('Appareil déconnecté avec succès', '');
        this.deviceUpdated.emit();
        this.isProcessing = false;
      },
      error: (error: HttpErrorResponse) => {
        this.handleError(error);
        this.isProcessing = false;
      }
    });
  }

  // Method to update trust level
  updateTrustLevel(newLevel: DeviceTrustLevel): void {
    if (this.device.blacklisted || this.device.loggedOut) {
      return;
    }

    if (!confirm(`Êtes-vous sûr de vouloir modifier le niveau de confiance de cet appareil vers "${this.getTrustLevelLabel(newLevel)}" ?`)) {
      return;
    }

    this.isProcessing = true;
    this.deviceService.updateTrustLevel(this.device.id, newLevel).subscribe({
      next: () => {
        this.displaySuccess(`Niveau de confiance mis à jour vers ${this.getTrustLevelLabel(newLevel)}`, '');
        this.device.level = newLevel; // Update local state
        this.deviceUpdated.emit();
        this.isProcessing = false;
      },
      error: (error: HttpErrorResponse) => {
        this.handleError(error);
        this.isProcessing = false;
      }
    });
  }

  // Helper methods
  closeDetail(): void {
    this.close.emit();
  }

  // Delegation to the utility service
  getTrustLevelLabel(level: DeviceTrustLevel): string {
    return this.deviceUtils.getTrustLevelLabel(level);
  }

  getTrustLevelClass(level: DeviceTrustLevel): string {
    return this.deviceUtils.getTrustLevelClass(level);
  }

  formatDate(dateString: string | null): string {
    return this.deviceUtils.formatDate(dateString);
  }

  getDeviceIcon(deviceType: string): string {
    return this.deviceUtils.getDeviceIcon(deviceType);
  }

  formatIpAddress(ip: string | null): string {
    return this.deviceUtils.formatIpAddress(ip);
  }

  // Error handling
  private handleError(error: HttpErrorResponse): void {
    let errorMessage = 'Une erreur est survenue lors de l\'opération.';

    if (error.error?.error) {
      errorMessage = error.error.error;
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    this.displayError(errorMessage);
  }
}
