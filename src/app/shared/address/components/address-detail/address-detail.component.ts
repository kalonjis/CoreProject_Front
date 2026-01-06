// src/app/shared/address/components/address-detail/address-detail.component.ts

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  AddressLink,
  UserAddress,
  isUserAddress,
  isAddressCurrentlyValid,
  getAddressDisplayName,
  formatAddressMultiLine,
  getAddressTypeLabel,
  getAddressTypeIcon
} from '../../models';

/**
 * Composant pour afficher les détails complets d'une adresse (read-only).
 *
 * Utilisation:
 * ```html
 * <app-address-detail
 *   [address]="selectedAddress"
 *   (onEdit)="openEditModal($event)"
 *   (onClose)="closeDetail()">
 * </app-address-detail>
 * ```
 */
@Component({
  selector: 'app-address-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './address-detail.component.html',
  styleUrl: './address-detail.component.scss'
})
export class AddressDetailComponent {

  // ===========================================================================
  // INPUTS
  // ===========================================================================

  @Input({ required: true }) address!: AddressLink;
  @Input() showActions = true;
  @Input() showMap = false;  // Pour intégration future

  // ===========================================================================
  // OUTPUTS
  // ===========================================================================

  @Output() onEdit = new EventEmitter<string>();
  @Output() onDelete = new EventEmitter<string>();
  @Output() onClose = new EventEmitter<void>();

  // ===========================================================================
  // COMPUTED VALUES
  // ===========================================================================

  get displayName(): string {
    return getAddressDisplayName(this.address);
  }

  get addressLines(): string[] {
    return formatAddressMultiLine(this.address.address);
  }

  get typeLabel(): string {
    return getAddressTypeLabel(this.address.addressType);
  }

  get typeIcon(): string {
    return getAddressTypeIcon(this.address.addressType);
  }

  get isValid(): boolean {
    return isAddressCurrentlyValid(this.address);
  }

  get isUserAddr(): boolean {
    return isUserAddress(this.address);
  }

  get userAddr(): UserAddress | null {
    return isUserAddress(this.address) ? this.address : null;
  }

  get hasCoordinates(): boolean {
    return this.address.address.latitude !== null && this.address.address.longitude !== null;
  }

  get coordinates(): { lat: number; lng: number } | null {
    if (!this.hasCoordinates) return null;
    return {
      lat: this.address.address.latitude!,
      lng: this.address.address.longitude!
    };
  }

  get googleMapsUrl(): string | null {
    if (!this.hasCoordinates) return null;
    const { lat, lng } = this.coordinates!;
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }

  get formattedValidFrom(): string | null {
    return this.address.validFrom
      ? this.formatDate(this.address.validFrom)
      : null;
  }

  get formattedValidTo(): string | null {
    return this.address.validTo
      ? this.formatDate(this.address.validTo)
      : null;
  }

  get formattedCreatedAt(): string {
    return this.formatDate(this.address.createdAt);
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  private formatDate(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleDateString('fr-BE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // ===========================================================================
  // EVENT HANDLERS
  // ===========================================================================

  handleEdit(): void {
    this.onEdit.emit(this.address.publicId);
  }

  handleDelete(): void {
    this.onDelete.emit(this.address.publicId);
  }

  handleClose(): void {
    this.onClose.emit();
  }

  openInMaps(): void {
    if (this.googleMapsUrl) {
      window.open(this.googleMapsUrl, '_blank');
    }
  }
}
