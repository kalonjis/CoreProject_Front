import { Component, OnInit, OnDestroy, inject, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from "../core/layout/footer/footer.component";
import { HeaderComponent } from "../core/layout/header/header.component";
import { SessionService } from '../core/auth/services/session.service';
import { DeviceFingerprintService } from '../core/security/device-fingerprint.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FooterComponent, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  private sessionService = inject(SessionService);
  private fingerprintService = inject(DeviceFingerprintService);

  // Using effect to respond to signal changes instead of subscription
  private authEffect = effect(() => {
    const state = this.sessionService.state();
    if (state.isAuthenticated) {
      console.log('User authenticated', state.user?.username);
    }
  });

  ngOnInit() {
    console.log("App initialized");

    // Créer un effet pour surveiller l'état d'authentification
    effect(() => {
      const state = this.sessionService.state();
      console.log("Authentication state:", {
        isInitialized: state.isInitialized,
        isAuthenticated: state.isAuthenticated,
        user: state.user?.username
      });
    });
  }

  ngOnDestroy(): void {
    // Nothing to clean up since we're using effects
  }
}
