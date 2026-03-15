import { Component, Input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ContactDetail } from '../../models/contact.model';
import { ContactStatusBadgeComponent } from '../contact-status-badge/contact-status-badge.component';

@Component({
  selector: 'app-contact-info-card',
  imports: [DatePipe, RouterLink, ContactStatusBadgeComponent],
  templateUrl: './contact-info-card.component.html',
  styleUrl: './contact-info-card.component.scss'
})
export class ContactInfoCardComponent {
  @Input({ required: true }) contact!: ContactDetail;
}
