import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {WebAuthnSetupResponse} from './webauthn-models';


@Component({
  selector: 'app-webauthn-test',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './webauthn-test.component.html',
  styleUrl: './webauthn-test.component.scss'
})
export class WebAuthnTestComponent {
  private http = inject(HttpClient);

  result = signal<string>('');
  isLoading = signal<boolean>(false);

  async testWebAuthn() {
    this.isLoading.set(true);
    this.result.set('');

    try {
      const response = await firstValueFrom(
        this.http.post('/api/auth/2fa/webauthn/initiate-activation', {}, {
          withCredentials: true
        })
      ) as WebAuthnSetupResponse;

      this.result.set('API Response OK, testing WebAuthn...');

      // Convertir le challenge string en BufferSource
      const challengeBuffer = this.base64UrlToUint8Array(response.credentialCreationOptions.challenge);
      const userIdBuffer = this.base64UrlToUint8Array(response.credentialCreationOptions.user.id);

      const credential = await navigator.credentials.create({
        publicKey: {
          ...response.credentialCreationOptions,
          challenge: challengeBuffer,
          user: {
            ...response.credentialCreationOptions.user,
            id: userIdBuffer
          }
        }
      });

      this.result.set('✅ WebAuthn Success! Credential ID: ' + credential?.id);

    } catch (error: any) {
      this.result.set('❌ Error: ' + error.message);
      console.error('WebAuthn Test Error:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

// Fonction utilitaire pour convertir Base64URL en Uint8Array
  private base64UrlToUint8Array(base64UrlString: string): Uint8Array {
    const base64 = base64UrlString.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
    const binary = atob(padded);
    const buffer = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      buffer[i] = binary.charCodeAt(i);
    }
    return buffer;
  }
}
