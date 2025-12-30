import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FeedbackComponent } from '../../../../shared/feedback/feedback.component';
import { FeedbackBase } from '../../../../shared/feedback/tools/feedback.base';
import { UserRole } from '../../../../data/models/user/user-role';
import {AuthFacade} from '../../../../core/auth';
import {AdminUserApiService} from '../../services/admin-user-api.service';
import {combineLatest, startWith} from 'rxjs';

@Component({
  selector: 'app-user-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FeedbackComponent],
  templateUrl: './user-register.component.html',
  styleUrl: './user-register.component.scss'
})
export class UserRegisterComponent extends FeedbackBase implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authFacade: AuthFacade = inject(AuthFacade);
  private adminUserApi = inject(AdminUserApiService);

  // État local du composant
  isSubmitting = signal(false);

  // Rôles disponibles pour l'attribution
  availableRoles = signal<{ value: UserRole, label: string, selected: boolean }[]>([]);

  // Formulaire d'enregistrement
  registerForm: FormGroup;

  constructor() {
    super();

    // Initialisation du formulaire
    this.registerForm = this.fb.group({
      username: ['', [Validators.minLength(2), Validators.maxLength(50)]],
      firstname: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastname: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [
        Validators.required,
        Validators.minLength(9),
        Validators.maxLength(15),
        Validators.pattern(/^[0-9]+$/)
      ]]
    });

    // ✅ Écouter les changements de firstname/lastname pour mettre à jour le placeholder
    this.setupUsernamePlaceholder();
  }

  /**
   * Met à jour le placeholder du username quand firstname/lastname changent
   */
  private setupUsernamePlaceholder(): void {
    combineLatest([
      this.registerForm.get('firstname')!.valueChanges.pipe(startWith('')),
      this.registerForm.get('lastname')!.valueChanges.pipe(startWith(''))
    ]).subscribe(([firstname, lastname]) => {
    });
  }

  /**
   * Génère un aperçu du username professionnel
   * Simule la logique backend
   */
  getGeneratedUsernamePlaceholder(): string {
    const firstname = this.registerForm.get('firstname')?.value?.trim() || '';
    const lastname = this.registerForm.get('lastname')?.value?.trim() || '';

    if (!firstname || !lastname) {
      return 'Ex: dupont.j';
    }

    // Simuler la logique du UsernameGeneratorService
    // Format: lastname.firstLetterOfFirstname
    const usernameSuggestion = `${lastname.toLowerCase()}.${firstname.charAt(0).toLowerCase()}`;

    return usernameSuggestion;
  }

  ngOnInit(): void {
    // Initialiser les rôles disponibles en fonction des droits de l'utilisateur
    this.initializeAvailableRoles();
  }

  initializeAvailableRoles(): void {
    // Définition des rôles de base
    const rolesList = [
      { value: UserRole.SUPER_ADMIN, label: 'Super_Administrateur', selected: false },
      { value: UserRole.ADMIN, label: 'Administrateur', selected: false },
      { value: UserRole.MODERATOR, label: 'Modérateur', selected: false },
      { value: UserRole.USER, label: 'Utilisateur', selected: true }, // Sélectionné par défaut
      { value: UserRole.GUEST, label: 'Invité', selected: false }
    ];

    // Ajouter le rôle SUPER_ADMIN uniquement si l'utilisateur est lui-même SUPER_ADMIN
    if (this.authFacade.hasRole( UserRole.SUPER_ADMIN)) {
      rolesList.unshift({ value: UserRole.SUPER_ADMIN, label: 'Super Administrateur', selected: false });
    }

    // Mettre à jour le signal
    this.availableRoles.set(rolesList);
  }

  toggleRole(role: UserRole): void {
    // Mettre à jour l'état de sélection pour le rôle spécifié
    this.availableRoles.update(roles =>
      roles.map(r => r.value === role ? { ...r, selected: !r.selected } : r)
    );
  }

  getSelectedRoles(): UserRole[] {
    return this.availableRoles()
      .filter(role => role.selected)
      .map(role => role.value);
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
      return;
    }

    // Vérifier qu'au moins un rôle est sélectionné
    if (this.getSelectedRoles().length === 0) {
      this.displayError('Veuillez sélectionner au moins un rôle pour cet utilisateur', 'Compris');
      return;
    }

    this.isSubmitting.set(true);
    this.clearFeedback();

    // Préparation des données pour l'API
    const formData = {
      ...this.registerForm.value,
      userRoles: this.getSelectedRoles()
    };

    // Envoi de la requête
    this.adminUserApi.createUser(formData)
      .subscribe({
        next: (response: any) => {
          this.isSubmitting.set(false);

          this.displaySuccess(
            `L'utilisateur ${formData.username} a été créé avec succès. Un email d'activation a été envoyé à l'adresse indiquée.`,
            'Retour à la liste des utilisateurs'
          );

          this.buttonAction = () => {
            this.router.navigate(['/admin/users']);
          };

          // Réinitialiser le formulaire
          this.registerForm.reset();
          this.resetRoleSelection();
        },
        error: (err: HttpErrorResponse) => {
          this.isSubmitting.set(false);
          console.log("error: ", err)

          // Gestion des erreurs de validation
          if (err.error?.errors && Array.isArray(err.error.errors)) {
            this.displayError(err.error.errors.join('\n'), 'Réessayer');
          } else if (err.error?.globalErrors && Array.isArray(err.error.globalErrors)) {
            this.displayError(err.error.globalErrors.join('\n'), 'Réessayer');
          } else if (err.error?.error) {
            this.displayError(err.error.error, 'Réessayer');
          } else {
            this.displayError('Une erreur s\'est produite lors de la création de l\'utilisateur.', 'Réessayer');
          }
        }
      });
  }

  resetRoleSelection(): void {
    // Réinitialisation des rôles
    this.initializeAvailableRoles();
  }

  cancel(): void {
    // Retour à la liste des utilisateurs
    this.router.navigate(['/admin/users']);
  }

  protected readonly UserRole = UserRole;
}
