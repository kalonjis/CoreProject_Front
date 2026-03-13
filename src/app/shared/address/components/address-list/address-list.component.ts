// src/app/shared/address/components/address-list/address-list.component.ts

import { Component, Input, Output, EventEmitter, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AddressCardComponent } from '../address-card/address-card.component';
import {
  AddressLink,
  UserAddress,
  AddressType,
  AddressListConfig,
  AddressCardConfig,
  AddressActionEvent,
  DEFAULT_USER_LIST_CONFIG,
  DEFAULT_CARD_CONFIG,
  getAddressTypeLabel,
  getAddressTypeOptions
} from '../../models';

/**
 * Composant liste pour afficher une collection d'adresses.
 *
 * Supporte plusieurs modes d'affichage (cards, table, compact)
 * et des filtres optionnels.
 *
 * Utilisation:
 * ```html
 * <app-address-list
 *   [addresses]="addresses()"
 *   [config]="listConfig"
 *   [isLoading]="isLoading()"
 *   (onCreate)="openCreateModal()"
 *   (onAction)="handleAction($event)">
 * </app-address-list>
 * ```
 */
@Component({
    selector: 'app-address-list',
    imports: [CommonModule, FormsModule, AddressCardComponent],
    templateUrl: './address-list.component.html',
    styleUrl: './address-list.component.scss'
})
export class AddressListComponent {

  // ===========================================================================
  // INPUTS
  // ===========================================================================

  @Input({ required: true }) addresses: AddressLink[] = [];
  @Input() config: AddressListConfig = DEFAULT_USER_LIST_CONFIG;
  @Input() isLoading = false;
  @Input() selectedPublicId: string | null = null;

  // ===========================================================================
  // OUTPUTS
  // ===========================================================================

  @Output() onCreate = new EventEmitter<void>();
  @Output() onAction = new EventEmitter<AddressActionEvent>();
  @Output() onSelect = new EventEmitter<AddressLink>();

  // ===========================================================================
  // LOCAL STATE
  // ===========================================================================

  filterType = signal<AddressType | null>(null);
  filterActive = signal<boolean | null>(null);
  searchQuery = signal<string>('');

  // ===========================================================================
  // COMPUTED VALUES
  // ===========================================================================

  get filteredAddresses(): AddressLink[] {
    let result = [...this.addresses];

    // Filter by type
    const type = this.filterType();
    if (type) {
      result = result.filter(a => a.addressType === type);
    }

    // Filter by active status
    const active = this.filterActive();
    if (active !== null) {
      result = result.filter(a => a.active === active);
    }

    // Filter by search query
    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      result = result.filter(a => {
        const addr = a.address;
        return (
          addr.streetName?.toLowerCase().includes(query) ||
          addr.city?.toLowerCase().includes(query) ||
          addr.postalCode?.toLowerCase().includes(query) ||
          a.label?.toLowerCase().includes(query)
        );
      });
    }

    return result;
  }

  get hasFilters(): boolean {
    return this.filterType() !== null ||
      this.filterActive() !== null ||
      this.searchQuery().trim() !== '';
  }

  get isEmpty(): boolean {
    return this.filteredAddresses.length === 0;
  }

  get typeOptions(): Array<{ value: AddressType; label: string }> {
    return getAddressTypeOptions(this.config.context);
  }

  get cardConfig(): AddressCardConfig {
    return {
      ...DEFAULT_CARD_CONFIG,
      compact: this.config.displayMode === 'compact',
      showFullAddress: this.config.displayMode !== 'compact',
      showBadges: true,
      showActions: true,
      actions: this.getAvailableActions()
    };
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  private getAvailableActions(): AddressActionEvent['action'][] {
    const actions: AddressActionEvent['action'][] = [];

    if (this.config.canEdit) actions.push('edit');
    if (this.config.canSetDefault) actions.push('setDefault');
    if (this.config.canSetPrimary) actions.push('setPrimary');
    if (this.config.canChangeType) actions.push('changeType');
    if (this.config.canDelete) actions.push('delete');

    return actions;
  }

  getTypeLabel(type: AddressType): string {
    return getAddressTypeLabel(type);
  }

  isSelected(address: AddressLink): boolean {
    return this.selectedPublicId === address.publicId;
  }

  // ===========================================================================
  // EVENT HANDLERS
  // ===========================================================================

  handleFilterTypeChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.filterType.set(value ? value as AddressType : null);
  }

  handleFilterActiveChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.filterActive.set(value === '' ? null : value === 'true');
  }

  handleSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }

  clearFilters(): void {
    this.filterType.set(null);
    this.filterActive.set(null);
    this.searchQuery.set('');
  }

  handleCreate(): void {
    this.onCreate.emit();
  }

  handleCardAction(event: AddressActionEvent): void {
    this.onAction.emit(event);
  }

  handleCardClick(address: AddressLink): void {
    this.onSelect.emit(address);
  }

  // ===========================================================================
  // TRACK BY
  // ===========================================================================

  trackByPublicId(_index: number, address: AddressLink): string {
    return address.publicId;
  }
}
