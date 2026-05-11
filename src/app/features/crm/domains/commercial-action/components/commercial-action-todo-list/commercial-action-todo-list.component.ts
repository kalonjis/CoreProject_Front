import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommercialActionResponse } from '../../models/commercial-action.model';
import { CommercialActionCardComponent, CompleteEvent } from '../commercial-action-card/commercial-action-card.component';
import { CrmEmptyStateComponent } from '../../../../shared/empty-state/crm-empty-state.component';

@Component({
  selector: 'app-commercial-action-todo-list',
  imports: [CommercialActionCardComponent, CrmEmptyStateComponent],
  templateUrl: './commercial-action-todo-list.component.html',
  styleUrl: './commercial-action-todo-list.component.scss'
})
export class CommercialActionTodoListComponent {

  @Input({ required: true }) set actions(value: CommercialActionResponse[]) {
    this._actions.set(value);
  }

  @Output() completed = new EventEmitter<CompleteEvent>();
  @Output() cancelled = new EventEmitter<string>();
  @Output() edited    = new EventEmitter<void>();

  private readonly _actions = signal<CommercialActionResponse[]>([]);

  readonly isEmpty         = computed(() => this._actions().length === 0);
  readonly todayActions    = computed(() => this._actions().filter(a => this.isToday(a.dueDate)));
  readonly thisWeekActions = computed(() => this._actions().filter(a => this.isThisWeek(a.dueDate)));
  readonly laterActions    = computed(() => this._actions().filter(a => !this.isToday(a.dueDate) && !this.isThisWeek(a.dueDate)));

  private isToday(dueDate: string | null): boolean {
    if (!dueDate) return false;
    return dueDate.slice(0, 10) === new Date().toISOString().slice(0, 10);
  }

  private isThisWeek(dueDate: string | null): boolean {
    if (!dueDate || this.isToday(dueDate)) return false;
    const date = new Date(dueDate.slice(0, 10));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in7days = new Date(today);
    in7days.setDate(today.getDate() + 7);
    return date > today && date <= in7days;
  }
}
