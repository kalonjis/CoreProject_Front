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


type UserDetailTab = 'info' | 'devices' | 'activity' | 'permissions';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FeedbackComponent],
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.scss'
})



export class UserDetailComponent extends FeedbackBase implements OnInit {
  private route = inject(ActivatedRoute);
  private adminService = inject(AdminService);
  private authService: AuthService = inject(AuthService);
  private router: Router = inject(Router);


  userId = signal<number | null>(null);
  user = signal<UserDTO | null>(null);
  isLoading = signal(true);
  activeTab = signal<UserDetailTab>('info');

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



  private handleError(error: HttpErrorResponse): void {
    let errorMessage = 'Une erreur est survenue lors du chargement des données utilisateur.';

    if (error.error?.error) {
      errorMessage = error.error.error;
    }

    this.displayError(errorMessage);
  }
}
