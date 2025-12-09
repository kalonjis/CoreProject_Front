import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Device } from '../../../../data/models/device/device';
import { FeedbackBase } from '../../../../shared/feedback/tools/feedback.base';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConfirmDialogService } from '../../../../shared/confirm-dialog/tools/confirm-dialog.service';
import {DeviceService} from '../../../../data/services/device-service';
import {FeedbackComponent} from '../../../../shared/feedback/feedback.component';
import {DeviceDetailComponent} from '../../../devices/device-detail/device-detail.component';
import {DeviceUtilsService} from '../../../../shared/services/device-utils.service';

@Component({
  selector: 'device-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, FeedbackComponent, DeviceDetailComponent],
  templateUrl: './device-tab.component.html',
  styleUrls: ['./device-tab.component.scss']
})
export class DeviceTabComponent extends FeedbackBase implements OnInit {
  private deviceService = inject(DeviceService);
  protected deviceUtils = inject(DeviceUtilsService);
  private destroyRef = inject(DestroyRef);
  private confirmDialogService: ConfirmDialogService = inject(ConfirmDialogService);

  devices = signal<Device[]>([]);
  isLoading = signal(true);
  isProcessing = signal(false);
  currentDeviceId = signal<number | null>(null);
  currentDeviceIsConfirmed = signal<boolean>(false);
  selectedDevice = signal<Device | null>(null);
  filterText = '';
  sortField: keyof Device = 'lastSeen';
  sortDirection: 'asc' | 'desc' = 'desc';
  confirmDisconnectAll:  boolean = false;

  ngOnInit(): void {
    this.loadDevices();

    // Detect current device
    this.deviceService.getCurrentDevice().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(device => {
      this.currentDeviceId.set(device.id);
      this.currentDeviceIsConfirmed.set(device.confirmed)
    });
  }

  loadDevices(): void {
    this.isLoading.set(true);

    this.deviceService.getMyDevices().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (devices) => {
        // Trier par date (le plus récent en premier) en utilisant deviceUtils
        this.devices.set(this.deviceUtils.sortDevices(devices, 'lastSeen', 'desc'));
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading devices', err);
        this.displayError('Unable to load your devices list', 'Retry');
        this.buttonAction = () => this.loadDevices();
        this.isLoading.set(false);
      }
    });
  }

  disconnectDevice(deviceId: number): void {
    if (this.currentDeviceId() === deviceId) {
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
        this.deviceService.disconnectDevice(deviceId).pipe(
          takeUntilDestroyed(this.destroyRef)
        ).subscribe({
          next: () => {
            this.displaySuccess('Device successfully disconnected', '');
            this.loadDevices(); // Reload the list
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

        this.deviceService.disconnectAllDevices().pipe(
          takeUntilDestroyed(this.destroyRef)
        ).subscribe({
          next: () => {
            this.displaySuccess(
              'Tous les autres appareils ont été déconnectés avec succès. Seul votre appareil actuel reste connecté.',
              ''
            );
            this.loadDevices();
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
    this.deviceService.requestDeviceConfirmationLink().pipe(
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

  isCurrentDevice(deviceId: number): boolean {
    return this.currentDeviceId() === deviceId;
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
