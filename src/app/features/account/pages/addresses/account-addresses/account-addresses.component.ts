// src/app/features/account/pages/addresses/account-addresses.component.ts

import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, catchError, of } from 'rxjs';

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
  DEFAULT_USER_LIST_CONFIG,
  DEFAULT_USER_FORM_CONFIG, AddressLink
} from '../../../../../shared/address';

import { UserAddressApiService } from '../services/user-address-api.service';
import { FeedbackService } from '../../../../../shared/feedback/tools/feedback.service';
import { ConfirmDialogService } from '../../../../../shared/confirm-dialog/tools/confirm-dialog.service';

type ModalMode = 'create' | 'edit';

/**
 * Page de gestion des adresses utilisateur.
 *
 * Route: /account/addresses
 */
@Component({
  selector: 'app-account-addresses',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    AddressListComponent,
    AddressDetailComponent,
    AddressFormModalComponent
  ],
  templateUrl: './account-addresses.component.html',
  styleUrl: './account-addresses.component.scss'
})
export class AccountAddressesComponent implements OnInit {

  // ===========================================================================
  // DEPENDENCIES
  // ===========================================================================

  private destroyRef = inject(DestroyRef);
  private addressApi = inject(UserAddressApiService);
  private feedback = inject(FeedbackService);
  private confirmDialog = inject(ConfirmDialogService);

  // ===========================================================================
  // STATE
  // ===========================================================================

  addresses = signal<UserAddress[]>([]);
  isLoading = signal(true);
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
    ...DEFAULT_USER_LIST_CONFIG,
    displayMode: 'cards',
    showFilters: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canSetDefault: true,
    canSetPrimary: true
  };

  formConfig: AddressFormConfig = {
    ...DEFAULT_USER_FORM_CONFIG
  };

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  ngOnInit(): void {
    this.loadAddresses();
  }

  // ===========================================================================
  // DATA LOADING
  // ===========================================================================

  loadAddresses(): void {
    this.isLoading.set(true);

    this.addressApi.getAll()
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

  handleSelect(address: AddressLink): void {
    this.selectedAddress.set(address as UserAddress);
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
    this.isSubmitting.set(true);

    this.addressApi.create(request)
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
    const address = this.addressToEdit();
    if (!address) return;

    this.isSubmitting.set(true);

    this.addressApi.update(address.publicId, request)
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
        // Annulé par l'utilisateur
      });
  }

  private deleteAddress(address: UserAddress): void {
    this.addressApi.unlink(address.publicId)
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
    this.addressApi.setAsDefault(address.publicId)
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
    this.addressApi.setAsPrimary(address.publicId)
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
}
