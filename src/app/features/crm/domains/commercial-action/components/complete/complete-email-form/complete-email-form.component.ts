import { Component, Input, OnInit, Output, EventEmitter, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommercialActionResponse, CompleteCommercialActionRequest } from '../../../models/commercial-action.model';

@Component({
  selector: 'app-complete-email-form',
  imports: [FormsModule],
  templateUrl: './complete-email-form.component.html',
  styleUrl:    './complete-email-form.component.scss'
})
/** Completion form for EMAIL-type commercial actions, capturing subject and body snippet. */
export class CompleteEmailFormComponent implements OnInit {
  @Input({ required: true }) action!: CommercialActionResponse;
  @Output() confirmed = new EventEmitter<CompleteCommercialActionRequest>();
  @Output() cancelled = new EventEmitter<void>();

  emailSubject  = signal('');
  bodySnippet   = signal('');

  get isValid(): boolean { return this.emailSubject().trim().length > 0; }

  ngOnInit(): void {
    this.emailSubject.set(this.action.title);
  }

  submit(): void {
    if (!this.isValid) return;
    this.confirmed.emit({
      emailLogDetails: {
        emailSubject: this.emailSubject().trim(),
        bodySnippet:  this.bodySnippet().trim() || undefined
      }
    });
  }
}
