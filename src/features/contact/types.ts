export type ContactMessage = {
  name: string;
  email: string;
  subject: string;
  message: string;
  website: string;
};

export type ContactStatus = 'idle' | 'pending' | 'flying' | 'success' | 'error';
