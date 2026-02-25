// src/app/features/account/pages/privacy/privacy.component.ts

import {Component, inject, OnInit, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DeactivateAccountModalComponent
} from '../../components/deactivate-account-modal/deactivate-account-modal.component';
import {DataExportCardComponent} from '../../components/data-export-card/data-export-card.component';
import {ActivatedRoute, RouterLink} from '@angular/router';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [CommonModule, DeactivateAccountModalComponent, DataExportCardComponent, RouterLink],
  templateUrl: './privacy.component.html',
  styleUrl: './privacy.component.scss'
})
export class PrivacyComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);

  showDeactivationModal = signal(false);
  deactivationEmailSent = signal(false);

  deletionEmailSent = signal(false);

  openDeactivationModal(): void {
    this.showDeactivationModal.set(true);
  }

  closeDeactivationModal(): void {
    this.showDeactivationModal.set(false);
  }

  onDeactivationRequested(): void {
    this.showDeactivationModal.set(false);
    this.deactivationEmailSent.set(true);
  }


  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      if (params.get('deletionRequested') === 'true') {
        this.deletionEmailSent.set(true);
      }
    });
  }
}
