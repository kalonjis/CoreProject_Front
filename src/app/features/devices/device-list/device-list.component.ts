// src/app/features/devices/device-list/device-list.component.ts
import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DeviceService } from '../../../data/services/device-service';
import { Device } from '../../../data/models/device/device';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FeedbackComponent } from '../../../shared/feedback/feedback.component';
import { FeedbackBase } from '../../../shared/feedback/tools/feedback.base';

@Component({
  selector: 'app-device-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FeedbackComponent],
  templateUrl: './device-list.component.html',
  styleUrls: ['./device-list.component.scss']
})
export class DeviceListComponent extends FeedbackBase implements OnInit {
  private deviceService = inject(DeviceService);
  private destroyRef = inject(DestroyRef);

  devices = signal<Device[]>([]);
  isLoading = signal(true);
  currentDeviceId = signal<number | null>(null);

  ngOnInit(): void {
    this.loadDevices();

    // Détecter l'appareil actuel
    this.deviceService.getCurrentDevice().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(device => {
      this.currentDeviceId.set(device.id);
    });
  }

  loadDevices(): void {
    this.isLoading.set(true);

    this.deviceService.getMyDevices().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (devices) => {
        this.devices.set(devices.sort((a, b) => {
          // Tri par date (du plus récent au plus ancien)
          const dateA = new Date(a.lastSeen).getTime();
          const dateB = new Date(b.lastSeen).getTime();
          return dateB - dateA;
        }));
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des appareils', err);
        this.displayError('Impossible de charger la liste de vos appareils', 'Réessayer');
        this.buttonAction = () => this.loadDevices();
        this.isLoading.set(false);
      }
    });
  }

  disconnectDevice(deviceId: number): void {
    if (this.currentDeviceId() === deviceId) {
      this.displayWarning(
        'Vous ne pouvez pas déconnecter l\'appareil que vous utilisez actuellement.',
        'Compris'
      );
      return;
    }

    this.deviceService.disconnectDevice(deviceId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.displaySuccess('Appareil déconnecté avec succès', '');
       console.log('Appareil déconnecté avec succès', '');
        this.loadDevices(); // Recharger la liste
      },
      error: (err) => {
        console.error('Erreur lors de la déconnexion', err);
        this.displayError('Impossible de déconnecter cet appareil', 'Réessayer');
      }
    });
  }

  disconnectAllDevices(): void {
    this.deviceService.disconnectAllDevices().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.displaySuccess(
          'Tous les autres appareils ont été déconnectés. Seul votre appareil actuel reste connecté.',
          ''
        );
        this.loadDevices(); // Recharger la liste
      },
      error: (err) => {
        console.error('Erreur lors de la déconnexion de tous les appareils', err);
        this.displayError('Impossible de déconnecter tous les appareils', 'Réessayer');
      }
    });
  }

  getDeviceIcon(deviceType: string): string {
    switch (deviceType.toLowerCase()) {
      case 'mobile':
        return '📱';
      case 'tablet':
        return '📱';
      case 'desktop':
      case 'laptop':
        return '💻';
      case 'tv':
      case 'smarttv':
        return '📺';
      default:
        return '🖥️';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Date inconnue';

    const date = new Date(dateString);
    return date.toLocaleString();
  }

  isCurrentDevice(deviceId: number): boolean {
    return this.currentDeviceId() === deviceId;
  }
}
