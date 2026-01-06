// src/app/shared/address/components/address-form/address-form.component.ts

import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import {
  AddressLink,
  UserAddress,
  AddressType,
  AddressFormConfig,
  CreateAddressRequest,
  UpdateAddressRequest,
  DEFAULT_USER_FORM_CONFIG,
  isUserAddress,
  getAddressTypeOptions
} from '../../models';
import { COUNTRIES } from './countries.data';

export type AddressFormMode = 'create' | 'edit';

/**
 * Composant formulaire pour créer ou modifier une adresse.
 *
 * Utilisation:
 * ```html
 * <app-address-form
 *   mode="create"
 *   [config]="formConfig"
 *   (onSubmit)="handleSubmit($event)"
 *   (onCancel)="closeForm()">
 * </app-address-form>
 *
 * <app-address-form
 *   mode="edit"
 *   [initialData]="addressToEdit"
 *   [config]="formConfig"
 *   (onSubmit)="handleUpdate($event)"
 *   (onCancel)="closeForm()">
 * </app-address-form>
 * ```
 */
@Component({
  selector: 'app-address-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './address-form.component.html',
  styleUrl: './address-form.component.scss'
})
export class AddressFormComponent implements OnInit, OnChanges {

  // ===========================================================================
  // INPUTS
  // ===========================================================================

  @Input() mode: AddressFormMode = 'create';
  @Input() initialData: AddressLink | null = null;
  @Input() config: AddressFormConfig = DEFAULT_USER_FORM_CONFIG;
  @Input() isSubmitting = false;

  // ===========================================================================
  // OUTPUTS
  // ===========================================================================

  @Output() onSubmit = new EventEmitter<CreateAddressRequest | UpdateAddressRequest>();
  @Output() onCancel = new EventEmitter<void>();

  // ===========================================================================
  // FORM
  // ===========================================================================

  form!: FormGroup;
  countries = COUNTRIES;

  constructor(private fb: FormBuilder) {}

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialData'] && !changes['initialData'].firstChange) {
      this.patchFormWithData();
    }
    if (changes['config'] && !changes['config'].firstChange) {
      this.updateFormValidators();
    }
  }

  // ===========================================================================
  // FORM INITIALIZATION
  // ===========================================================================

  private initForm(): void {
    this.form = this.fb.group({
      // Address fields
      streetNumber: ['', [Validators.maxLength(20)]],
      streetName: ['', [Validators.required, Validators.maxLength(150)]],
      complement: ['', [Validators.maxLength(150)]],
      postalCode: ['', [Validators.required, Validators.maxLength(20)]],
      city: ['', [Validators.required, Validators.maxLength(100)]],
      stateProvince: ['', [Validators.maxLength(100)]],
      countryCode: [this.config.defaultCountryCode, [Validators.required, Validators.minLength(2), Validators.maxLength(2)]],

      // Metadata fields
      addressType: [this.config.defaultType, [Validators.required]],
      label: ['', [Validators.maxLength(50)]],
      notes: ['', [Validators.maxLength(500)]],

      // Flags
      isDefault: [false],
      isPrimary: [false],
      billingEligible: [true],
      shippingEligible: [true]
    });

    // Update validators based on config
    this.updateFormValidators();

    // Patch with initial data if editing
    if (this.mode === 'edit' && this.initialData) {
      this.patchFormWithData();
    }
  }

  private updateFormValidators(): void {
    if (!this.form) return;

    const stateControl = this.form.get('stateProvince');
    if (stateControl) {
      if (this.config.requireStateProvince) {
        stateControl.setValidators([Validators.required, Validators.maxLength(100)]);
      } else {
        stateControl.setValidators([Validators.maxLength(100)]);
      }
      stateControl.updateValueAndValidity();
    }
  }

  private patchFormWithData(): void {
    if (!this.form || !this.initialData) return;

    const addr = this.initialData.address;
    const link = this.initialData;

    this.form.patchValue({
      streetNumber: addr.streetNumber || '',
      streetName: addr.streetName || '',
      complement: addr.complement || '',
      postalCode: addr.postalCode || '',
      city: addr.city || '',
      stateProvince: addr.stateProvince || '',
      countryCode: addr.countryCode || this.config.defaultCountryCode,
      addressType: link.addressType,
      label: link.label || '',
      notes: link.notes || ''
    });

    // UserAddress specific fields
    if (isUserAddress(this.initialData)) {
      const userAddr = this.initialData as UserAddress;
      this.form.patchValue({
        isDefault: link.isDefault,
        isPrimary: userAddr.isPrimary,
        billingEligible: userAddr.billingEligible,
        shippingEligible: userAddr.shippingEligible
      });
    }
  }

  // ===========================================================================
  // COMPUTED VALUES
  // ===========================================================================

  get typeOptions(): Array<{ value: AddressType; label: string; icon: string }> {
    return getAddressTypeOptions(this.config.context);
  }

  get isEditMode(): boolean {
    return this.mode === 'edit';
  }

  get formTitle(): string {
    return this.isEditMode ? 'Modifier l\'adresse' : 'Nouvelle adresse';
  }

  get submitLabel(): string {
    if (this.isSubmitting) return 'Enregistrement...';
    return this.isEditMode ? 'Enregistrer' : 'Créer';
  }

  // ===========================================================================
  // FIELD ACCESSORS
  // ===========================================================================

  get f() {
    return this.form.controls;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  getFieldError(fieldName: string): string | null {
    const field = this.form.get(fieldName);
    if (!field || !field.errors) return null;

    if (field.errors['required']) return 'Ce champ est requis';
    if (field.errors['maxlength']) {
      const max = field.errors['maxlength'].requiredLength;
      return `Maximum ${max} caractères`;
    }
    if (field.errors['minlength']) {
      const min = field.errors['minlength'].requiredLength;
      return `Minimum ${min} caractères`;
    }

    return 'Valeur invalide';
  }

  // ===========================================================================
  // EVENT HANDLERS
  // ===========================================================================

  handleSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;

    if (this.mode === 'create') {
      const request: CreateAddressRequest = {
        streetNumber: formValue.streetNumber || null,
        streetName: formValue.streetName,
        complement: formValue.complement || null,
        postalCode: formValue.postalCode,
        city: formValue.city,
        stateProvince: formValue.stateProvince || null,
        countryCode: formValue.countryCode.toUpperCase(),
        addressType: formValue.addressType,
        label: formValue.label || null,
        notes: formValue.notes || null,
        isDefault: formValue.isDefault,
        isPrimary: formValue.isPrimary,
        billingEligible: formValue.billingEligible,
        shippingEligible: formValue.shippingEligible
      };
      this.onSubmit.emit(request);
    } else {
      const request: UpdateAddressRequest = {
        streetNumber: formValue.streetNumber || null,
        streetName: formValue.streetName || null,
        complement: formValue.complement || null,
        postalCode: formValue.postalCode || null,
        city: formValue.city || null,
        stateProvince: formValue.stateProvince || null,
        countryCode: formValue.countryCode?.toUpperCase() || null,
        label: formValue.label || null,
        notes: formValue.notes || null,
        billingEligible: formValue.billingEligible,
        shippingEligible: formValue.shippingEligible
      };
      this.onSubmit.emit(request);
    }
  }

  handleCancel(): void {
    this.onCancel.emit();
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  resetForm(): void {
    this.form.reset({
      countryCode: this.config.defaultCountryCode,
      addressType: this.config.defaultType,
      isDefault: false,
      isPrimary: false,
      billingEligible: true,
      shippingEligible: true
    });
  }
}
