export type SearchResultType = 'CONTACT' | 'ORGANISATION' | 'DEAL' | 'LEAD';

export interface SearchResult {
  type:      SearchResultType;
  publicId:  string;
  label:     string;
  subtitle:  string;
}

export interface GlobalSearchResponse {
  results: SearchResult[];
}

export const SEARCH_TYPE_LABELS: Record<SearchResultType, string> = {
  CONTACT:      'Contact',
  ORGANISATION: 'Organisation',
  DEAL:         'Deal',
  LEAD:         'Lead'
};

export const SEARCH_TYPE_ROUTES: Record<SearchResultType, string> = {
  CONTACT:      '/crm/contacts',
  ORGANISATION: '/crm/organisations',
  DEAL:         '/crm/deals',
  LEAD:         '/crm/leads'
};

export const SEARCH_TYPE_ICONS: Record<SearchResultType, string> = {
  CONTACT:      '👤',
  ORGANISATION: '🏢',
  DEAL:         '💼',
  LEAD:         '📥'
};
