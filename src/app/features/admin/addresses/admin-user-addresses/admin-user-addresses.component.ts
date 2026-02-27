// src/app/features/admin/addresses/admin-user-addresses.component.ts

import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, catchError, of, switchMap } from 'rxjs';

import {
  AddressListComponent,
  AddressDetailComponent,
  AddressFormModalComponent,
  UserAddress,
  AddressListConfig,
  AddressFormConfig,
  AddressActionEvent,
  CreateAddressRequest,
  UpdateAddressRequest,
  DEFAULT_ADMIN_LIST_CONFIG,
  DEFAULT_ADMIN_FORM_CONFIG
} from '../../../../shared/address';

import { AdminAddressApiService } from '../services/admin-address-api.service';
import { AdminUserApiService } from '../../users/services/admin-user-api.service';
import { FeedbackService } from '../../../../shared/feedback/tools/feedback.service';
import { ConfirmDialogService } from '../../../../shared/confirm-dialog/tools/confirm-dialog.service';
import { UserDTO } from '../../../../data/models/user/user-dto';

type ModalMode = 'create' | 'edit';

/**
 * Page admin pour gérer les adresses d'un utilisateur spécifique.
 *
 * Route: /admin/users/:userId/addresses
 */
@Component({
  selector: 'app-admin-user-addresses',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    AddressListComponent,
    AddressDetailComponent,
    AddressFormModalComponent
  ],
  templateUrl: './admin-user-addresses.component.html',
  styleUrl: './admin-user-addresses.component.scss'
})
export class AdminUserAddressesComponent implements OnInit {

  // ===========================================================================
  // DEPENDENCIES
  // ===========================================================================

  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private addressApi = inject(AdminAddressApiService);
  private userApi = inject(AdminUserApiService);
  private feedback = inject(FeedbackService);
  private confirmDialog = inject(ConfirmDialogService);

  // ===========================================================================
  // STATE
  // ===========================================================================

  userId = signal<number | null>(null);
  user = signal<UserDTO | null>(null);
  addresses = signal<UserAddress[]>([]);
  isLoading = signal(true);
  isLoadingUser = signal(true);
  selectedAddress = signal<UserAddress | null>(null);

  // Modal state
  showModal = signal(false);
  modalMode = signal<ModalMode>('create');
  addressToEdit = signal<UserAddress | null>(null);
  isSubmitting = signal(false);

  // ===========================================================================
  // CONFIG
  // ===========================================================================

  listConfig: AddressListConfig = {
    ...DEFAULT_ADMIN_LIST_CONFIG,
    displayMode: 'table',
    showFilters: true,
    showSearch: true,
    showValidityPeriod: true,
    showVerifiedBadge: true,
    defaultActiveOnly: false,  // Admin voit aussi les inactives
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canSetDefault: true,
    canSetPrimary: true
  };

  formConfig: AddressFormConfig = {
    ...DEFAULT_ADMIN_FORM_CONFIG
  };

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const id = +params['userId'];
        if (!isNaN(id) && id > 0) {
          this.userId.set(id);
          this.loadUser(id);
          this.loadAddresses(id);
        } else {
          this.feedback.showError('ID utilisateur invalide');
          this.router.navigate(['/admin/users']);
        }
      });
  }

  // ===========================================================================
  // DATA LOADING
  // ===========================================================================

  private loadUser(userId: number): void {
    this.isLoadingUser.set(true);

    this.userApi.getUserById(userId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoadingUser.set(false)),
        catchError(err => {
          this.feedback.showError('Impossible de charger l\'utilisateur');
          console.error('Error loading user:', err);
          return of(null);
        })
      )
      .subscribe(user => {
        this.user.set(user);
      });
  }

  loadAddresses(userId?: number): void {
    const id = userId ?? this.userId();
    if (!id) return;

    this.isLoading.set(true);

    this.addressApi.getAllForUser(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
        catchError(err => {
          this.feedback.showError('Impossible de charger les adresses');
          console.error('Error loading addresses:', err);
          return of([]);
        })
      )
      .subscribe(addresses => {
        this.addresses.set(addresses);
      });
  }

  // ===========================================================================
  // LIST ACTIONS
  // ===========================================================================

  handleCreate(): void {
    this.modalMode.set('create');
    this.addressToEdit.set(null);
    this.showModal.set(true);
  }

  handleSelect(address: UserAddress): void {
    this.selectedAddress.set(address);
  }

  handleAction(event: AddressActionEvent): void {
    const address = this.addresses().find(a => a.publicId === event.publicId);
    if (!address) return;

    switch (event.action) {
      case 'edit':
        this.openEditModal(address);
        break;
      case 'delete':
        this.confirmDelete(address);
        break;
      case 'setDefault':
        this.setAsDefault(address);
        break;
      case 'setPrimary':
        this.setAsPrimary(address);
        break;
      case 'view':
        this.selectedAddress.set(address);
        break;
    }
  }

  // ===========================================================================
  // MODAL HANDLERS
  // ===========================================================================

  openEditModal(address: UserAddress): void {
    this.modalMode.set('edit');
    this.addressToEdit.set(address);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.addressToEdit.set(null);
  }

  handleSave(data: CreateAddressRequest | UpdateAddressRequest): void {
    if (this.modalMode() === 'create') {
      this.createAddress(data as CreateAddressRequest);
    } else {
      this.updateAddress(data as UpdateAddressRequest);
    }
  }

  // ===========================================================================
  // DETAIL PANEL HANDLERS
  // ===========================================================================

  closeDetail(): void {
    this.selectedAddress.set(null);
  }

  handleDetailEdit(publicId: string): void {
    const address = this.addresses().find(a => a.publicId === publicId);
    if (address) {
      this.openEditModal(address);
    }
  }

  handleDetailDelete(publicId: string): void {
    const address = this.addresses().find(a => a.publicId === publicId);
    if (address) {
      this.confirmDelete(address);
    }
  }

  // ===========================================================================
  // API OPERATIONS
  // ===========================================================================

  private createAddress(request: CreateAddressRequest): void {
    const userId = this.userId();
    if (!userId) return;

    this.isSubmitting.set(true);

    this.addressApi.createForUser(userId, request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSubmitting.set(false)),
        catchError(err => {
          this.feedback.showError('Impossible de créer l\'adresse');
          console.error('Error creating address:', err);
          return of(null);
        })
      )
      .subscribe(newAddress => {
        if (newAddress) {
          this.addresses.update(list => [...list, newAddress]);
          this.closeModal();
          this.feedback.showSuccess('Adresse créée avec succès');
        }
      });
  }

  private updateAddress(request: UpdateAddressRequest): void {
    const userId = this.userId();
    const address = this.addressToEdit();
    if (!userId || !address) return;

    this.isSubmitting.set(true);

    this.addressApi.updateForUser(userId, address.publicId, request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSubmitting.set(false)),
        catchError(err => {
          this.feedback.showError('Impossible de modifier l\'adresse');
          console.error('Error updating address:', err);
          return of(null);
        })
      )
      .subscribe(updated => {
        if (updated) {
          this.addresses.update(list =>
            list.map(a => a.publicId === updated.publicId ? updated : a)
          );

          if (this.selectedAddress()?.publicId === updated.publicId) {
            this.selectedAddress.set(updated);
          }

          this.closeModal();
          this.feedback.showSuccess('Adresse modifiée avec succès');
        }
      });
  }

  private confirmDelete(address: UserAddress): void {
    this.confirmDialog.confirm({
      title: 'Supprimer l\'adresse',
      message: `Êtes-vous sûr de vouloir supprimer cette adresse ?`,
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      type: 'danger'
    })
      .then(() => {
        this.deleteAddress(address);
      })
      .catch(() => {
      });
  }

  private deleteAddress(address: UserAddress): void {
    const userId = this.userId();
    if (!userId) return;

    this.addressApi.unlinkForUser(userId, address.publicId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(err => {
          this.feedback.showError('Impossible de supprimer l\'adresse');
          console.error('Error deleting address:', err);
          return of(null);
        })
      )
      .subscribe(() => {
        this.addresses.update(list =>
          list.filter(a => a.publicId !== address.publicId)
        );

        if (this.selectedAddress()?.publicId === address.publicId) {
          this.selectedAddress.set(null);
        }

        this.feedback.showSuccess('Adresse supprimée');
      });
  }

  private setAsDefault(address: UserAddress): void {
    const userId = this.userId();
    if (!userId) return;

    this.addressApi.setAsDefault(userId, address.publicId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(err => {
          this.feedback.showError('Impossible de définir l\'adresse par défaut');
          console.error('Error setting default:', err);
          return of(null);
        })
      )
      .subscribe(updated => {
        if (updated) {
          this.addresses.update(list =>
            list.map(a => {
              if (a.publicId === updated.publicId) {
                return updated;
              }
              if (a.addressType === updated.addressType && a.isDefault) {
                return { ...a, isDefault: false };
              }
              return a;
            })
          );

          this.feedback.showSuccess('Adresse définie par défaut');
        }
      });
  }

  private setAsPrimary(address: UserAddress): void {
    const userId = this.userId();
    if (!userId) return;

    this.addressApi.setAsPrimary(userId, address.publicId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(err => {
          this.feedback.showError('Impossible de définir l\'adresse principale');
          console.error('Error setting primary:', err);
          return of(null);
        })
      )
      .subscribe(updated => {
        if (updated) {
          this.addresses.update(list =>
            list.map(a => {
              if (a.publicId === updated.publicId) {
                return updated;
              }
              if (a.isPrimary) {
                return { ...a, isPrimary: false };
              }
              return a;
            })
          );

          this.feedback.showSuccess('Adresse principale définie');
        }
      });
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  get userDisplayName(): string {
    const u = this.user();
    if (!u) return 'Utilisateur';
    return u.firstname && u.lastname
      ? `${u.firstname} ${u.lastname}`
      : u.username || u.email || 'Utilisateur';
  }

  goBack(): void {
    const userId = this.userId();
    if (userId) {
      this.router.navigate(['/admin/users', userId]);
    } else {
      this.router.navigate(['/admin/users']);
    }
  }
}
