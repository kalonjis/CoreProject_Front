import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  private http = inject(HttpClient);

  // Données statistiques
  totalUsers = signal(0);
  activeUsers = signal(0);
  totalDevices = signal(0);
  isLoading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    //this.loadDashboardStats();
    this.isLoading.set(true);

    this.getTotalUsers();
    this.getTotalDevices();
    this.getTotalActiveUsers()
    this.isLoading.set(false);

  }

  getTotalUsers(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.http.get<any>('api/admin/users/count-total').subscribe({
      next: data => {
        this.totalUsers.set(data.totalUsers || 0);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading dashboard stats', err);
        this.error.set('Impossible de charger les statistiques du tableau de bord');
        this.isLoading.set(false);
      }
    })
  }


  getTotalDevices(): void {


    this.http.get<any>('api/admin/device/count-total').subscribe({
      next: data => {
        this.totalDevices.set(data.totalDevices || 0);
      },
      error: (err) => {
        console.error('Error loading dashboard stats', err);
        this.error.set('Impossible de charger les statistiques du tableau de bord');
        this.isLoading.set(false);
      }
    })
  }


  getTotalActiveUsers(): void {
    this.http.get<any>('/api/admin/users/count-active').subscribe({
      next: data => {
        this.activeUsers.set(data.totalActiveUsers || 0);
      },
      error: (err) => {
        console.error('Error loading dashboard stats', err);
        this.error.set('Impossible de charger les statistiques du tableau de bord');
        this.isLoading.set(false);
      }
    })
  }

  loadDashboardStats(): void {
    this.isLoading.set(true);
    this.error.set(null);

    // Appel API pour récupérer les statistiques
    this.http.get<any>('/api/admin/stats').subscribe({
      next: (stats) => {
        this.totalUsers.set(stats.totalUsers || 0);
        this.activeUsers.set(stats.activeUsers || 0);
        this.totalDevices.set(stats.totalDevices || 0);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading dashboard stats', err);
        this.error.set('Impossible de charger les statistiques du tableau de bord');
        this.isLoading.set(false);
      }
    });
  }
}
