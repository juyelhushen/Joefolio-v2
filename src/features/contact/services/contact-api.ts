import { ApiError, normalizeApiError } from '../../../lib/api/api-error';
import { apiClient } from '../../../lib/api/client';

import type { ContactMessage } from '../types';

type ContactResponse = {
  message: string;
};

export async function sendContactMessage(message: ContactMessage): Promise<void> {
  try {
    const response = await apiClient.post<ContactResponse>('/api/v1/contact', {
      name: message.name,
      email: message.email,
      subject: message.subject,
      body: message.message,
      website: message.website,
    });

    if (
      response.status !== 202 ||
      typeof response.data?.message !== 'string' ||
      response.data.message.trim().length === 0
    ) {
      throw new ApiError(
        'The contact service returned an unexpected response. Your message is still here; please retry.',
        response.status,
      );
    }
  } catch (error) {
    throw normalizeApiError(error);
  }
}
