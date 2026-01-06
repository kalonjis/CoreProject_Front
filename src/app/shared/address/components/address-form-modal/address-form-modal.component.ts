// src/app/shared/address/components/address-form-modal/address-form-modal.component.ts

import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AddressFormComponent, AddressFormMode } from '../address-form/address-form.component';
import {
  AddressLink,
  AddressFormConfig,
  CreateAddressRequest,
  UpdateAddressRequest,
  DEFAULT_USER_FORM_CONFIG
} from '../../models';

/**
 * Composant modale encapsulant AddressFormComponent.
 *
 * Gère l'ouverture/fermeture et le backdrop de la modale.
 *
 * Utilisation:
 * ```html
 * <app-address-form-modal
 *   [isOpen]="showModal()"
 *   [mode]="modalMode()"
 *   [address]="addressToEdit()"
 *   [config]="formConfig"
 *   [isSubmitting]="isSubmitting()"
 *   (onClose)="closeModal()"
 *   (onSave)="handleSave($event)">
 * </app-address-form-modal>
 * ```
 */
@Component({
  selector: 'app-address-form-modal',
  standalone: true,
  imports: [CommonModule, AddressFormComponent],
  templateUrl: './address-form-modal.component.html',
  styleUrl: './address-form-modal.component.scss'
})
export class AddressFormModalComponent implements OnChanges {

  // ===========================================================================
  // INPUTS
  // ===========================================================================

  @Input() isOpen = false;
  @Input() mode: AddressFormMode = 'create';
  @Input() address: AddressLink | null = null;
  @Input() config: AddressFormConfig = DEFAULT_USER_FORM_CONFIG;
  @Input() isSubmitting = false;

  // ===========================================================================
  // OUTPUTS
  // ===========================================================================

  @Output() onClose = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<CreateAddressRequest | UpdateAddressRequest>();

  // ===========================================================================
  // LOCAL STATE
  // ===========================================================================

  isVisible = false;
  isAnimating = false;

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      if (this.isOpen) {
        this.openModal();
      } else {
        this.closeModal();
      }
    }
  }

  // ===========================================================================
  // MODAL CONTROL
  // ===========================================================================

  private openModal(): void {
    this.isVisible = true;
    this.isAnimating = true;

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // End animation
    setTimeout(() => {
      this.isAnimating = false;
    }, 200);
  }

  private closeModal(): void {
    this.isAnimating = true;

    setTimeout(() => {
      this.isVisible = false;
      this.isAnimating = false;

      // Restore body scroll
      document.body.style.overflow = '';
    }, 200);
  }

  // ===========================================================================
  // COMPUTED
  // ===========================================================================

  get modalTitle(): string {
    return this.mode === 'edit' ? 'Modifier l\'adresse' : 'Nouvelle adresse';
  }

  // ===========================================================================
  // EVENT HANDLERS
  // ===========================================================================

  handleBackdropClick(event: MouseEvent): void {
    // Only close if clicking directly on backdrop, not on modal content
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.handleClose();
    }
  }

  handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && !this.isSubmitting) {
      this.handleClose();
    }
  }

  handleClose(): void {
    if (!this.isSubmitting) {
      this.onClose.emit();
    }
  }

  handleFormSubmit(data: CreateAddressRequest | UpdateAddressRequest): void {
    this.onSave.emit(data);
  }

  handleFormCancel(): void {
    this.handleClose();
  }
}
