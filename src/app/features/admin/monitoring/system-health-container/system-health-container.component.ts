// src/app/features/admin/monitoring/system-health-container/system-health-container.component.ts

import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, interval, takeUntil, forkJoin, catchError, of } from 'rxjs';

import { ActuatorHealthApiService } from '../services/actuator-health-api.service';
import { ActuatorMetricsApiService } from '../services/actuator-metrics-api.service';
import { CircuitBreakerApiService } from '../services/circuit-breaker-api.service';
import { CircuitBreakerStatus, ExecutorMetrics, HealthMetrics, HealthStatus, ServerStatus } from '../models';
import { HealthMetricsCardComponent } from '../components/health-metrics-card/health-metrics-card.component';
import { CircuitBreakerCardComponent } from '../components/circuit-breaker-card/circuit-breaker-card.component';
import { ServerStatusCardComponent } from '../components/server-status-card/server-status-card.component';
import { ExecutorMetricsCardComponent } from '../components/executor-metrics-card/executor-metrics-card.component';


/** Auto-refresh interval in milliseconds (30 seconds) */
const REFRESH_INTERVAL_MS = 30_000;

/**
 * System Health container component.
 *
 * Main dashboard for monitoring system health, accessible only to SUPER_ADMIN.
 * Displays:
 * - Server/service status (Application, Database, RabbitMQ, Email, Disk)
 * - Circuit breaker states with manual controls
 * - JVM, CPU, Disk and DB pool metrics
 * - Async executor thread pool metrics
 *
 * Features:
 * - Auto-refresh every 30 seconds
 * - Manual refresh button
 * - Aggregated loading and error states
 */
@Component({
  selector: 'app-system-health-container',
  standalone: true,
  imports: [
    CommonModule,
    ServerStatusCardComponent,
    CircuitBreakerCardComponent,
    HealthMetricsCardComponent,
    ExecutorMetricsCardComponent
  ],
  templateUrl: './system-health-container.component.html',
  styleUrl: './system-health-container.component.scss'
})
export class SystemHealthContainerComponent implements OnInit, OnDestroy {

  // ===========================================================================
  // SERVICES
  // ===========================================================================

  private readonly healthApi = inject(ActuatorHealthApiService);
  private readonly metricsApi = inject(ActuatorMetricsApiService);
  private readonly circuitBreakerApi = inject(CircuitBreakerApiService);

  // ===========================================================================
  // STATE
  // ===========================================================================

  /** Server/service statuses */
  serverStatuses = signal<ServerStatus[]>([]);

  /** Circuit breaker statuses */
  circuitBreakers = signal<CircuitBreakerStatus[]>([]);

  /** Health metrics (JVM, CPU, Disk, DB, Executors) */
  healthMetrics = signal<HealthMetrics | null>(null);

  /** Overall system status */
  overallStatus = signal<HealthStatus>('UNKNOWN');

  /** Loading state */
  isLoading = signal(true);

  /** Error message if any */
  error = signal<string | null>(null);

  /** Last successful data refresh */
  lastUpdated = signal<Date | null>(null);

  /** Auto-refresh enabled flag */
  autoRefreshEnabled = signal(true);

  // ===========================================================================
  // COMPUTED
  // ===========================================================================

  /** Count of services that are UP */
  healthyServicesCount = computed(() =>
    this.serverStatuses().filter(s => s.status === 'UP').length
  );

  /** Total number of monitored services */
  totalServicesCount = computed(() => this.serverStatuses().length);

  /** Count of circuit breakers in CLOSED state */
  closedCircuitBreakersCount = computed(() =>
    this.circuitBreakers().filter(cb => cb.state === 'CLOSED').length
  );

  /** Total number of circuit breakers */
  totalCircuitBreakersCount = computed(() => this.circuitBreakers().length);

  /** True if any circuit breaker is OPEN */
  hasOpenCircuitBreaker = computed(() =>
    this.circuitBreakers().some(cb => cb.state === 'OPEN' || cb.state === 'FORCED_OPEN')
  );

  /** Executor metrics extracted from health metrics */
  executorMetrics = computed<ExecutorMetrics[]>(() =>
    this.healthMetrics()?.executors ?? []
  );

  /** Count of saturated executors */
  saturatedExecutorsCount = computed(() =>
    this.executorMetrics().filter(e => e.saturated).length
  );

  /** Total number of executors */
  totalExecutorsCount = computed(() => this.executorMetrics().length);

  /** True if any executor is saturated */
  hasAnySaturatedExecutor = computed(() =>
    this.executorMetrics().some(e => e.saturated)
  );

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.loadAllData();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===========================================================================
  // DATA LOADING
  // ===========================================================================

  /**
   * Loads all system health data in parallel.
   * Updates loading state and error handling.
   */
  loadAllData(): void {
    this.isLoading.set(true);
    this.error.set(null);

    forkJoin({
      health: this.healthApi.getHealth().pipe(catchError(() => of(null))),
      metrics: this.metricsApi.getHealthMetrics().pipe(catchError(() => of(null))),
      circuitBreakers: this.circuitBreakerApi.getAll().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ health, metrics, circuitBreakers }) => {
        // Map health to server statuses
        if (health) {
          this.serverStatuses.set(this.healthApi.mapToServerStatuses(health));
          this.overallStatus.set(health.status);
        }

        // Set metrics (includes executors now)
        if (metrics) {
          this.healthMetrics.set(metrics);
        }

        // Set circuit breakers
        this.circuitBreakers.set(circuitBreakers);

        // Update timestamps and state
        this.lastUpdated.set(new Date());
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load system health data:', err);
        this.error.set('Failed to load system health data. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Manually triggers a data refresh.
   */
  refresh(): void {
    this.loadAllData();
  }

  // ===========================================================================
  // AUTO-REFRESH
  // ===========================================================================

  /**
   * Starts the auto-refresh interval.
   * Refreshes data every 30 seconds while enabled.
   */
  private startAutoRefresh(): void {
    interval(REFRESH_INTERVAL_MS)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.autoRefreshEnabled()) {
          this.loadAllData();
        }
      });
  }

  /**
   * Toggles auto-refresh on/off.
   */
  toggleAutoRefresh(): void {
    this.autoRefreshEnabled.update(enabled => !enabled);
  }

  // ===========================================================================
  // CIRCUIT BREAKER ACTIONS
  // ===========================================================================

  /**
   * Handles circuit breaker action (reset, force open, force close).
   * Called by CircuitBreakerCardComponent.
   *
   * @param event Action event with name and action type
   */
  onCircuitBreakerAction(event: { name: string; action: 'reset' | 'forceOpen' | 'forceClose' }): void {
    const { name, action } = event;

    let action$;
    switch (action) {
      case 'reset':
        action$ = this.circuitBreakerApi.reset(name);
        break;
      case 'forceOpen':
        action$ = this.circuitBreakerApi.forceOpen(name);
        break;
      case 'forceClose':
        action$ = this.circuitBreakerApi.forceClose(name);
        break;
    }

    action$.subscribe({
      next: (response) => {
        console.log(`Circuit breaker ${name} action completed:`, response.message);
        // Refresh circuit breaker data
        this.refreshCircuitBreakers();
      },
      error: (err) => {
        console.error(`Failed to ${action} circuit breaker ${name}:`, err);
        this.error.set(`Failed to ${action} circuit breaker "${name}".`);
      }
    });
  }

  /**
   * Refreshes only circuit breaker data.
   */
  private refreshCircuitBreakers(): void {
    this.circuitBreakerApi.getAll().subscribe({
      next: (circuitBreakers) => {
        this.circuitBreakers.set(circuitBreakers);
      },
      error: (err) => {
        console.error('Failed to refresh circuit breakers:', err);
      }
    });
  }
}
