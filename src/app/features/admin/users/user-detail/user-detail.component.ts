// src/app/features/admin/users/user-detail/user-detail.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { UserDTO } from '../../../../data/models/user/user-dto';
import { FeedbackComponent } from '../../../../shared/feedback/feedback.component';
import { FeedbackBase } from '../../../../shared/feedback/tools/feedback.base';
import { Device } from '../../../../data/models/device/device';
import { DeviceTrustLevel } from '../../../../data/models/device/device-trust-level';
import { UserRole } from '../../../../data/models/user/user-role';
import { FormsModule } from '@angular/forms';
import { DeviceUtilsService } from '../../../../shared/services/device-utils.service';
import { AuthFacade } from '../../../../core/auth';
import { AdminUserApiService } from '../../services/admin-user-api.service';
import { AdminDeviceApiService } from '../../services/admin-device-api.service';
import { UserLogsComponent } from '../../../activity-logs';

type UserDetailTab = 'info' | 'devices' | 'activity' | 'permissions';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FeedbackComponent, FormsModule, UserLogsComponent],
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.scss'
})
export class UserDetailComponent extends FeedbackBase implements OnInit {
  private route = inject(ActivatedRoute);
  private adminUserApi = inject(AdminUserApiService);
  private adminDeviceApi = inject(AdminDeviceApiService);
  protected authFacade = inject(AuthFacade);
  private router = inject(Router);
  protected deviceUtils = inject(DeviceUtilsService);

  // Stocke le publicId extrait de la route (pour le bouton "Réessayer")
  publicId = signal<string | null>(null);
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

  availableRoles = signal<UserRole[]>([
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MODERATOR,
    UserRole.USER,
    UserRole.GUEST
  ]);
  isUpdatingRole = signal(false);
  roleUpdateError = signal<string | null>(null);

  protected readonly UserRole = UserRole;

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.publicId.set(id);
        this.loadUserDetails(id);
      }
    });

    // Lire le tab depuis les queryParams
    this.route.queryParamMap.subscribe(params => {
      const tab = params.get('tab') as UserDetailTab | null;
      if (tab) this.activeTab.set(tab);
    });
  }

  // ===========================================================================
  // CHARGEMENT
  // ===========================================================================

  loadUserDetails(publicId: string): void {
    this.isLoading.set(true);
    this.adminUserApi.getUserById(publicId).subscribe({
      next: (user) => {
        this.user.set(user);
        this.isLoading.set(false);
        this.loadUserDevices();
      },
      error: (error: HttpErrorResponse) => {
        this.handleError(error);
        this.isLoading.set(false);
      }
    });
  }

  loadUserDevices(): void {
    const user = this.user();
    if (!user) return;

    this.isLoadingDevices = true;
    this.deviceError = null;

    this.adminDeviceApi.getUserDevices(user.publicId).subscribe({
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

  // ===========================================================================
  // NAVIGATION
  // ===========================================================================

  setActiveTab(tab: UserDetailTab): void {
    this.activeTab.set(tab);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  // ===========================================================================
  // ACTIONS UTILISATEUR
  // ===========================================================================

  activateUser(): void {
    const user = this.user();
    if (!user || user.enabled) return;

    this.adminUserApi.activateUser(user.publicId).subscribe({
      next: () => {
        this.displaySuccess('Utilisateur activé avec succès');
        this.user.update(u => u ? { ...u, enabled: true } : null);
      },
      error: (error: HttpErrorResponse) => {
        this.displayError(error.error?.error || "Erreur lors de l'activation de l'utilisateur");
      }
    });
  }

  deactivateUser(): void {
    const user = this.user();
    if (!user || !user.enabled) return;

    this.adminUserApi.deactivateUser(user.publicId).subscribe({
      next: () => {
        this.displaySuccess('Utilisateur désactivé avec succès');
        this.user.update(u => u ? { ...u, enabled: false } : null);
      },
      error: (error: HttpErrorResponse) => {
        this.displayError(error.error?.error || "Erreur lors de la désactivation de l'utilisateur");
      }
    });
  }

  resetPassword(): void {
    if (!this.user()) return;

    if (confirm('Êtes-vous sûr de vouloir réinitialiser le mot de passe de cet utilisateur ? Un email lui sera envoyé.')) {
      this.adminUserApi.forceResetPassword(this.user()!.publicId).subscribe({
        next: () => {
          this.displaySuccess('Un email de réinitialisation de mot de passe a été envoyé à l\'utilisateur');
        },
        error: (error: HttpErrorResponse) => {
          this.displayError(error.error?.error || 'Erreur lors de la réinitialisation du mot de passe');
        }
      });
    }
  }

  deleteUser(): void {
    if (!this.user()) return;

    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) {
      this.adminUserApi.deleteUser(this.user()!.publicId).subscribe({
        next: () => {
          this.displaySuccess('Utilisateur supprimé avec succès');
          setTimeout(() => this.router.navigate(['/admin/users']), 1500);
        },
        error: (error: HttpErrorResponse) => {
          this.displayError(error.error?.error || "Erreur lors de la suppression de l'utilisateur");
        }
      });
    }
  }

  // ===========================================================================
  // GESTION DES RÔLES
  // ===========================================================================

  grantRole(role: UserRole): void {
    const user = this.user();
    if (!user || this.isUpdatingRole()) return;

    this.isUpdatingRole.set(true);
    this.roleUpdateError.set(null);

    this.adminUserApi.grantUserRole(user.publicId, role).subscribe({
      next: () => {
        this.user.update(u => u ? { ...u, userRoles: [...u.userRoles, role] } : null);
        this.displaySuccess(`Rôle ${role} attribué avec succès`);
        this.isUpdatingRole.set(false);
      },
      error: (error: HttpErrorResponse) => {
        const msg = error.error?.error || `Erreur lors de l'attribution du rôle ${role}`;
        this.roleUpdateError.set(msg);
        this.displayError(msg);
        this.isUpdatingRole.set(false);
      }
    });
  }

  revokeRole(role: UserRole): void {
    const user = this.user();
    if (!user || this.isUpdatingRole()) return;

    this.isUpdatingRole.set(true);
    this.roleUpdateError.set(null);

    this.adminUserApi.revokeUserRole(user.publicId, role).subscribe({
      next: () => {
        this.user.update(u => u ? { ...u, userRoles: u.userRoles.filter(r => r !== role) } : null);
        this.displaySuccess(`Rôle ${role} révoqué avec succès`);
        this.isUpdatingRole.set(false);
      },
      error: (error: HttpErrorResponse) => {
        const msg = error.error?.error || `Erreur lors de la révocation du rôle ${role}`;
        this.roleUpdateError.set(msg);
        this.displayError(msg);
        this.isUpdatingRole.set(false);
      }
    });
  }

  hasRole(role: UserRole): boolean {
    return this.user()?.userRoles.includes(role) ?? false;
  }

  canManageRoles(): boolean {
    if (this.isCurrentUserProfile()) return false;

    const isSuperAdmin = this.authFacade.hasRole(UserRole.SUPER_ADMIN);
    const isAdmin = this.authFacade.hasRole(UserRole.ADMIN);
    const targetIsSuperAdmin = this.user()?.userRoles.includes(UserRole.SUPER_ADMIN);

    if (isSuperAdmin) return true;
    if (isAdmin && !targetIsSuperAdmin) return true;
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

  // ===========================================================================
  // APPAREILS
  // ===========================================================================

  selectDeviceDetail(device: Device): void {
    this.selectedDevice = device;
  }

  closeDeviceDetail(): void {
    this.selectedDevice = null;
  }

  sortDevices(field: keyof Device): void {
    if (this.deviceSortField === field) {
      this.deviceSortDirection = this.deviceSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.deviceSortField = field;
      this.deviceSortDirection = 'desc';
    }
  }

  getSortedAndFilteredDevices(): Device[] {
    return this.deviceUtils.getSortedAndFilteredDevices(
      this.devices,
      this.deviceFilterText,
      this.deviceSortField,
      this.deviceSortDirection
    );
  }

  blacklistDevice(publicId: string): void {
    if (!confirm('Êtes-vous sûr de vouloir blacklister cet appareil ? L\'utilisateur ne pourra plus l\'utiliser pour se connecter.')) return;

    this.displayWarning('Fonctionnalité non implémentée : la mise en liste noire des appareils sera disponible prochainement.', 'Compris');

    if (this.selectedDevice?.publicId === publicId) {
      this.closeDeviceDetail();
    }
  }

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
      case DeviceTrustLevel.TRUSTED:        return 'level-trusted';
      case DeviceTrustLevel.BASIC:          return 'level-basic';
      case DeviceTrustLevel.UNTRUSTED:      return 'level-untrusted';
      default:                              return '';
    }
  }

  getDeviceStatus(device: Device): string {
    if (device.blacklisted) return 'Blacklisté';
    if (device.confirmed)   return 'Confirmé';
    return 'Non confirmé';
  }

  getDeviceStatusClass(device: Device): string {
    if (device.blacklisted) return 'status-blacklisted';
    if (device.confirmed)   return 'status-confirmed';
    return 'status-unconfirmed';
  }

  formatDeviceDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  isCurrentUserProfile(): boolean {
    return this.authFacade.username() === this.user()?.username;
  }

  private handleError(error: HttpErrorResponse): void {
    this.displayError(error.error?.error || 'Une erreur est survenue lors du chargement des données utilisateur.');
  }
}
