import { Component, inject, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AuthFacade } from '../core/auth';
import { FooterComponent } from '../core/layout/footer/footer.component';
import { HeaderComponent } from '../core/layout/header/header.component';
import { GlobalFeedbackComponent } from '../shared/feedback/global-feedback.component';
import { DeviceAlertBannerComponent } from '../shared/device-alert-banner/device-alert-banner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    FooterComponent,
    HeaderComponent,
    GlobalFeedbackComponent,
    DeviceAlertBannerComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  private readonly authFacade = inject(AuthFacade);

  // Apply theme based on user preferences
  themeEffect = effect(() => {
    const user = this.authFacade.user();
    if (user) {
      const savedTheme = localStorage.getItem('theme') || 'light';
      document.body.className = savedTheme;
    }
  });

  // Log auth status in dev mode
  logEffect = effect(() => {
    const isAuth = this.authFacade.isAuthenticated();
    console.log(`Auth status: ${isAuth ? 'Authenticated' : 'Not authenticated'}`);

    if (isAuth) {
      console.log('User:', this.authFacade.username());
    }
  });
}
