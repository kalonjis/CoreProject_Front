import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CrmTagApiService } from '../../services/crm-tag-api.service';
import { ConfirmDialogService } from '../../../../../../shared/confirm-dialog/tools/confirm-dialog.service';
import { FeedbackService } from '../../../../../../shared/feedback/tools/feedback.service';
import { AuthStore } from '../../../../../../core/auth/state/auth.store';
import { TagChipComponent } from '../../components/tag-chip/tag-chip.component';
import { Tag } from '../../models/tag.model';

@Component({
  selector: 'app-tag-management',
  imports: [FormsModule, TagChipComponent],
  templateUrl: './tag-management.component.html',
  styleUrl: './tag-management.component.scss'
})
/** Admin page for managing CRM tags: create, rename, recolour, and delete. */
export class TagManagementComponent implements OnInit {

  private readonly api     = inject(CrmTagApiService);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly feedback = inject(FeedbackService);
  private readonly authStore = inject(AuthStore);

  /** Whether the current user has the ADMIN role; gates create/edit/delete actions. */
  readonly isAdmin  = this.authStore.isAdmin;
  /** All CRM tags; updated optimistically after create/edit/delete. */
  readonly tags     = signal<Tag[]>([]);
  /** Whether the tag list is being fetched. */
  readonly loading  = signal(false);
  /** Whether a create or edit request is in flight. */
  readonly saving   = signal(false);

  /** Controls visibility of the inline create form. */
  showCreateForm = false;
  /** Name field for the new tag. */
  newName        = '';
  /** Colour hex for the new tag (default indigo). */
  newColor       = '#6366f1';

  /** Public ID of the tag currently being edited; empty string when no edit is active. */
  editingId   = '';
  /** Working copy of the tag name in the edit form. */
  editName    = '';
  /** Working copy of the tag colour in the edit form. */
  editColor   = '';

  // ─── Lifecycle ───────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.api.findAll().subscribe({
      next: tags => { this.tags.set(tags); this.loading.set(false); },
      error: ()   => { this.feedback.showError('Impossible de charger les tags.'); this.loading.set(false); }
    });
  }

  // ─── Create ──────────────────────────────────────────────────────────────

  /** Shows the create form and resets its fields; collapses any active edit. */
  openCreateForm(): void {
    this.showCreateForm = true;
    this.newName  = '';
    this.newColor = '#6366f1';
    this.editingId = '';
  }

  /** Hides the create form without saving. */
  cancelCreate(): void {
    this.showCreateForm = false;
  }

  /** Creates the tag via the API and inserts it alphabetically into the list. */
  submitCreate(): void {
    if (!this.newName.trim()) return;
    this.saving.set(true);
    this.api.create({ name: this.newName.trim(), color: this.newColor }).subscribe({
      next: tag => {
        this.tags.update(list => [...list, tag].sort((a, b) => a.name.localeCompare(b.name)));
        this.showCreateForm = false;
        this.saving.set(false);
        this.feedback.showSuccess('Tag créé.');
      },
      error: () => { this.saving.set(false); this.feedback.showError('Erreur lors de la création.'); }
    });
  }

  // ─── Edit ────────────────────────────────────────────────────────────────

  /** Pre-fills the edit form with the tag's current values and collapses the create form. */
  startEdit(tag: Tag): void {
    this.editingId     = tag.publicId;
    this.editName      = tag.name;
    this.editColor     = tag.color;
    this.showCreateForm = false;
  }

  /** Collapses the edit form without saving. */
  cancelEdit(): void {
    this.editingId = '';
  }

  /** Saves the edited tag name and colour; updates the list in place. */
  submitEdit(): void {
    if (!this.editName.trim()) return;
    this.saving.set(true);
    this.api.update(this.editingId, { name: this.editName.trim(), color: this.editColor }).subscribe({
      next: updated => {
        this.tags.update(list =>
          list.map(t => t.publicId === updated.publicId ? updated : t)
              .sort((a, b) => a.name.localeCompare(b.name))
        );
        this.editingId = '';
        this.saving.set(false);
        this.feedback.showSuccess('Tag mis à jour.');
      },
      error: () => { this.saving.set(false); this.feedback.showError('Erreur lors de la mise à jour.'); }
    });
  }

  // ─── Delete ──────────────────────────────────────────────────────────────

  /** Shows a confirmation dialog then deletes the tag and removes it from the list. */
  async deleteTag(tag: Tag): Promise<void> {
    await this.confirm.confirm({
      title: 'Supprimer le tag',
      message: `Supprimer "${tag.name}" ? Il sera retiré de tous les contacts et deals.`,
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      type: 'danger'
    }).then(() => {
      this.api.delete(tag.publicId).subscribe({
        next: () => {
          this.tags.update(list => list.filter(t => t.publicId !== tag.publicId));
          this.feedback.showSuccess('Tag supprimé.');
        },
        error: () => this.feedback.showError('Impossible de supprimer ce tag.')
      });
    }).catch(() => {});
  }
}
