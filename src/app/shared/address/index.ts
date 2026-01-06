// src/app/shared/address/index.ts

// =============================================================================
// MODELS
// =============================================================================

// Enums
export {
  AddressType,
  ADDRESS_TYPE_LABELS,
  ADDRESS_TYPE_ICONS,
  ADDRESS_TYPES_BY_CONTEXT,
  getAddressTypeLabel,
  getAddressTypeIcon,
  getAddressTypesForContext,
  getAddressTypeOptions
} from './models/address-type.enum';

export type { AddressContext } from './models/address-type.enum';

// Data models
export type {
  Address,
  AddressLink,
  UserAddress,
  CompanyAddress,
  AnyAddressLink
} from './models/address.model';

export {
  isAddressCurrentlyValid,
  isUserAddress,
  isCompanyAddress,
  getAddressDisplayName,
  formatAddressOneLine,
  formatAddressMultiLine
} from './models/address.model';

// Request models
export type {
  CreateAddressRequest,
  UpdateAddressRequest,
  AddressSearchCriteria,
  ChangeAddressTypeRequest,
  AddressOperationResponse
} from './models/address-request.model';

export {
  buildSearchParams,
  hasSearchCriteria,
  createDefaultAddressRequest
} from './models/address-request.model';

// Config models
export type {
  AddressListConfig,
  AddressFormConfig,
  AddressCardConfig,
  AddressCardAction,
  AddressActionEvent
} from './models/address-config.model';

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
} from './models/address-config.model';

// =============================================================================
// SERVICES
// =============================================================================

export { AddressApiBaseService } from './services/address-api-base.service';

// =============================================================================
// COMPONENTS
// =============================================================================

export { AddressCardComponent } from './components/address-card/address-card.component';
export { AddressListComponent } from './components/address-list/address-list.component';
export { AddressDetailComponent } from './components/address-detail/address-detail.component';
export { AddressFormComponent, type AddressFormMode } from './components/address-form/address-form.component';
export { AddressFormModalComponent } from './components/address-form-modal/address-form-modal.component';

// =============================================================================
// DATA
// =============================================================================

export { COUNTRIES, getCountryName, isValidCountryCode } from './components/address-form/countries.data';
export type { Country } from './components/address-form/countries.data';
