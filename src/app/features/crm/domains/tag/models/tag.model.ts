/** CRM tag with a name and a hex colour, attachable to contacts, deals, and organisations. */
export interface Tag {
  publicId: string;
  name:     string;
  color:    string;
}

/** Request payload for creating a new tag. */
export interface CreateTagRequest {
  name:   string;
  color?: string;
}

/** Request payload for partially updating a tag's name or colour. */
export interface UpdateTagRequest {
  name?:  string;
  color?: string;
}
