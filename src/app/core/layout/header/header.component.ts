// header.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterLink, RouterLinkActive} from '@angular/router';
import {AuthService} from '../../auth/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  authService = inject(AuthService);
  mobileMenuActive = false;

  toggleMobileMenu(): void {
    this.mobileMenuActive = !this.mobileMenuActive;
    document.body.style.overflow = this.mobileMenuActive ? 'hidden' : '';
  }

  closeMobileMenu(): void {
    this.mobileMenuActive = false;
    document.body.style.overflow = '';
  }

  logout(): void {
    this.authService.logout().subscribe();
  }
}
