export interface ActivityLogDto {
  id: number;
  userId: number;
  username: string;
  deviceId?: number;
  deviceInfo?: string;
  actionType: string;
  actionCategory: string;
  actionDescription: string;
  timestamp: string;
  formattedTimestamp: string;
  ipAddress: string;
  location: string;
  successful: boolean;
  failureReason?: string;
  actionDetails?: string;
  riskLevel?: number;
  sessionId?: string;
  durationSeconds?: number;
  formattedDuration?: string;
}

export interface LogPagination {
  totalPages: number;
  totalElements: number;
  pageNumber: number;
  pageSize: number;
}
