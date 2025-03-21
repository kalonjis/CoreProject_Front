import {CanActivateFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {map} from 'rxjs';
import {provideAuthService} from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = provideAuthService();
  const router = inject(Router);

  return authService.isAuthenticated$.pipe(
    map(isAuthenticated => {
      if (isAuthenticated) {
        return true;
      } else {
        // Redirect to login page with return url
        router.navigate(['/auth/login'], {
          queryParams: { returnUrl: state.url }
        });
        return false;
      }
    })
  );
};
