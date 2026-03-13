import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-footer',
    imports: [CommonModule, RouterModule],
    templateUrl: './footer.component.html',
    styleUrl: './footer.component.scss'
})
export class FooterComponent implements OnInit {
  currentYear: number = new Date().getFullYear();

  // État des sections dépliables
  expandedSections = {
    links: false,
    contact: false
  };

  constructor() { }

  ngOnInit(): void {
    // Calculer la hauteur du footer pour le padding du body
    this.addBodyPadding();

    // Écouteur d'événement pour mise à jour en cas de redimensionnement
    window.addEventListener('resize', this.addBodyPadding);
  }

  ngOnDestroy(): void {
    // Supprimer l'écouteur d'événement
    window.removeEventListener('resize', this.addBodyPadding);
  }

  /**
   * Ajoute le padding au body pour éviter que le footer ne chevauche le contenu
   */
  addBodyPadding(): void {
    const footer = document.querySelector('.app-footer') as HTMLElement;
    if (footer) {
      const footerHeight = footer.offsetHeight;
      document.body.style.paddingBottom = `${footerHeight}px`;
    }
  }

  /**
   * Bascule l'état d'expansion d'une section
   */
  toggleSection(section: 'links' | 'contact'): void {
    // Fermer les autres sections
    if (section !== 'links') {
      this.expandedSections.links = false;
    }
    if (section !== 'contact') {
      this.expandedSections.contact = false;
    }

    // Basculer la section actuelle
    this.expandedSections[section] = !this.expandedSections[section];

    // Mettre à jour le padding après un court délai pour tenir compte de l'animation
    setTimeout(() => this.addBodyPadding(), 300);
  }

  /**
   * Ferme toutes les sections quand on clique en dehors du footer
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.footer-collapsible-sections')) {
      this.expandedSections.links = false;
      this.expandedSections.contact = false;
    }
  }
}
