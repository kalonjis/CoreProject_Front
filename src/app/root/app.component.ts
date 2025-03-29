import { Component, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import {AuthService} from '../core/auth/services/auth.service';
import {FooterComponent} from '../core/layout/footer/footer.component';
import {RouterOutlet} from '@angular/router';
import {HeaderComponent} from '../core/layout/header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FooterComponent, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  authService = inject(AuthService);

  // Utilisation d'un effect pour gérer le thème basé sur les préférences
  themeEffect = effect(() => {
    const user = this.authService.user();
    if (user) {
      // Exemple: appliquer le thème préféré de l'utilisateur
      const savedTheme = localStorage.getItem('theme') || 'light';
      document.body.className = savedTheme;
    }
  });

  // Utilisation d'un effect pour afficher le statut d'authentification en dev
  logEffect = effect(() => {
    const isAuth = this.authService.isAuthenticated();
    console.log(`État d'authentification: ${isAuth ? 'Connecté' : 'Non connecté'}`);

    if (isAuth) {
      console.log('Utilisateur:', this.authService.user()?.username);
    }
  });

  ngOnInit(): void {
    // L'initialisation est déjà gérée par APP_INITIALIZER
    // Mais on peut ajouter des actions supplémentaires si nécessaire
    console.log('Application initialisée');
  }
}
