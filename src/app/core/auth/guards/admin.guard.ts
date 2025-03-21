import {CanActivateFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {provideAuthService} from '../services/auth.service';
import {map} from 'rxjs';
import {UserRole} from '../../../data/models/user/user-role';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = provideAuthService();
  const router = inject(Router);

  return authService.currentUser$.pipe(
    map(user => {
      if (user && (user.userRoles.includes(<UserRole>'ADMIN') || user.userRoles.includes(<UserRole>'SUPER_ADMIN'))) {
        return true;
      } else {
        // Redirect to access denied page
        router.navigate(['/access-denied']);
        return false;
      }
    })
  );
};
