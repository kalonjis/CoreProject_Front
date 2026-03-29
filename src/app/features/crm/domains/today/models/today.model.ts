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
