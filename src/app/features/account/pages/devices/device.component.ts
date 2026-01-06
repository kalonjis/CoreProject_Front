import {Component, OnInit, inject, signal, DestroyRef, computed} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Device } from '../../../../data/models/device/device';
import { FeedbackBase } from '../../../../shared/feedback/tools/feedback.base';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConfirmDialogService } from '../../../../shared/confirm-dialog/tools/confirm-dialog.service';
import {FeedbackComponent} from '../../../../shared/feedback/feedback.component';
import {DeviceDetailComponent} from '../../../devices/device-detail/device-detail.component';
import {DeviceUtilsService} from '../../../../shared/services/device-utils.service';
import {DeviceFacade} from '../../../../core/device';

@Component({
  selector: 'device-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, FeedbackComponent, DeviceDetailComponent],
  templateUrl: './device.component.html',
  styleUrls: ['./device.component.scss']
})
export class DeviceComponent extends FeedbackBase implements OnInit {
  private deviceFacade = inject(DeviceFacade);
  protected deviceUtils = inject(DeviceUtilsService);
  private destroyRef = inject(DestroyRef);
  private confirmDialogService: ConfirmDialogService = inject(ConfirmDialogService);

  // Read from store (auto-sync)
  readonly devices = this.deviceFacade.devices;
  readonly isLoading = this.deviceFacade.isLoading;
  readonly currentDeviceId = computed(() => this.deviceFacade.currentDevice()?.publicId ?? null);
  readonly currentDeviceIsConfirmed = computed(() => this.deviceFacade.isConfirmed());

  // Derived (sorted/filtered)
  readonly sortedDevices = computed(() =>
    this.deviceUtils.sortDevices(this.devices(), this.sortField, this.sortDirection)
  );

  isProcessing = signal(false);
  selectedDevice = signal<Device | null>(null);
  filterText = '';
  sortField: keyof Device = 'lastSeen';
  sortDirection: 'asc' | 'desc' = 'desc';
  confirmDisconnectAll:  boolean = false;

  ngOnInit(): void {
    this.deviceFacade.loadDevices();
  }

  reloadDevices(): void {
    this.deviceFacade.loadDevices();
  }

  disconnectDevice(publicId: string): void {
    if (this.currentDeviceId() === publicId) {
      this.displayWarning(
        'You cannot disconnect the device you are currently using.',
        'Understood'
      );
      return;
    }

    this.confirmDialogService.confirm({
      message: `Êtes-vous sûr de vouloir déconnecter cet appareil?`,
      title: 'Confirmation de déconnexion',
      confirmButtonText: 'Confirmer',
      cancelButtonText: 'Annuler',
      type: 'warning'
    })
      .then(() => {
        this.isProcessing.set(true);
        this.deviceFacade.disconnectDevice(publicId).pipe(
          takeUntilDestroyed(this.destroyRef)
        ).subscribe({
          next: () => {
            this.displaySuccess('Device successfully disconnected', '');
            this.isProcessing.set(false);
          },
          error: (err) => {
            console.error('Error during disconnection', err);
            this.displayError('Unable to disconnect this device', 'Retry');
            this.isProcessing.set(false);
          }
        });
      })
      .catch(() => {})
  }

  disconnectAllDevices(): void {
    this.confirmDialogService.confirm({
      message: 'Êtes-vous sûr de vouloir déconnecter tous les autres appareils ? Cette action est irréversible.',
      title: 'Confirmation de déconnexion',
      confirmButtonText: 'Confirmer',
      cancelButtonText: 'Annuler',
      type: 'warning'
    })
      .then(() => {
        // Action si l'utilisateur confirme
        this.isProcessing.set(true);

        this.deviceFacade.disconnectAllOthers().pipe(
          takeUntilDestroyed(this.destroyRef)
        ).subscribe({
          next: () => {
            this.displaySuccess(
              'Tous les autres appareils ont été déconnectés avec succès. Seul votre appareil actuel reste connecté.',
              ''
            );
            this.isProcessing.set(false);
          },
          error: (err) => {
            console.error('Erreur lors de la déconnexion de tous les appareils', err);
            this.displayError('Impossible de déconnecter tous les appareils', 'Réessayer');
            this.isProcessing.set(false);
          }
        });
      })
      .catch(() => {
        // Action si l'utilisateur annule - ne rien faire
      });
  }

  requestConfirmationLink(): void {
    this.isProcessing.set(true);
    this.deviceFacade.requestConfirmationLink().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.displaySuccess('A new confirmation link has been sent to your email address', '');
        this.isProcessing.set(false);
      },
      error: (err) => {
        this.handleError(err);
        this.isProcessing.set(false);
      }
    });
  }

  selectDevice(device: Device): void {
    this.selectedDevice.set(device);
  }

  closeDeviceDetail(): void {
    this.selectedDevice.set(null);
  }

  isCurrentDevice(publicId: string): boolean {
    return this.currentDeviceId() === publicId;
  }

  // Error handling
  private handleError(error: HttpErrorResponse): void {
    let errorMessage = 'An error occurred during the operation.';

    if (error.error?.error) {
      errorMessage = error.error.error;
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    this.displayError(errorMessage);
  }
}
