import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

// ✅ AVANT: import { AuthService } from '../../auth/services/auth.service';
// ✅ APRÈS: Import depuis le barrel
import { AuthFacade } from '../../auth';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {

  protected readonly auth = inject(AuthFacade);

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

  toggleDropdown(): void {
    event?.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  logout(): void {
    this.auth.logout().subscribe();
    this.isDropdownOpen = false;
  }
}
