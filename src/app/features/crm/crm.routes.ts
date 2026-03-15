import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';

export const CRM_ROUTES: Routes = [
  {
    path: '',
    canActivate: [() => authGuard()],
    loadComponent: () => import('./shell/crm-shell.component').then(m => m.CrmShellComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./domains/dashboard/pages/crm-dashboard/crm-dashboard.component')
          .then(m => m.CrmDashboardComponent),
        title: 'CRM — Dashboard'
      },

      // -----------------------------------------------------------------------
      // LEADS
      // -----------------------------------------------------------------------
      {
        path: 'leads',
        loadComponent: () => import('./domains/lead/pages/lead-list/lead-list.component')
          .then(m => m.LeadListComponent),
        title: 'CRM — Leads'
      },
      {
        path: 'leads/:publicId',
        loadComponent: () => import('./domains/lead/pages/lead-detail/lead-detail.component')
          .then(m => m.LeadDetailComponent),
        title: 'CRM — Lead'
      },

      // -----------------------------------------------------------------------
      // CONTACTS
      // -----------------------------------------------------------------------
      {
        path: 'contacts',
        loadComponent: () => import('./domains/contact/pages/contact-list/contact-list.component')
          .then(m => m.ContactListComponent),
        title: 'CRM — Contacts'
      },
      {
        path: 'contacts/new',
        loadComponent: () => import('./domains/contact/pages/contact-form/contact-form.component')
          .then(m => m.ContactFormComponent),
        data: { mode: 'create' },
        title: 'CRM — Nouveau contact'
      },
      {
        path: 'contacts/:publicId',
        loadComponent: () => import('./domains/contact/pages/contact-detail/contact-detail.component')
          .then(m => m.ContactDetailComponent),
        title: 'CRM — Contact'
      },
      {
        path: 'contacts/:publicId/edit',
        loadComponent: () => import('./domains/contact/pages/contact-form/contact-form.component')
          .then(m => m.ContactFormComponent),
        data: { mode: 'edit' },
        title: 'CRM — Modifier contact'
      },

      // -----------------------------------------------------------------------
      // ORGANISATIONS
      // -----------------------------------------------------------------------
      {
        path: 'organisations',
        loadComponent: () => import('./domains/organisation/pages/organisation-list/organisation-list.component')
          .then(m => m.OrganisationListComponent),
        title: 'CRM — Organisations'
      },
      {
        path: 'organisations/new',
        loadComponent: () => import('./domains/organisation/pages/organisation-form/organisation-form.component')
          .then(m => m.OrganisationFormComponent),
        data: { mode: 'create' },
        title: 'CRM — Nouvelle organisation'
      },
      {
        path: 'organisations/:publicId',
        loadComponent: () => import('./domains/organisation/pages/organisation-detail/organisation-detail.component')
          .then(m => m.OrganisationDetailComponent),
        title: 'CRM — Organisation'
      },
      {
        path: 'organisations/:publicId/edit',
        loadComponent: () => import('./domains/organisation/pages/organisation-form/organisation-form.component')
          .then(m => m.OrganisationFormComponent),
        data: { mode: 'edit' },
        title: 'CRM — Modifier organisation'
      },

      // -----------------------------------------------------------------------
      // DEALS
      // -----------------------------------------------------------------------
      {
        path: 'deals',
        loadComponent: () => import('./domains/deal/pages/deal-list/deal-list.component')
          .then(m => m.DealListComponent),
        title: 'CRM — Deals'
      },
      {
        path: 'deals/new',
        loadComponent: () => import('./domains/deal/pages/deal-form/deal-form.component')
          .then(m => m.DealFormComponent),
        data: { mode: 'create' },
        title: 'CRM — Nouveau deal'
      },
      {
        path: 'deals/:publicId',
        loadComponent: () => import('./domains/deal/pages/deal-detail/deal-detail.component')
          .then(m => m.DealDetailComponent),
        title: 'CRM — Deal'
      },
      {
        path: 'deals/:publicId/edit',
        loadComponent: () => import('./domains/deal/pages/deal-form/deal-form.component')
          .then(m => m.DealFormComponent),
        data: { mode: 'edit' },
        title: 'CRM — Modifier deal'
      },

      // -----------------------------------------------------------------------
      // PIPELINE
      // -----------------------------------------------------------------------
      {
        path: 'pipeline',
        loadComponent: () => import('./domains/pipeline/pages/pipeline-board/pipeline-board.component')
          .then(m => m.PipelineBoardComponent),
        title: 'CRM — Pipeline'
      },

      // -----------------------------------------------------------------------
      // INTERACTIONS
      // -----------------------------------------------------------------------
      {
        path: 'interactions',
        loadComponent: () => import('./domains/interaction/pages/interaction-list/interaction-list.component')
          .then(m => m.InteractionListComponent),
        title: 'CRM — Interactions'
      },

      // -----------------------------------------------------------------------
      // COMMERCIAL ACTIONS
      // -----------------------------------------------------------------------
      {
        path: 'commercial-actions',
        loadComponent: () => import('./domains/commercial-action/pages/commercial-action-list/commercial-action-list.component')
          .then(m => m.CommercialActionListComponent),
        title: 'CRM — Actions commerciales'
      },

      // -----------------------------------------------------------------------
      // SUPPORT TICKETS
      // -----------------------------------------------------------------------
      {
        path: 'support-tickets',
        loadComponent: () => import('./domains/support-ticket/pages/support-ticket-list/support-ticket-list.component')
          .then(m => m.SupportTicketListComponent),
        title: 'CRM — Support'
      },
      {
        path: 'support-tickets/new',
        loadComponent: () => import('./domains/support-ticket/pages/support-ticket-form/support-ticket-form.component')
          .then(m => m.SupportTicketFormComponent),
        title: 'CRM — Nouveau ticket'
      },
      {
        path: 'support-tickets/:publicId',
        loadComponent: () => import('./domains/support-ticket/pages/support-ticket-detail/support-ticket-detail.component')
          .then(m => m.SupportTicketDetailComponent),
        title: 'CRM — Ticket'
      },

      // -----------------------------------------------------------------------
      // FALLBACK
      // -----------------------------------------------------------------------
      {
        path: '**',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  }
];
