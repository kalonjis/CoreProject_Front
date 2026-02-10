// src/app/features/calendar/components/address-select/address-select.component.spec.ts

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AddressSelectComponent } from './address-select.component';
import { UserAddressApiService } from '../../../account/services/user-address-api.service';
import { UserAddress} from '../../../../shared/address';
import {AddressInput} from '../../models';

describe('AddressSelectComponent', () => {
  let component: AddressSelectComponent;
  let fixture: ComponentFixture<AddressSelectComponent>;
  let mockAddressApi: jasmine.SpyObj<UserAddressApiService>;

  const mockAddresses: UserAddress[] = [
    {
      publicId: 'addr-1',
      isPrimary: true,
      isDefault: false,
      label: 'Office',
      notes: null,
      addressType: 'PROFESSIONAL',
      address: {
        publicId: 'address-phys-1',
        streetName: 'Rue de la Paix',
        streetNumber: '10',
        complement: null,
        postalCode: '1348',
        city: 'Louvain-la-Neuve',
        stateProvince: null,
        countryCode: 'BE',
        formattedAddress: '10 Rue de la Paix, 1348 Louvain-la-Neuve, BE',
        latitude: null,
        longitude: null,
        validated: false
      },
      active: true,
      verified: true,
      verifiedByOwner: false,
      billingEligible: false,
      shippingEligible: false,
      validFrom: null,
      validTo: null,
      createdAt: new Date().toISOString()
    } as UserAddress,
    {
      publicId: 'addr-2',
      isPrimary: false,
      isDefault: false,
      label: 'Home',
      notes: null,
      addressType: 'RESIDENTIAL',
      address: {
        publicId: 'address-phys-2',
        streetName: 'Avenue Example',
        streetNumber: '5',
        complement: null,
        postalCode: '1000',
        city: 'Brussels',
        stateProvince: null,
        countryCode: 'BE',
        formattedAddress: '5 Avenue Example, 1000 Brussels, BE',
        latitude: null,
        longitude: null,
        validated: false
      },
      active: true,
      verified: true,
      verifiedByOwner: false,
      billingEligible: false,
      shippingEligible: false,
      validFrom: null,
      validTo: null,
      createdAt: new Date().toISOString()
    } as UserAddress
  ];

  beforeEach(async () => {
    // Create service mock
    mockAddressApi = jasmine.createSpyObj('UserAddressApiService', ['getAll']);

    await TestBed.configureTestingModule({
      imports: [AddressSelectComponent],
      providers: [
        { provide: UserAddressApiService, useValue: mockAddressApi }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddressSelectComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Loading addresses', () => {
    it('should load addresses on init', (done) => {
      mockAddressApi.getAll.and.returnValue(of(mockAddresses));

      fixture.detectChanges(); // ngOnInit

      setTimeout(() => {
        expect(mockAddressApi.getAll).toHaveBeenCalledWith({ active: true });
        expect(component.addresses()).toEqual(mockAddresses);
        expect(component.isLoading()).toBe(false);
        expect(component.hasError()).toBe(false);
        done();
      }, 100);
    });

    it('should handle loading error', (done) => {
      mockAddressApi.getAll.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      fixture.detectChanges(); // ngOnInit

      setTimeout(() => {
        expect(component.isLoading()).toBe(false);
        expect(component.hasError()).toBe(true);
        expect(component.addresses()).toEqual([]);
        done();
      }, 100);
    });
  });

  describe('Address selection', () => {
    beforeEach(() => {
      mockAddressApi.getAll.and.returnValue(of(mockAddresses));
      fixture.detectChanges();
    });

    it('should emit addressSelected when an address is selected', (done) => {
      component.addressSelected.subscribe((address: AddressInput) => {
        expect(address.streetName).toBe('Rue de la Paix');
        expect(address.city).toBe('Louvain-la-Neuve');
        done();
      });

      // Simulate address selection
      const select = document.createElement('select');
      select.value = 'addr-1';
      const event = new Event('change');
      Object.defineProperty(event, 'target', { value: select });

      component.onSelectAddress(event);
    });

    it('should emit createNew when "new" option is selected', (done) => {
      component.createNew.subscribe(() => {
        expect(true).toBe(true);
        done();
      });

      const select = document.createElement('select');
      select.value = 'new';
      const event = new Event('change');
      Object.defineProperty(event, 'target', { value: select });

      component.onSelectAddress(event);
    });
  });

  describe('Address formatting', () => {
    it('should format address correctly', () => {
      const formatted = component.formatAddress(mockAddresses[0]);
      expect(formatted).toContain('Rue de la Paix');
      expect(formatted).toContain('Louvain-la-Neuve');
    });

    it('should include label if present', () => {
      const label = component.getAddressLabel(mockAddresses[0]);
      expect(label).toContain('Bureau');
    });

    it('should highlight primary address', () => {
      const label = component.getAddressLabel(mockAddresses[0]);
      expect(label).toContain('⭐');
    });
  });

  describe('Retry mechanism', () => {
    it('should retry loading addresses', (done) => {
      mockAddressApi.getAll.and.returnValue(
        throwError(() => new Error('First error'))
      );
      fixture.detectChanges();

      // After error, simulate successful retry
      mockAddressApi.getAll.and.returnValue(of(mockAddresses));
      component.retry();

      setTimeout(() => {
        expect(component.hasError()).toBe(false);
        expect(component.addresses()).toEqual(mockAddresses);
        done();
      }, 100);
    });
  });
});
