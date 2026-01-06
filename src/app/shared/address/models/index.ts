// src/app/shared/address/models/index.ts

// =============================================================================
// ENUMS
// =============================================================================

export {
  AddressType,
  ADDRESS_TYPE_LABELS,
  ADDRESS_TYPE_ICONS,
  ADDRESS_TYPES_BY_CONTEXT,
  getAddressTypeLabel,
  getAddressTypeIcon,
  getAddressTypesForContext,
  getAddressTypeOptions
} from './address-type.enum';

export type { AddressContext } from './address-type.enum';

// =============================================================================
// MODELS - Données
// =============================================================================

export type {
  Address,
  AddressLink,
  UserAddress,
  CompanyAddress,
  AnyAddressLink
} from './address.model';

export {
  isAddressCurrentlyValid,
  isUserAddress,
  isCompanyAddress,
  getAddressDisplayName,
  formatAddressOneLine,
  formatAddressMultiLine
} from './address.model';

// =============================================================================
// MODELS - Requêtes
// =============================================================================

export type {
  CreateAddressRequest,
  UpdateAddressRequest,
  AddressSearchCriteria,
  ChangeAddressTypeRequest,
  AddressOperationResponse
} from './address-request.model';

export {
  buildSearchParams,
  hasSearchCriteria,
  createDefaultAddressRequest
} from './address-request.model';

// =============================================================================
// MODELS - Configuration
// =============================================================================

export type {
  AddressListConfig,
  AddressFormConfig,
  AddressCardConfig,
  AddressCardAction,
  AddressActionEvent
} from './address-config.model';

export {
  DEFAULT_USER_LIST_CONFIG,
  DEFAULT_ADMIN_LIST_CONFIG,
  DEFAULT_COMPANY_LIST_CONFIG,
  DEFAULT_USER_FORM_CONFIG,
  DEFAULT_ADMIN_FORM_CONFIG,
  DEFAULT_CARD_CONFIG,
  COMPACT_CARD_CONFIG,
  getDefaultListConfig,
  getDefaultFormConfig,
  mergeListConfig,
  mergeFormConfig
} from './address-config.model';
