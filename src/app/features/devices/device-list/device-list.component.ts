// src/app/features/devices/device-list/device-list.component.ts
import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeviceService } from '../../../data/services/device-service';
import { Device } from '../../../data/models/device/device';
import { DeviceTrustLevel } from '../../../data/models/device/device-trust-level';
import { FeedbackComponent } from '../../../shared/feedback/feedback.component';
import { FeedbackBase } from '../../../shared/feedback/tools/feedback.base';
import { HttpErrorResponse } from '@angular/common/http';
import { DeviceDetailComponent } from '../device-detail/device-detail.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-device-list',
  standalone: true,
  imports: [CommonModule, FormsModule, FeedbackComponent, DeviceDetailComponent],
  templateUrl: './device-list.component.html',
  styleUrls: ['./device-list.component.scss']
})
export class DeviceListComponent extends FeedbackBase implements OnInit {
  private deviceService = inject(DeviceService);
  private destroyRef = inject(DestroyRef);

  devices = signal<Device[]>([]);
  isLoading = signal(true);
  isProcessing = signal(false);
  currentDeviceId = signal<number | null>(null);
  selectedDevice = signal<Device | null>(null);
  filterText = '';

  ngOnInit(): void {
    this.loadDevices();

    // Detect current device
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
          // Sort by date (most recent first)
          const dateA = new Date(a.lastSeen).getTime();
          const dateB = new Date(b.lastSeen).getTime();
          return dateB - dateA;
        }));
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
  }

  disconnectAllDevices(): void {
    if (!confirm('Are you sure you want to disconnect all other devices? This action cannot be undone.')) {
      return;
    }

    this.isProcessing.set(true);
    this.deviceService.disconnectAllDevices().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.displaySuccess(
          'All other devices have been successfully disconnected. Only your current device remains connected.',
          ''
        );
        this.loadDevices(); // Reload the list
        this.isProcessing.set(false);
      },
      error: (err) => {
        console.error('Error disconnecting all devices', err);
        this.displayError('Unable to disconnect all devices', 'Retry');
        this.isProcessing.set(false);
      }
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
    if (!dateString) return 'Unknown date';

    const date = new Date(dateString);
    return date.toLocaleString();
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
