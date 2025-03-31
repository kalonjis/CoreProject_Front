# Documentation du Système de Feedback

## Vue d'ensemble

Le système de feedback de l'application fournit deux mécanismes complémentaires pour afficher des notifications aux utilisateurs:

1. **Système Global** : Notifications qui apparaissent en haut de l'écran, sous la navbar, gérées par un service centralisé.
2. **Composant Contextuel** : Notifications localisées qui peuvent être placées n'importe où dans l'interface.

Cette architecture permet de gérer à la fois les notifications système (globales) et les feedbacks contextuels (locaux).

## Structure du système

### 1. Modèles et Types

- **FeedbackType** : Énumération des types de feedback
  ```typescript
  export type FeedbackType = 'success' | 'error' | 'info' | 'warning';
  ```

- **FeedbackOptions** : Interface définissant les options d'un feedback
  ```typescript
  export interface FeedbackOptions {
    message: string;
    type: FeedbackType;
    buttonText?: string;
    timeout?: number | null;
  }
  ```

### 2. Service de Feedback

Le `FeedbackService` est un service injectable qui maintient l'état global des notifications:

```typescript
@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  // État global du feedback
  private _feedback = signal<FeedbackOptions | null>(null);
  readonly feedback = this._feedback.asReadonly();

  // Méthodes pour afficher différents types de feedback
  showSuccess(message: string, buttonText?: string, timeout: number | null = 5000) {...}
  showError(message: string, buttonText?: string, timeout: number | null = null) {...}
  showInfo(message: string, buttonText?: string, timeout: number | null = 5000) {...}
  showWarning(message: string, buttonText?: string, timeout: number | null = 7000) {...}
  
  // Effacer le message de feedback
  clearFeedback() {
    this._feedback.set(null);
  }
}
```

### 3. Composants de Feedback

#### FeedbackComponent (Local/Contextuel)

Composant autonome qui affiche un message de feedback dans son emplacement d'utilisation:

```typescript
@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.scss']
})
export class FeedbackComponent {
  @Input() message: string = '';
  @Input() type: FeedbackType = 'success';
  @Input() buttonText: string = '';
  @Input() timeout: number | null = null;
  @Output() buttonClicked = new EventEmitter<void>();
  
  visible = true;
  // ...
}
```

#### GlobalFeedbackComponent

Composant qui s'abonne au FeedbackService et affiche les messages globaux:

```typescript
@Component({
  selector: 'app-global-feedback',
  template: `
    @if (feedbackService.feedback()) {
      <app-feedback
        [message]="feedbackService.feedback()?.message ?? ''"
        [type]="feedbackService.feedback()?.type ?? 'info'"
        [buttonText]="feedbackService.feedback()?.buttonText ?? ''"
        [timeout]="feedbackService.feedback()?.timeout ?? null"
        (buttonClicked)="onButtonClicked()"
        class="navbar-adjusted-feedback"
      ></app-feedback>
    }
  `,
  styles: [...]
})
export class GlobalFeedbackComponent {
  feedbackService = inject(FeedbackService);
  // ...
}
```

### 4. Classe utilitaire FeedbackBase

Une classe de base que les composants peuvent étendre pour intégrer facilement des fonctionnalités de feedback local:

```typescript
export class FeedbackBase {
  // Signaux pour gérer l'état du feedback
  feedbackMessage = signal<string>('');
  feedbackType = signal<FeedbackType>('info');
  showFeedback = signal<boolean>(false);
  // ...

  // Méthodes utilitaires
  displaySuccess(message: string, buttonText: string = '', timeout: number | null = 5000) {...}
  displayError(message: string, buttonText: string = '', timeout: number | null = null) {...}
  // ...
}
```

## Cas d'utilisation

### 1. Notifications globales avec FeedbackService

Utilisez le FeedbackService pour afficher des notifications système qui concernent l'application dans son ensemble:

```typescript
// Dans un composant quelconque
export class MyComponent {
  private feedbackService = inject(FeedbackService);
  
  onSuccessfulAction() {
    this.feedbackService.showSuccess('Opération réussie !', 'OK', 5000);
  }
  
  onError(error: any) {
    this.feedbackService.showError('Une erreur est survenue: ' + error.message);
  }
}
```

### 2. Feedback contextuel avec FeedbackComponent

Utilisez directement le FeedbackComponent dans les templates pour des messages localisés:

```html
<div class="form-container">
  <h2>Mon formulaire</h2>
  
  <!-- Feedback contextuel lié au formulaire -->
  @if (showFormError) {
    <app-feedback
      message="Veuillez corriger les erreurs dans le formulaire"
      type="error"
      buttonText="Compris"
      (buttonClicked)="hideFormError()"
    ></app-feedback>
  }
  
  <!-- Contenu du formulaire -->
</div>
```

### 3. Feedback dans des composants complexes avec FeedbackBase

Pour les composants avec une logique de feedback plus complexe:

```typescript
@Component({
  selector: 'app-complex-form',
  templateUrl: './complex-form.component.html'
})
export class ComplexFormComponent extends FeedbackBase {
  
  onFormStepComplete(step: number) {
    this.displaySuccess(`Étape ${step} complétée avec succès`);
  }
  
  onFormStepError(step: number, error: string) {
    this.displayError(`Erreur à l'étape ${step}: ${error}`);
  }
}
```

## Bonnes pratiques

1. **Notifications Globales vs Contextuelles**:
   - Utilisez les notifications globales (FeedbackService) pour des informations importantes qui concernent l'ensemble de l'application
   - Utilisez les feedbacks contextuels (FeedbackComponent) pour des messages spécifiques à une section ou un formulaire

2. **Durée des messages**:
   - Messages de succès: 3-5 secondes
   - Messages d'information: 5-7 secondes
   - Messages d'erreur: durée indéfinie ou plus longue (10+ secondes)
   - Messages nécessitant une action: pas de timeout, attendre l'action de l'utilisateur

3. **Contenu des messages**:
   - Soyez concis et clair
   - Expliquez ce qui s'est passé et, si nécessaire, les actions que l'utilisateur peut entreprendre
   - Pour les erreurs, proposez une solution lorsque c'est possible

4. **Style et Apparence**:
   - Maintenez une cohérence visuelle entre les feedbacks globaux et contextuels
   - Utilisez des couleurs distinctes pour chaque type de message (succès, erreur, etc.)
   - Assurez-vous que les messages sont bien visibles mais non intrusifs

## Exemples concrets

### Authentification

```typescript
// Lors d'une inscription réussie
this.feedbackService.showSuccess(
  "Votre compte a été créé avec succès. Un email de confirmation vous a été envoyé.",
  "Se connecter",
  10000
);

// Lors d'une erreur de connexion
this.feedbackService.showError(
  "Identifiants incorrects. Veuillez réessayer ou réinitialiser votre mot de passe.",
  "Mot de passe oublié?"
);
```

### Gestion de données

```typescript
// Après sauvegarde de données
this.feedbackService.showSuccess("Vos modifications ont été enregistrées");

// Lors d'une validation de formulaire complète
<app-feedback
  *ngIf="formValidationFailed"
  message="Veuillez corriger les erreurs dans le formulaire avant de soumettre"
  type="warning"
></app-feedback>
```

## Compatibilité et adaptation

Le système de feedback est conçu pour s'adapter à différentes tailles d'écran:

- Sur desktop, les feedbacks globaux apparaissent sous la navbar
- Sur mobile, ils s'adaptent à la largeur de l'écran
- Les feedbacks contextuels s'adaptent à leur conteneur parent

## Conclusion

Ce système de feedback dual offre flexibilité et cohérence. En utilisant le bon type de feedback au bon endroit, vous pouvez créer une expérience utilisateur intuitive et informative tout en maintenant une structure de code propre et modulaire.
