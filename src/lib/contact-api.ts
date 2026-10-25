export type ContactMessage = {
  name: string;
  email: string;
  subject: string;
  message: string;
  website: string;
};

type ContactResponse = {
  accepted?: boolean;
  error?: string;
};

export async function sendContactMessage(message: ContactMessage): Promise<void> {
  let response: Response;
  try {
    response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
  } catch {
    throw new Error('Could not reach the email service. Your message is still here; please retry.');
  }

  let result: ContactResponse = {};
  try {
    result = (await response.json()) as ContactResponse;
  } catch {
    if (response.ok) {
      throw new Error('The email service returned an invalid response. Please retry.');
    }
  }

  if (!response.ok || result.accepted !== true) {
    throw new Error(
      result.error ?? 'The message could not be sent. Your message is still here; please retry.',
    );
  }
}
