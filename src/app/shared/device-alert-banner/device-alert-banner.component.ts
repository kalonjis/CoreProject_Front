import { Component, inject, DestroyRef, OnInit, OnDestroy, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthFacade } from '../../core/auth';
import { DeviceApiService } from '../../core/device';

@Component({
  selector: 'app-device-alert-banner',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './device-alert-banner.component.html',
  styleUrl: './device-alert-banner.component.scss'
})
export class DeviceAlertBannerComponent implements OnInit, OnDestroy {

  private readonly auth = inject(AuthFacade);
  private readonly deviceApi = inject(DeviceApiService);
  private readonly destroyRef = inject(DestroyRef);

  // Local state
  private bannerDismissed = signal(false);
  protected isRequestingLink = signal(false);

  // Periodic check interval
  private checkInterval: ReturnType<typeof setInterval> | null = null;

  // Debug: log device confirmation changes
  private debugEffect = effect(() => {
    console.log('[DeviceAlertBanner] isAuthenticated:', this.auth.isAuthenticated());
    console.log('[DeviceAlertBanner] isDeviceConfirmed:', this.auth.isDeviceConfirmed());
    console.log('[DeviceAlertBanner] bannerDismissed:', this.bannerDismissed());
    console.log('[DeviceAlertBanner] showBanner:', this.showBanner());
  });

  ngOnInit(): void {
    // Check for previously dismissed banner in session
    const dismissed = sessionStorage.getItem('device-banner-dismissed');
    if (dismissed === 'true') {
      this.bannerDismissed.set(true);
    }

    // Initial device status check
    this.refreshDeviceStatus();

    // Periodic device status check (every 5 minutes)
    this.checkInterval = setInterval(() => {
      this.refreshDeviceStatus();
    }, 5 * 60 * 1000);
  }

  ngOnDestroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  /**
   * Determines if banner should be displayed.
   * Uses signals from AuthFacade which reads from DeviceStore.
   */
  showBanner(): boolean {
    return this.auth.isAuthenticated() &&
      !this.auth.isDeviceConfirmed() &&
      !this.bannerDismissed();
  }

  /**
   * Refreshes device status from server.
   * Updates DeviceStore via AuthFacade.
   */
  refreshDeviceStatus(): void {
    if (!this.auth.isAuthenticated()) return;

    // Reload device session - this updates the DeviceStore
    this.auth.reloadDeviceSession()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          console.log('[DeviceAlertBanner] Device status refreshed');
        },
        error: (err) => {
          console.error('[DeviceAlertBanner] Failed to refresh device status', err);
        }
      });
  }

  /**
   * Requests a new confirmation link for current device.
   */
  requestNewConfirmationLink(): void {
    if (this.isRequestingLink()) return;

    this.isRequestingLink.set(true);

    this.deviceApi.requestConfirmationLink()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          alert('Un nouveau lien de confirmation a été envoyé à votre adresse email.');
          this.isRequestingLink.set(false);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error requesting confirmation link', error);
          alert('Une erreur est survenue. Veuillez réessayer plus tard.');
          this.isRequestingLink.set(false);
        }
      });
  }

  /**
   * Dismisses banner for current session.
   */
  dismissBanner(): void {
    this.bannerDismissed.set(true);
    sessionStorage.setItem('device-banner-dismissed', 'true');
  }
}
