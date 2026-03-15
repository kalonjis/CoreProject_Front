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
