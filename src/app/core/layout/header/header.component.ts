import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SessionService } from '../../auth/services/session.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  private sessionService = inject(SessionService);

  // Utiliser directement les signaux exposés par le service
  isLoggedIn = this.sessionService.isAuthenticated;
  username = this.sessionService.username;
  isAdmin = this.sessionService.isAdmin;

  // État local du composant
  mobileMenuActive = signal(false);

  logout(): void {
    this.sessionService.logout().subscribe();
  }

  toggleMobileMenu(): void {
    this.mobileMenuActive.update(value => !value);
    document.body.style.overflow = this.mobileMenuActive() ? 'hidden' : '';
  }

  closeMobileMenu(): void {
    this.mobileMenuActive.set(false);
    document.body.style.overflow = '';
  }
}
