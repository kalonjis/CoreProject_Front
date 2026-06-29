// src/app/features/account/pages/recovery/backup-codes/components/backup-codes-modal/backup-codes-modal.component.ts

import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Backup Codes Display Modal Component.
 *
 * Shows generated backup codes with secure storage options:
 * - Copy all codes to clipboard (formatted)
 * - Download codes as .txt file
 * - Print codes with proper formatting
 * - Security warnings and instructions
 *
 * SECURITY IMPORTANT:
 * - Codes are only shown once during generation
 * - Modal should be treated as sensitive information
 * - User must acknowledge secure storage before closing
 *
 * Features:
 * - Formatted display (ABCD-EFGH-1234-5678)
 * - Multiple export options (copy/download/print)
 * - Security best practices guidance
 * - Confirmation before closing
 */
@Component({
    selector: 'app-backup-codes-modal',
    imports: [CommonModule],
    templateUrl: './backup-codes-modal.component.html',
    styleUrl: './backup-codes-modal.component.scss'
})
export class BackupCodesModalComponent implements OnInit {

  // ===========================================================================
  // INPUTS
  // ===========================================================================

  /** Array of backup codes to display */
  @Input() backupCodes: string[] = [];

  // ===========================================================================
  // OUTPUTS
  // ===========================================================================

  /** Emitted when user confirms they've saved the codes */
  @Output() complete = new EventEmitter<void>();

  /** Emitted when user cancels without saving */
  @Output() cancel = new EventEmitter<void>();

  // ===========================================================================
  // STATE
  // ===========================================================================

  /** Whether copy operation is in progress */
  isCopying = signal(false);

  /** Whether download operation is in progress */
  isDownloading = signal(false);

  /** Whether print operation is in progress */
  isPrinting = signal(false);

  /** Success message after operations */
  successMessage = signal<string | null>(null);

  /** Whether user has acknowledged saving the codes */
  hasAcknowledged = signal(false);

  // ===========================================================================
  // COMPUTED VALUES
  // ===========================================================================

  /** Current date for file naming */
  currentDate = computed(() => {
    const now = new Date();
    return now.toISOString().split('T')[0]; // YYYY-MM-DD
  });

  /** Filename for download */
  downloadFileName = computed(() => {
    return `backup-codes-${this.currentDate()}.txt`;
  });

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  ngOnInit(): void {
    // Modal is ready to display codes
  }

  // ===========================================================================
  // COPY FUNCTIONALITY
  // ===========================================================================

  /**
   * Copy all backup codes to clipboard.
   * Formats codes with numbers and proper spacing.
   */
  async copyAllCodes(): Promise<void> {
    this.isCopying.set(true);
    this.clearSuccessMessage();

    try {
      const formattedCodes = this.formatCodesForCopy();
      await navigator.clipboard.writeText(formattedCodes);

      this.showSuccessMessage('All backup codes copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy codes to clipboard', error);
      this.showSuccessMessage('Failed to copy codes. Please try again.', true);
    } finally {
      this.isCopying.set(false);
    }
  }

  /**
   * Format codes for clipboard (numbered list).
   */
  private formatCodesForCopy(): string {
    const header = '=== BACKUP RECOVERY CODES ===\n';
    const timestamp = `Generated: ${new Date().toLocaleString()}\n`;
    const warning = '\n⚠️  IMPORTANT: Each code can only be used once. Store securely!\n\n';

    const codesList = this.backupCodes
      .map((code, index) => `${this.formatNumber(index + 1)}. ${code}`)
      .join('\n');

    const footer = '\n\n=== SECURITY TIPS ===\n' +
      '• Store these codes in a secure location (password manager, safe, etc.)\n' +
      '• Each code works only once\n' +
      '• Generate new codes if you suspect compromise\n' +
      '• Use codes only when your 2FA device is unavailable';

    return header + timestamp + warning + codesList + footer;
  }

  // ===========================================================================
  // DOWNLOAD FUNCTIONALITY
  // ===========================================================================

  /**
   * Download backup codes as a .txt file.
   */
  downloadCodes(): void {
    this.isDownloading.set(true);
    this.clearSuccessMessage();

    try {
      const content = this.formatCodesForDownload();
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = this.downloadFileName();
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);

      this.showSuccessMessage(`Codes downloaded as ${this.downloadFileName()}`);
    } catch (error) {
      console.error('Failed to download codes', error);
      this.showSuccessMessage('Failed to download codes. Please try again.', true);
    } finally {
      this.isDownloading.set(false);
    }
  }

  /**
   * Format codes for download file.
   */
  private formatCodesForDownload(): string {
    const header = 'BACKUP RECOVERY CODES\n' +
      '====================\n\n';

    const info = `Generated: ${new Date().toLocaleString()}\n` +
      `Account: Your Account\n` +
      `Total Codes: ${this.backupCodes.length}\n\n`;

    const warning = '⚠️  SECURITY WARNING:\n' +
      '• Each code can only be used ONCE\n' +
      '• Store this file in a secure location\n' +
      '• Delete this file after storing codes elsewhere\n' +
      '• Generate new codes if you suspect compromise\n\n';

    const codesSection = 'RECOVERY CODES:\n' +
      '---------------\n';

    const codesList = this.backupCodes
      .map((code, index) => `${this.formatNumber(index + 1)}. ${code}`)
      .join('\n');

    const instructions = '\n\nHOW TO USE:\n' +
      '----------\n' +
      '1. Go to the login page\n' +
      '2. Enter your username and password\n' +
      '3. When prompted for 2FA, click "Use backup code"\n' +
      '4. Enter one of the codes above\n' +
      '5. The code will be consumed and cannot be reused\n\n';

    const footer = 'IMPORTANT:\n' +
      '• Keep this file secure and confidential\n' +
      '• Do not share these codes with anyone\n' +
      '• Consider using a password manager for storage\n' +
      '• Generate new codes before running out\n';

    return header + info + warning + codesSection + codesList + instructions + footer;
  }

  // ===========================================================================
  // PRINT FUNCTIONALITY
  // ===========================================================================

  /**
   * Print backup codes with proper formatting.
   */
  printCodes(): void {
    this.isPrinting.set(true);
    this.clearSuccessMessage();

    try {
      const printContent = this.formatCodesForPrint();

      const blob = new Blob([printContent], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);

      const printWindow = window.open(blobUrl, '_blank', 'width=800,height=600');
      if (!printWindow) {
        URL.revokeObjectURL(blobUrl);
        throw new Error('Failed to open print window. Please check your popup blocker.');
      }

      printWindow.onload = () => {
        printWindow.print();
        printWindow.onafterprint = () => {
          printWindow.close();
          URL.revokeObjectURL(blobUrl);
        };
      };

      this.showSuccessMessage('Print dialog opened successfully');
    } catch (error) {
      console.error('Failed to print codes', error);
      this.showSuccessMessage('Failed to open print dialog. Please try again.', true);
    } finally {
      this.isPrinting.set(false);
    }
  }

  /**
   * Format codes for printing (HTML).
   */
  private formatCodesForPrint(): string {
    const codesHtml = this.backupCodes
      .map((code, index) =>
        `<div class="code-item">
          <span class="code-number">${this.formatNumber(index + 1)}.</span>
          <span class="code-value">${code}</span>
        </div>`
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Backup Recovery Codes</title>
        <style>
          @page { margin: 1in; }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12pt;
            line-height: 1.4;
            color: #000;
            background: #fff;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
          }
          .header h1 {
            font-size: 18pt;
            margin: 0;
            text-transform: uppercase;
          }
          .header .date {
            font-size: 10pt;
            margin-top: 5px;
          }
          .warning {
            background: #f5f5f5;
            border: 2px solid #333;
            padding: 15px;
            margin: 20px 0;
            font-weight: bold;
          }
          .codes-section {
            margin: 30px 0;
          }
          .codes-section h2 {
            font-size: 14pt;
            margin-bottom: 15px;
            text-transform: uppercase;
          }
          .codes-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin: 20px 0;
          }
          .code-item {
            display: flex;
            align-items: center;
            padding: 8px;
            border: 1px solid #ccc;
            background: #f9f9f9;
          }
          .code-number {
            font-weight: bold;
            margin-right: 10px;
            min-width: 30px;
          }
          .code-value {
            font-family: 'Courier New', monospace;
            font-weight: bold;
            font-size: 11pt;
            letter-spacing: 1px;
          }
          .instructions {
            margin-top: 30px;
            border-top: 1px solid #ccc;
            padding-top: 15px;
          }
          .instructions h3 {
            font-size: 12pt;
            margin-bottom: 10px;
          }
          .instructions ul {
            list-style-type: disc;
            margin-left: 20px;
          }
          .instructions li {
            margin-bottom: 5px;
          }
          .footer {
            margin-top: 30px;
            border-top: 2px solid #000;
            padding-top: 15px;
            text-align: center;
            font-size: 10pt;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Backup Recovery Codes</h1>
          <div class="date">Generated: ${new Date().toLocaleString()}</div>
        </div>

        <div class="warning">
          ⚠️ SECURITY WARNING: Each code can only be used ONCE. Store this document securely and destroy after copying codes to a safe location.
        </div>

        <div class="codes-section">
          <h2>Your Recovery Codes:</h2>
          <div class="codes-grid">
            ${codesHtml}
          </div>
        </div>

        <div class="instructions">
          <h3>How to use these codes:</h3>
          <ul>
            <li>Use these codes when you cannot access your primary 2FA device</li>
            <li>Go to the login page and enter your username/password</li>
            <li>When prompted for 2FA, click "Use backup code"</li>
            <li>Enter one of the codes above (each code works only once)</li>
            <li>Generate new codes if you've used several or suspect compromise</li>
          </ul>
        </div>

        <div class="footer">
          CONFIDENTIAL - Store securely and do not share with anyone
        </div>
      </body>
      </html>
    `;
  }

  // ===========================================================================
  // MODAL ACTIONS
  // ===========================================================================

  /**
   * Handle modal confirmation (user has saved codes).
   */
  onConfirmSaved(): void {
    if (!this.hasAcknowledged()) {
      this.showSuccessMessage('Please confirm you have saved the codes securely', true);
      return;
    }
    this.complete.emit();
  }

  /**
   * Handle modal cancellation.
   */
  onCancel(): void {
    if (!this.hasAcknowledged()) {
      // Show warning about not saving codes
      const confirmed = confirm(
        'Are you sure? These backup codes will not be shown again. ' +
        'You should save them before closing this window.'
      );
      if (!confirmed) {
        return;
      }
    }
    this.cancel.emit();
  }

  /**
   * Prevent clicks inside modal from closing it.
   */
  onModalClick(event: Event): void {
    event.stopPropagation();
  }

  /**
   * Toggle acknowledgment checkbox.
   */
  toggleAcknowledgment(): void {
    this.hasAcknowledged.set(!this.hasAcknowledged());
  }

  // ===========================================================================
  // UTILITY METHODS
  // ===========================================================================

  /**
   * Show success message with auto-clear.
   */
  private showSuccessMessage(message: string, isError: boolean = false): void {
    this.successMessage.set(message);
    setTimeout(() => {
      this.successMessage.set(null);
    }, isError ? 5000 : 3000);
  }

  /**
   * Clear current success message.
   */
  private clearSuccessMessage(): void {
    this.successMessage.set(null);
  }

  /**
   * Format number with leading zeros (for display).
   */
  formatNumber(num: number): string {
    return String(num).padStart(2, '0');
  }
}
