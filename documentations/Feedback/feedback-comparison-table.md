## Tableau comparatif: Feedback Global vs Feedback Contextuel

| Caractéristique | Feedback Global (Service + GlobalComponent) | Feedback Contextuel (FeedbackComponent) |
|----------------|--------------------------------------------|----------------------------------------|
| **Position à l'écran** | Fixe, en haut sous la navbar | Flexible, n'importe où dans la page |
| **Persistance** | À travers les navigations entre pages | Lié au cycle de vie du composant parent |
| **Gestion d'état** | Centralisée via FeedbackService | Locale au composant ou via FeedbackBase |
| **Visibilité** | Visible depuis toute l'application | Visible uniquement dans son contexte |
| **Cas d'usage** | Confirmations d'actions, erreurs système, notifications globales | Validations de formulaire, guides contextuels, messages d'aide |
| **Intégration** | `inject(FeedbackService)` puis appel de méthodes | Inclusion directe dans le template HTML |
| **Animation** | Slide-down depuis le haut | Configurable selon le contexte |
| **Priorité** | Haute (z-index élevé) | Variable selon le contexte |
| **Plusieurs à la fois** | Un seul à la fois | Plusieurs possibles sur différentes parties de la page |
| **Adaptation mobile** | Optimisé pour petits écrans | Dépend de l'implémentation du parent |

## Quand utiliser chaque type de feedback?

### Feedback Global (FeedbackService)

✅ Idéal pour:
- Confirmation après une action importante (inscription, paiement...)
- Notifications d'erreurs système
- Alertes concernant l'ensemble de l'application
- Messages qui doivent persister entre les navigations
- Informations critiques exigeant l'attention de l'utilisateur

### Feedback Contextuel (FeedbackComponent)

✅ Idéal pour:
- Messages d'aide ou d'information dans un formulaire
- Validation de champs spécifiques
- Indicateurs d'état d'une section particulière
- Guides étape par étape
- Informations complémentaires qui ne doivent pas interrompre le flux principal

## Exemple de combinaison des deux approches

```typescript
@Component({
  selector: 'app-complex-form',
  template: `
    <h2>Formulaire de demande</h2>
    
    <!-- Feedback contextuel pour ce formulaire spécifique -->
    @if (showFormFeedback()) {
      <app-feedback
        [message]="formFeedbackMessage()"
        [type]="formFeedbackType()"
        (buttonClicked)="hideFormFeedback()"
      ></app-feedback>
    }
    
    <form [formGroup]="requestForm" (ngSubmit)="onSubmit()">
      <!-- Contenu du formulaire -->
      <button type="submit">Soumettre</button>
    </form>
  `
})
export class ComplexFormComponent {
  private feedbackService = inject(FeedbackService);
  
  // Feedback local
  showFormFeedback = signal(false);
  formFeedbackMessage = signal('');
  formFeedbackType = signal<FeedbackType>('info');
  
  // Exemple d'utilisation combinée
  onSubmit() {
    if (this.requestForm.invalid) {
      // Feedback contextuel pour les erreurs de validation
      this.formFeedbackMessage.set('Veuillez corriger les erreurs du formulaire');
      this.formFeedbackType.set('error');
      this.showFormFeedback.set(true);
      return;
    }
    
    this.someService.submitRequest(this.requestForm.value).subscribe({
      next: () => {
        // Feedback global pour la confirmation de soumission
        this.feedbackService.showSuccess('Votre demande a été soumise avec succès');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        // Feedback contextuel pour les erreurs spécifiques au formulaire
        if (err.validationErrors) {
          this.formFeedbackMessage.set('Des erreurs de validation ont été détectées');
          this.formFeedbackType.set('error');
          this.showFormFeedback.set(true);
        } else {
          // Feedback global pour les erreurs système
          this.feedbackService.showError('Une erreur système est survenue');
        }
      }
    });
  }
  
  hideFormFeedback() {
    this.showFormFeedback.set(false);
  }
}
```
