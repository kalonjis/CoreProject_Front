import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CrmPipelineApiService } from '../../services/crm-pipeline-api.service';
import { ConfirmDialogService } from '../../../../../../shared/confirm-dialog/tools/confirm-dialog.service';
import { FeedbackService } from '../../../../../../shared/feedback/tools/feedback.service';
import { Pipeline, PipelineStep } from '../../models/pipeline.model';

interface StepForm {
  name:            string;
  color:           string;
  isWon:           boolean;
  isLost:          boolean;
  winProbability:  number;
}

const emptyStepForm = (): StepForm => ({ name: '', color: '#6366f1', isWon: false, isLost: false, winProbability: 50 });

@Component({
  selector: 'app-pipeline-settings',
  imports: [FormsModule],
  templateUrl: './pipeline-settings.component.html',
  styleUrl: './pipeline-settings.component.scss'
})
export class PipelineSettingsComponent implements OnInit {

  private readonly api     = inject(CrmPipelineApiService);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly feedback = inject(FeedbackService);

  readonly pipelines    = signal<Pipeline[]>([]);
  readonly loading      = signal(false);
  readonly saving       = signal(false);

  // ─── Create pipeline form ────────────────────────────────────────────────
  showCreateForm  = false;
  newName         = '';
  newDescription  = '';
  newIsDefault    = false;

  // ─── Edit pipeline ───────────────────────────────────────────────────────
  editingId       = '';
  editName        = '';
  editDescription = '';
  editIsDefault   = false;

  // ─── Steps ───────────────────────────────────────────────────────────────
  expandedId      = '';
  addingStepFor   = '';
  newStep         = emptyStepForm();
  editingStepId   = '';
  editStep        = emptyStepForm();

  // ─── Lifecycle ───────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.api.findAll().subscribe({
      next: list => { this.pipelines.set(list); this.loading.set(false); },
      error: ()   => { this.feedback.showError('Impossible de charger les pipelines.'); this.loading.set(false); }
    });
  }

  private updateLocal(updated: Pipeline): void {
    this.pipelines.update(list => list.map(p => p.publicId === updated.publicId ? updated : p));
  }

  private reloadPipeline(publicId: string): void {
    this.api.getByPublicId(publicId).subscribe({
      next: fresh => this.updateLocal(fresh)
    });
  }

  // ─── Create pipeline ─────────────────────────────────────────────────────

  openCreateForm(): void {
    this.showCreateForm = true;
    this.newName = '';
    this.newDescription = '';
    this.newIsDefault = false;
  }

  cancelCreate(): void {
    this.showCreateForm = false;
  }

  submitCreate(): void {
    if (!this.newName.trim()) return;
    this.saving.set(true);
    this.api.create({ name: this.newName.trim(), description: this.newDescription.trim() || undefined, isDefault: this.newIsDefault }).subscribe({
      next: created => {
        this.pipelines.update(list => [...list, created]);
        this.showCreateForm = false;
        this.saving.set(false);
        this.feedback.showSuccess('Pipeline créé.');
      },
      error: () => { this.saving.set(false); this.feedback.showError('Erreur lors de la création.'); }
    });
  }

  // ─── Edit pipeline ───────────────────────────────────────────────────────

  startEdit(p: Pipeline): void {
    this.editingId      = p.publicId;
    this.editName       = p.name;
    this.editDescription = p.description ?? '';
    this.editIsDefault  = p.isDefault;
  }

  cancelEdit(): void {
    this.editingId = '';
  }

  submitEdit(): void {
    if (!this.editName.trim()) return;
    this.saving.set(true);
    this.api.update(this.editingId, { name: this.editName.trim(), description: this.editDescription.trim() || undefined, isDefault: this.editIsDefault }).subscribe({
      next: updated => {
        this.updateLocal(updated);
        this.editingId = '';
        this.saving.set(false);
        this.feedback.showSuccess('Pipeline mis à jour.');
      },
      error: () => { this.saving.set(false); this.feedback.showError('Erreur lors de la mise à jour.'); }
    });
  }

  // ─── Delete pipeline ─────────────────────────────────────────────────────

  async deletePipeline(p: Pipeline): Promise<void> {
    await this.confirm.confirm({
      title: 'Supprimer le pipeline',
      message: `Supprimer "${p.name}" ? Tous les deals liés seront affectés.`,
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      type: 'danger'
    }).then(() => {
      this.api.delete(p.publicId).subscribe({
        next: () => {
          this.pipelines.update(list => list.filter(x => x.publicId !== p.publicId));
          this.feedback.showSuccess('Pipeline supprimé.');
        },
        error: () => this.feedback.showError('Impossible de supprimer ce pipeline.')
      });
    }).catch(() => {});
  }

  // ─── Steps: expand ───────────────────────────────────────────────────────

  toggleSteps(publicId: string): void {
    this.expandedId     = this.expandedId === publicId ? '' : publicId;
    this.addingStepFor  = '';
    this.editingStepId  = '';
  }

  getSteps(p: Pipeline): PipelineStep[] {
    return [...p.steps].sort((a, b) => a.position - b.position);
  }

  // ─── Add step ────────────────────────────────────────────────────────────

  openAddStep(pipelinePublicId: string, currentStepCount: number): void {
    this.addingStepFor = pipelinePublicId;
    this.editingStepId = '';
    this.newStep = emptyStepForm();
    this._nextPosition = currentStepCount + 1;
  }

  private _nextPosition = 1;

  cancelAddStep(): void {
    this.addingStepFor = '';
  }

  submitAddStep(pipelinePublicId: string): void {
    if (!this.newStep.name.trim()) return;
    this.saving.set(true);
    this.api.addStep(pipelinePublicId, {
      name:            this.newStep.name.trim(),
      color:           this.newStep.color || undefined,
      position:        this._nextPosition,
      isWon:           this.newStep.isWon,
      isLost:          this.newStep.isLost,
      winProbability:  this.newStep.isWon ? 100 : this.newStep.isLost ? 0 : this.newStep.winProbability
    }).subscribe({
      next: () => {
        this.reloadPipeline(pipelinePublicId);
        this.addingStepFor = '';
        this.saving.set(false);
        this.feedback.showSuccess('Étape ajoutée.');
      },
      error: () => { this.saving.set(false); this.feedback.showError("Erreur lors de l'ajout de l'étape."); }
    });
  }

  // ─── Edit step ───────────────────────────────────────────────────────────

  startEditStep(step: PipelineStep): void {
    this.editingStepId = step.publicId;
    this.addingStepFor = '';
    this.editStep = { name: step.name, color: step.color ?? '#6366f1', isWon: step.isWon, isLost: step.isLost, winProbability: step.winProbability };
  }

  cancelEditStep(): void {
    this.editingStepId = '';
  }

  submitEditStep(pipelinePublicId: string, stepPublicId: string): void {
    if (!this.editStep.name.trim()) return;
    this.saving.set(true);
    this.api.updateStep(pipelinePublicId, stepPublicId, {
      name:           this.editStep.name.trim(),
      color:          this.editStep.color || undefined,
      winProbability: this.editStep.winProbability
    }).subscribe({
      next: () => {
        this.reloadPipeline(pipelinePublicId);
        this.editingStepId = '';
        this.saving.set(false);
        this.feedback.showSuccess('Étape mise à jour.');
      },
      error: () => { this.saving.set(false); this.feedback.showError("Erreur lors de la mise à jour."); }
    });
  }

  // ─── Delete step ─────────────────────────────────────────────────────────

  async deleteStep(p: Pipeline, step: PipelineStep): Promise<void> {
    await this.confirm.confirm({
      title: 'Supprimer l\'étape',
      message: `Supprimer l'étape "${step.name}" ?`,
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      type: 'danger'
    }).then(() => {
      this.api.deleteStep(p.publicId, step.publicId).subscribe({
        next: () => { this.reloadPipeline(p.publicId); this.feedback.showSuccess('Étape supprimée.'); },
        error: () => this.feedback.showError("Impossible de supprimer cette étape.")
      });
    }).catch(() => {});
  }

  // ─── Reorder steps ───────────────────────────────────────────────────────

  moveStep(p: Pipeline, step: PipelineStep, direction: 'up' | 'down'): void {
    const steps = this.getSteps(p);
    const idx   = steps.findIndex(s => s.publicId === step.publicId);
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= steps.length) return;

    const ids = steps.map(s => s.publicId);
    [ids[idx], ids[targetIdx]] = [ids[targetIdx], ids[idx]];

    this.api.reorderSteps(p.publicId, { stepPublicIds: ids }).subscribe({
      next: () => this.reloadPipeline(p.publicId),
      error: () => this.feedback.showError('Impossible de réordonner les étapes.')
    });
  }
}
