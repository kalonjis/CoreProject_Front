import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountApiService } from '../../services';
import { FeedbackBase } from '../../../../shared/feedback/tools/feedback.base';
import { FeedbackComponent } from '../../../../shared/feedback/feedback.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-account-deactivation-confirmation',
  standalone: true,
  imports: [FeedbackComponent, CommonModule],
  templateUrl: './account-deactivation-confirmation.component.html',
  styleUrl: './account-deactivation-confirmation.component.scss'
})
export class AccountDeactivationConfirmationComponent extends FeedbackBase implements OnInit {

  private route           = inject(ActivatedRoute);
  private router          = inject(Router);
  private accountApi      = inject(AccountApiService);

  isProcessing  = false;
  token: string | null = null;
  showConfirmButton = signal(true);

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.token = params.get('token');

      if (!this.token) {
        this.displayError('No confirmation token found in the URL.', 'Back to home');
        this.buttonAction = () => this.router.navigate(['/']);
        this.showConfirmButton.set(false);
      }
    });
  }

  confirm(): void {
    if (!this.token) return;

    this.isProcessing = true;
    this.showConfirmButton.set(false);

    this.accountApi.confirmDeactivation(this.token).subscribe({
      next: () => {
        this.isProcessing = false;
        this.displaySuccess(
          'Your account has been successfully deactivated. We hope to see you again soon.',
          'Back to home',
          null
        );
        this.buttonAction = () => this.router.navigate(['/']);
      },
      error: (err) => {
        this.isProcessing = false;
        this.showConfirmButton.set(false);

        if (err.status === 498 || err.status === 401) {
          this.displayError(
            'This confirmation link has expired or is invalid. Please request a new deactivation from your account settings.',
            'Back to home'
          );
        } else {
          this.displayError(
            err.error?.message || 'An error occurred. Please try again.',
            'Back to home'
          );
        }
        this.buttonAction = () => this.router.navigate(['/']);
      }
    });
  }
}
