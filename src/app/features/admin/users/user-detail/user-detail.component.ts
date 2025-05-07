// src/app/features/admin/users/user-detail/user-detail.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminService } from '../../../../data/services/admin.service';
import { UserDTO } from '../../../../data/models/user/user-dto';
import { FeedbackComponent } from '../../../../shared/feedback/feedback.component';
import { FeedbackBase } from '../../../../shared/feedback/tools/feedback.base';
import {AuthService} from '../../../../core/auth/services/auth.service';
import {ConnectionLogDTO, LogPagination} from '../../../../data/models/log/connection-log-dto';
import {Device} from '../../../../data/models/device/device';
import {DeviceTrustLevel} from '../../../../data/models/device/device-trust-level';
import {UserRole} from '../../../../data/models/user/user-role';
import {FormsModule} from '@angular/forms';
import {DeviceUtilsService} from '../../../../shared/services/device-utils.service';


type UserDetailTab = 'info' | 'devices' | 'activity' | 'permissions';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FeedbackComponent, FormsModule],
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.scss'
})


export class UserDetailComponent extends FeedbackBase implements OnInit {
  private route = inject(ActivatedRoute);
  private adminService = inject(AdminService);
  protected authService: AuthService = inject(AuthService);
  private router: Router = inject(Router);


  userId = signal<number | null>(null);
  user = signal<UserDTO | null>(null);
  isLoading = signal(true);
  activeTab = signal<UserDetailTab>('info');


  devices: Device[] = [];
  isLoadingDevices = false;
  deviceError: string | null = null;
  deviceFilterText = '';
  deviceSortField: keyof Device = 'lastSeen';
  deviceSortDirection: 'asc' | 'desc' = 'desc';
  selectedDevice: Device | null = null;

  protected deviceUtils = inject(DeviceUtilsService);

  activityLogs = signal<ConnectionLogDTO[]>([]);
  isLoadingLogs = signal(false);
  activityPagination = signal<LogPagination>({
    totalPages: 0,
    totalElements: 0,
    pageNumber: 0,
    pageSize: 10
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.userId.set(parseInt(idParam, 10));
        this.loadUserDetails(parseInt(idParam, 10));
        this.loadUserDevices();
      }
    });
  }

  loadUserDetails(userId: number): void {
    this.isLoading.set(true);

    this.adminService.getUserById(userId).subscribe({
      next: (user) => {
        this.user.set(user);
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.handleError(error);
        this.isLoading.set(false);
      }
    });
  }


  // Méthode pour changer d'onglet
  // Pour charger les logs quand on change d'onglet
  setActiveTab(tab: UserDetailTab): void {
    this.activeTab.set(tab);

    // Charger les données spécifiques à l'onglet si nécessaire
    if (tab === 'activity' && this.activityLogs().length === 0) {
      this.loadActivityLogs();
    }

    // Mettre à jour l'URL sans recharger la page
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }


  activateUser(): void {
    if (!this.user() || this.user()?.enabled) {
      return;
    }

    this.adminService.activateUser(this.userId()!).subscribe({
      next: () => {
        this.displaySuccess('Utilisateur activé avec succès');
        // Mettre à jour l'état local
        this.user.update(user => user ? { ...user, enabled: true } : null);
      },
      error: (error: HttpErrorResponse) => {
        this.displayError(
          error.error?.error || 'Erreur lors de l\'activation de l\'utilisateur'
        );
      }
    });
  }

  /**
   * Désactive un utilisateur actif
   */
  deactivateUser(): void {
    if (!this.user() || !this.user()?.enabled) {
      return;
    }

    this.adminService.deactivateUser(this.userId()!).subscribe({
      next: () => {
        this.displaySuccess('Utilisateur désactivé avec succès');
        // Mettre à jour l'état local
        this.user.update(user => user ? { ...user, enabled: false } : null);
      },
      error: (error: HttpErrorResponse) => {
        console.log("deactivate error: ", error);
        this.displayError(
          error.error?.error || 'Erreur lors de la désactivation de l\'utilisateur'
        );
      }
    });
  }

  /**
   * Réinitialise le mot de passe de l'utilisateur
   */
  resetPassword(): void {
    if (!this.user()) {
      return;
    }

    if (confirm('Êtes-vous sûr de vouloir réinitialiser le mot de passe de cet utilisateur ? Un email lui sera envoyé.')) {
      this.adminService.forceResetPassword(this.userId()!).subscribe({
        next: () => {
          this.displaySuccess(
            'Un email de réinitialisation de mot de passe a été envoyé à l\'utilisateur'
          );
        },
        error: (error: HttpErrorResponse) => {
          this.displayError(
            error.error?.error || 'Erreur lors de la réinitialisation du mot de passe'
          );
        }
      });
    }
  }

  /**
   * Supprime l'utilisateur
   */
  deleteUser(): void {
    if (!this.user()) {
      return;
    }

    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) {
      this.adminService.deleteUser(this.userId()!).subscribe({
        next: () => {
          this.displaySuccess('Utilisateur supprimé avec succès');
          // Rediriger vers la liste des utilisateurs après un court délai
          setTimeout(() => {
            window.location.href = '/admin/users';
          }, 1500);
        },
        error: (error: HttpErrorResponse) => {
          this.displayError(
            error.error?.error || 'Erreur lors de la suppression de l\'utilisateur'
          );
        }
      });
    }
  }


  // Méthode pour vérifier si c'est le profil de l'utilisateur connecté
  isCurrentUserProfile(): boolean {
    if (!this.user()) {
      return false;
    }

    const currentUsername = this.authService.username();
    return currentUsername === this.user()?.username;
  }



  // Ajoutez cette méthode pour charger les appareils
  loadUserDevices(): void {
    if (!this.userId()) {
      return;
    }
    this.isLoadingDevices = true;

    // Vérifiez si userId a une valeur
    this.adminService.getUserDevices(this.userId()!).subscribe({
      next: (devices) => {
        this.devices = devices;
        this.isLoadingDevices = false;
      },
      error: (err) => {
        this.deviceError = "Impossible de charger les appareils de l'utilisateur";
        this.isLoadingDevices = false;
        console.error('Erreur lors du chargement des appareils', err);
      }
    });
  }

  // Méthodes utilitaires pour l'affichage des appareils
  getTrustLevelLabel(level: DeviceTrustLevel): string {
    const labels: Record<DeviceTrustLevel, string> = {
      [DeviceTrustLevel.UNTRUSTED]: 'Non approuvé',
      [DeviceTrustLevel.BASIC]: 'Basique',
      [DeviceTrustLevel.TRUSTED]: 'Approuvé',
      [DeviceTrustLevel.HIGHLY_TRUSTED]: 'Haute confiance'
    };
    return labels[level] || 'Inconnu';
  }

  getTrustLevelClass(level: DeviceTrustLevel): string {
    switch (level) {
      case DeviceTrustLevel.HIGHLY_TRUSTED: return 'level-highly-trusted';
      case DeviceTrustLevel.TRUSTED: return 'level-trusted';
      case DeviceTrustLevel.BASIC: return 'level-basic';
      case DeviceTrustLevel.UNTRUSTED: return 'level-untrusted';
      default: return '';
    }
  }

  formatDeviceDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  getDeviceStatus(device: Device): string {
    if (device.blacklisted) return 'Blacklisté';
    if (device.confirmed) return 'Confirmé';
    return 'Non confirmé';
  }

  getDeviceStatusClass(device: Device): string {
    if (device.blacklisted) return 'status-blacklisted';
    if (device.confirmed) return 'status-confirmed';
    return 'status-unconfirmed';
  }


  // Pour l'onglet activité

  // Méthode pour charger les logs d'activité
  loadActivityLogs(page = 0): void {
    if (!this.userId()) {
      return;
    }

    this.isLoadingLogs.set(true);

    this.adminService.getUserActivityHistory(
      this.userId()!,
      page,
      this.activityPagination().pageSize
    ).subscribe({
      next: (response) => {
        if (response && response._embedded && response._embedded.connectionLogDTOList) {
          this.activityLogs.set(response._embedded.connectionLogDTOList);

          // Mise à jour de la pagination
          if (response.page) {
            this.activityPagination.set({
              totalPages: response.page.totalPages,
              totalElements: response.page.totalElements,
              pageNumber: response.page.number,
              pageSize: response.page.size
            });
          }
        }
        this.isLoadingLogs.set(false);
      },
      error: (error) => {
        this.displayError("Erreur lors du chargement de l'historique d'activité");
        this.isLoadingLogs.set(false);
      }
    });
  }

// Méthode pour changer de page dans les logs
  changeActivityPage(newPage: number): void {
    if (newPage < 0 || newPage >= this.activityPagination().totalPages) {
      return;
    }

    this.loadActivityLogs(newPage);
  }

// Méthode pour obtenir la couleur CSS en fonction du type d'action
  getActionTypeClass(actionType: string): string {
    if (!actionType) return '';

    if (actionType.startsWith('AUTH_')) {
      return 'action-auth';
    } else if (actionType.startsWith('ACCOUNT_')) {
      return 'action-account';
    } else if (actionType.startsWith('PASSWORD_')) {
      return 'action-password';
    } else if (actionType.startsWith('EMAIL_')) {
      return 'action-email';
    } else if (actionType.startsWith('DEVICE_')) {
      return 'action-device';
    } else if (actionType.startsWith('SECURITY_')) {
      return 'action-security';
    }

    return 'action-other';
  }


  // Propriétés pour la gestion des rôles
  availableRoles = signal<UserRole[]>([
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MODERATOR,
    UserRole.USER,
    UserRole.GUEST
  ]);
  isUpdatingRole = signal(false);
  roleUpdateError = signal<string | null>(null);

// Méthodes pour la gestion des rôles
  grantRole(role: UserRole): void {
    if (!this.userId() || this.isUpdatingRole()) return;

    this.isUpdatingRole.set(true);
    this.roleUpdateError.set(null);

    this.adminService.grantUserRole(this.userId()!, role).subscribe({
      next: () => {
        // Mettre à jour le modèle local
        this.user.update(user => {
          if (!user) return null;

          // Créer une copie des rôles actuels et y ajouter le nouveau rôle
          const updatedRoles = [...user.userRoles, role];

          return {
            ...user,
            userRoles: updatedRoles
          };
        });

        this.displaySuccess(`Rôle ${role} attribué avec succès`);
        this.isUpdatingRole.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.roleUpdateError.set(
          error.error?.error || `Erreur lors de l'attribution du rôle ${role}`
        );
        this.isUpdatingRole.set(false);
        this.displayError(this.roleUpdateError()!);
      }
    });
  }

  revokeRole(role: UserRole): void {
    if (!this.userId() || this.isUpdatingRole()) return;

    this.isUpdatingRole.set(true);
    this.roleUpdateError.set(null);

    this.adminService.revokeUserRole(this.userId()!, role).subscribe({
      next: () => {
        // Mettre à jour le modèle local
        this.user.update(user => {
          if (!user) return null;

          // Créer une copie des rôles sans le rôle révoqué
          const updatedRoles = user.userRoles.filter(r => r !== role);

          return {
            ...user,
            userRoles: updatedRoles
          };
        });

        this.displaySuccess(`Rôle ${role} révoqué avec succès`);
        this.isUpdatingRole.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.roleUpdateError.set(
          error.error?.error || `Erreur lors de la révocation du rôle ${role}`
        );
        this.isUpdatingRole.set(false);
        this.displayError(this.roleUpdateError()!);
      }
    });
  }

// Vérifier si un utilisateur possède un rôle spécifique
  hasRole(role: UserRole): boolean {
    return this.user()?.userRoles.includes(role) || false;
  }

// Vérifier si l'utilisateur connecté peut modifier les rôles (vérification supplémentaire)
  canManageRoles(): boolean {
    // Vérifier si on est sur son propre profil
    if (this.isCurrentUserProfile()) {
      return false;
    }

    // Vérifier les règles de gestion des rôles
    const isSuperAdmin = this.authService.hasRole('SUPER_ADMIN');
    const isAdmin = this.authService.hasRole('ADMIN');
    const targetIsSuperAdmin = this.user()?.userRoles.includes(UserRole.SUPER_ADMIN);

    // Un SUPER_ADMIN peut gérer tous les utilisateurs
    if (isSuperAdmin) {
      return true;
    }

    // Un ADMIN peut gérer tous les utilisateurs sauf les SUPER_ADMIN
    if (isAdmin && !targetIsSuperAdmin) {
      return true;
    }

    return false;
  }

  getRoleDescription(role: UserRole): string {
    const descriptions: Record<UserRole, string> = {
      [UserRole.SUPER_ADMIN]: 'Accès complet à toutes les fonctionnalités et tous les utilisateurs',
      [UserRole.ADMIN]: 'Gestion des utilisateurs et des contenus',
      [UserRole.MODERATOR]: 'Modération des contenus et des interactions',
      [UserRole.USER]: 'Accès aux fonctionnalités standard',
      [UserRole.GUEST]: 'Accès limité en lecture seule'
    };

    return descriptions[role] || 'Description non disponible';
  }



  private handleError(error: HttpErrorResponse): void {
    let errorMessage = 'Une erreur est survenue lors du chargement des données utilisateur.';

    if (error.error?.error) {
      errorMessage = error.error.error;
    }

    this.displayError(errorMessage);
  }

  protected readonly UserRole = UserRole;

  /**
   * Sélectionne un appareil pour afficher ses détails
   */
  selectDeviceDetail(device: Device): void {
    this.selectedDevice = device;
  }

  /**
   * Ferme le panneau de détails de l'appareil
   */
  closeDeviceDetail(): void {
    this.selectedDevice = null;
  }

  /**
   * Trie les appareils selon un champ spécifique
   */
  sortDevices(field: keyof Device): void {
    if (this.deviceSortField === field) {
      // Inverser la direction si on clique sur le même champ
      this.deviceSortDirection = this.deviceSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Nouveau champ de tri, réinitialiser à desc (récent -> ancien)
      this.deviceSortField = field;
      this.deviceSortDirection = 'desc';
    }
  }


// Méthode pour filtrer et trier les appareils
  getSortedAndFilteredDevices(): Device[] {
    return this.deviceUtils.getSortedAndFilteredDevices(
      this.devices,
      this.deviceFilterText,
      this.deviceSortField,
      this.deviceSortDirection
    );
  }

// Méthode pour blacklister un appareil (à implémenter)
  blacklistDevice(deviceId: number): void {
    if (!confirm('Êtes-vous sûr de vouloir blacklister cet appareil ? L\'utilisateur ne pourra plus l\'utiliser pour se connecter.')) {
      return;
    }

    // Fonctionnalité à implémenter
    this.displayWarning(
      'Fonctionnalité non implémentée : la mise en liste noire des appareils sera disponible prochainement.',
      'Compris'
    );

    // Fermer le panneau de détails si ouvert
    if (this.selectedDevice && this.selectedDevice.id === deviceId) {
      this.closeDeviceDetail();
    }
  }




}
