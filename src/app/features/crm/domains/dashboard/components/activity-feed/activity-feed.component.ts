import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ActivityLogApiService } from '../../../../../activity-logs/services/activity-log-api.service';
import { ActivityLog } from '../../../../../activity-logs/models/activity-log.model';
import { ActivityLogCategory } from '../../../../../activity-logs/models/activity-log-category.enum';

// ── Types ────────────────────────────────────────────────────────────────────

/** Filter tab options for the activity feed. */
type FeedFilter = 'ALL' | 'CRM_DEAL' | 'CRM_LEAD' | 'CRM_SUPPORT';

/** Normalized activity log entry displayed in the CRM activity feed. */
interface FeedEntry {
  publicId:      string;
  actionType:    string;
  category:      string;
  message:       string;
  entityName:    string | null;
  entityPublicId: string | null;
  actor:         string | null;
  timestamp:     string;
  dotClass:      string;
  navPath:       string | null;
}

// ── Message templates (FR) ───────────────────────────────────────────────────

const MESSAGES: Record<string, string> = {
  DEAL_CREATED:              'Nouveau deal',
  DEAL_STAGE_MOVED:          'Deal avancé dans le pipeline',
  DEAL_WON:                  'Deal gagné',
  DEAL_LOST:                 'Deal perdu',
  DEAL_REASSIGNED:           'Deal réassigné',
  LEAD_SUBMITTED:            'Nouveau lead soumis',
  LEAD_ASSIGNED:             'Lead assigné',
  LEAD_IN_REVIEW:            'Lead mis en revue',
  LEAD_CONVERTED:            'Lead converti en contact',
  LEAD_REJECTED:             'Lead rejeté',
  CONTACT_CREATED:           'Nouveau contact',
  CONTACT_CREATED_FROM_LEAD: 'Contact créé depuis un lead',
  CONTACT_STATUS_CHANGED:    'Statut contact mis à jour',
  CONTACT_ASSIGNED:          'Contact réassigné',
  CONTACT_MERGED:            'Contacts fusionnés',
  CONTACT_ORG_LINKED:        'Contact lié à une organisation',
  CONTACT_ARCHIVED:          'Contact archivé',
  ORGANISATION_CREATED:      'Nouvelle organisation',
  ORGANISATION_ARCHIVED:     'Organisation archivée',
  ORGANISATION_MERGED:       'Organisations fusionnées',
  TICKET_CREATED:            'Nouveau ticket',
  TICKET_STATUS_CHANGED:     'Ticket mis à jour',
  TICKET_CLOSED:             'Ticket fermé',
  TICKET_ASSIGNED:           'Ticket assigné',
  TICKET_DELETED:            'Ticket supprimé',
};

// ── Dot CSS class per actionType ─────────────────────────────────────────────

const DOT_CLASS: Record<string, string> = {
  DEAL_WON:                  'green',
  LEAD_CONVERTED:            'green',
  TICKET_CLOSED:             'green',
  DEAL_LOST:                 'red',
  LEAD_REJECTED:             'red',
  DEAL_CREATED:              'blue',
  DEAL_STAGE_MOVED:          'blue',
  DEAL_REASSIGNED:           'blue',
  LEAD_SUBMITTED:            'violet',
  LEAD_ASSIGNED:             'violet',
  LEAD_IN_REVIEW:            'violet',
  CONTACT_CREATED:           'teal',
  CONTACT_CREATED_FROM_LEAD: 'teal',
  CONTACT_STATUS_CHANGED:    'teal',
  CONTACT_ASSIGNED:          'teal',
  ORGANISATION_CREATED:      'amber',
  TICKET_CREATED:            'orange',
  TICKET_ASSIGNED:           'orange',
};

// ── Nav segments per category ─────────────────────────────────────────────────

const NAV_SEGMENT: Partial<Record<string, string>> = {
  CRM_DEAL:         'deals',
  CRM_LEAD:         'leads',
  CRM_CONTACT:      'contacts',
  CRM_ORGANISATION: 'organisations',
  CRM_SUPPORT:      'support-tickets',
};

@Component({
  selector:    'app-activity-feed',
  standalone:  true,
  imports:     [RouterLink],
  templateUrl: './activity-feed.component.html',
  styleUrl:    './activity-feed.component.scss'
})
/**
 * Dashboard sidebar component showing recent CRM activity logs.
 * Loads the last 15 CRM events and provides tab-based filtering by entity type (deals, leads, support).
 */
export class ActivityFeedComponent implements OnInit {

  private readonly api    = inject(ActivityLogApiService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly filter  = signal<FeedFilter>('ALL');

  private readonly allEntries = signal<FeedEntry[]>([]);

  readonly entries = computed(() => {
    const f = this.filter();
    return f === 'ALL'
      ? this.allEntries()
      : this.allEntries().filter(e => e.category === f);
  });

  readonly filters: { key: FeedFilter; label: string }[] = [
    { key: 'ALL',         label: 'Tous'    },
    { key: 'CRM_DEAL',    label: 'Deals'   },
    { key: 'CRM_LEAD',    label: 'Leads'   },
    { key: 'CRM_SUPPORT', label: 'Support' },
  ];

  ngOnInit(): void {
    this.api.getAllLogs({ category: ActivityLogCategory.CRM, size: 15, page: 0 }).subscribe({
      next:  page => {
        this.allEntries.set(page.content.map(l => this.toEntry(l)));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  navigate(entry: FeedEntry): void {
    if (entry.navPath) this.router.navigateByUrl(entry.navPath);
  }

  setFilter(f: FeedFilter): void { this.filter.set(f); }

  timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const min  = Math.floor(diff / 60_000);
    if (min < 1)  return 'à l\'instant';
    if (min < 60) return `il y a ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24)   return `il y a ${h} h`;
    const d = Math.floor(h / 24);
    if (d < 7)    return `il y a ${d} j`;
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private toEntry(log: ActivityLog): FeedEntry {
    const entityPublicId = this.parsePublicId(log.actionDetails);
    const entityName     = this.parseEntityName(log.actionDetails);
    const category       = log.actionCategory as string;
    const seg            = NAV_SEGMENT[category];

    return {
      publicId:       log.publicId,
      actionType:     log.actionType,
      category,
      message:        MESSAGES[log.actionType] ?? log.actionType.toLowerCase().replace(/_/g, ' '),
      entityName,
      entityPublicId,
      actor:          log.actorUsername,
      timestamp:      log.timestamp,
      dotClass:       DOT_CLASS[log.actionType] ?? 'gray',
      navPath:        seg && entityPublicId ? `/crm/${seg}/${entityPublicId}` : null,
    };
  }

  /** Extracts `xxx` from `publicId:xxx | ...` */
  private parsePublicId(details: string | null): string | null {
    if (!details) return null;
    const m = details.match(/publicId:([^\s|]+)/);
    return m ? m[1] : null;
  }

  /** Extracts the value after the first ` | key: ` segment */
  private parseEntityName(details: string | null): string | null {
    if (!details) return null;
    const parts = details.split(' | ');
    if (parts.length < 2) return null;
    const idx = parts[1].indexOf(':');
    if (idx < 0) return null;
    const val = parts[1].slice(idx + 1).trim();
    return val || null;
  }
}
