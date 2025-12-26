import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FeedbackComponent } from '../../../../shared/feedback/feedback.component';
import { FeedbackBase } from '../../../../shared/feedback/tools/feedback.base';
import { HttpErrorResponse } from '@angular/common/http';
import { UserDTO } from '../../../../data/models/user/user-dto';
import { UserRole } from '../../../../data/models/user/user-role';
import {ConfirmDialogService} from '../../../../shared/confirm-dialog/tools/confirm-dialog.service';
import {AdminUserApiService} from '../../services/admin-user-api.service';

interface PaginationInfo {
  totalPages: number;
  totalElements: number;
  pageNumber: number;
  pageSize: number;
}

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, FeedbackComponent],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss'
})
export class UserListComponent extends FeedbackBase implements OnInit {
  private adminUserApi = inject(AdminUserApiService);
  private fb = inject(FormBuilder);
  private confirmDialogService: ConfirmDialogService = inject(ConfirmDialogService);


  // État de chargement
  isLoading = signal<boolean>(true);

  // Données des utilisateurs
  users = signal<UserDTO[]>([]);
  pagination = signal<PaginationInfo>({
    totalPages: 0,
    totalElements: 0,
    pageNumber: 0,
    pageSize: 20
  });

  // Interface d'administration
  searchForm: FormGroup;
  showAdvancedSearch = signal(false);

  constructor() {
    super();

    this.searchForm = this.fb.group({
      query: [''],
      username: [''],
      firstname: [''],
      lastname: [''],
      email: [''],
      phoneNumber: ['']
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(page = 0): void {
    this.isLoading.set(true);

    this.adminUserApi.getAllUsers(page, this.pagination().pageSize)
      .subscribe({
        next: (response) => {
          console.log("trying to load users page"),
            console.log("Response from backend:", response);
          this.processUserResponse(response);
        },
        error: (error: HttpErrorResponse) => {
          this.handleError(error);
        }
      });
  }

  search(): void {
    const query = this.searchForm.get('query')?.value;

    if (!query || query.trim() === '') {
      this.loadUsers();
      return;
    }

    this.isLoading.set(true);

    this.adminUserApi.searchUsers(query, 0, this.pagination().pageSize)
      .subscribe({
        next: (response) => {
          this.processUserResponse(response);
        },
        error: (error: HttpErrorResponse) => {
          this.handleError(error);
        }
      });
  }

  advancedSearch(): void {
    const criteria = {
      username: this.searchForm.get('username')?.value,
      firstname: this.searchForm.get('firstname')?.value,
      lastname: this.searchForm.get('lastname')?.value,
      email: this.searchForm.get('email')?.value,
      phoneNumber: this.searchForm.get('phoneNumber')?.value
    };

    // Vérifier si au moins un critère est renseigné
    const hasCriteria = Object.values(criteria).some(value => value && value.trim() !== '');

    if (!hasCriteria) {
      this.loadUsers();
      return;
    }

    this.isLoading.set(true);

    this.adminUserApi.searchUsersByCriteria(criteria, 0, this.pagination().pageSize)
      .subscribe({
        next: (response) => {
          this.processUserResponse(response);
        },
        error: (error: HttpErrorResponse) => {
          this.handleError(error);
        }
      });
  }

  changePage(newPage: number): void {
    if (newPage < 0 || newPage >= this.pagination().totalPages) {
      return;
    }

    this.loadUsers(newPage);
  }

  toggleAdvancedSearch(): void {
    this.showAdvancedSearch.update(val => !val);

    if (!this.showAdvancedSearch()) {
      // Réinitialiser les champs de recherche avancée mais pas le champ de recherche simple
      this.searchForm.patchValue({
        username: '',
        firstname: '',
        lastname: '',
        email: '',
        phoneNumber: ''
      });
    }
  }

  resetSearch(): void {
    this.searchForm.reset();
    this.loadUsers();
  }

  getRoleClass(role: string): string {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'role-super-admin';
      case UserRole.ADMIN:
        return 'role-admin';
      case UserRole.MODERATOR:
        return 'role-moderator';
      case UserRole.USER:
        return 'role-user';
      case UserRole.GUEST:
        return 'role-guest';
      default:
        return '';
    }
  }

  getTopRole(roles: UserRole[]): UserRole {
    // Trouve le rôle avec la plus haute autorité (le plus bas dans l'énumération)
    return roles.reduce((top, current) => {
      const topIndex = Object.values(UserRole).indexOf(top);
      const currentIndex = Object.values(UserRole).indexOf(current);
      return topIndex < currentIndex ? top : current;
    }, UserRole.GUEST);
  }

  protected processUserResponse(response: any): void {
    if (response && response._embedded && response._embedded.userDTOList) {
      this.users.set(response._embedded.userDTOList);

      // Extraire les informations de pagination
      if (response.page) {
        this.pagination.set({
          totalPages: response.page.totalPages,
          totalElements: response.page.totalElements,
          pageNumber: response.page.number,
          pageSize: response.page.size
        });
      }
    } else {
      this.users.set([]);
      this.pagination.set({
        totalPages: 0,
        totalElements: 0,
        pageNumber: 0,
        pageSize: 20
      });
    }

    this.isLoading.set(false);
  }

  protected handleError(error: HttpErrorResponse): void {
    this.isLoading.set(false);

    let errorMessage = 'Une erreur est survenue lors du chargement des utilisateurs.';

    if (error.error && error.error.message) {
      errorMessage = error.error.message;
    }

    this.displayError(errorMessage, 'Réessayer');
    this.buttonAction = () => {
      this.clearFeedback();
      this.loadUsers();
    };
  }

  activateUser(id: number, event: Event): void {
    this.confirmDialogService.confirm({
      message: `Êtes-vous sûr de vouloir activer cet utilsateur?`,
      title: 'Confirmation de l\'activation de l\'utilisateur',
      confirmButtonText: 'Confirmer',
      cancelButtonText: 'Annuler',
      type: 'warning'
    })
      .then(()=>{
        event.preventDefault();
        event.stopPropagation();

        this.adminUserApi.activateUser(id).subscribe({
          next: () => {
            this.displaySuccess('Utilisateur activé avec succès', '');
            this.loadUsers(this.pagination().pageNumber);
          },
          error: (error: HttpErrorResponse) => {
            this.displayError(
              error.error?.message || 'Erreur lors de l\'activation de l\'utilisateur',
              'Réessayer'
            );
          }
        });
      })
      .catch(()=>{})
  }

  deactivateUser(id: number, event: Event): void {
    this.confirmDialogService.confirm({
      message: `Êtes-vous sûr de vouloir désactiver cet utilsateur?`,
      title: 'Confirmation de desactivation de l\'utilisateur',
      confirmButtonText: 'Confirmer',
      cancelButtonText: 'Annuler',
      type: 'warning'
    })
      .then(()=>{
        event.preventDefault();
        event.stopPropagation();

        this.adminUserApi.deactivateUser(id).subscribe({
          next: () => {
            this.displaySuccess('Utilisateur désactivé avec succès', '');
            this.loadUsers(this.pagination().pageNumber);
          },
          error: (error: HttpErrorResponse) => {
            this.displayError(
              error.error?.message || 'Erreur lors de la désactivation de l\'utilisateur',
              'Réessayer'
            );
          }
        });
      })
      .catch(() => {})
  }

  deleteUser(id: number, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) {
      this.adminUserApi.deleteUser(id).subscribe({
        next: () => {
          this.displaySuccess('Utilisateur supprimé avec succès', '');
          this.loadUsers(this.pagination().pageNumber);
        },
        error: (error: HttpErrorResponse) => {
          this.displayError(
            error.error?.message || 'Erreur lors de la suppression de l\'utilisateur',
            'Réessayer'
          );
        }
      });
    }
  }

  resetPassword(id: number, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (confirm('Êtes-vous sûr de vouloir réinitialiser le mot de passe de cet utilisateur ?')) {
      this.adminUserApi.forceResetPassword(id).subscribe({
        next: () => {
          this.displaySuccess(
            'Un email de réinitialisation de mot de passe a été envoyé à l\'utilisateur',
            ''
          );
        },
        error: (error: HttpErrorResponse) => {
          this.displayError(
            error.error?.message || 'Erreur lors de la réinitialisation du mot de passe',
            'Réessayer'
          );
        }
      });
    }
  }
}
