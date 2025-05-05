// src/app/features/devices/device-management/device-management.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Device } from '../../../data/models/device/device';
import { DeviceService } from '../../../data/services/device-service';
import { DeviceTrustLevel } from '../../../data/models/device/device-trust-level';
import { FeedbackComponent } from '../../../shared/feedback/feedback.component';
import { FeedbackBase } from '../../../shared/feedback/tools/feedback.base';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DeviceDetailComponent } from '../device-detail/device-detail.component';

@Component({
  selector: 'app-device-management',
  standalone: true,
  imports: [CommonModule, RouterLink, FeedbackComponent, FormsModule, DeviceDetailComponent],
  templateUrl: './device-management.component.html',
  styleUrl: './device-management.component.scss'
})
export class DeviceManagementComponent extends FeedbackBase implements OnInit {
  private deviceService = inject(DeviceService);
  private router = inject(Router);

  // Signaux pour l'état du composant
  devices = signal<Device[]>([]);
  isLoading = signal(true);
  selectedDevice = signal<Device | null>(null);
  isProcessing = signal(false);
  currentDeviceId = signal<number | null>(null);

  // Pour le tri et le filtrage
  sortField = signal<keyof Device>('lastSeen');
  sortDirection = signal<'asc' | 'desc'>('desc');
  filterText = signal('');

  // Pour les opérations de modification
  deviceToDisconnect = signal<Device | null>(null);
  showDisconnectModal = signal(false);
  showTrustLevelModal = signal(false);
  selectedTrustLevel = signal<DeviceTrustLevel | null>(null);
  trustLevelOptions = [
    { value: DeviceTrustLevel.HIGHLY_TRUSTED, label: 'Très fiable' },
    { value: DeviceTrustLevel.TRUSTED, label: 'Fiable' },
    { value: DeviceTrustLevel.BASIC, label: 'Basique' },
    { value: DeviceTrustLevel.UNTRUSTED, label: 'Non fiable' }
  ];

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

  getSortedAndFilteredDevices(): Device[] {
    let result = [...this.devices()];

    // Filtrage
    const filter = this.filterText().toLowerCase();
    if (filter) {
      result = result.filter(device =>
        device.deviceType.toLowerCase().includes(filter) ||
        device.browser.toLowerCase().includes(filter) ||
        device.operatingSystem.toLowerCase().includes(filter) ||
        (device.deviceBrand && device.deviceBrand.toLowerCase().includes(filter))
      );
    }

    // Tri
    const field = this.sortField();
    const direction = this.sortDirection();

    result.sort((a, b) => {
      let comparison = 0;

      // Traitement spécial pour les dates
      if (field === 'lastSeen' || field === 'firstSeen' || field === 'logoutTime') {
        const dateA = a[field] ? new Date(a[field]).getTime() : 0;
        const dateB = b[field] ? new Date(b[field]).getTime() : 0;
        comparison = dateA - dateB;
      }
      // Traitement pour les booléens
      else if (typeof a[field] === 'boolean') {
        comparison = (a[field] === b[field]) ? 0 : a[field] ? 1 : -1;
      }
      // Traitement par défaut (chaînes)
      else {
        const valA = String(a[field] || '').toLowerCase();
        const valB = String(b[field] || '').toLowerCase();
        comparison = valA.localeCompare(valB);
      }

      return direction === 'asc' ? comparison : -comparison;
    });

    return result;
  }

  // Opérations sur les appareils
  showDisconnectConfirmation(device: Device): void {
    this.deviceToDisconnect.set(device);
    this.showDisconnectModal.set(true);
  }

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

  openTrustLevelModal(device: Device): void {
    this.selectedDevice.set(device);
    this.selectedTrustLevel.set(device.level);
    this.showTrustLevelModal.set(true);
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

  // Méthodes utilitaires pour l'affichage
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

  getDeviceStatus(device: Device): string {
    if (device.blacklisted) return 'Blacklisté';
    if (device.loggedOut) return 'Déconnecté';
    if (device.confirmed) return 'Confirmé';
    return 'Non confirmé';
  }

  getDeviceStatusClass(device: Device): string {
    if (device.blacklisted) return 'status-blacklisted';
    if (device.loggedOut) return 'status-disconnected';
    if (device.confirmed) return 'status-confirmed';
    return 'status-unconfirmed';
  }

  isCurrentDevice(device: Device): boolean {
    return device.id === this.currentDeviceId();
  }

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
