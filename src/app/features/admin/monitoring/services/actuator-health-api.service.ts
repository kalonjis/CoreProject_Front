// src/app/features/admin/system-health/services/actuator-health-api.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {HealthResponse, ServerStatus} from '../models';

/**
 * API service for Spring Boot Actuator health endpoints.
 *
 * Provides access to application health status including:
 * - Overall application health
 * - Individual component health (DB, RabbitMQ, Mail, Disk)
 *
 * Used by the Server Status card in System Health dashboard.
 */
@Injectable({
  providedIn: 'root'
})
export class ActuatorHealthApiService {

  private readonly http = inject(HttpClient);

  /** Base URL for actuator endpoints */
  private readonly actuatorUrl = `/api/monitoring`;

  // ===========================================================================
  // API CALLS
  // ===========================================================================

  /**
   * Retrieves the overall application health status.
   * GET /actuator/health
   *
   * @returns Observable with health response including component statuses
   */
  getHealth(): Observable<HealthResponse> {
    return this.http.get<HealthResponse>(`${this.actuatorUrl}/health`);
  }

  // ===========================================================================
  // MAPPING
  // ===========================================================================

  /**
   * Transforms raw health response into simplified server statuses.
   * Maps each health component to a user-friendly ServerStatus object.
   *
   * @param health Raw health response from actuator
   * @returns Array of ServerStatus for display
   */
  mapToServerStatuses(health: HealthResponse): ServerStatus[] {
    const statuses: ServerStatus[] = [];
    const now = new Date();


    // Database
    if (health.components?.db) {
      statuses.push({
        id: 'database',
        name: 'Database',
        status: health.components.db.status,
        icon: '🗄️',
        message: health.components.db.details?.database,
        lastChecked: now
      });
    }

    // RabbitMQ
    if (health.components?.rabbit) {
      statuses.push({
        id: 'rabbitmq',
        name: 'RabbitMQ',
        status: health.components.rabbit.status,
        icon: '🐰',
        message: health.components.rabbit.details?.version,
        lastChecked: now
      });
    }

    // Email System
    if (health.components?.emailSystem) {
      const emailDetails = health.components.emailSystem.details;
      statuses.push({
        id: 'email',
        name: 'Email Service',
        status: health.components.emailSystem.status,
        icon: '📧',
        message: emailDetails?.message || `CB: ${emailDetails?.circuitBreaker}`,
        lastChecked: now
      });
    }

    // Disk Space
    if (health.components?.diskSpace) {
      statuses.push({
        id: 'disk',
        name: 'Disk Space',
        status: health.components.diskSpace.status,
        icon: '💾',
        lastChecked: now
      });
    }

    return statuses;
  }
}
