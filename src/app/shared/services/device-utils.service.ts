import { Injectable } from '@angular/core';
import { Device } from '../../data/models/device/device';
import { DeviceTrustLevel } from '../../data/models/device/device-trust-level';

@Injectable({
  providedIn: 'root'
})
export class DeviceUtilsService {

  // Options de niveau de confiance pour l'interface utilisateur
  readonly trustLevelOptions = [
    { value: DeviceTrustLevel.HIGHLY_TRUSTED, label: 'Très fiable' },
    { value: DeviceTrustLevel.TRUSTED, label: 'Fiable' },
    { value: DeviceTrustLevel.BASIC, label: 'Basique' },
    { value: DeviceTrustLevel.UNTRUSTED, label: 'Non fiable' }
  ];

  constructor() { }

  /**
   * Obtient l'icône appropriée pour un type d'appareil
   */
  getDeviceIcon(deviceType: string): string {
    switch (deviceType.toLowerCase()) {
      case 'mobile':
        return '📱';
      case 'tablet':
        return '📱';
      case 'desktop':
      case 'laptop':
        return '💻';
      case 'tv':
      case 'smarttv':
        return '📺';
      default:
        return '🖥️';
    }
  }

  /**
   * Formate une date ISO en chaîne localisée
   */
  formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  /**
   * Obtient le libellé du niveau de confiance pour l'affichage
   */
  getTrustLevelLabel(level: DeviceTrustLevel): string {
    const option = this.trustLevelOptions.find(opt => opt.value === level);
    return option ? option.label : 'Inconnu';
  }

  /**
   * Obtient la classe CSS pour le niveau de confiance
   */
  getTrustLevelClass(level: DeviceTrustLevel): string {
    switch (level) {
      case DeviceTrustLevel.HIGHLY_TRUSTED: return 'level-highly-trusted';
      case DeviceTrustLevel.TRUSTED: return 'level-trusted';
      case DeviceTrustLevel.BASIC: return 'level-basic';
      case DeviceTrustLevel.UNTRUSTED: return 'level-untrusted';
      default: return '';
    }
  }

  /**
   * Obtient le statut de l'appareil sous forme de texte
   */
  getDeviceStatus(device: Device): string {
    if (device.blacklisted) return 'Blacklisté';
    if (device.loggedOut) return 'Déconnecté';
    if (device.confirmed) return 'Confirmé';
    return 'Non confirmé';
  }

  /**
   * Obtient la classe CSS pour le statut de l'appareil
   */
  getDeviceStatusClass(device: Device): string {
    if (device.blacklisted) return 'status-blacklisted';
    if (device.loggedOut) return 'status-disconnected';
    if (device.confirmed) return 'status-confirmed';
    return 'status-unconfirmed';
  }

  /**
   * Trie les appareils selon un champ et une direction
   */
  sortDevices(devices: Device[], field: keyof Device, direction: 'asc' | 'desc'): Device[] {
    return [...devices].sort((a, b) => {
      let comparison = 0;

      // Traitement spécial pour les dates
      if (field === 'lastSeen' || field === 'firstSeen' || field === 'logoutTime') {
        const dateA = a[field] ? new Date(a[field]).getTime() : 0;
        const dateB = b[field] ? new Date(b[field]).getTime() : 0;
        comparison = dateA - dateB;
      }
      // Traitement pour les booléens
      else if (typeof a[field] === 'boolean') {
        comparison = (a[field] === b[field]) ? 0 : a[field] ? 1 : -1;
      }
      // Traitement par défaut (chaînes)
      else {
        const valA = String(a[field] || '').toLowerCase();
        const valB = String(b[field] || '').toLowerCase();
        comparison = valA.localeCompare(valB);
      }

      return direction === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Filtre les appareils selon un texte de recherche
   */
  filterDevices(devices: Device[], filterText: string): Device[] {
    if (!filterText) return devices;

    const filter = filterText.toLowerCase();
    return devices.filter(device =>
      device.deviceType.toLowerCase().includes(filter) ||
      device.browser.toLowerCase().includes(filter) ||
      device.operatingSystem.toLowerCase().includes(filter) ||
      (device.deviceBrand && device.deviceBrand.toLowerCase().includes(filter))
    );
  }

  /**
   * Formate une adresse IP pour l'affichage
   */
  formatIpAddress(ip: string | null): string {
    return ip || 'Non disponible';
  }
}
