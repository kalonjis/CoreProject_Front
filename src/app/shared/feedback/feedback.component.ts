import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.component.html',
  standalone: true,
  styleUrl: './feedback.component.scss'
})
export class FeedbackComponent {
  @Input() message: string = '';
  @Input() isSuccess: boolean = true;
  @Input() buttonText: string = '';
  @Output() buttonClicked = new EventEmitter<void>();

  onButtonClick() {
    this.buttonClicked.emit();
  }
}
