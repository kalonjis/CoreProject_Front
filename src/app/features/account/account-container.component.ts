// src/app/features/account/account-container.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AccountTabsComponent } from './components/account-tabs/account-tabs.component';

/**
 * Account management container component.
 *
 * Provides the main container for all account-related functionality:
 * - User profile management
 * - Security settings (2FA, password, sessions)
 * - Device management
 *
 * Uses child routes to organize different account sections.
 */
@Component({
    selector: 'app-account',
    imports: [CommonModule, RouterOutlet, AccountTabsComponent],
    templateUrl: './account-container.component.html',
    styleUrl: './account-container.component.scss'
})
export class AccountContainerComponent {

}
