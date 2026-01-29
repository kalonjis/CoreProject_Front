// src/app/shared/models/page.model.ts

/**
 * Generic paginated response matching Spring Data Page format.
 */
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;  // Current page (0-indexed)
  first: boolean;
  last: boolean;
  empty: boolean;
  numberOfElements: number;
}

/**
 * Pagination info for display components.
 */
export interface PaginationInfo {
  totalPages: number;
  totalElements: number;
  pageNumber: number;
  pageSize: number;
}

/**
 * Extracts pagination info from a Page response.
 */
export function extractPaginationInfo<T>(page: Page<T>): PaginationInfo {
  return {
    totalPages: page.totalPages,
    totalElements: page.totalElements,
    pageNumber: page.number,
    pageSize: page.size
  };
}

/**
 * Creates an empty page.
 */
export function emptyPage<T>(): Page<T> {
  return {
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 20,
    number: 0,
    first: true,
    last: true,
    empty: true,
    numberOfElements: 0
  };
}
