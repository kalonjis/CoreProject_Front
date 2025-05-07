// src/app/features/devices/device-management/device-management.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeviceService } from '../../../data/services/device-service';
import { Device } from '../../../data/models/device/device';
import { DeviceTrustLevel } from '../../../data/models/device/device-trust-level';
import { FeedbackComponent } from '../../../shared/feedback/feedback.component';
import { FeedbackBase } from '../../../shared/feedback/tools/feedback.base';
import { HttpErrorResponse } from '@angular/common/http';
import { DeviceDetailComponent } from '../device-detail/device-detail.component';
import { DeviceUtilsService } from '../../../shared/services/device-utils.service';

@Component({
  selector: 'app-device-management',
  standalone: true,
  imports: [CommonModule, FeedbackComponent, FormsModule, DeviceDetailComponent],
  templateUrl: './device-management.component.html',
  styleUrl: './device-management.component.scss'
})
export class DeviceManagementComponent extends FeedbackBase implements OnInit {
  private deviceService = inject(DeviceService);
  private deviceUtils = inject(DeviceUtilsService);

  // Signaux pour l'état du composant
  devices = signal<Device[]>([]);
  isLoading = signal(true);
  selectedDevice = signal<Device | null>(null);
  isProcessing = signal(false);
  currentDeviceId = signal<number | null>(null);

  // Pour le tri et le filtrage
  sortField = signal<keyof Device>('lastSeen');
  sortDirection = signal<'asc' | 'desc'>('desc');
  filterTextValue = signal('');

  // Pour les opérations de modification
  deviceToDisconnect = signal<Device | null>(null);
  showDisconnectModal = signal(false);
  showTrustLevelModal = signal(false);
  selectedTrustLevel = signal<DeviceTrustLevel | null>(null);

  // Getter pour accéder aux options de niveau de confiance
  get trustLevelOptions() {
    return this.deviceUtils.trustLevelOptions;
  }

  ngOnInit(): void {
    this.loadDevices();

    // Identifier l'appareil actuel
    this.deviceService.getCurrentDevice().subscribe({
      next: (device) => {
        this.currentDeviceId.set(device.id);
      },
      error: (error) => {
        console.error('Erreur lors de la récupération de l\'appareil actuel', error);
      }
    });
  }

  loadDevices(): void {
    this.isLoading.set(true);
    this.deviceService.getMyDevices().subscribe({
      next: (devices) => {
        this.devices.set(devices);
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.handleError(error);
        this.isLoading.set(false);
      }
    });
  }

  selectDevice(device: Device): void {
    this.selectedDevice.set(device);
  }

  closeDeviceDetail(): void {
    this.selectedDevice.set(null);
  }

  // Méthodes de tri et filtrage
  sortDevices(field: keyof Device): void {
    if (this.sortField() === field) {
      // Inverser la direction si on clique sur le même champ
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      // Nouveau champ de tri, réinitialiser à desc (récent -> ancien)
      this.sortField.set(field);
      this.sortDirection.set('desc');
    }
  }

  // Getters and setters for filterText (to be used with ngModel)
  get filterText(): string {
    return this.filterTextValue();
  }

  set filterText(value: string) {
    this.filterTextValue.set(value);
  }

  getSortedAndFilteredDevices(): Device[] {
    const filteredDevices = this.deviceUtils.filterDevices(
      this.devices(),
      this.filterTextValue()
    );

    return this.deviceUtils.sortDevices(
      filteredDevices,
      this.sortField(),
      this.sortDirection()
    );
  }

  // Méthodes pour les modales
  showDisconnectConfirmation(device: Device): void {
    this.deviceToDisconnect.set(device);
    this.showDisconnectModal.set(true);
  }

  openTrustLevelModal(device: Device): void {
    this.selectedDevice.set(device);
    this.selectedTrustLevel.set(device.level);
    this.showTrustLevelModal.set(true);
  }

  // Opérations sur les appareils
  disconnectDevice(): void {
    const device = this.deviceToDisconnect();
    if (!device) return;

    this.isProcessing.set(true);
    this.deviceService.disconnectDevice(device.id).subscribe({
      next: () => {
        this.displaySuccess(`Appareil ${device.browser} sur ${device.operatingSystem} déconnecté avec succès`);
        this.showDisconnectModal.set(false);
        this.deviceToDisconnect.set(null);

        // Mettre à jour la liste
        this.loadDevices();
        this.isProcessing.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.handleError(error);
        this.isProcessing.set(false);
      }
    });
  }

  disconnectAllDevices(): void {
    if (!confirm('Êtes-vous sûr de vouloir déconnecter tous vos autres appareils ? Cette action ne peut pas être annulée.')) {
      return;
    }

    this.isProcessing.set(true);
    this.deviceService.disconnectAllDevices().subscribe({
      next: () => {
        this.displaySuccess('Tous les autres appareils ont été déconnectés avec succès');

        // Mettre à jour la liste
        this.loadDevices();
        this.isProcessing.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.handleError(error);
        this.isProcessing.set(false);
      }
    });
  }

  updateTrustLevel(): void {
    const device = this.selectedDevice();
    const newLevel = this.selectedTrustLevel();

    if (!device || !newLevel) return;

    this.isProcessing.set(true);
    this.deviceService.updateTrustLevel(device.id, newLevel).subscribe({
      next: () => {
        // Mettre à jour l'appareil localement
        const updatedDevice = { ...device, level: newLevel };
        this.selectedDevice.set(updatedDevice);

        // Mettre à jour la liste
        this.loadDevices();

        this.displaySuccess(`Niveau de confiance mis à jour vers ${this.getTrustLevelLabel(newLevel)}`);
        this.showTrustLevelModal.set(false);
        this.isProcessing.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.handleError(error);
        this.isProcessing.set(false);
      }
    });
  }

  requestConfirmationLink(): void {
    this.isProcessing.set(true);
    this.deviceService.requestDeviceConfirmationLink().subscribe({
      next: () => {
        this.displaySuccess('Un nouveau lien de confirmation a été envoyé à votre adresse email');
        this.isProcessing.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.handleError(error);
        this.isProcessing.set(false);
      }
    });
  }

  // Méthodes utilitaires - délèguent au service
  getTrustLevelLabel(level: DeviceTrustLevel): string {
    return this.deviceUtils.getTrustLevelLabel(level);
  }

  getTrustLevelClass(level: DeviceTrustLevel): string {
    return this.deviceUtils.getTrustLevelClass(level);
  }

  formatDate(dateString: string | null): string {
    return this.deviceUtils.formatDate(dateString);
  }

  getDeviceStatus(device: Device): string {
    return this.deviceUtils.getDeviceStatus(device);
  }

  getDeviceStatusClass(device: Device): string {
    return this.deviceUtils.getDeviceStatusClass(device);
  }

  getDeviceIcon(deviceType: string): string {
    return this.deviceUtils.getDeviceIcon(deviceType);
  }

  isCurrentDevice(device: Device): boolean {
    return device.id === this.currentDeviceId();
  }

  // Gestion des erreurs
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
