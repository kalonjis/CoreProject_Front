import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SessionService } from '../../auth/services/session.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  private sessionService = inject(SessionService);
  private _mobileMenuActive = false;

  // Signaux pour l'état d'authentification et l'utilisateur
  isLoggedIn = computed(() => this.sessionService.isAuthenticated());
  username = computed(() => this.sessionService.username());
  isAdmin = computed(() => this.sessionService.isAdmin());
  isInitialized = computed(() => this.sessionService.isInitialized());

  // Propriété pour l'état du menu mobile
  get mobileMenuActive(): boolean {
    return this._mobileMenuActive;
  }

  ngOnInit(): void {
    // Si pas encore initialisé, on attend...
    if (!this.isInitialized()) {
      // On pourrait ajouter un spinner ici
      console.log('Waiting for session to initialize...');
    }
  }

  logout(): void {
    this.sessionService.logout().subscribe();
  }

  toggleMobileMenu(): void {
    this._mobileMenuActive = !this._mobileMenuActive;
    document.body.style.overflow = this._mobileMenuActive ? 'hidden' : '';
  }

  closeMobileMenu(): void {
    this._mobileMenuActive = false;
    document.body.style.overflow = '';
  }
}
