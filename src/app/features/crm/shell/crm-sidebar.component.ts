import { Component, OnInit, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CrmDashboardApiService } from '../domains/dashboard/services/crm-dashboard-api.service';
import { AuthStore } from '../../../core/auth/state/auth.store';

const STORAGE_KEY = 'crm-sidebar-collapsed';

interface CrmNavItem {
  label: string;
  icon: string;
  route: string;
  badgeKey?: 'leads' | 'actions' | 'today';
}

@Component({
  selector: 'app-crm-sidebar',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './crm-sidebar.component.html',
  styleUrl: './crm-sidebar.component.scss'
})
export class CrmSidebarComponent implements OnInit {
  @Output() searchRequested = new EventEmitter<void>();

  private readonly dashboardApi = inject(CrmDashboardApiService);
  private readonly authStore    = inject(AuthStore);

  readonly isAdmin = this.authStore.isAdmin;

  readonly collapsed    = signal(localStorage.getItem(STORAGE_KEY) === 'true');
  readonly leadsBadge   = signal(0);
  readonly actionsBadge = signal(0);
  readonly todayBadge   = signal(0);

  toggle(): void {
    const next = !this.collapsed();
    this.collapsed.set(next);
    localStorage.setItem(STORAGE_KEY, String(next));
  }

  readonly navItems: CrmNavItem[] = [
    { label: 'Dashboard',            icon: '🏠', route: '/crm/dashboard' },
    { label: "Aujourd'hui",          icon: '📌', route: '/crm/today',                 badgeKey: 'today' },
    { label: 'Leads',                icon: '📥', route: '/crm/leads',               badgeKey: 'leads' },
    { label: 'Contacts',             icon: '👤', route: '/crm/contacts' },
    { label: 'Organisations',        icon: '🏢', route: '/crm/organisations' },
    { label: 'Deals',                icon: '💼', route: '/crm/deals' },
    { label: 'Pipeline',             icon: '📊', route: '/crm/pipeline' },
{ label: 'Actions commerciales', icon: '✅', route: '/crm/commercial-actions',   badgeKey: 'actions' },
    { label: 'Support',              icon: '🎫', route: '/crm/support-tickets' },
    { label: 'Modifications',        icon: '📝', route: '/crm/changelog' },
  ];

  ngOnInit(): void {
    this.dashboardApi.getStats().subscribe({
      next: s => {
        this.leadsBadge.set(s.leadsNew + s.leadsInReview);
        this.actionsBadge.set(s.overdueActions);
        this.todayBadge.set(s.overdueActions);
      }
    });
  }

  getBadge(item: CrmNavItem): number {
    if (item.badgeKey === 'leads')   return this.leadsBadge();
    if (item.badgeKey === 'actions') return this.actionsBadge();
    if (item.badgeKey === 'today')   return this.todayBadge();
    return 0;
  }
}
