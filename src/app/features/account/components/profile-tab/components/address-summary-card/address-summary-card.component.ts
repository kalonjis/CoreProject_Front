// src/app/features/account/components/profile-tab/components/address-summary-card/address-summary-card.component.ts

import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, finalize } from 'rxjs';

import {
  UserAddress,
  formatAddressOneLine,
  getAddressTypeLabel,
  getAddressTypeIcon
} from '../../../../../../shared/address';
import { UserAddressApiService } from '../../../../../profile/addresses/services/user-address-api.service';

/**
 * Carte résumé des adresses pour l'onglet Profile.
 * Affiche les 3 premières adresses avec un lien vers la page complète.
 */
@Component({
  selector: 'app-address-summary-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './address-summary-card.component.html',
  styleUrl: './address-summary-card.component.scss'
})
export class AddressSummaryCardComponent implements OnInit {

  private destroyRef = inject(DestroyRef);
  private addressApi = inject(UserAddressApiService);

  addresses = signal<UserAddress[]>([]);
  isLoading = signal(true);
  hasError = signal(false);

  // Limite d'adresses affichées dans le résumé
  readonly displayLimit = 3;

  ngOnInit(): void {
    this.loadAddresses();
  }

  private loadAddresses(): void {
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
      });
  }

  get displayedAddresses(): UserAddress[] {
    return this.addresses().slice(0, this.displayLimit);
  }

  get totalCount(): number {
    return this.addresses().length;
  }

  get hasMore(): boolean {
    return this.totalCount > this.displayLimit;
  }

  get remainingCount(): number {
    return this.totalCount - this.displayLimit;
  }

  get primaryAddress(): UserAddress | null {
    return this.addresses().find(a => a.isPrimary) ?? null;
  }

  getTypeLabel(type: string): string {
    return getAddressTypeLabel(type as any);
  }

  getTypeIcon(type: string): string {
    return getAddressTypeIcon(type as any);
  }

  formatAddress(address: UserAddress): string {
    return formatAddressOneLine(address.address);
  }

  retry(): void {
    this.loadAddresses();
  }
}
