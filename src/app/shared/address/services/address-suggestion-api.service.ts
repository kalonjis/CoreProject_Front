import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type AddressSearchField = 'streetName' | 'city' | 'postalCode';

export interface AddressSuggestion {
  publicId:     string;
  displayText:  string;
  streetNumber: string | null;
  streetName:   string | null;
  complement:   string | null;
  postalCode:   string | null;
  city:         string | null;
  countryCode:  string | null;
}

@Injectable({ providedIn: 'root' })
export class AddressSuggestionApiService {

  private readonly http = inject(HttpClient);

  search(query: string, limit = 8): Observable<AddressSuggestion[]> {
    return this.http.get<AddressSuggestion[]>('/api/addresses/suggestions', {
      params: { field: 'streetName', q: query, limit: limit.toString() },
      withCredentials: true
    });
  }
}
