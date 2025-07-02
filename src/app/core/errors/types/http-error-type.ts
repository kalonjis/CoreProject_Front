export enum HttpErrorType {
  // 4xx Client Errors
  BAD_REQUEST = 'bad_request',                    // 400
  UNAUTHORIZED = 'unauthorized',                  // 401
  FORBIDDEN = 'forbidden',                        // 403
  NOT_FOUND = 'not_found',                       // 404
  METHOD_NOT_ALLOWED = 'method_not_allowed',     // 405
  CONFLICT = 'conflict',                         // 409
  UNPROCESSABLE_ENTITY = 'unprocessable_entity', // 422
  RATE_LIMITED = 'rate_limited',                 // 429

  // 5xx Server Errors
  INTERNAL_SERVER_ERROR = 'internal_server_error', // 500
  BAD_GATEWAY = 'bad_gateway',                     // 502
  SERVICE_UNAVAILABLE = 'service_unavailable',     // 503
  GATEWAY_TIMEOUT = 'gateway_timeout',             // 504

  // Network/Connection Errors
  NETWORK_ERROR = 'network_error',                 // 0, connection refused
  TIMEOUT = 'timeout',                            // Request timeout

  // Business Logic Errors
  BUSINESS_LOGIC_ERROR = 'business_logic_error',   // Erreurs métier spécifiques
  VALIDATION_ERROR = 'validation_error',           // Erreurs de validation

  // Unknown
  UNKNOWN = 'unknown'
}

export enum HttpErrorSubType {
  // Forbidden subtypes
  AUTHENTICATION_REQUIRED = 'auth_required',
  INSUFFICIENT_PRIVILEGES = 'insufficient_privileges',
  ACCOUNT_SUSPENDED = 'account_suspended',
  GEO_BLOCKED = 'geo_blocked',
  FEATURE_DISABLED = 'feature_disabled',

  // Not Found subtypes
  USER_NOT_FOUND = 'user_not_found',
  RESOURCE_NOT_FOUND = 'resource_not_found',
  PAGE_NOT_FOUND = 'page_not_found',
  API_ENDPOINT_NOT_FOUND = 'api_endpoint_not_found',

  // Server Error subtypes
  DATABASE_ERROR = 'database_error',
  EXTERNAL_SERVICE_ERROR = 'external_service_error',
  CONFIGURATION_ERROR = 'configuration_error',

  // Network subtypes
  CONNECTION_REFUSED = 'connection_refused',
  DNS_ERROR = 'dns_error',
  SSL_ERROR = 'ssl_error'
}
