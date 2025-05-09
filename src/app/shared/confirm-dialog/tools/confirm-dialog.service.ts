// confirm-dialog.service.ts
import { Injectable, ApplicationRef, ComponentRef, createComponent, EnvironmentInjector } from '@angular/core';
import { ConfirmDialogComponent } from '../confirm-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class ConfirmDialogService {
  private dialogComponentRef: ComponentRef<ConfirmDialogComponent> | null = null;

  constructor(
    private appRef: ApplicationRef,
    private injector: EnvironmentInjector
  ) {}

  /**
   * Ouvre une boîte de dialogue de confirmation
   * @returns Promise qui est résolu lors de la confirmation ou rejeté lors de l'annulation
   */
  confirm(options: {
    message: string;
    title?: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
    type?: 'warning' | 'danger' | 'info';
  }): Promise<void> {
    // Nettoyer tout dialogue existant
    this.cleanUp();

    // Créer un élément hôte pour le composant
    const hostElement = document.createElement('div');
    document.body.appendChild(hostElement);

    // Créer le composant
    this.dialogComponentRef = createComponent(ConfirmDialogComponent, {
      hostElement,
      environmentInjector: this.injector
    });

    // Configurer le composant
    const component = this.dialogComponentRef.instance;
    component.message = options.message;
    component.title = options.title || '';
    component.confirmButtonText = options.confirmButtonText || 'Confirmer';
    component.cancelButtonText = options.cancelButtonText || 'Annuler';
    component.type = options.type || 'warning';

    // Détecter les changements
    this.dialogComponentRef.changeDetectorRef.detectChanges();
    this.appRef.attachView(this.dialogComponentRef.hostView);

    // Retourner une Promise qui sera résolue ou rejetée en fonction de l'action utilisateur
    return new Promise<void>((resolve, reject) => {
      component.confirm.subscribe(() => {
        resolve();
        this.cleanUp();
      });

      component.cancel.subscribe(() => {
        reject();
        this.cleanUp();
      });
    });
  }

  private cleanUp(): void {
    if (this.dialogComponentRef) {
      this.appRef.detachView(this.dialogComponentRef.hostView);
      this.dialogComponentRef.destroy();
      this.dialogComponentRef = null;
    }
  }
}
