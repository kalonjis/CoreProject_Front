import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from "../core/layout/footer/footer.component";
import { HeaderComponent } from "../core/layout/header/header.component";
import { Subscription } from 'rxjs';
import {SessionService} from '../core/auth/services/session.service';
import {DeviceFingerprintService} from '../core/security/device-fingerprint.service';

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

  private subscriptions = new Subscription();

  ngOnInit(): void {
    // Génération de l'empreinte de l'appareil au démarrage (pour référence)
    // Peut être utilisée pour des vérifications côté client
    this.fingerprintService.generateSimpleFingerprint();

    // S'abonner aux changements d'état de session
    this.subscriptions.add(
      this.sessionService.state.subscribe(state => {
        if (state.isAuthenticated) {
          console.log('User authenticated', state.user?.username);
        }
      })
    );
  }

  ngOnDestroy(): void {
    // Nettoyer toutes les souscriptions
    this.subscriptions.unsubscribe();
  }
}
