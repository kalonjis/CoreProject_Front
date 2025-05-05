// src/app/features/devices/device-detail/device-detail.component.ts
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Device } from '../../../data/models/device/device';
import { DeviceTrustLevel } from '../../../data/models/device/device-trust-level';
import { DeviceService } from '../../../data/services/device-service';
import { FeedbackComponent } from '../../../shared/feedback/feedback.component';
import { FeedbackBase } from '../../../shared/feedback/tools/feedback.base';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-device-detail',
  standalone: true,
  imports: [CommonModule, FeedbackComponent],
  templateUrl: './device-detail.component.html',
  styleUrl: './device-detail.component.scss'
})
export class DeviceDetailComponent extends FeedbackBase {
  private deviceService = inject(DeviceService);

  // Inputs and outputs
  @Input() device!: Device;
  @Input() isCurrentDevice = false;
  @Output() deviceUpdated = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  // UI state
  isProcessing = false;

  // Trust level options
  trustLevelOptions = [
    { value: DeviceTrustLevel.HIGHLY_TRUSTED, label: 'Très fiable' },
    { value: DeviceTrustLevel.TRUSTED, label: 'Fiable' },
    { value: DeviceTrustLevel.BASIC, label: 'Basique' },
    { value: DeviceTrustLevel.UNTRUSTED, label: 'Non fiable' }
  ];

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

  getTrustLevelLabel(level: DeviceTrustLevel): string {
    const option = this.trustLevelOptions.find(opt => opt.value === level);
    return option ? option.label : 'Inconnu';
  }

  getTrustLevelClass(level: DeviceTrustLevel): string {
    switch (level) {
      case DeviceTrustLevel.HIGHLY_TRUSTED: return 'level-highly-trusted';
      case DeviceTrustLevel.TRUSTED: return 'level-trusted';
      case DeviceTrustLevel.BASIC: return 'level-basic';
      case DeviceTrustLevel.UNTRUSTED: return 'level-untrusted';
      default: return '';
    }
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  getDeviceIcon(deviceType: string): string {
    switch (deviceType.toLowerCase()) {
      case 'mobile': return '📱';
      case 'tablet': return '📱';
      case 'desktop': return '💻';
      case 'laptop': return '💻';
      default: return '🖥️';
    }
  }

  formatIpAddress(ip: string | null): string {
    return ip || 'Non disponible';
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
