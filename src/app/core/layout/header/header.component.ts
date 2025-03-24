// src/app/core/layout/header/header.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthStore } from '../../auth/store/auth.store';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  private authStore = inject(AuthStore);

  // Exposer directement les signaux du store
  isLoggedIn = this.authStore.isAuthenticated;
  currentUser = this.authStore.user;
  isAdmin = this.authStore.isAdmin;
  username = this.authStore.username;

  mobileMenuActive = false;

  ngOnInit(): void {
    // Pas besoin de s'abonner, les signaux sont actualisés automatiquement
  }

  logout(): void {
    this.authStore.logout().subscribe();
  }

  toggleMobileMenu(): void {
    this.mobileMenuActive = !this.mobileMenuActive;
    document.body.style.overflow = this.mobileMenuActive ? 'hidden' : '';
  }

  closeMobileMenu(): void {
    this.mobileMenuActive = false;
    document.body.style.overflow = '';
  }
}
