// src/app/features/account/pages/export-download/export-download.component.ts

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { FeedbackBase }        from '../../../../shared/feedback/tools/feedback.base';
import { FeedbackComponent }   from '../../../../shared/feedback/feedback.component';
import { GdprExportApiService } from '../../services/gdpr-export-api.service';

/**
 * ExportDownloadComponent — landing page for the GDPR archive download email link.
 *
 * Route: /account/export/download?token=  (public — no authGuard)
 *
 * Flow:
 * 1. Extract `token` from query params on init.
 * 2. If no token → show error immediately.
 * 3. If token → auto-call GET /api/privacy/export/download?token= (returns a Blob).
 * 4. On success → trigger browser download via a temporary <a> element, then show
 *    success feedback.
 * 5. On error → contextual feedback based on HTTP status:
 *    - 404 / 498      → token invalid or expired
 *    - 409 / 410      → already downloaded and link expired
 *    - fallback       → generic error
 *
 * The download is triggered programmatically so the user sees a proper page
 * instead of a raw JSON response or a blank tab.
 *
 * Extends FeedbackBase to reuse the existing displaySuccess / displayError /
 * FeedbackComponent pattern used across all account confirmation pages.
 */
@Component({
    selector: 'app-export-download',
    imports: [CommonModule, FeedbackComponent],
    templateUrl: './export-download.component.html',
    styleUrl: './export-download.component.scss'
})
export class ExportDownloadComponent extends FeedbackBase implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly gdprApi = inject(GdprExportApiService);

  isProcessing = false;
  readyToDownload = false;
  private token: string | null = null;

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.token = params.get('token');

      if (!this.token) {
        this.displayError(
          'Aucun jeton de téléchargement trouvé. Veuillez utiliser le lien reçu par e-mail.',
          'Aller aux paramètres de confidentialité'
        );
        this.buttonAction = () => this.router.navigate(['/account/privacy']);
        return;
      }

      // Au lieu de lancer le téléchargement, on prépare l'interface
      this.prepareDownload();
    });
  }

  private prepareDownload(): void {
    this.readyToDownload = true;
    this.displaySuccess(
      'Votre archive de données est prête à être téléchargée.',
      'Enregistrer le fichier...', // Libellé du bouton du FeedbackComponent
      null
    );

    // On lie l'action du bouton FeedbackComponent à notre méthode de téléchargement
    this.buttonAction = () => this.startDownload();
  }

  private startDownload(): void {
    if (!this.token || this.isProcessing) return;

    this.isProcessing = true;
    // On change le message pendant le chargement (optionnel)
    //this.message = "Préparation du fichier en cours...";

    this.gdprApi.download(this.token).subscribe({
      next: async (blob) => {
        try {
          // Comme cet appel provient d'un clic (via buttonAction),
          // le navigateur autorisera le Picker !
          await this.triggerBlobDownload(blob);

          this.isProcessing = false;
          this.readyToDownload = false;
          this.displaySuccess(
            'Le téléchargement a commencé. Votre archive contient vos données au format JSON.',
            'Retour aux paramètres',
            null
          );
          this.buttonAction = () => this.router.navigate(['/account/privacy']);
        } catch (err) {
          this.isProcessing = false;
          // Gestion si l'utilisateur ferme le picker ou autre erreur
        }
      },
      error: (err) => {
        this.isProcessing = false;
        this.handleError(err);
      }
    });
  }

  private async triggerBlobDownload(blob: Blob): Promise<void> {
    const filename = `export-donnees-${new Date().toISOString().slice(0, 10)}.zip`;

    // 1. Tentative avec l'API File System (Save As)
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: 'Archive ZIP',
            accept: { 'application/zip': ['.zip'] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return;
      } catch (e) {
        // L'utilisateur a annulé la boîte de dialogue ou erreur
        if ((e as Error).name === 'AbortError') return;
      }
    }

    // 2. Fallback classique (Downloads par défaut)
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  private handleError(err: any): void {
    const status = err?.status;
    // ... (garde ta logique de switch status 404, 498, etc.)
    this.displayError("Une erreur est survenue...", "Retour aux paramètres");
    this.buttonAction = () => this.router.navigate(['/account/privacy']);
  }
}
