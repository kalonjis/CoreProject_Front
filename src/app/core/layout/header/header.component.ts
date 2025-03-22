import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { provideAuthService } from '../../auth/services/auth.service';
import { User } from '../../../data/models/user/user';
import { UserRole } from '../../../data/models/user/user-role';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  private auth = provideAuthService();

  isLoggedIn = false;
  currentUser: User | null = null;
  isAdmin = false;
  mobileMenuActive = false;

  ngOnInit(): void {
    // Subscribe to authentication state
    this.auth.isAuthenticated$.subscribe(isAuthenticated => {
      this.isLoggedIn = isAuthenticated;
    });

    // Subscribe to current user data
    this.auth.currentUser$.subscribe(user => {
      this.currentUser = user;

      // Check if user has admin privileges
      if (user) {
        this.isAdmin = user.userRoles.includes(UserRole.ADMIN) ||
          user.userRoles.includes(UserRole.SUPER_ADMIN);
      } else {
        this.isAdmin = false;
      }
    });
  }

  logout(): void {
    this.auth.logout().subscribe();
  }

  toggleMobileMenu(): void {
    this.mobileMenuActive = !this.mobileMenuActive;

    // Prevent scrolling on body when mobile menu is open
    if (this.mobileMenuActive) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  closeMobileMenu(): void {
    this.mobileMenuActive = false;
    document.body.style.overflow = '';
  }
}
