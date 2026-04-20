/**
 * Response model for the CRM Today summary ({@code GET /api/crm/today}).
 *
 * Aggregates overdue commercial actions, today's actions, overdue deals,
 * deals closing soon, and open support tickets into a single dashboard view.
 */
import { CommercialActionResponse } from '../../commercial-action/models/commercial-action.model';
import { DealSummary } from '../../deal/models/deal.model';
import { SupportTicketSummary } from '../../support-ticket/models/support-ticket.model';

export interface TodaySummary {
  overdueActions:   CommercialActionResponse[];
  todayActions:     CommercialActionResponse[];
  dealsOverdue:     DealSummary[];
  dealsClosingSoon: DealSummary[];
  openTickets:      SupportTicketSummary[];
}
