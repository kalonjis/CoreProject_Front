import {Component, ElementRef, EventEmitter, Input, OnInit, Output, signal, ViewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-backup-code-input',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './backup-code-input.component.html',
  styleUrl: './backup-code-input.component.scss'
})

/**
 * BackupCodeInputComponent - Input spécialisé pour les codes backup 2FA
 *
 * Format attendu: XXXX-XXXX-XXXX-XXXX
 *
 * Features:
 * - Auto-formatage avec tirets
 * - Copier-coller complet
 * - Validation du format
 * - Nettoyage automatique
 */

export class BackupCodeInputComponent implements OnInit {

  // ===========================================================================
  // INPUTS
  // ===========================================================================

  @Input() disabled = false;
  @Input() placeholder = 'XXXX-XXXX-XXXX-XXXX';
  @Input() autoFocus = true;
  @Input() showHint = true;

  // ===========================================================================
  // OUTPUTS
  // ===========================================================================

  @Output() codeComplete = new EventEmitter<string>();
  @Output() codeChange = new EventEmitter<string>();

  // ===========================================================================
  // STATE
  // ===========================================================================

  @ViewChild('inputEl') inputElement!: ElementRef<HTMLInputElement>;

  displayValue = signal('');
  private currentCode = '';

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  ngOnInit(): void {
    if (this.autoFocus && !this.disabled) {
      setTimeout(() => this.focus(), 100);
    }
  }

  // ===========================================================================
  // METHODS
  // ===========================================================================

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Nettoyer et formater
    const cleaned = this.cleanValue(value);
    const formatted = this.formatValue(cleaned);

    // Mettre à jour l'affichage
    this.displayValue.set(formatted);
    input.value = formatted;

    // Mettre à jour le code interne
    this.currentCode = cleaned;

    // Émettre les événements
    this.codeChange.emit(cleaned);

    if (this.isValidCode(cleaned)) {
      this.codeComplete.emit(cleaned);
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();

    const pastedText = event.clipboardData?.getData('text') || '';
    const cleaned = this.cleanValue(pastedText);

    if (cleaned.length <= 16) {
      const formatted = this.formatValue(cleaned);
      this.displayValue.set(formatted);
      this.currentCode = cleaned;

      this.codeChange.emit(cleaned);

      if (this.isValidCode(cleaned)) {
        this.codeComplete.emit(cleaned);
      }
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    // Autoriser navigation et suppression
    const allowedKeys = [
      'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight',
      'Tab', 'Enter', 'Escape'
    ];

    if (allowedKeys.includes(event.key)) {
      return;
    }

    // Autoriser Ctrl/Cmd + A/C/V/X
    if ((event.ctrlKey || event.metaKey) &&
      ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase())) {
      return;
    }

    // Bloquer si déjà au max
    const input = event.target as HTMLInputElement;
    if (input.value.replace(/-/g, '').length >= 16) {
      event.preventDefault();
      return;
    }

    // Autoriser seulement alphanumériques
    if (!/^[a-zA-Z0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  private cleanValue(value: string): string {
    // Nettoyer: garder seulement alphanumériques, convertir en majuscules
    return value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().substring(0, 16);
  }

  private formatValue(cleaned: string): string {
    // Formater avec des tirets: XXXX-XXXX-XXXX-XXXX
    return cleaned.match(/.{1,4}/g)?.join('-') || cleaned;
  }

  private isValidCode(code: string): boolean {
    return code.length === 16 && /^[A-Z0-9]{16}$/.test(code);
  }

  // ===========================================================================
  // PUBLIC API
  // ===========================================================================

  focus(): void {
    this.inputElement?.nativeElement.focus();
  }

  reset(): void {
    this.displayValue.set('');
    this.currentCode = '';
    this.codeChange.emit('');
  }

  getCode(): string {
    return this.currentCode;
  }

  hasError(): boolean {
    const code = this.currentCode;
    return code.length > 0 && !this.isValidCode(code);
  }

  isValid(): boolean {
    return this.isValidCode(this.currentCode);
  }
}
