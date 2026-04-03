import { Component, Input, Output, EventEmitter, OnInit, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CrmUserApiService } from '../../services/crm-user-api.service';
import { CommercialSummary, commercialDisplayName } from '../../models/commercial.model';

@Component({
  standalone: true,
  selector: 'app-commercial-picker',
  imports: [FormsModule],
  templateUrl: './commercial-picker.component.html'
})
export class CommercialPickerComponent implements OnInit {
  /** Affiche une option "— Non assigné —" (valeur null) */
  @Input() nullable = false;
  @Input() required = false;
  @Input() prefilledPublicId = '';
  @Output() selected = new EventEmitter<string | null>();

  private readonly userApi = inject(CrmUserApiService);

  commercials      = signal<CommercialSummary[]>([]);
  selectedPublicId = '';
  readonly displayName = commercialDisplayName;

  ngOnInit(): void {
    this.selectedPublicId = this.prefilledPublicId;
    this.userApi.getCommercials().subscribe({
      next: list => this.commercials.set(list),
      error: ()  => {}
    });
  }

  onChange(): void {
    this.selected.emit(this.selectedPublicId || null);
  }
}
