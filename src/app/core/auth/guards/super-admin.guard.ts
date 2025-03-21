import {CanActivateFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {AuthService} from '../services/auth-service.service';
import {map} from 'rxjs';
import {UserRole} from '../../../data/models/user/user-role';

export const superAdminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    map(user => {
      if (user && user.userRoles.includes(<UserRole>'SUPER_ADMIN')) {
        return true;
      } else {
        // Redirect to access denied page
        router.navigate(['/access-denied']);
        return false;
      }
    })
  );
};
