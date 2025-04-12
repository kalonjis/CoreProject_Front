import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/services/auth.service';

@Component({
  selector: 'app-device-alert-banner',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './device-alert-banner.component.html',
  styleUrl: './device-alert-banner.component.scss'
})
export class DeviceAlertBannerComponent {
  authService = inject(AuthService);

  get showBanner(): boolean {
    return this.authService.isAuthenticated() && !this.authService.isDeviceConfirmed();
  }
}
