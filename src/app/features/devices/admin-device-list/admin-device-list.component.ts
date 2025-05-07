import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Device } from '../../../data/models/device/device';
import { DeviceTrustLevel } from '../../../data/models/device/device-trust-level';
import { FeedbackComponent } from '../../../shared/feedback/feedback.component';
import { FeedbackBase } from '../../../shared/feedback/tools/feedback.base';
import { HttpErrorResponse } from '@angular/common/http';
import { DeviceUtilsService } from '../../../shared/services/device-utils.service';
import { AdminService } from '../../../data/services/admin.service';
import { ActivatedRoute } from '@angular/router';
import { DeviceDetailComponent } from '../../devices/device-detail/device-detail.component';

@Component({
  selector: 'app-admin-device-list',
  standalone: true,
  imports: [CommonModule, FormsModule, FeedbackComponent, DeviceDetailComponent],
  templateUrl: './admin-device-list.component.html',
  styleUrls: ['./admin-device-list.component.scss']
})
export class AdminDeviceListComponent extends FeedbackBase implements OnInit {
  private adminService = inject(AdminService);
  private deviceUtils = inject(DeviceUtilsService);
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

  // Getter pour les options de niveau de confiance
  get trustLevelOptions() {
    return this.deviceUtils.trustLevelOptions;
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      if (!isNaN(id)) {
        this.userId.set(id);
        this.loadUserDevices(id);
        // Charger les informations de l'utilisateur pour afficher son nom
        this.loadUserInfo(id);
      }
    });
  }

  loadUserDevices(userId: number): void {
    this.isLoading.set(true);
    this.adminService.getUserDevices(userId).subscribe({
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
    this.adminService.getUserById(userId).subscribe({
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

  // Méthodes de tri et filtrage
  sortDevices(field: keyof Device): void {
    if (this.sortField() === field) {
      // Inverser la direction si on clique sur le même champ
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
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
    const filteredDevices = this.deviceUtils.filterDevices(
      this.devices(),
      this.filterTextValue()
    );

    return this.deviceUtils.sortDevices(
      filteredDevices,
      this.sortField(),
      this.sortDirection()
    );
  }

  // Pour les fonctionnalités spécifiques à l'admin (exemple)
  blacklistDevice(deviceId: number): void {
    if (!confirm('Êtes-vous sûr de vouloir blacklister cet appareil ? L\'utilisateur ne pourra plus l\'utiliser pour se connecter.')) {
      return;
    }

    // Cette méthode est spécifique à l'admin, il faudrait l'implémenter dans le service admin
    // this.adminService.blacklistDevice(deviceId).subscribe({ ... });

    // Pour l'instant, on simule une réponse réussie
    this.displayWarning('Fonctionnalité non implémentée : Blacklister un appareil');
  }

  // Délégation au service utilitaire pour les fonctions communes
  getTrustLevelLabel(level: DeviceTrustLevel): string {
    return this.deviceUtils.getTrustLevelLabel(level);
  }

  getTrustLevelClass(level: DeviceTrustLevel): string {
    return this.deviceUtils.getTrustLevelClass(level);
  }

  formatDate(dateString: string | null): string {
    return this.deviceUtils.formatDate(dateString);
  }

  getDeviceStatus(device: Device): string {
    return this.deviceUtils.getDeviceStatus(device);
  }

  getDeviceStatusClass(device: Device): string {
    return this.deviceUtils.getDeviceStatusClass(device);
  }

  getDeviceIcon(deviceType: string): string {
    return this.deviceUtils.getDeviceIcon(deviceType);
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
