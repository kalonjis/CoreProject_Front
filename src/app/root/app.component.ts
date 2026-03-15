import { Component, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FooterComponent } from '../core/layout/footer/footer.component';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { HeaderComponent } from '../core/layout/header/header.component';
import { GlobalFeedbackComponent } from '../shared/feedback/global-feedback.component';
import { DeviceAlertBannerComponent } from '../shared/device-alert-banner/device-alert-banner.component';
import { AuthFacade } from '../core/auth';
import { NotificationFacade } from '../features/notification';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';


@Component({
    selector: 'app-root',
    imports: [RouterOutlet, FooterComponent, HeaderComponent, GlobalFeedbackComponent, DeviceAlertBannerComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent {
  private authFacade         = inject(AuthFacade);
  private notificationFacade = inject(NotificationFacade);
  private router             = inject(Router);

  readonly isInCrm = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map((e: NavigationEnd) => e.urlAfterRedirects.startsWith('/crm')),
      startWith(this.router.url.startsWith('/crm'))
    ),
    { initialValue: false }
  );

  // Theme effect
  themeEffect = effect(() => {
    const user = this.authFacade.user();
    if (user) {
      const savedTheme = localStorage.getItem('theme') || 'light';
      document.body.className = savedTheme;
    }
  });

  // Notification SSE - réactif aux changements d'auth
  notificationEffect = effect(() => {
    const isAuth = this.authFacade.isAuthenticated();
    const isInitialized = this.authFacade.isInitialized();

    if (isInitialized && isAuth) {
      this.notificationFacade.initialize();
    } else if (isInitialized && !isAuth) {
      this.notificationFacade.shutdown();
    }
  }, { allowSignalWrites: true });
}
