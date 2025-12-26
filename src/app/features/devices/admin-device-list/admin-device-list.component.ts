import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Device } from '../../../data/models/device/device';
import { FeedbackComponent } from '../../../shared/feedback/feedback.component';
import { FeedbackBase } from '../../../shared/feedback/tools/feedback.base';
import { HttpErrorResponse } from '@angular/common/http';
import { DeviceUtilsService } from '../../../shared/services/device-utils.service';
import {ActivatedRoute, RouterLink} from '@angular/router';
import { DeviceDetailComponent } from '../../devices/device-detail/device-detail.component';
import {AdminDeviceApiService} from '../../admin/services/admin-device-api.service';
import {AdminUserApiService} from '../../admin/services/admin-user-api.service';

@Component({
  selector: 'app-admin-device-list',
  standalone: true,
  imports: [CommonModule, FormsModule, FeedbackComponent, DeviceDetailComponent, RouterLink],
  templateUrl: './admin-device-list.component.html',
  styleUrls: ['./admin-device-list.component.scss']
})
export class AdminDeviceListComponent extends FeedbackBase implements OnInit {
  private adminDeviceApi = inject(AdminDeviceApiService);
  private adminUserApi = inject(AdminUserApiService);
  protected deviceUtils = inject(DeviceUtilsService);
  private route = inject(ActivatedRoute);

  // État du composant
  devices = signal<Device[]>([]);
  isLoading = signal(true);
  selectedDevice = signal<Device | null>(null);
  userId = signal<number | null>(null);
  userName = signal<string>('');

  // Pour le tri et le filtrage
  sortField = signal<keyof Device>('lastSeen');
  sortDirection = signal<'asc' | 'desc'>('desc');
  filterTextValue = signal('');

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      if (!isNaN(id)) {
        this.userId.set(id);
        this.loadUserDevices(id);
        this.loadUserInfo(id);
      }
    });
  }

  loadUserDevices(userId: number): void {
    this.isLoading.set(true);
    this.adminDeviceApi.getUserDevices(userId).subscribe({
      next: (devices) => {
        this.devices.set(devices);
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.handleError(error);
        this.isLoading.set(false);
      }
    });
  }

  loadUserInfo(userId: number): void {
    this.adminUserApi.getUserById(userId).subscribe({
      next: (user) => {
        this.userName.set(`${user.firstname || ''} ${user.lastname || ''} (${user.username})`);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des informations utilisateur', err);
      }
    });
  }

  selectDevice(device: Device): void {
    this.selectedDevice.set(device);
  }

  closeDeviceDetail(): void {
    this.selectedDevice.set(null);
  }

  // Méthodes de tri
  sortDevices(field: keyof Device): void {
    if (this.sortField() === field) {
      // Inverser la direction si on clique sur le même champ
      this.sortDirection.update(dir => dir === 'asc' ? 'desc' : 'asc');
    } else {
      // Nouveau champ de tri, réinitialiser à desc (récent -> ancien)
      this.sortField.set(field);
      this.sortDirection.set('desc');
    }
  }

  // Getters and setters for filterText (to be used with ngModel)
  get filterText(): string {
    return this.filterTextValue();
  }

  set filterText(value: string) {
    this.filterTextValue.set(value);
  }

  getSortedAndFilteredDevices(): Device[] {
    return this.deviceUtils.getSortedAndFilteredDevices(
      this.devices(),
      this.filterTextValue(),
      this.sortField(),
      this.sortDirection()
    );
  }

  // Pour les fonctionnalités spécifiques à l'admin
  blacklistDevice(deviceId: number): void {
    if (!confirm('Êtes-vous sûr de vouloir blacklister cet appareil ? L\'utilisateur ne pourra plus l\'utiliser pour se connecter.')) {
      return;
    }

    // Cette méthode est spécifique à l'admin, il faudrait l'implémenter dans le service admin
    // this.adminService.blacklistDevice(deviceId).subscribe({ ... });

    // Pour l'instant, on simule une réponse réussie
    this.displayWarning('Fonctionnalité non implémentée : Blacklister un appareil');
  }

  private handleError(error: HttpErrorResponse): void {
    let errorMessage = 'Une erreur est survenue lors de l\'opération.';

    if (error.error?.error) {
      errorMessage = error.error.error;
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    this.displayError(errorMessage);
  }
}
