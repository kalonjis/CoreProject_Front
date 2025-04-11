import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserDTO } from '../models/user/user-dto';
import { UserRole } from '../models/user/user-role';
import { Device } from '../models/device/device';
import { UserRegisterForm } from '../models/admin/user-register-form';
import {HttpUtilService} from '../../core/http/http-util.service';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private httpUtil = inject(HttpUtilService);


  // Pagination par défaut
  private defaultPage = 0;
  private defaultSize = 20;

  /**
   * Récupérer la liste de tous les utilisateurs avec pagination
   */
  getAllUsers(page = this.defaultPage, size = this.defaultSize, sort = 'id,asc'): Observable<any> {
    return this.http.get<any>(`/api/admin/users/all?page=${page}&size=${size}&sort=${sort}`);
  }

  /**
   * Rechercher des utilisateurs par terme de recherche
   */
  searchUsers(query: string, page = this.defaultPage, size = this.defaultSize): Observable<any> {
    return this.http.get<any>(`/api/admin/users/search?query=${encodeURIComponent(query)}&page=${page}&size=${size}`);
  }

  /**
   * Rechercher des utilisateurs par critères spécifiques
   */
  searchUsersByCriteria(criteria: {
    username?: string,
    firstname?: string,
    lastname?: string,
    email?: string,
    phoneNumber?: string
  }, page = this.defaultPage, size = this.defaultSize): Observable<any> {
    // Construire l'URL avec les paramètres non vides
    const params = Object.entries(criteria)
      .filter(([_, value]) => value !== undefined && value !== '')
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');

    return this.http.get<any>(
      `/api/admin/users/searchbycriteria?${params}&page=${page}&size=${size}`
    );
  }

  /**
   * Récupérer un utilisateur par son ID
   */
  getUserById(id: number): Observable<UserDTO> {
    return this.http.get<UserDTO>(`/api/admin/users/${id}`);
  }

  requestPasswordReset(email: string): Observable<any> {
    return this.httpUtil.post<any>('/api/password/request-password-reset', { email }, true);
  }

  /**
   * Créer un nouvel utilisateur (par un administrateur)
   */
  createUser(user: UserRegisterForm): Observable<any> {
    return this.httpUtil.post<any>('/api/admin/users', user);
  }

  /**
   * Supprimer un utilisateur
   */
  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`/api/admin/users/${id}`);
  }

  /**
   * Activer un compte utilisateur
   */
  activateUser(id: number): Observable<void> {
    return this.http.patch<void>(`/api/admin/users/activate/${id}`, {});
  }

  /**
   * Désactiver un compte utilisateur
   */
  deactivateUser(id: number): Observable<void> {
    return this.http.patch<void>(`/api/admin/users/deactivate/${id}`, {});
  }

  /**
   * Ajouter un rôle à un utilisateur
   */
  grantUserRole(id: number, role: UserRole): Observable<void> {
    return this.http.patch<void>(`/api/admin/users/grant-role/${id}`, { userRole: role });
  }

  /**
   * Retirer un rôle à un utilisateur
   */
  revokeUserRole(id: number, role: UserRole): Observable<void> {
    return this.http.patch<void>(`/api/admin/users/revoke-role/${id}`, { userRole: role });
  }

  /**
   * Forcer la réinitialisation du mot de passe d'un utilisateur
   */
  forceResetPassword(id: number): Observable<void> {
    return this.http.patch<void>(`/api/admin/users/force-reset-password/${id}`, {});
  }

  /**
   * Récupérer les appareils d'un utilisateur
   */
  getUserDevices(userId: number): Observable<Device[]> {
    return this.http.get<Device[]>(`/api/admin/device/list/user/${userId}`);
  }
}
