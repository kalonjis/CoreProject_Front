export interface ApiResponse {
  message?: string;
  error?: string;
  errors?: string[];
  globalErrors?: string[];
  [key: string]: any;
}
