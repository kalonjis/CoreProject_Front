import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CrmSidebarComponent } from './crm-sidebar.component';
import { CrmSearchBarComponent } from '../domains/search/components/crm-search-bar/crm-search-bar.component';

@Component({
  selector: 'app-crm-shell',
  imports: [RouterOutlet, CrmSidebarComponent, CrmSearchBarComponent],
  templateUrl: './crm-shell.component.html',
  styleUrl: './crm-shell.component.scss'
})
export class CrmShellComponent {}
