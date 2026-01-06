// src/app/shared/address/services/address-api-base.service.ts

import { inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  AddressLink,
  AddressType,
  AddressSearchCriteria,
  CreateAddressRequest,
  UpdateAddressRequest,
  buildSearchParams
} from '../models';

/**
 * Service de base abstrait pour les opérations CRUD sur les adresses.
 *
 * Les classes dérivées doivent implémenter `getBaseUrl()` pour définir
 * l'endpoint spécifique au contexte (user, admin, company).
 *
 * @template T Type d'adresse (UserAddress, CompanyAddress, etc.)
 */
export abstract class AddressApiBaseService<T extends AddressLink> {

  protected readonly http = inject(HttpClient);

  // ===========================================================================
  // ABSTRACT - À implémenter par les classes dérivées
  // ===========================================================================

  /**
   * Retourne l'URL de base pour les requêtes.
   * Ex: '/api/profile/addresses' ou '/api/admin/users/123/addresses'
   */
  protected abstract getBaseUrl(): string;

  // ===========================================================================
  // READ
  // ===========================================================================

  /**
   * Récupère toutes les adresses (avec filtres optionnels).
   */
  getAll(criteria?: AddressSearchCriteria): Observable<T[]> {
    const url = this.getBaseUrl();

    if (criteria && Object.keys(criteria).length > 0) {
      const params = this.buildHttpParams(criteria);
      return this.http.get<T[]>(url, { params, withCredentials: true });
    }

    return this.http.get<T[]>(url, { withCredentials: true });
  }

  /**
   * Récupère une adresse par son publicId.
   */
  getByPublicId(publicId: string): Observable<T> {
    return this.http.get<T>(
      `${this.getBaseUrl()}/${publicId}`,
      { withCredentials: true }
    );
  }

  /**
   * Récupère l'adresse principale (primary).
   */
  getPrimary(): Observable<T | null> {
    return this.http.get<T | null>(
      `${this.getBaseUrl()}/primary`,
      { withCredentials: true }
    );
  }

  /**
   * Récupère l'adresse par défaut pour un type donné.
   */
  getDefaultForType(type: AddressType): Observable<T | null> {
    return this.http.get<T | null>(
      `${this.getBaseUrl()}/default/${type}`,
      { withCredentials: true }
    );
  }

  /**
   * Récupère les adresses éligibles pour la facturation.
   */
  getBillingEligible(): Observable<T[]> {
    return this.getAll({ billingEligible: true, active: true });
  }

  /**
   * Récupère les adresses éligibles pour la livraison.
   */
  getShippingEligible(): Observable<T[]> {
    return this.getAll({ shippingEligible: true, active: true });
  }

  // ===========================================================================
  // CREATE
  // ===========================================================================

  /**
   * Crée une nouvelle adresse.
   */
  create(request: CreateAddressRequest): Observable<T> {
    return this.http.post<T>(
      this.getBaseUrl(),
      request,
      { withCredentials: true }
    );
  }

  // ===========================================================================
  // UPDATE
  // ===========================================================================

  /**
   * Met à jour une adresse existante (PUT complet).
   */
  update(publicId: string, request: UpdateAddressRequest): Observable<T> {
    return this.http.put<T>(
      `${this.getBaseUrl()}/${publicId}`,
      request,
      { withCredentials: true }
    );
  }

  /**
   * Met à jour partiellement une adresse (PATCH).
   */
  patch(publicId: string, request: Partial<UpdateAddressRequest>): Observable<T> {
    return this.http.patch<T>(
      `${this.getBaseUrl()}/${publicId}`,
      request,
      { withCredentials: true }
    );
  }

  /**
   * Définit une adresse comme défaut pour son type.
   */
  setAsDefault(publicId: string): Observable<T> {
    return this.http.patch<T>(
      `${this.getBaseUrl()}/${publicId}/default`,
      {},
      { withCredentials: true }
    );
  }

  /**
   * Définit une adresse comme principale.
   */
  setAsPrimary(publicId: string): Observable<T> {
    return this.http.patch<T>(
      `${this.getBaseUrl()}/${publicId}/primary`,
      {},
      { withCredentials: true }
    );
  }

  /**
   * Change le type d'une adresse.
   */
  changeType(publicId: string, newType: AddressType, setAsDefault = false): Observable<T> {
    const params = new HttpParams()
      .set('newType', newType)
      .set('setAsDefault', String(setAsDefault));

    return this.http.patch<T>(
      `${this.getBaseUrl()}/${publicId}/type`,
      {},
      { params, withCredentials: true }
    );
  }

  /**
   * Met à jour l'éligibilité facturation/livraison.
   */
  updateEligibility(publicId: string, billing: boolean, shipping: boolean): Observable<T> {
    return this.patch(publicId, {
      billingEligible: billing,
      shippingEligible: shipping
    });
  }

  // ===========================================================================
  // DELETE
  // ===========================================================================

  /**
   * Désactive une adresse (soft delete).
   */
  unlink(publicId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.getBaseUrl()}/${publicId}`,
      { withCredentials: true }
    );
  }

  /**
   * Supprime définitivement une adresse.
   */
  remove(publicId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.getBaseUrl()}/${publicId}/permanent`,
      { withCredentials: true }
    );
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  /**
   * Construit les HttpParams depuis les critères de recherche.
   */
  protected buildHttpParams(criteria: AddressSearchCriteria): HttpParams {
    const paramsObj = buildSearchParams(criteria);
    let params = new HttpParams();

    Object.entries(paramsObj).forEach(([key, value]) => {
      params = params.set(key, value);
    });

    return params;
  }
}
