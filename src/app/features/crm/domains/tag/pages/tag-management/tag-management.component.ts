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
export class TagManagementComponent implements OnInit {

  private readonly api     = inject(CrmTagApiService);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly feedback = inject(FeedbackService);
  private readonly authStore = inject(AuthStore);

  readonly isAdmin  = this.authStore.isAdmin;
  readonly tags     = signal<Tag[]>([]);
  readonly loading  = signal(false);
  readonly saving   = signal(false);

  // ─── Create form ─────────────────────────────────────────────────────────
  showCreateForm = false;
  newName        = '';
  newColor       = '#6366f1';

  // ─── Edit form ───────────────────────────────────────────────────────────
  editingId   = '';
  editName    = '';
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

  openCreateForm(): void {
    this.showCreateForm = true;
    this.newName  = '';
    this.newColor = '#6366f1';
    this.editingId = '';
  }

  cancelCreate(): void {
    this.showCreateForm = false;
  }

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

  startEdit(tag: Tag): void {
    this.editingId     = tag.publicId;
    this.editName      = tag.name;
    this.editColor     = tag.color;
    this.showCreateForm = false;
  }

  cancelEdit(): void {
    this.editingId = '';
  }

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
