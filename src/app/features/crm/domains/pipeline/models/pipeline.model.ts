export interface PipelineStep {
  publicId:       string;
  name:           string;
  color:          string | null;
  position:       number;
  isWon:          boolean;
  isLost:         boolean;
  winProbability: number;
}

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

export interface PipelineStats {
  pipelinePublicId: string;
  pipelineName:     string;
  stages:           PipelineStageStats[];
  winRate:          number | null;
  avgDealCycleDays: number | null;
}

// ─── Request models ──────────────────────────────────────────────────────────

export interface CreatePipelineRequest {
  name:         string;
  description?: string;
  isDefault?:   boolean;
}

export interface UpdatePipelineRequest {
  name?:        string;
  description?: string;
  isDefault?:   boolean;
}

export interface CreatePipelineStepRequest {
  name:            string;
  color?:          string;
  position:        number;
  isWon?:          boolean;
  isLost?:         boolean;
  winProbability?: number;
}

export interface UpdatePipelineStepRequest {
  name?:           string;
  color?:          string;
  winProbability?: number;
}

export interface ReorderPipelineStepsRequest {
  stepPublicIds: string[];
}
