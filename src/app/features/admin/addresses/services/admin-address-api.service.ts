// src/app/features/admin/addresses/services/admin-address-api.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  UserAddress,
  AddressType,
  AddressSearchCriteria,
  CreateAddressRequest,
  UpdateAddressRequest,
  buildSearchParams
} from '../../../../shared/address/models';

/**
 * Service API pour la gestion admin des adresses utilisateurs.
 *
 * Contrairement à UserAddressApiService, ce service nécessite
 * un userId pour chaque opération car l'admin peut gérer
 * les adresses de n'importe quel utilisateur.
 *
 * Endpoint: /api/admin/users/{userId}/addresses
 *
 * Utilisation:
 * ```typescript
 * private adminAddressApi = inject(AdminAddressApiService);
 *
 * // Récupérer les adresses d'un utilisateur
 * this.adminAddressApi.getAllForUser(userId).subscribe(...);
 *
 * // Créer une adresse pour un utilisateur
 * this.adminAddressApi.createForUser(userId, request).subscribe(...);
 * ```
 */
@Injectable({ providedIn: 'root' })
export class AdminAddressApiService {

  private readonly http = inject(HttpClient);

  // ===========================================================================
  // URL BUILDER
  // ===========================================================================

  private getBaseUrl(userId: number): string {
    return `/api/admin/users/${userId}/addresses`;
  }

  // ===========================================================================
  // READ
  // ===========================================================================

  /**
   * Récupère toutes les adresses d'un utilisateur.
   */
  getAllForUser(userId: number, criteria?: AddressSearchCriteria): Observable<UserAddress[]> {
    const url = this.getBaseUrl(userId);

    if (criteria && Object.keys(criteria).length > 0) {
      const params = this.buildHttpParams(criteria);
      return this.http.get<UserAddress[]>(url, { params, withCredentials: true });
    }

    return this.http.get<UserAddress[]>(url, { withCredentials: true });
  }

  /**
   * Récupère une adresse spécifique d'un utilisateur.
   */
  getByPublicId(userId: number, publicId: string): Observable<UserAddress> {
    return this.http.get<UserAddress>(
      `${this.getBaseUrl(userId)}/${publicId}`,
      { withCredentials: true }
    );
  }

  /**
   * Récupère l'adresse principale d'un utilisateur.
   */
  getPrimaryForUser(userId: number): Observable<UserAddress | null> {
    return this.http.get<UserAddress | null>(
      `${this.getBaseUrl(userId)}/primary`,
      { withCredentials: true }
    );
  }

  /**
   * Récupère l'adresse par défaut d'un type pour un utilisateur.
   */
  getDefaultForType(userId: number, type: AddressType): Observable<UserAddress | null> {
    return this.http.get<UserAddress | null>(
      `${this.getBaseUrl(userId)}/default/${type}`,
      { withCredentials: true }
    );
  }

  // ===========================================================================
  // CREATE
  // ===========================================================================

  /**
   * Crée une nouvelle adresse pour un utilisateur.
   */
  createForUser(userId: number, request: CreateAddressRequest): Observable<UserAddress> {
    return this.http.post<UserAddress>(
      this.getBaseUrl(userId),
      request,
      { withCredentials: true }
    );
  }

  // ===========================================================================
  // UPDATE
  // ===========================================================================

  /**
   * Met à jour une adresse d'un utilisateur.
   */
  updateForUser(userId: number, publicId: string, request: UpdateAddressRequest): Observable<UserAddress> {
    return this.http.put<UserAddress>(
      `${this.getBaseUrl(userId)}/${publicId}`,
      request,
      { withCredentials: true }
    );
  }

  /**
   * Met à jour partiellement une adresse.
   */
  patchForUser(userId: number, publicId: string, request: Partial<UpdateAddressRequest>): Observable<UserAddress> {
    return this.http.patch<UserAddress>(
      `${this.getBaseUrl(userId)}/${publicId}`,
      request,
      { withCredentials: true }
    );
  }

  /**
   * Définit une adresse comme défaut pour son type.
   */
  setAsDefault(userId: number, publicId: string): Observable<UserAddress> {
    return this.http.patch<UserAddress>(
      `${this.getBaseUrl(userId)}/${publicId}/default`,
      {},
      { withCredentials: true }
    );
  }

  /**
   * Définit une adresse comme principale.
   */
  setAsPrimary(userId: number, publicId: string): Observable<UserAddress> {
    return this.http.patch<UserAddress>(
      `${this.getBaseUrl(userId)}/${publicId}/primary`,
      {},
      { withCredentials: true }
    );
  }

  /**
   * Change le type d'une adresse.
   */
  changeType(userId: number, publicId: string, newType: AddressType, setAsDefault = false): Observable<UserAddress> {
    const params = new HttpParams()
      .set('newType', newType)
      .set('setAsDefault', String(setAsDefault));

    return this.http.patch<UserAddress>(
      `${this.getBaseUrl(userId)}/${publicId}/type`,
      {},
      { params, withCredentials: true }
    );
  }

  // ===========================================================================
  // DELETE
  // ===========================================================================

  /**
   * Désactive une adresse (soft delete).
   */
  unlinkForUser(userId: number, publicId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.getBaseUrl(userId)}/${publicId}`,
      { withCredentials: true }
    );
  }

  /**
   * Supprime définitivement une adresse.
   */
  removeForUser(userId: number, publicId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.getBaseUrl(userId)}/${publicId}/permanent`,
      { withCredentials: true }
    );
  }

  // ===========================================================================
  // ADMIN-SPECIFIC METHODS
  // ===========================================================================

  /**
   * Récupère toutes les adresses inactives d'un utilisateur.
   */
  getInactiveForUser(userId: number): Observable<UserAddress[]> {
    return this.getAllForUser(userId, { active: false });
  }

  /**
   * Réactive une adresse désactivée.
   */
  reactivateAddress(userId: number, publicId: string): Observable<UserAddress> {
    return this.patchForUser(userId, publicId, {
      // Note: nécessite un endpoint backend ou un champ dans UpdateAddressRequest
      // Pour l'instant on simule avec les champs disponibles
    } as any);
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  private buildHttpParams(criteria: AddressSearchCriteria): HttpParams {
    const paramsObj = buildSearchParams(criteria);
    let params = new HttpParams();

    Object.entries(paramsObj).forEach(([key, value]) => {
      params = params.set(key, value);
    });

    return params;
  }
}
