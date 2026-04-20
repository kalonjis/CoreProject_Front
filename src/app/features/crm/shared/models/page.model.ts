/**
 * Generic paginated response wrapper matching the Spring Data {@code Page<T>} JSON structure.
 *
 * Used across all CRM list endpoints.
 */
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
