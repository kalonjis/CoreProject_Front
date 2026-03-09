// src/app/features/admin/monitoring/system-health-container/system-health-container.component.ts

import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, interval, takeUntil, forkJoin, catchError, of } from 'rxjs';

import { ActuatorHealthApiService, ActuatorMetricsApiService, CircuitBreakerApiService, SmtpHealthApiService, TwilioHealthApiService } from '../services/';
import {
  CircuitBreakerStatus,
  createInitialSmtpState,
  createInitialTwilioState,
  ExecutorMetrics,
  HealthMetrics,
  HealthStatus,
  ServerStatus,
  SmtpHealthState,
  TwilioHealthState
} from '../models';
import { HealthMetricsCardComponent } from '../components/health-metrics-card/health-metrics-card.component';
import { CircuitBreakerCardComponent } from '../components/circuit-breaker-card/circuit-breaker-card.component';
import { ServerStatusCardComponent } from '../components/server-status-card/server-status-card.component';
import { ExecutorMetricsCardComponent } from '../components/executor-metrics-card/executor-metrics-card.component';
import {RouterLink} from '@angular/router';


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
    imports: [
        CommonModule,
        ServerStatusCardComponent,
        CircuitBreakerCardComponent,
        HealthMetricsCardComponent,
        ExecutorMetricsCardComponent,
        RouterLink
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
  private readonly smtpHealthApi = inject(SmtpHealthApiService);
  private readonly twilioHealthApi = inject(TwilioHealthApiService);

  // ===========================================================================
  // STATE
  // ===========================================================================

  /** Server/service statuses */
  serverStatuses = signal<ServerStatus[]>([]);

  /** Circuit breaker statuses */
  circuitBreakers = signal<CircuitBreakerStatus[]>([]);

  /** SMTP health state */
  smtpHealth = signal<SmtpHealthState>(createInitialSmtpState());

  /** Twilio health state */
  twilioHealth = signal<TwilioHealthState>(createInitialTwilioState());

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

  /** Current SMTP status for template binding */
  smtpStatus = computed(() => this.smtpHealth().status);

  /** True if SMTP test is in progress */
  isTestingSmtp = computed(() => this.smtpHealth().status === 'TESTING');

  /** Current Twilio status for template binding */
  twilioStatus = computed(() => this.twilioHealth().status);

  /** True if Twilio test is in progress */
  isTestingTwilio = computed(() => this.twilioHealth().status === 'TESTING');

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
    this.testSmtpConnection();
    this.testTwilioConnection();
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
    this.testSmtpConnection();
    this.testTwilioConnection();
  }

  /**
   * Tests SMTP server connectivity.
   *
   * Performs a connection test without sending an email.
   * Updates smtpHealth signal with the result.
   */
  testSmtpConnection(): void {
    // Set testing state
    this.smtpHealth.update(state => ({
      ...state,
      status: 'TESTING'
    }));

    this.smtpHealthApi.testConnection().subscribe({
      next: (result) => {
        this.smtpHealth.set({
          status: result.reachable ? 'UP' : 'DOWN',
          responseTimeMs: result.responseTimeMs,
          errorMessage: result.errorMessage,
          lastTestedAt: new Date()
        });

        // Show error banner if SMTP is down
        if (!result.reachable) {
          this.error.set(`SMTP unreachable: ${result.errorMessage}`);
        }
      },
      error: (err) => {
        console.error('Failed to test SMTP connection:', err);
        this.smtpHealth.set({
          status: 'DOWN',
          responseTimeMs: null,
          errorMessage: 'Failed to reach health endpoint',
          lastTestedAt: new Date()
        });
        this.error.set('Failed to test SMTP connection');
      }
    });
  }

  /**
   * Tests Twilio API connectivity.
   *
   * Fetches account info without sending an SMS.
   * Updates twilioHealth signal with the result.
   */
  testTwilioConnection(): void {
    // Set testing state
    this.twilioHealth.update(state => ({
      ...state,
      status: 'TESTING'
    }));

    this.twilioHealthApi.testConnection().subscribe({
      next: (result) => {
        this.twilioHealth.set({
          status: result.reachable ? 'UP' : 'DOWN',
          responseTimeMs: result.responseTimeMs,
          accountStatus: result.accountStatus,
          errorMessage: result.errorMessage,
          lastTestedAt: new Date()
        });

        // Show error banner if Twilio is down
        if (!result.reachable) {
          this.error.set(`Twilio unreachable: ${result.errorMessage}`);
        }
      },
      error: (err) => {
        console.error('Failed to test Twilio connection:', err);
        this.twilioHealth.set({
          status: 'DOWN',
          responseTimeMs: null,
          accountStatus: null,
          errorMessage: 'Failed to reach health endpoint',
          lastTestedAt: new Date()
        });
        this.error.set('Failed to test Twilio connection');
      }
    });
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
