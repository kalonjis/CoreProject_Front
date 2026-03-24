export interface PipelineStep {
  publicId: string;
  name:     string;
  color:    string | null;
  position: number;
  isWon:    boolean;
  isLost:   boolean;
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
  name:     string;
  color?:   string;
  position: number;
  isWon?:   boolean;
  isLost?:  boolean;
}

export interface UpdatePipelineStepRequest {
  name?:     string;
  color?:    string;
  position?: number;
  isWon?:    boolean;
  isLost?:   boolean;
}

export interface ReorderPipelineStepsRequest {
  stepPublicIds: string[];
}
