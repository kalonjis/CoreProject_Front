import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent implements OnInit {
  currentYear: number = new Date().getFullYear();

  constructor() { }

  ngOnInit(): void {
    // Add some padding to the bottom of the main content
    // to prevent the footer from overlapping content
    this.addBodyPadding();

    // Listen for window resize to adjust padding if needed
    window.addEventListener('resize', this.addBodyPadding);
  }

  ngOnDestroy(): void {
    // Remove event listener on component destruction
    window.removeEventListener('resize', this.addBodyPadding);
  }

  /**
   * Add padding to the bottom of the body to account for the footer height
   * This ensures the footer doesn't overlap content on small screens
   */
  addBodyPadding(): void {
    const footer = document.querySelector('.app-footer') as HTMLElement;
    if (footer) {
      const footerHeight = footer.offsetHeight;

      // Add some extra padding on mobile for better UX
      const extraPadding = window.innerWidth <= 576 ? 20 : 0;

      document.body.style.paddingBottom = `${footerHeight + extraPadding}px`;

      // For debugging purposes - you can remove this later
      console.log(`Adjusted footer padding: ${footerHeight + extraPadding}px`);
    }
  }
}
