/**
 * Rich-text email compose panel for CRM contexts.
 *
 * Wraps a {@link RichTextEditorComponent} (TipTap) with a subject field.
 * Emits {@link send} with subject and HTML body when the user clicks Send.
 * The parent is responsible for calling {@link reset} after the HTTP call completes.
 */
import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RichTextEditorComponent } from '../../../../shared/rich-text-editor/rich-text-editor.component';

export interface EmailComposeSubmit {
  subject: string;
  /** HTML string produced by TipTap. */
  body: string;
}

@Component({
  selector: 'app-email-compose',
  imports: [FormsModule, RichTextEditorComponent],
  templateUrl: './email-compose.component.html',
  styleUrl: './email-compose.component.scss'
})
export class EmailComposeComponent {

  /** Optional: pre-fill subject (e.g. "Re: Deal XYZ") */
  @Input() defaultSubject = '';

  /** Emitted when the user clicks Send */
  @Output() send   = new EventEmitter<EmailComposeSubmit>();

  /** Emitted when the user clicks Cancel */
  @Output() cancel = new EventEmitter<void>();

  subject = '';
  body    = '';

  readonly sending = signal(false);

  /** Body is valid when TipTap emits non-empty HTML (empty editor → ''). */
  get canSend(): boolean {
    return this.subject.trim().length > 0 && this.body.length > 0;
  }

  ngOnInit(): void {
    this.subject = this.defaultSubject;
  }

  onSend(): void {
    if (!this.canSend || this.sending()) return;
    this.sending.set(true);
    this.send.emit({ subject: this.subject.trim(), body: this.body });
  }

  /** Called by the parent after the HTTP call completes (success or error). */
  reset(): void {
    this.sending.set(false);
    this.subject = '';
    this.body    = '';
  }
}
