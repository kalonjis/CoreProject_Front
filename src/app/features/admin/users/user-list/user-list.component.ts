import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FeedbackComponent } from '../../../../shared/feedback/feedback.component';
import { FeedbackBase } from '../../../../shared/feedback/tools/feedback.base';
import { HttpErrorResponse } from '@angular/common/http';
import { UserRole } from '../../../../data/models/user/user-role';
import { ConfirmDialogService } from '../../../../shared/confirm-dialog/tools/confirm-dialog.service';
import { AdminUserApiService } from '../../services/admin-user-api.service';
import {AdminUserDTO} from '../../models/admin-user-dto';

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

  // Données des utilisateurs (now using AdminUserDTO)
  users = signal<AdminUserDTO[]>([]);
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
      searchQuery: [''],
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
          this.processUserResponse(response);
        },
        error: (error: HttpErrorResponse) => {
          this.handleError(error);
        }
      });
  }

  searchUsers(): void {
    const searchQuery = this.searchForm.get('searchQuery')?.value?.trim();

    if (!searchQuery) {
      this.loadUsers();
      return;
    }

    this.isLoading.set(true);

    this.adminUserApi.searchUsers(searchQuery, 0, this.pagination().pageSize)
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
      username: this.searchForm.get('username')?.value?.trim(),
      firstname: this.searchForm.get('firstname')?.value?.trim(),
      lastname: this.searchForm.get('lastname')?.value?.trim(),
      email: this.searchForm.get('email')?.value?.trim(),
      phoneNumber: this.searchForm.get('phoneNumber')?.value?.trim()
    };

    // Check if at least one criterion is provided
    const hasAnyCriteria = Object.values(criteria).some(val => val);

    if (!hasAnyCriteria) {
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
      // Reset advanced search fields but not simple search
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
    // Find role with highest authority (lowest in enumeration)
    return roles.reduce((top, current) => {
      const topIndex = Object.values(UserRole).indexOf(top);
      const currentIndex = Object.values(UserRole).indexOf(current);
      return topIndex < currentIndex ? top : current;
    }, UserRole.GUEST);
  }

  /**
   * Format date for display
   */
  formatDate(date?: Date): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-BE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  protected processUserResponse(response: any): void {
    if (response && response.content) {
      this.users.set(response.content);

      // Extract pagination information
      this.pagination.set({
        totalPages: response.totalPages || 0,
        totalElements: response.totalElements || 0,
        pageNumber: response.number || 0,
        pageSize: response.size || 20
      });
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

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status === 403) {
      errorMessage = 'Vous n\'avez pas les permissions nécessaires pour accéder à cette ressource.';
    } else if (error.status === 0) {
      errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
    }

    this.displayError(errorMessage);
  }
}
