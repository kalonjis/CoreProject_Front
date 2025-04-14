import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {ConnectionLogDTO} from '../models/Connection-log-dto';
import {Page} from '../models/page';

@Injectable({
  providedIn: 'root'
})
export class ConnectionLogService {
  private http = inject(HttpClient);

  /**
   * Récupère les logs d'activité de l'utilisateur connecté
   */
  getMyLogs(
    types?: string[],
    fromDate?: string,
    toDate?: string,
    page = 0,
    size = 20
  ): Observable<Page<ConnectionLogDTO>> {
    let url = `/api/security/logs/my-actions?page=${page}&size=${size}`;

    if (types && types.length > 0) {
      types.forEach(type => {
        url += `&types=${encodeURIComponent(type)}`;
      });
    }

    if (fromDate) {
      url += `&from=${fromDate}`;
    }

    if (toDate) {
      url += `&to=${toDate}`;
    }

    return this.http.get<Page<ConnectionLogDTO>>(url);
  }

  /**
   * Récupère les connexions récentes de l'utilisateur connecté
   */
  getMyRecentLogins(): Observable<ConnectionLogDTO[]> {
    return this.http.get<ConnectionLogDTO[]>('/api/security/logs/my-recent-logins');
  }

  /**
   * Récupère les statistiques d'activité de l'utilisateur connecté
   */
  getMyStats(): Observable<any> {
    return this.http.get<any>('/api/security/logs/my-stats');
  }

  /**
   * Récupère les alertes de sécurité de l'utilisateur connecté
   */
  getMySecurityAlerts(): Observable<ConnectionLogDTO[]> {
    return this.http.get<ConnectionLogDTO[]>('/api/security/logs/my-security-alerts');
  }

  /**
   * Récupère les logs d'activité d'un utilisateur spécifique (admin only)
   */
  getUserLogs(
    userId: number,
    types?: string[],
    fromDate?: string,
    toDate?: string,
    page = 0,
    size = 20
  ): Observable<Page<ConnectionLogDTO>> {
    let url = `/api/security/logs/user/${userId}/actions?page=${page}&size=${size}`;

    if (types && types.length > 0) {
      types.forEach(type => {
        url += `&types=${encodeURIComponent(type)}`;
      });
    }

    if (fromDate) {
      url += `&from=${fromDate}`;
    }

    if (toDate) {
      url += `&to=${toDate}`;
    }

    return this.http.get<Page<ConnectionLogDTO>>(url);
  }

  /**
   * Récupère les statistiques d'activité d'un utilisateur spécifique (admin only)
   */
  getUserStats(userId: number, fromDate?: string, toDate?: string): Observable<any> {
    let url = `/api/security/logs/user/${userId}/stats`;

    if (fromDate) {
      url += `?from=${fromDate}`;
    }

    if (toDate) {
      url += `${fromDate ? '&' : '?'}to=${toDate}`;
    }

    return this.http.get<any>(url);
  }

  /**
   * Recherche avancée des logs (admin only)
   */
  searchLogs(
    userId?: number,
    ipAddress?: string,
    types?: string[],
    successful?: boolean,
    fromDate?: string,
    toDate?: string,
    page = 0,
    size = 20
  ): Observable<Page<ConnectionLogDTO>> {
    let url = `/api/security/logs/search?page=${page}&size=${size}`;

    if (userId) {
      url += `&userId=${userId}`;
    }

    if (ipAddress) {
      url += `&ipAddress=${encodeURIComponent(ipAddress)}`;
    }

    if (types && types.length > 0) {
      types.forEach(type => {
        url += `&types=${encodeURIComponent(type)}`;
      });
    }

    if (successful !== undefined) {
      url += `&successful=${successful}`;
    }

    if (fromDate) {
      url += `&from=${fromDate}`;
    }

    if (toDate) {
      url += `&to=${toDate}`;
    }

    return this.http.get<Page<ConnectionLogDTO>>(url);
  }

  /**
   * Récupère les types d'actions disponibles
   */
  getActionTypes(): Observable<any[]> {
    return this.http.get<any[]>('/api/security/logs/action-types');
  }

  /**
   * Récupère les statistiques système globales (admin only)
   */
  getSystemStats(fromDate?: string, toDate?: string): Observable<any> {
    let url = '/api/security/logs/system-stats';

    if (fromDate) {
      url += `?from=${fromDate}`;
    }

    if (toDate) {
      url += `${fromDate ? '&' : '?'}to=${toDate}`;
    }

    return this.http.get<any>(url);
  }
}
