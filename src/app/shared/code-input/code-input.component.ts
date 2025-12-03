import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChildren,
  QueryList,
  OnInit,
  AfterViewInit,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * CodeInputComponent - Reusable code/PIN input with individual boxes.
 *
 * Features:
 * - Configurable length (4, 6, 8 digits)
 * - Auto-focus and auto-advance
 * - Paste support (full code)
 * - Backspace navigation
 * - Auto-submit when complete
 * - Optional masking (like password)
 *
 * Usage:
 * ```html
 * <app-code-input
 *   [length]="6"
 *   [autoSubmit]="true"
 *   (codeComplete)="onCodeEntered($event)">
 * </app-code-input>
 * ```
 */
@Component({
  selector: 'app-code-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './code-input.component.html',
  styleUrl: './code-input.component.scss'
})
export class CodeInputComponent implements OnInit, AfterViewInit {

  // =========================================================================
  // INPUTS
  // =========================================================================

  /** Number of input boxes (default: 6) */
  @Input() length = 6;

  /** Auto-focus first input on init */
  @Input() autoFocus = true;

  /** Emit codeComplete when all digits entered */
  @Input() autoSubmit = true;

  /** Mask input like password */
  @Input() mask = false;

  /** Disable all inputs */
  @Input() disabled = false;

  /** Input type: 'numeric' (0-9) or 'alphanumeric' */
  @Input() inputType: 'numeric' | 'alphanumeric' = 'numeric';

  // =========================================================================
  // OUTPUTS
  // =========================================================================

  /** Emitted when all digits are entered */
  @Output() codeComplete = new EventEmitter<string>();

  /** Emitted on every change */
  @Output() codeChange = new EventEmitter<string>();

  // =========================================================================
  // STATE
  // =========================================================================

  @ViewChildren('inputEl') inputElements!: QueryList<ElementRef<HTMLInputElement>>;

  /** Array of digit values */
  digits = signal<string[]>([]);

  /** Computed: current full code */
  currentCode = computed(() => this.digits().join(''));

  /** Computed: is code complete */
  isComplete = computed(() => {
    const digits = this.digits();
    return digits.length === this.length && digits.every(d => d !== '');
  });

  // =========================================================================
  // LIFECYCLE
  // =========================================================================

  ngOnInit(): void {
    // Initialize digits array immediately
    this.digits.set(Array(this.length).fill(''));
  }

  ngAfterViewInit(): void {
    // Auto-focus first input
    if (this.autoFocus && !this.disabled) {
      setTimeout(() => this.focusInput(0), 0);
    }
  }

  // =========================================================================
  // EVENT HANDLERS
  // =========================================================================

  /**
   * Handle input event on a single box.
   */
  onInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Filter based on input type
    if (this.inputType === 'numeric') {
      value = value.replace(/[^0-9]/g, '');
    } else {
      value = value.replace(/[^a-zA-Z0-9]/g, '');
    }

    // Take only first character
    const char = value.charAt(0);

    // Update digits array
    const newDigits = [...this.digits()];
    newDigits[index] = char;
    this.digits.set(newDigits);

    // Update input value (in case we filtered something)
    input.value = char;

    // Emit change
    this.codeChange.emit(this.currentCode());

    // Move to next input if we have a value
    if (char && index < this.length - 1) {
      this.focusInput(index + 1);
    }

    // Check if complete
    this.checkComplete();
  }

  /**
   * Handle keydown for navigation.
   */
  onKeyDown(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;

    switch (event.key) {
      case 'Backspace':
        if (!input.value && index > 0) {
          // Move to previous input and clear it
          event.preventDefault();
          const newDigits = [...this.digits()];
          newDigits[index - 1] = '';
          this.digits.set(newDigits);
          this.focusInput(index - 1);
          this.codeChange.emit(this.currentCode());
        } else if (input.value) {
          // Clear current input
          const newDigits = [...this.digits()];
          newDigits[index] = '';
          this.digits.set(newDigits);
          this.codeChange.emit(this.currentCode());
        }
        break;

      case 'ArrowLeft':
        if (index > 0) {
          event.preventDefault();
          this.focusInput(index - 1);
        }
        break;

      case 'ArrowRight':
        if (index < this.length - 1) {
          event.preventDefault();
          this.focusInput(index + 1);
        }
        break;

      case 'Delete':
        const newDigits = [...this.digits()];
        newDigits[index] = '';
        this.digits.set(newDigits);
        this.codeChange.emit(this.currentCode());
        break;
    }
  }

  /**
   * Handle paste event - fill all boxes.
   */
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();

    const pastedData = event.clipboardData?.getData('text') || '';
    let filtered: string;

    if (this.inputType === 'numeric') {
      filtered = pastedData.replace(/[^0-9]/g, '');
    } else {
      filtered = pastedData.replace(/[^a-zA-Z0-9]/g, '');
    }

    // Take only the number of characters we need
    const chars = filtered.slice(0, this.length).split('');

    // Pad with empty strings if needed
    while (chars.length < this.length) {
      chars.push('');
    }

    this.digits.set(chars);

    // Update all input values
    this.inputElements.forEach((el, i) => {
      el.nativeElement.value = chars[i];
    });

    // Focus appropriate input
    const nextEmptyIndex = chars.findIndex(c => !c);
    if (nextEmptyIndex >= 0) {
      this.focusInput(nextEmptyIndex);
    } else {
      this.focusInput(this.length - 1);
    }

    // Emit change
    this.codeChange.emit(this.currentCode());

    // Check if complete
    this.checkComplete();
  }

  /**
   * Handle focus - select content.
   */
  onFocus(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    input.select();
  }

  // =========================================================================
  // PUBLIC METHODS
  // =========================================================================

  /**
   * Reset all inputs.
   */
  reset(): void {
    this.digits.set(Array(this.length).fill(''));
    this.inputElements?.forEach(el => {
      el.nativeElement.value = '';
    });
    this.focusInput(0);
  }

  /**
   * Focus first input.
   */
  focus(): void {
    this.focusInput(0);
  }

  /**
   * Get current code value.
   */
  getCode(): string {
    return this.currentCode();
  }

  // =========================================================================
  // PRIVATE HELPERS
  // =========================================================================

  private focusInput(index: number): void {
    const inputs = this.inputElements?.toArray();
    if (inputs && inputs[index]) {
      inputs[index].nativeElement.focus();
    }
  }

  private checkComplete(): void {
    if (this.isComplete() && this.autoSubmit) {
      this.codeComplete.emit(this.currentCode());
    }
  }

  /**
   * TrackBy for ngFor.
   */
  trackByIndex(index: number): number {
    return index;
  }
}
