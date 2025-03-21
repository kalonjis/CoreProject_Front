import {CanActivateFn, Router} from '@angular/router';
import {DeviceService} from '../../../data/services/device-service.service';
import {DeviceTrustLevel} from '../../../data/models/device/device-trust-level';
import {inject} from '@angular/core';
import {catchError, map, of} from 'rxjs';

export const deviceTrustGuard = (requiredLevel: DeviceTrustLevel): CanActivateFn => {
  return (route, state) => {
    const deviceService = inject(DeviceService);
    const router = inject(Router);

    return deviceService.getCurrentDevice().pipe(
      map(device => {
        // Convertir les niveaux en nombres pour comparer facilement (UNTRUSTED=0, BASIC=1, etc.)
        const deviceLevelValue = DeviceTrustLevel[device.level];
        const requiredLevelValue = DeviceTrustLevel[requiredLevel];

        if (deviceLevelValue >= requiredLevelValue) {
          return true;
        } else {
          // Rediriger vers une page expliquant le problème de niveau de confiance
          router.navigate(['/device-trust-required'], {
            queryParams: {
              required: requiredLevel,
              current: device.level
            }
          });
          return false;
        }
      }),
      catchError(() => {
        // En cas d'erreur, on redirige vers une page d'erreur
        router.navigate(['/device-error']);
        return of(false);
      })
    );
  };
};
