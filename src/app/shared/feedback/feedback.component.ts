// src/app/shared/feedback/feedback.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FeedbackType} from './tools/feedback.model';

@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class FeedbackComponent {
  @Input() message: string = '';
  @Input() type: FeedbackType = 'success';
  @Input() buttonText: string = '';
  @Input() timeout: number | null = null;
  @Output() buttonClicked = new EventEmitter<void>();

  // État interne
  visible = true;

  ngOnInit() {
    // Auto-dismissal
    if (this.timeout && this.timeout > 0) {
      setTimeout(() => {
        this.visible = false;
      }, this.timeout);
    }
  }

  onButtonClick() {
    this.buttonClicked.emit();
    this.visible = false;
  }

  // Helper pour les classes CSS
  get feedbackClass(): string {
    return `feedback-${this.type}`;
  }

  get buttonClass(): string {
    return `button-${this.type}`;
  }

  // Helper pour l'icône
  get icon(): string {
    switch(this.type) {
      case 'success': return '✓';
      case 'error': return '!';
      case 'warning': return '⚠';
      case 'info': return 'i';
      default: return '';
    }
  }
}
