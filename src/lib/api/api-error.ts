import axios from 'axios';

const statusMessages: Record<number, string> = {
  400: 'Please check the information in the form and try again.',
  401: 'The contact service could not authorize this request.',
  403: 'The contact service cannot accept this request.',
  404: 'The contact service endpoint could not be found.',
  429: 'You have sent messages too recently. Please wait a few minutes before trying again.',
  500: 'The contact service encountered an error. Please try again later.',
  502: 'The contact service is temporarily unavailable. Please try again later.',
  503: 'The contact service is temporarily unavailable. Please try again later.',
};

const NETWORK_ERROR_MESSAGE =
  'Could not reach the contact service. Your message is still here; please retry.';
const TIMEOUT_ERROR_MESSAGE =
  'The contact service took too long to respond. Your message is still here; please retry.';
const UNKNOWN_ERROR_MESSAGE =
  'The contact service is unavailable right now. Your message is still here; please retry.';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getSafeResponseMessage(data: unknown): string | undefined {
  if (!isRecord(data)) return undefined;

  for (const key of ['detail', 'title', 'message', 'error']) {
    const value = data[key];
    if (typeof value !== 'string') continue;

    const message = value.trim().replace(/\s+/g, ' ');
    if (
      message.length > 0 &&
      message.length <= 240 &&
      !/<[^>]*>/.test(message) &&
      !/\b(stack(?: trace)?|traceback|exception|api[_ -]?key|secret|authorization|provider|internal server|sql|database|jdbc|hibernate|org\.springframework)\b/i.test(
        message,
      )
    ) {
      return message;
    }
  }

  return undefined;
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status !== undefined) {
      const message =
        status >= 500
          ? (statusMessages[status] ??
            'The contact service is temporarily unavailable. Please try again later.')
          : (getSafeResponseMessage(error.response?.data) ??
            statusMessages[status] ??
            UNKNOWN_ERROR_MESSAGE);
      return new ApiError(message, status, error.code);
    }

    const message =
      error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
        ? TIMEOUT_ERROR_MESSAGE
        : NETWORK_ERROR_MESSAGE;
    return new ApiError(message, undefined, error.code);
  }

  return new ApiError(UNKNOWN_ERROR_MESSAGE);
}
