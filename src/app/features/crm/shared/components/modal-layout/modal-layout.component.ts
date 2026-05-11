import { Component, Input, Output, EventEmitter, HostListener, OnInit, OnDestroy } from '@angular/core';

/**
 * Shared overlay modal shell for all CRM modals (log and schedule).
 *
 * Renders a fixed backdrop + centered card with a colored top-accent stripe,
 * an icon, a title and a close button. Body content is projected via ng-content.
 *
 * The accent color is applied as a CSS custom property so each consumer
 * can theme the header without duplicating styles.
 *
 * Closing is triggered by:
 *  - Clicking the × button
 *  - Clicking the backdrop
 *  - Pressing Escape
 */
@Component({
  selector: 'app-modal-layout',
  templateUrl: './modal-layout.component.html',
  styleUrl: './modal-layout.component.scss'
})
export class ModalLayoutComponent implements OnInit, OnDestroy {

  /** Text displayed in the modal header. */
  @Input() title = '';

  /** Emoji or single character shown left of the title. */
  @Input() icon = '';

  /**
   * CSS hex color applied to the top accent stripe and the icon background tint.
   * Defaults to the application primary blue.
   */
  @Input() accentColor = '#4a90e2';

  /**
   * When true, the backdrop is lightened and leaves 300px on the right uncovered
   * so a side panel (e.g. AgendaDayPanel) remains visible alongside the modal.
   */
  @Input() rightPanelOpen = false;

  /** Emitted whenever the user requests to close the modal. */
  @Output() closed = new EventEmitter<void>();

  /**
   * Blocks page scroll behind the overlay without touching body styles.
   * Touching body overflow breaks position:sticky on the sidebar; instead we
   * intercept wheel and touch events at the document level and cancel them
   * unless the target is inside the scrollable modal body.
   */
  ngOnInit(): void {
    document.addEventListener('wheel',     this.blockScroll, { passive: false });
    document.addEventListener('touchmove', this.blockScroll, { passive: false });
  }

  /** Removes scroll-blocking listeners on destroy. */
  ngOnDestroy(): void {
    document.removeEventListener('wheel',     this.blockScroll);
    document.removeEventListener('touchmove', this.blockScroll);
  }

  /**
   * Cancels scroll events that originate outside the modal body.
   * Events inside `.modal-layout__body` are let through so the modal itself
   * remains scrollable when its content overflows.
   */
  private readonly blockScroll = (e: Event): void => {
    const target = e.target as HTMLElement;
    if (!target.closest('.modal-layout__body')) {
      e.preventDefault();
    }
  };

  /** Closes the modal when the Escape key is pressed anywhere on the page. */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closed.emit();
  }

  /** Closes the modal when the user clicks directly on the backdrop overlay. */
  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closed.emit();
    }
  }
}
