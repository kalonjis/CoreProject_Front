import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountApiService } from '../../services';
import { FeedbackBase } from '../../../../shared/feedback/tools/feedback.base';
import { FeedbackComponent } from '../../../../shared/feedback/feedback.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-account-reactivation',
  standalone: true,
  imports: [FeedbackComponent, CommonModule, FormsModule, RouterLink],
  templateUrl: './account-reactivation.component.html',
  styleUrl: './account-reactivation.component.scss',
})
export class AccountReactivationComponent extends FeedbackBase implements OnInit {

  private route      = inject(ActivatedRoute);
  private router     = inject(Router);
  private accountApi = inject(AccountApiService);

  // Token flow (depuis l'email de confirmation)
  token         = signal<string | null>(null);
  isProcessing  = signal(false);

  // Request flow (depuis le login → identifier saisi)
  identifier    = signal('');
  showRequestForm = signal(false);

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const t = params.get('token');
      if (t) {
        // Confirmation via token email
        this.token.set(t);
        this.confirmReactivation(t);
      } else {
        // Pas de token → afficher le formulaire de demande
        this.showRequestForm.set(true);
      }
    });
  }

  /** Appelé automatiquement quand un token est présent dans l'URL */
  private confirmReactivation(token: string): void {
    this.isProcessing.set(true);
    this.accountApi.confirmReactivation(token).subscribe({
      next: (res) => {
        this.isProcessing.set(false);
        const name = res?.username || 'you';
        this.displaySuccess(
          `Welcome back, ${name}! Your account has been successfully reactivated.`,
          'Go to login',
          null
        );
        this.buttonAction = () => this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        this.isProcessing.set(false);
        if (err.status === 498 || err.status === 401) {
          this.displayError(
            'This reactivation link has expired or is invalid. Please request a new one.',
            'Request reactivation'
          );
          this.buttonAction = () => {
            this.token.set(null);
            this.showRequestForm.set(true);
          };
        } else {
          this.displayError(err.error?.message || 'An error occurred. Please try again.', 'Back to login');
          this.buttonAction = () => this.router.navigate(['/auth/login']);
        }
      }
    });
  }

  /** Soumission du formulaire de demande (identifier = email ou username) */
  requestReactivation(): void {
    const id = this.identifier().trim();
    if (!id) return;

    this.isProcessing.set(true);
    this.accountApi.requestReactivation({ identifier: id }).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.showRequestForm.set(false);
        this.displaySuccess(
          'A reactivation email has been sent. Please check your inbox and follow the link.',
          'Back to login',
          null
        );
        this.buttonAction = () => this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        this.isProcessing.set(false);
        const msg = err.error?.message || '';
        if (msg.includes('not allowed') || msg.includes('GDPR') || msg.includes('permanent')) {
          this.displayError(
            'This account cannot be reactivated. Please contact support.',
            'Back to login'
          );
        } else {
          this.displayError(
            err.error?.message || 'An error occurred. Please try again.',
            'Retry'
          );
        }
        this.buttonAction = () => this.router.navigate(['/auth/login']);
      }
    });
  }
}
