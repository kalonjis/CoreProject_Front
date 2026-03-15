import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CrmSidebarComponent } from './crm-sidebar.component';

@Component({
  selector: 'app-crm-shell',
  imports: [RouterOutlet, CrmSidebarComponent],
  templateUrl: './crm-shell.component.html',
  styleUrl: './crm-shell.component.scss'
})
export class CrmShellComponent {}
