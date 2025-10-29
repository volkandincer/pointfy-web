export interface ContactFormData {
  name: string;
  email: string;
  message: string;
  // Honeypot field for spam prevention
  website?: string;
}

export interface ContactApiResponse {
  success: boolean;
  error?: string;
}
