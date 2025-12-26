import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModuleCardComponent } from './components/module-card/module-card.component';
import { ModuleCardConfig } from '../models/module-card-config.model';

/**
 * Admin dashboard component - Main entry point for admin section.
 *
 * Displays a grid of module cards representing different admin functionalities.
 * Each card navigates to its respective management container.
 *
 * Currently available modules:
 * - User Management
 * - Device Management
 *
 * Future modules can be easily added by extending the modules array.
 */
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, ModuleCardComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {

  /**
   * Configuration for all admin modules.
   * Defines which modules are available and their display properties.
   */
  modules: ModuleCardConfig[] = [
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
      id: 'suppliers',
      icon: '🏢',
      title: 'Supplier Management',
      description: 'Manage suppliers and vendor relationships',
      route: '/admin/suppliers',
      enabled: false // Coming soon
    },
    {
      id: 'products',
      icon: '📦',
      title: 'Product Management',
      description: 'Manage product catalog and inventory',
      route: '/admin/products',
      enabled: false // Coming soon
    },
    {
      id: 'clients',
      icon: '🤝',
      title: 'Client Management',
      description: 'Manage client accounts and relationships',
      route: '/admin/clients',
      enabled: false // Coming soon
    },
    {
      id: 'settings',
      icon: '⚙️',
      title: 'System Settings',
      description: 'Configure system parameters and preferences',
      route: '/admin/settings',
      enabled: false // Coming soon
    }
  ];

  ngOnInit(): void {
    // Dashboard initialization logic if needed
  }
}
