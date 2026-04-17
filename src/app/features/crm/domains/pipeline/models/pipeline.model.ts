/** A single stage within a pipeline, with position, colour, win/loss flags, and probability. */
export interface PipelineStep {
  publicId:       string;
  name:           string;
  color:          string | null;
  position:       number;
  isWon:          boolean;
  isLost:         boolean;
  winProbability: number;
}

/** A deal pipeline with an ordered list of stages, a default flag, and audit timestamps. */
export interface Pipeline {
  publicId:     string;
  name:         string;
  description:  string | null;
  isDefault:    boolean;
  displayOrder: number;
  steps:        PipelineStep[];
  createdAt:    string;
  updatedAt:    string;
}

// ─── Stats models ────────────────────────────────────────────────────────────

/** Conversion and throughput statistics for a single pipeline stage. */
export interface PipelineStageStats {
  stagePublicId:  string;
  stageName:      string;
  position:       number;
  isWon:          boolean;
  isLost:         boolean;
  dealsCurrently: number;
  dealsEntered:   number;
  conversionRate: number | null;
  avgDaysInStage: number | null;
}

/** Aggregated statistics for an entire pipeline: per-stage metrics, global win rate, and average deal cycle. */
export interface PipelineStats {
  pipelinePublicId: string;
  pipelineName:     string;
  stages:           PipelineStageStats[];
  winRate:          number | null;
  avgDealCycleDays: number | null;
}

// ─── Request models ──────────────────────────────────────────────────────────

/** Request payload for creating a new pipeline. */
export interface CreatePipelineRequest {
  name:         string;
  description?: string;
  isDefault?:   boolean;
}

/** Request payload for partially updating a pipeline's metadata. */
export interface UpdatePipelineRequest {
  name?:        string;
  description?: string;
  isDefault?:   boolean;
}

/** Request payload for adding a new stage to a pipeline. */
export interface CreatePipelineStepRequest {
  name:            string;
  color?:          string;
  position:        number;
  isWon?:          boolean;
  isLost?:         boolean;
  winProbability?: number;
}

/** Request payload for partially updating a pipeline stage's name, colour, or win probability. */
export interface UpdatePipelineStepRequest {
  name?:           string;
  color?:          string;
  winProbability?: number;
}

/** Request payload for reordering the stages of a pipeline. */
export interface ReorderPipelineStepsRequest {
  stepPublicIds: string[];
}
