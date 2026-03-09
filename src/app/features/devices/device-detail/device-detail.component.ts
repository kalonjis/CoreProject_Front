import {Component, EventEmitter, Input, Output, inject, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Device } from '../../../data/models/device/device';
import { DeviceTrustLevel } from '../../../data/models/device/device-trust-level';
import { FeedbackComponent } from '../../../shared/feedback/feedback.component';
import { FeedbackBase } from '../../../shared/feedback/tools/feedback.base';
import { HttpErrorResponse } from '@angular/common/http';
import { DeviceUtilsService } from '../../../shared/services/device-utils.service';
import {ConfirmDialogService} from '../../../shared/confirm-dialog/tools/confirm-dialog.service';
import {DeviceFacade} from '../../../core/device';

@Component({
    selector: 'app-device-detail',
    imports: [CommonModule, FeedbackComponent],
    templateUrl: './device-detail.component.html',
    styleUrl: './device-detail.component.scss'
})
export class DeviceDetailComponent extends FeedbackBase {
  private deviceFacade = inject(DeviceFacade);
  protected deviceUtils = inject(DeviceUtilsService);
  private confirmDialogService: ConfirmDialogService = inject(ConfirmDialogService);

  // Inputs and outputs
  @Input() device!: Device;
  @Input() isCurrentDevice = false;
  @Output() deviceUpdated = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  // UI state
  isProcessing = signal<boolean>(false);

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

    this.isProcessing.set(true);
    this.deviceFacade.disconnectDevice(this.device.publicId).subscribe({
      next: () => {

        this.displaySuccess('Appareil déconnecté avec succès', '');
        this.deviceUpdated.emit();
        this.isProcessing.set(false);
      },
      error: (error: HttpErrorResponse) => {

        this.handleError(error);
        this.isProcessing.set(false);
      }
    });
  }

  // Method to update trust level
  updateTrustLevel(newLevel: DeviceTrustLevel): void {
    if (this.deviceUtils.isDeviceDisabled(this.device)) {
      return;
    }

    this.confirmDialogService.confirm({
      message: `Êtes-vous sûr de vouloir modifier le niveau de confiance de cet appareil vers "${this.deviceUtils.getTrustLevelLabel(newLevel)}" ?`,
      title: 'Confirmation de changement de niveau de confiance de l\'appareil',
      confirmButtonText: 'Confirmer',
      cancelButtonText: 'Annuler',
      type: 'warning'
    })
      .then(() =>{
        this.isProcessing.set(true);
        this.deviceFacade.updateTrustLevel(this.device.publicId, newLevel).subscribe({
          next: () => {

            this.displaySuccess(`Niveau de confiance mis à jour vers ${this.deviceUtils.getTrustLevelLabel(newLevel)}`, '');
            this.device.level = newLevel; // Update local state
            this.deviceUpdated.emit();
            this.isProcessing.set(false);
          },
          error: (error: HttpErrorResponse) => {

            this.handleError(error);
            this.isProcessing.set(false);
          }
        });
      })
      .catch(()=>{

      });
  }

  // Helper methods
  closeDetail(): void {
    this.close.emit();
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
