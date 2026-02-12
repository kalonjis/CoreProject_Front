import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthFacade } from '../../auth/services/auth.facade';
import {NotificationBellComponent, NotificationToastComponent} from '../../../features/notification';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, NotificationBellComponent, NotificationToastComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {

  private readonly authFacade = inject(AuthFacade);

  // Expose signals for template
  readonly isAuthenticated = this.authFacade.isAuthenticated;
  readonly username = this.authFacade.username;
  readonly isAdmin = this.authFacade.isAdmin;

  // Local UI state
  mobileMenuActive = false;
  isDropdownOpen = false;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-dropdown')) {
      this.isDropdownOpen = false;
    }
  }

  toggleMobileMenu(): void {
    this.mobileMenuActive = !this.mobileMenuActive;
    document.body.style.overflow = this.mobileMenuActive ? 'hidden' : '';
  }

  closeMobileMenu(): void {
    this.mobileMenuActive = false;
    document.body.style.overflow = '';
  }

  // APRÈS ✅
  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  logout(): void {
    this.authFacade.logout().subscribe();
    this.isDropdownOpen = false;
  }
}
