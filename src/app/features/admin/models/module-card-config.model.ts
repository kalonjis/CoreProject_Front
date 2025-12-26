/**
 * Configuration model for admin module cards.
 * Used to define the modules displayed on the admin dashboard.
 */
export interface ModuleCardConfig {
  /** Unique identifier for the module */
  id: string;

  /** Display icon (emoji or icon class) */
  icon: string;

  /** Module title */
  title: string;

  /** Brief description of the module */
  description: string;

  /** Route to navigate to when card is clicked */
  route: string;

  /** Whether the module is currently available */
  enabled: boolean;

  /** Optional badge text (e.g., "New", "Beta") */
  badge?: string;

  /** Optional color theme for the card */
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'info';
}
