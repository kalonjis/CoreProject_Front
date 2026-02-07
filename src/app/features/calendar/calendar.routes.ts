import { Routes } from '@angular/router';

import {
  calendarEventsResolver,
  calendarEventResolver,
  calendarUpcomingEventsResolver
} from './resolvers/calendar-events.resolver';
import { calendarUnsavedChangesGuard } from './guards/calendar-unsaved-changes.guard';

/**
 * Calendar feature routes configuration.
 *
 * @description
 * Standalone routes for the calendar feature module.
 * Uses lazy loading for all components.
 *
 * Route structure:
 * - `/calendar` - Main calendar view (month by default)
 * - `/calendar/agenda` - Agenda/list view of upcoming events
 * - `/calendar/events/new` - Create new event
 * - `/calendar/events/:publicId` - View event details
 * - `/calendar/events/:publicId/edit` - Edit event
 *
 * @example
 * ```typescript
 * // In app.routes.ts
 * export const routes: Routes = [
 *   {
 *     path: 'calendar',
 *     loadChildren: () =>
 *       import('./features/calendar/calendar.routes')
 *         .then(m => m.CALENDAR_ROUTES)
 *   }
 * ];
 * ```
 */
export const CALENDAR_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/calendar.component').then(m => m.CalendarComponent),
    resolve: {
      events: calendarEventsResolver
    },
    title: 'Calendrier',
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'month'
      },
      {
        path: 'month',
        loadComponent: () =>
          import('./components/calendar-month-view/calendar-month-view.component')
            .then(m => m.CalendarMonthViewComponent),
        title: 'Calendrier - Vue mois'
      },
      {
        path: 'week',
        loadComponent: () =>
          import('./components/calendar-week-view/calendar-week-view.component')
            .then(m => m.CalendarWeekViewComponent),
        title: 'Calendrier - Vue semaine'
      },
      {
        path: 'day',
        loadComponent: () =>
          import('./components/calendar-day-view/calendar-day-view.component')
            .then(m => m.CalendarDayViewComponent),
        title: 'Calendrier - Vue jour'
      },
      {
        path: 'agenda',
        loadComponent: () =>
          import('./components/calendar-agenda-view/calendar-agenda-view.component')
            .then(m => m.CalendarAgendaViewComponent),
        resolve: {
          events: calendarUpcomingEventsResolver
        },
        title: 'Calendrier - Agenda'
      }
    ]
  },
  {
    path: 'events/new',
    loadComponent: () =>
      import('./components/calendar-event-form/calendar-event-form.component')
        .then(m => m.CalendarEventFormComponent),
    canDeactivate: [calendarUnsavedChangesGuard],
    title: 'Nouvel événement',
    data: {
      mode: 'create'
    }
  },
  {
    path: 'events/:publicId',
    loadComponent: () =>
      import('./components/calendar-event-detail/calendar-event-detail.component')
        .then(m => m.CalendarEventDetailComponent),
    resolve: {
      event: calendarEventResolver
    },
    title: 'Détails de l\'événement'
  },
  {
    path: 'events/:publicId/edit',
    loadComponent: () =>
      import('./components/calendar-event-form/calendar-event-form.component')
        .then(m => m.CalendarEventFormComponent),
    resolve: {
      event: calendarEventResolver
    },
    canDeactivate: [calendarUnsavedChangesGuard],
    title: 'Modifier l\'événement',
    data: {
      mode: 'edit'
    }
  }
];

/**
 * Calendar routes for use without the main calendar container.
 *
 * @description
 * Alternative route configuration for simpler setups where
 * views are not nested under a parent calendar component.
 */
export const CALENDAR_FLAT_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'view'
  },
  {
    path: 'view',
    loadComponent: () =>
      import('./pages/calendar.component').then(m => m.CalendarComponent),
    resolve: {
      events: calendarEventsResolver
    },
    title: 'Calendrier'
  },
  {
    path: 'agenda',
    loadComponent: () =>
      import('./components/calendar-agenda-view/calendar-agenda-view.component')
        .then(m => m.CalendarAgendaViewComponent),
    resolve: {
      events: calendarUpcomingEventsResolver
    },
    title: 'Agenda'
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./components/calendar-event-form/calendar-event-form.component')
        .then(m => m.CalendarEventFormComponent),
    canDeactivate: [calendarUnsavedChangesGuard],
    title: 'Nouvel événement',
    data: { mode: 'create' }
  },
  {
    path: ':publicId',
    loadComponent: () =>
      import('./components/calendar-event-detail/calendar-event-detail.component')
        .then(m => m.CalendarEventDetailComponent),
    resolve: {
      event: calendarEventResolver
    },
    title: 'Événement'
  },
  {
    path: ':publicId/edit',
    loadComponent: () =>
      import('./components/calendar-event-form/calendar-event-form.component')
        .then(m => m.CalendarEventFormComponent),
    resolve: {
      event: calendarEventResolver
    },
    canDeactivate: [calendarUnsavedChangesGuard],
    title: 'Modifier',
    data: { mode: 'edit' }
  }
];

/**
 * Provides calendar routes with custom configuration.
 *
 * @param options - Route configuration options
 * @returns Configured routes array
 *
 * @example
 * ```typescript
 * // Custom routes with authentication guard
 * const routes = provideCalendarRoutes({
 *   guards: [authGuard],
 *   resolvers: {
 *     user: userResolver
 *   }
 * });
 * ```
 */
export function provideCalendarRoutes(options?: {
  guards?: any[];
  resolvers?: Record<string, any>;
  titlePrefix?: string;
}): Routes {
  const baseRoutes = [...CALENDAR_ROUTES];

  if (options?.guards) {
    // Add guards to all routes
    const addGuards = (routes: Routes) => {
      for (const route of routes) {
        route.canActivate = [...(route.canActivate || []), ...options.guards!];
        if (route.children) {
          addGuards(route.children);
        }
      }
    };
    addGuards(baseRoutes);
  }

  if (options?.resolvers) {
    // Add resolvers to root route
    baseRoutes[0].resolve = {
      ...baseRoutes[0].resolve,
      ...options.resolvers
    };
  }

  if (options?.titlePrefix) {
    // Prefix all titles
    const prefixTitles = (routes: Routes) => {
      for (const route of routes) {
        if (route.title && typeof route.title === 'string') {
          route.title = `${options.titlePrefix} - ${route.title}`;
        }
        if (route.children) {
          prefixTitles(route.children);
        }
      }
    };
    prefixTitles(baseRoutes);
  }

  return baseRoutes;
}
