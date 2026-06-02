import { Component, Input, inject } from '@angular/core';
import { CallFacade } from '../../core/telephony/services/call.facade';

/**
 * Renders a phone number as a clickable link.
 *
 * On click, it registers the call session on the backend (via {@link CallFacade}),
 * then opens the tel: URI so the OS dialler (Windows Phone Link, etc.) can handle
 * the actual call. The in-app {@link CallWidgetComponent} becomes visible once the
 * session is active.
 *
 * Usage:
 * ```html
 * <app-phone-link
 *   [phoneNumber]="contact.phone"
 *   [contactPublicId]="contact.publicId" />
 * ```
 */
@Component({
  selector: 'app-phone-link',
  template: `
    <button
      class="phone-link"
      [class.phone-link--busy]="facade.isCallActive()"
      [disabled]="facade.isInitiating() || facade.isCallActive()"
      (click)="call()"
      [title]="phoneNumber"
      type="button">
      <span class="phone-link__icon">📞</span>
      <span class="phone-link__number">{{ phoneNumber }}</span>
    </button>
  `,
  styleUrl: './phone-link.component.scss'
})
export class PhoneLinkComponent {

  /** E.164 or display phone number to dial. */
  @Input({ required: true }) phoneNumber!: string;

  /** Public ID of the CRM contact to link the session to. */
  @Input() contactPublicId?: string;

  /** Public ID of the CRM lead to link the session to. */
  @Input() leadPublicId?: string;

  readonly facade = inject(CallFacade);

  call(): void {
    this.facade.initiate(this.phoneNumber, this.contactPublicId, this.leadPublicId);
  }
}
