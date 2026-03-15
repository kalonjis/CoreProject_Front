// src/app/features/admin/dashboard/admin-dashboard.component.ts

import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModuleCardComponent } from './components/module-card/module-card.component';
import { ModuleCardConfig } from '../models/module-card-config.model';
import { AuthFacade } from '../../../core/auth/services/auth.facade';
import { UserRole } from '../../../data/models/user/user-role';

/**
 * Admin dashboard component - Main entry point for admin section.
 *
 * Displays a grid of module cards representing different admin functionalities.
 * Each card navigates to its respective management container.
 *
 * Modules are filtered based on user role:
 * - ADMIN: Can see all modules except SUPER_ADMIN-only modules
 * - SUPER_ADMIN: Can see all modules
 *
 * Currently available modules:
 * - User Management (ADMIN+)
 * - Device Management (ADMIN+)
 * - System Health (SUPER_ADMIN only)
 *
 * Future modules can be easily added by extending the modules array.
 */
@Component({
    selector: 'app-admin-dashboard',
    imports: [CommonModule, ModuleCardComponent],
    templateUrl: './admin-dashboard.component.html',
    styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {

  private readonly authFacade = inject(AuthFacade);

  // ===========================================================================
  // MODULE CONFIGURATION
  // ===========================================================================

  /**
   * Configuration for all admin modules.
   * Defines which modules are available and their display properties.
   */
  private readonly allModules: ModuleCardConfig[] = [
    // -------------------------------------------------------------------------
    // AVAILABLE MODULES
    // -------------------------------------------------------------------------
    {
      id: 'users',
      icon: '👥',
      title: 'User Management',
      description: 'Manage user accounts, roles, permissions, and activity',
      route: '/admin/users',
      enabled: true,
      color: 'primary'
    },
    {
      id: 'devices',
      icon: '📱',
      title: 'Device Management',
      description: 'Monitor and manage registered devices and trust levels',
      route: '/admin/devices',
      enabled: true,
      color: 'info'
    },
    {
      id: 'system-health',
      icon: '🖥️',
      title: 'System Health',
      description: 'Monitor servers, services, and circuit breakers',
      route: '/admin/system-health',
      enabled: true,
      color: 'danger',
      badge: 'Live',
      requiredRole: UserRole.SUPER_ADMIN
    },
    {
      id: 'calendar',
      icon: '📅',
      title: 'Calendar Management',
      description: 'View and manage calendar events and schedules',
      route: '/calendar',
      enabled: true,
      color: 'success'
    },

    {
      id: 'activity-log',
      icon: '📋',
      title: 'Activity Log',
      description: 'View and audit all system activity and user actions',
      route: '/activity-log',
      enabled: true,
      color: 'warning'
    },
    {
      id: 'crm',
      icon: '💼',
      title: 'CRM',
      description: 'Manage leads, contacts, deals, pipeline and support tickets',
      route: '/crm',
      enabled: true,
      color: 'info'
    },

    // -------------------------------------------------------------------------
    // COMING SOON MODULES
    // -------------------------------------------------------------------------
    {
      id: 'suppliers',
      icon: '🏢',
      title: 'Supplier Management',
      description: 'Manage suppliers and vendor relationships',
      route: '/admin/suppliers',
      enabled: false
    },
    {
      id: 'products',
      icon: '📦',
      title: 'Product Management',
      description: 'Manage product catalog and inventory',
      route: '/admin/products',
      enabled: false
    },
    {
      id: 'clients',
      icon: '🤝',
      title: 'Client Management',
      description: 'Manage client accounts and relationships',
      route: '/admin/clients',
      enabled: false
    },
    {
      id: 'settings',
      icon: '⚙️',
      title: 'System Settings',
      description: 'Configure system parameters and preferences',
      route: '/admin/settings',
      enabled: false,
      requiredRole: UserRole.SUPER_ADMIN
    }
  ];

  // ===========================================================================
  // COMPUTED
  // ===========================================================================

  /**
   * Filtered modules based on user role.
   * Only shows modules the current user has access to.
   */
  readonly modules = computed(() => {
    return this.allModules.filter(module => this.canAccessModule(module));
  });

  /**
   * Count of available (enabled) modules for the current user.
   */
  readonly availableModulesCount = computed(() => {
    return this.modules().filter(m => m.enabled).length;
  });

  /**
   * True if current user is a SUPER_ADMIN.
   */
  readonly isSuperAdmin = computed(() => {
    return this.authFacade.hasRole(UserRole.SUPER_ADMIN);
  });

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  ngOnInit(): void {
    // Dashboard initialization logic if needed
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  /**
   * Checks if the current user can access a module based on required role.
   *
   * @param module Module configuration
   * @returns True if user can access the module
   */
  private canAccessModule(module: ModuleCardConfig): boolean {
    // No role requirement = accessible to all admins
    if (!module.requiredRole) {
      return true;
    }

    // Check if user has the required role
    return this.authFacade.hasRole(module.requiredRole);
  }
}
