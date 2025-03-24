// src/app/core/auth/providers/auth.provider.ts
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthStore } from '../store/auth.store';

// Cette fonction permet d'injecter le AuthStore dans n'importe quel composant
export function provideAuthStore() {
  const authStore = inject(AuthStore);
  const platformId = inject(PLATFORM_ID);

  // Initialize the store only in browser environment
  if (isPlatformBrowser(platformId)) {
    authStore.init();
  }

  return authStore;
}
