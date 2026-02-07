import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';

/**
 * Interface for components that can have unsaved changes.
 *
 * @description
 * Components implementing this interface can be protected by the
 * unsaved changes guard, which will prompt the user before navigation.
 *
 * @example
 * ```typescript
 * @Component({ ... })
 * export class EventFormComponent implements HasUnsavedChanges {
 *   private form = inject(FormBuilder).group({ ... });
 *
 *   hasUnsavedChanges(): boolean {
 *     return this.form.dirty;
 *   }
 *
 *   // Optional: custom confirmation message
 *   getUnsavedChangesMessage(): string {
 *     return 'Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter ?';
 *   }
 * }
 * ```
 */
export interface HasUnsavedChanges {
  /**
   * Returns true if the component has unsaved changes.
   */
  hasUnsavedChanges(): boolean;

  /**
   * Optional custom confirmation message.
   * If not provided, a default message will be used.
   */
  getUnsavedChangesMessage?(): string;
}

/**
 * Default confirmation message for unsaved changes.
 */
const DEFAULT_MESSAGE = 'Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter cette page ?';

/**
 * Guard that prevents navigation when there are unsaved changes.
 *
 * @description
 * This functional guard checks if the component has unsaved changes
 * and prompts the user for confirmation before allowing navigation.
 *
 * @example
 * ```typescript
 * // In routes configuration
 * {
 *   path: 'events/:id/edit',
 *   component: EventFormComponent,
 *   canDeactivate: [calendarUnsavedChangesGuard]
 * }
 * ```
 */
export const calendarUnsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (
  component,
  currentRoute,
  currentState,
  nextState
) => {
  // Check if component implements the interface
  if (!component || typeof component.hasUnsavedChanges !== 'function') {
    return true;
  }

  // Check for unsaved changes
  if (!component.hasUnsavedChanges()) {
    return true;
  }

  // Get confirmation message
  const message = component.getUnsavedChangesMessage?.() || DEFAULT_MESSAGE;

  // Show browser confirmation dialog
  return window.confirm(message);
};

/**
 * Creates a custom unsaved changes guard with specific options.
 *
 * @param options - Guard configuration options
 * @returns Configured CanDeactivateFn
 *
 * @example
 * ```typescript
 * // Custom guard that uses a modal instead of browser confirm
 * export const customUnsavedGuard = createUnsavedChangesGuard({
 *   confirmFn: async (message) => {
 *     const modal = inject(ModalService);
 *     return modal.confirm(message);
 *   }
 * });
 * ```
 */
export function createUnsavedChangesGuard(options: {
  /**
   * Custom confirmation function.
   * Can be async for modal dialogs.
   */
  confirmFn?: (message: string) => boolean | Promise<boolean>;

  /**
   * Default message if component doesn't provide one.
   */
  defaultMessage?: string;

  /**
   * Routes to exclude from the guard (regex patterns).
   */
  excludeRoutes?: RegExp[];
}): CanDeactivateFn<HasUnsavedChanges> {
  return async (component, currentRoute, currentState, nextState) => {
    // Check excluded routes
    if (options.excludeRoutes?.some(pattern => pattern.test(nextState?.url || ''))) {
      return true;
    }

    // Check if component implements the interface
    if (!component || typeof component.hasUnsavedChanges !== 'function') {
      return true;
    }

    // Check for unsaved changes
    if (!component.hasUnsavedChanges()) {
      return true;
    }

    // Get confirmation message
    const message = component.getUnsavedChangesMessage?.()
      || options.defaultMessage
      || DEFAULT_MESSAGE;

    // Use custom or default confirmation
    if (options.confirmFn) {
      return options.confirmFn(message);
    }

    return window.confirm(message);
  };
}

/**
 * Utility to mark a form as pristine after successful save.
 *
 * @description
 * Call this after saving to prevent the guard from triggering.
 *
 * @example
 * ```typescript
 * async save(): Promise<void> {
 *   await this.api.saveEvent(this.form.value);
 *   markAsSaved(this.form);
 *   this.router.navigate(['/calendar']);
 * }
 * ```
 */
export function markAsSaved(form: { markAsPristine: () => void }): void {
  form.markAsPristine();
}
