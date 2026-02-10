// src/app/features/calendar/components/address-select/address-select.component.ts

import {
  Component,
  OnInit,
  inject,
  signal,
  output,
  input,
  DestroyRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, of } from 'rxjs';

import { UserAddressApiService } from '../../../account/services/user-address-api.service';
import {
  UserAddress,
    formatAddressOneLine
} from '../../../../shared/address';
import {AddressInput} from '../../models';

/**
 * Address selection component for calendar events.
 *
 * Allows to:
 * - Select an existing user address
 * - Switch to creating a new address
 *
 * @example
 * ```html
 * <app-address-select
 *   [selectedAddress]="selectedAddress()"
 *   (addressSelected)="onAddressSelected($event)"
 *   (createNew)="onCreateNewAddress()"
 * />
 * ```
 */
@Component({
  selector: 'app-address-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './address-select.component.html',
  styleUrl: './address-select.component.scss'
})
export class AddressSelectComponent implements OnInit {

  // ===========================================================================
  // Dependencies
  // ===========================================================================

  private destroyRef = inject(DestroyRef);
  private addressApi = inject(UserAddressApiService);

  // ===========================================================================
  // Inputs
  // ===========================================================================

  /** Currently selected address */
  selectedAddress = input<AddressInput | null>(null);

  // ===========================================================================
  // Outputs
  // ===========================================================================

  /** Emitted when an address is selected */
  addressSelected = output<AddressInput>();

  /** Emitted when user wants to create a new address */
  createNew = output<void>();

  // ===========================================================================
  // State
  // ===========================================================================

  /** List of user addresses */
  addresses = signal<UserAddress[]>([]);

  /** Loading state */
  isLoading = signal(true);

  /** Loading error */
  hasError = signal(false);

  /** ID of the selected address in dropdown */
  selectedAddressId = signal<string | null>(null);

  // ===========================================================================
  // Lifecycle
  // ===========================================================================

  ngOnInit(): void {
    this.loadUserAddresses();
  }

  // ===========================================================================
  // Data Loading
  // ===========================================================================

  /**
   * Loads active user addresses.
   */
  private loadUserAddresses(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.addressApi.getAll({ active: true })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
        catchError(() => {
          this.hasError.set(true);
          return of([]);
        })
      )
      .subscribe(addresses => {
        this.addresses.set(addresses);

        // If an address is already selected, find its ID
        const currentAddress = this.selectedAddress();
        if (currentAddress) {
          const match = addresses.find(addr =>
            this.addressesMatch(addr, currentAddress)
          );
          if (match) {
            this.selectedAddressId.set(match.publicId);
          }
        }
      });
  }

  // ===========================================================================
  // Actions
  // ===========================================================================

  /**
   * Handles address selection from dropdown.
   */
  onSelectAddress(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const publicId = select.value;

    if (!publicId) {
      // "No address" option selected
      this.selectedAddressId.set(null);
      return;
    }

    if (publicId === 'new') {
      // "New address" option selected
      this.createNew.emit();

      // CRITICAL: Reset dropdown to avoid blocking subsequent clicks
      // Without this, the dropdown stays on "new" and change event won't fire again
      setTimeout(() => {
        select.value = '';
        this.selectedAddressId.set(null);
      }, 0);
      return;
    }

    // Existing address selected
    const address = this.addresses().find(a => a.publicId === publicId);
    if (address) {
      this.selectedAddressId.set(publicId);
      this.addressSelected.emit(this.convertToAddressInput(address));
    }
  }

  /**
   * Retries loading addresses on error.
   */
  retry(): void {
    this.loadUserAddresses();
  }

  // ===========================================================================
  // Helpers
  // ===========================================================================

  /**
   * Converts UserAddress to AddressInput.
   * Handles nullable fields by providing default empty strings.
   */
  private convertToAddressInput(userAddress: UserAddress): AddressInput {
    return {
      streetName: userAddress.address.streetName ?? '',
      streetNumber: userAddress.address.streetNumber ?? '',
      postalCode: userAddress.address.postalCode ?? '',
      city: userAddress.address.city ?? '',
      countryCode: userAddress.address.countryCode ?? ''
    };
  }

  /**
   * Checks if two addresses match.
   */
  private addressesMatch(userAddress: UserAddress, input: AddressInput): boolean {
    return (
      userAddress.address.streetName === input.streetName &&
      userAddress.address.streetNumber === input.streetNumber &&
      userAddress.address.postalCode === input.postalCode &&
      userAddress.address.city === input.city &&
      userAddress.address.countryCode === input.countryCode
    );
  }

  /**
   * Formats an address for display.
   */
  formatAddress(userAddress: UserAddress): string {
    return formatAddressOneLine(userAddress.address);
  }

  /**
   * Gets a descriptive label for an address.
   */
  getAddressLabel(userAddress: UserAddress): string {
    const formatted = this.formatAddress(userAddress);

    if (userAddress.label) {
      return `${userAddress.label} - ${formatted}`;
    }

    if (userAddress.isPrimary) {
      return `⭐ ${formatted}`;
    }

    return formatted;
  }
}
