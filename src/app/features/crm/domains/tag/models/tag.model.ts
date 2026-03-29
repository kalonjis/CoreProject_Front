export interface Tag {
  publicId: string;
  name:     string;
  color:    string;
}

export interface CreateTagRequest {
  name:   string;
  color?: string;
}

export interface UpdateTagRequest {
  name?:  string;
  color?: string;
}
