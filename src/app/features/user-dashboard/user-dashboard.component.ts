import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {FeedbackComponent} from '../../shared/feedback/feedback.component';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {FeedbackBase} from '../../shared/feedback/tools/feedback.base';
import {AdminService} from '../../data/services/admin.service';
import {DeviceService} from '../../data/services/device-service.service';
import {ConnectionLogService} from '../../data/services/connection-log.service';
import {catchError, forkJoin, of, Subscription, switchMap} from 'rxjs';
import {UserDTO} from '../../data/models/user/user-dto';
import {ConnectionLogDTO} from '../../data/models/Connection-log-dto';
import {Device} from '../../data/models/device/device';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FeedbackComponent, ReactiveFormsModule],
  templateUrl: './user-dashboard.component.html',
  styleUrl: './user-dashboard.component.scss'
})
export class UserDashboardComponent extends FeedbackBase implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private adminService = inject(AdminService);
  private deviceService = inject(DeviceService);
  private connectionLogService = inject(ConnectionLogService);
  private fb = inject(FormBuilder);

  private subscriptions = new Subscription();

  // États
  isLoading = signal(true);
  user = signal<UserDTO | null>(null);
  devices = signal<Device[]>([]);
  recentLogs = signal<ConnectionLogDTO[]>([]);
  userStats = signal<any>({});

  // Formulaire de filtre des logs
  filterForm: FormGroup;

  // Périodes de filtre prédéfinies
  timePeriods = [
    { value: 7, label: '7 derniers jours' },
    { value: 30, label: '30 derniers jours' },
    { value: 90, label: '3 derniers mois' },
    { value: 365, label: '12 derniers mois' }
  ];

  // Onglet actif
  activeTab = signal('overview');

  constructor() {
    super();

    this.filterForm = this.fb.group({
      period: [30], // Par défaut 30 jours
      fromDate: [null],
      toDate: [null],
      actionTypes: [[]]
    });
  }

  ngOnInit(): void {
    // Récupérer l'ID utilisateur depuis les paramètres d'URL
    this.subscriptions.add(
      this.route.paramMap.pipe(
        switchMap(params => {
          const userId = Number(params.get('id'));
          if (isNaN(userId)) {
            this.router.navigate(['/admin/users']);
            return of(null);
          }
          return this.loadUserData(userId);
        })
      ).subscribe()
    );

    // S'abonner aux changements du formulaire de filtre
    this.subscriptions.add(
      this.filterForm.valueChanges.subscribe(() => {
        if (this.user()) {
          this.loadLogs(this.user()!.id);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadUserData(userId: number) {
    this.isLoading.set(true);

    // Utiliser forkJoin pour charger toutes les données en parallèle
    return forkJoin({
      userData: this.adminService.getUserById(userId),
      userDevices: this.adminService.getUserDevices(userId),
      userStats: this.connectionLogService.getUserStats(userId)
    }).pipe(
      switchMap(results => {
        this.user.set(results.userData);
        this.devices.set(results.userDevices);
        this.userStats.set(results.userStats);

        // Charger les logs avec les filtres actuels
        return this.loadLogs(userId);
      }),
      catchError(error => {
        this.isLoading.set(false);
        this.handleError(error);
        return of(null);
      })
    );
  }

  loadLogs(userId: number) {
    const filterValue = this.filterForm.value;

    return this.connectionLogService.getUserLogs(
      userId,
      filterValue.actionTypes,
      filterValue.fromDate,
      filterValue.toDate,
      0, // page
      10  // size
    ).pipe(
      catchError(error => {
        this.handleError(error);
        return of(null);
      })
    ).subscribe(logs => {
      if (logs) {
        this.recentLogs.set(logs.content || []);
      }
      this.isLoading.set(false);
    });
  }

  handleError(error: any): void {
    console.error('Error loading user dashboard data', error);

    let errorMessage = 'Une erreur est survenue lors du chargement des données.';
    if (error?.error?.message) {
      errorMessage = error.error.message;
    }

    this.displayError(errorMessage, 'Réessayer');
    this.buttonAction = () => {
      if (this.user()) {
        this.loadUserData(this.user()!.id);
      } else {
        this.router.navigate(['/admin/users']);
      }
    };
  }

  // Méthode pour afficher une durée relative depuis une date
  formatRelativeTime(dateString: string): string {
    return formatRelative(dateString);
  }

  // Méthode pour afficher le meilleur rôle d'un utilisateur
  getTopRole(roles: string[]): string {
    if (!roles || roles.length === 0) return 'USER';

    const roleOrder = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'USER', 'GUEST'];

    for (const role of roleOrder) {
      if (roles.includes(role)) {
        return role;
      }
    }

    return roles[0];
  }

  // Méthode pour formatter une date
  formatDate(date: string | null): string {
    if (!date) return 'Jamais';
    return new Date(date).toLocaleString();
  }

  // Changer d'onglet
  setActiveTab(tab: string): void {
    this.activeTab.set(tab);
  }

  // Méthode pour mettre à jour la période sur laquelle filtrer les logs
  updatePeriod(days: number): void {
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    this.filterForm.patchValue({
      fromDate: fromDate.toISOString().split('T')[0],
      toDate: toDate.toISOString().split('T')[0]
    });
  }

  // Méthode pour réinitialiser le mot de passe d'un utilisateur
  resetUserPassword(): void {
    if (!this.user()) return;

    if (confirm(`Êtes-vous sûr de vouloir réinitialiser le mot de passe de ${this.user()!.username} ?`)) {
      this.adminService.forceResetPassword(this.user()!.id).subscribe({
        next: () => {
          this.displaySuccess('Un email de réinitialisation de mot de passe a été envoyé à l\'utilisateur', '');
        },
        error: (error) => {
          this.handleError(error);
        }
      });
    }
  }

  // Méthode pour activer/désactiver un utilisateur
  toggleUserStatus(): void {
    if (!this.user()) return;

    const isEnabled = this.user()!.enabled;
    const action = isEnabled ? 'désactiver' : 'activer';

    if (confirm(`Êtes-vous sûr de vouloir ${action} le compte de ${this.user()!.username} ?`)) {
      const request = isEnabled
        ? this.adminService.deactivateUser(this.user()!.id)
        : this.adminService.activateUser(this.user()!.id);

      request.subscribe({
        next: () => {
          // Mettre à jour l'état local de l'utilisateur
          this.user.update(user => user ? { ...user, enabled: !isEnabled } : null);
          this.displaySuccess(`Le compte a été ${isEnabled ? 'désactivé' : 'activé'} avec succès`, '');
        },
        error: (error) => {
          this.handleError(error);
        }
      });
    }
  }

  // Méthode pour supprimer un utilisateur
  deleteUser(): void {
    if (!this.user()) return;

    if (confirm(`ATTENTION: Êtes-vous sûr de vouloir supprimer définitivement le compte de ${this.user()!.username} ? Cette action est irréversible.`)) {
      this.adminService.deleteUser(this.user()!.id).subscribe({
        next: () => {
          this.displaySuccess('L\'utilisateur a été supprimé avec succès', '');

          // Rediriger vers la liste des utilisateurs après un court délai
          setTimeout(() => {
            this.router.navigate(['/admin/users']);
          }, 1500);
        },
        error: (error) => {
          this.handleError(error);
        }
      });
    }
  }
}
