import { Component, Input, OnInit, inject } from '@angular/core';
import { DatePipe }                from '@angular/common';
import { CrmChangeLogFacade }      from '../../facades/crm-change-log.facade';
import { CrmEntityType, fieldLabel } from '../../models/crm-change-log.model';

/**
 * Displays the paginated field change history for a single CRM entity.
 *
 * Scoped facade: the parent component must declare {@link CrmChangeLogFacade}
 * in its {@code providers} array so each detail page gets its own instance.
 *
 * Usage:
 * ```html
 * <app-change-log-list entityType="CONTACT" [entityPublicId]="contact.publicId" />
 * ```
 */
@Component({
  selector: 'app-change-log-list',
  providers: [CrmChangeLogFacade],
  imports: [DatePipe],
  templateUrl: './change-log-list.component.html',
  styleUrl: './change-log-list.component.scss'
})
export class ChangeLogListComponent implements OnInit {

  /** CRM entity type — CONTACT, DEAL, or ORGANISATION. */
  @Input({ required: true }) entityType!: CrmEntityType;

  /** Public identifier of the entity whose change history to display. */
  @Input({ required: true }) entityPublicId!: string;

  readonly facade = inject(CrmChangeLogFacade);

  /** Exposes the helper function to the template. */
  readonly fieldLabel = fieldLabel;

  ngOnInit(): void {
    this.facade.init(this.entityType, this.entityPublicId);
  }
}
