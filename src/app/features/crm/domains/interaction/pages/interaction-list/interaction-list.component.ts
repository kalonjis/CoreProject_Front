import { Component, signal } from '@angular/core';
import { InteractionLogFormComponent } from '../../components/interaction-log-form/interaction-log-form.component';

@Component({
  selector: 'app-interaction-list',
  imports: [InteractionLogFormComponent],
  templateUrl: './interaction-list.component.html',
  styleUrl: './interaction-list.component.scss'
})
export class InteractionListComponent {
  readonly showForm = signal(false);

  onLogged(): void {
    this.showForm.set(false);
  }
}
