import { Directive, Input, OnInit, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { SessionService } from '../services/session.service';

/**
 * Directive structurelle qui affiche ou masque du contenu en fonction du niveau de confiance de l'appareil
 * Usage: *requireTrustLevel="'TRUSTED'"
 */
@Directive({
  selector: '[requireTrustLevel]',
  standalone: true
})
export class RequireTrustLevelDirective implements OnInit {
  private sessionService = inject(SessionService);
  private templateRef = inject(TemplateRef);
  private viewContainer = inject(ViewContainerRef);

  @Input() set requireTrustLevel(level: string) {
    this._requiredLevel = level;
    this.updateView();
  }

  private _requiredLevel: string = 'BASIC';
  private hasView = false;

  ngOnInit(): void {
    // S'abonner aux changements d'état pour mettre à jour la vue si nécessaire
    this.sessionService.state.subscribe(() => {
      this.updateView();
    });
  }

  private updateView(): void {
    const hasRequiredLevel = this.sessionService.hasRequiredTrustLevel(this._requiredLevel);

    if (hasRequiredLevel && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasRequiredLevel && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}

// Exemple d'utilisation dans un template HTML:
/*
<div *requireTrustLevel="'TRUSTED'">
  Ce contenu n'est visible que pour les appareils de confiance.
</div>

<div *requireTrustLevel="'HIGHLY_TRUSTED'">
  Ce contenu n'est visible que pour les appareils hautement fiables.
</div>
*/
