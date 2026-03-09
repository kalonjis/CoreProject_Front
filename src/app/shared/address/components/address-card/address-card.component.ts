// src/app/shared/address/components/address-card/address-card.component.ts

import { Component, Input, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  AddressLink,
  UserAddress,
  AddressCardConfig,
  AddressCardAction,
  AddressActionEvent,
  DEFAULT_CARD_CONFIG,
  isUserAddress,
  getAddressDisplayName,
  formatAddressMultiLine,
  getAddressTypeLabel,
  getAddressTypeIcon,
  isAddressCurrentlyValid
} from '../../models';

/**
 * Composant carte pour afficher une adresse de manière compacte.
 *
 * Utilisation:
 * ```html
 * <app-address-card
 *   [address]="userAddress"
 *   [config]="cardConfig"
 *   (onAction)="handleAction($event)">
 * </app-address-card>
 * ```
 */
@Component({
    selector: 'app-address-card',
    imports: [CommonModule],
    templateUrl: './address-card.component.html',
    styleUrl: './address-card.component.scss'
})
export class AddressCardComponent {

  // ===========================================================================
  // INPUTS
  // ===========================================================================

  @Input({ required: true }) address!: AddressLink;
  @Input() config: AddressCardConfig = DEFAULT_CARD_CONFIG;
  @Input() selected = false;

  // ===========================================================================
  // OUTPUTS
  // ===========================================================================

  @Output() onAction = new EventEmitter<AddressActionEvent>();
  @Output() onClick = new EventEmitter<AddressLink>();

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

  // ===========================================================================
  // BADGE HELPERS
  // ===========================================================================

  get showPrimaryBadge(): boolean {
    return this.isUserAddr && (this.address as UserAddress).isPrimary;
  }

  get showDefaultBadge(): boolean {
    return this.address.isDefault && !this.showPrimaryBadge;
  }

  get showBillingBadge(): boolean {
    return this.config.showBadges && this.isUserAddr && (this.address as UserAddress).billingEligible;
  }

  get showShippingBadge(): boolean {
    return this.config.showBadges && this.isUserAddr && (this.address as UserAddress).shippingEligible;
  }

  get showInactiveBadge(): boolean {
    return !this.address.active;
  }

  get showExpiredBadge(): boolean {
    return this.address.active && !this.isValid;
  }

  // ===========================================================================
  // ACTION HELPERS
  // ===========================================================================

  get availableActions(): AddressCardAction[] {
    if (!this.config.showActions) return [];
    return this.config.actions.filter(action => this.isActionAvailable(action));
  }

  isActionAvailable(action: AddressCardAction): boolean {
    switch (action) {
      case 'setPrimary':
        return this.isUserAddr && !(this.address as UserAddress).isPrimary;
      case 'setDefault':
        return !this.address.isDefault;
      case 'edit':
      case 'delete':
      case 'changeType':
      case 'view':
        return true;
      default:
        return false;
    }
  }

  // ===========================================================================
  // EVENT HANDLERS
  // ===========================================================================

  handleCardClick(): void {
    if (this.config.clickable) {
      this.onClick.emit(this.address);
    }
  }

  handleAction(action: AddressCardAction, event: Event): void {
    event.stopPropagation();
    this.onAction.emit({
      action,
      publicId: this.address.publicId
    });
  }

  // ===========================================================================
  // UI HELPERS
  // ===========================================================================

  getActionIcon(action: AddressCardAction): string {
    const icons: Record<AddressCardAction, string> = {
      edit: 'pencil',
      delete: 'trash-2',
      setDefault: 'star',
      setPrimary: 'home',
      changeType: 'repeat',
      view: 'eye'
    };
    return icons[action] || 'more-horizontal';
  }

  getActionLabel(action: AddressCardAction): string {
    const labels: Record<AddressCardAction, string> = {
      edit: 'Modifier',
      delete: 'Supprimer',
      setDefault: 'Définir par défaut',
      setPrimary: 'Définir principale',
      changeType: 'Changer le type',
      view: 'Voir détails'
    };
    return labels[action] || action;
  }
}
