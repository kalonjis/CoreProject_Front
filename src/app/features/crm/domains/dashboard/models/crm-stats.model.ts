/** Monthly revenue aggregation data point used in the CRM revenue chart. */
export interface RevenueMonth {
  month:    string;   // "2025-04"
  revenue:  number;
  dealsWon: number;
}

/** Aggregate CRM KPIs returned by the dashboard stats endpoint. */
export interface CrmStats {
  leadsNew:            number;
  leadsInReview:       number;
  dealsOpen:           number;
  pipelineValue:       number;
  dealsWonThisMonth:   number;
  revenueWonThisMonth: number;
  overdueActions:      number;
  ticketsOpen:         number;
  ticketsInProgress:   number;
  forecastRevenue:     number;
}
