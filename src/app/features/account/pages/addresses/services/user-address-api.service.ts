// src/app/features/profile/addresses/services/user-address-api.service.ts

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { AddressApiBaseService } from '../../../../../shared/address/services/address-api-base.service';
import { UserAddress, AddressType } from '../../../../../shared/address/models';

/**
 * Service API pour les adresses de l'utilisateur connecté.
 *
 * Endpoint: /api/profile/addresses
 *
 * Utilisation:
 * ```typescript
 * private addressApi = inject(UserAddressApiService);
 *
 * // Récupérer toutes les adresses
 * this.addressApi.getAll().subscribe(addresses => ...);
 *
 * // Récupérer les adresses de livraison
 * this.addressApi.getAll({ type: AddressType.SHIPPING }).subscribe(...);
 *
 * // Créer une nouvelle adresse
 * this.addressApi.create({ streetName: '...', ... }).subscribe(...);
 * ```
 */
@Injectable({ providedIn: 'root' })
export class UserAddressApiService extends AddressApiBaseService<UserAddress> {

  private readonly BASE_URL = '/api/profile/addresses';

  // ===========================================================================
  // IMPLEMENTATION
  // ===========================================================================

  protected override getBaseUrl(): string {
    return this.BASE_URL;
  }

  // ===========================================================================
  // USER-SPECIFIC METHODS
  // ===========================================================================

  /**
   * Récupère l'adresse de facturation par défaut.
   */
  getDefaultBillingAddress(): Observable<UserAddress | null> {
    return this.getDefaultForType(AddressType.BILLING);
  }

  /**
   * Récupère l'adresse de livraison par défaut.
   */
  getDefaultShippingAddress(): Observable<UserAddress | null> {
    return this.getDefaultForType(AddressType.SHIPPING);
  }

  /**
   * Récupère toutes les adresses résidentielles actives.
   */
  getResidentialAddresses(): Observable<UserAddress[]> {
    return this.getAll({ type: AddressType.RESIDENTIAL, active: true });
  }

  /**
   * Récupère toutes les adresses professionnelles actives.
   */
  getProfessionalAddresses(): Observable<UserAddress[]> {
    return this.getAll({ type: AddressType.PROFESSIONAL, active: true });
  }

  /**
   * Vérifie si l'utilisateur a au moins une adresse de facturation valide.
   */
  hasBillingAddress(): Observable<boolean> {
    return new Observable(subscriber => {
      this.getBillingEligible().subscribe({
        next: addresses => {
          subscriber.next(addresses.length > 0);
          subscriber.complete();
        },
        error: err => subscriber.error(err)
      });
    });
  }

  /**
   * Vérifie si l'utilisateur a au moins une adresse de livraison valide.
   */
  hasShippingAddress(): Observable<boolean> {
    return new Observable(subscriber => {
      this.getShippingEligible().subscribe({
        next: addresses => {
          subscriber.next(addresses.length > 0);
          subscriber.complete();
        },
        error: err => subscriber.error(err)
      });
    });
  }
}
