export type AssistantCitation = {
  title: string;
  url?: string;
};

export type AssistantChatRequest = {
  message: string;
  conversationId?: string;
};

export type AssistantChatResponse = {
  conversationId: string;
  answer: string;
  citations?: AssistantCitation[];
  suggestedQuestions?: string[];
};

export type AssistantApiErrorCode =
  'configuration' | 'validation' | 'network' | 'http' | 'malformed-response' | 'aborted';

export class AssistantApiError extends Error {
  constructor(
    readonly code: AssistantApiErrorCode,
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'AssistantApiError';
  }
}

function parseCitation(value: unknown): AssistantCitation | null {
  if (typeof value !== 'object' || value === null) return null;
  const citation = value as Record<string, unknown>;
  if (typeof citation.title !== 'string' || !citation.title.trim()) return null;
  if (citation.url === undefined) return { title: citation.title.trim() };
  if (typeof citation.url !== 'string') return null;

  try {
    const url = new URL(citation.url);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    return { title: citation.title.trim(), url: url.href };
  } catch {
    return null;
  }
}

function parseResponse(value: unknown): AssistantChatResponse {
  if (typeof value !== 'object' || value === null) {
    throw new AssistantApiError(
      'malformed-response',
      'The assistant returned an invalid response.',
    );
  }

  const response = value as Record<string, unknown>;
  if (
    typeof response.conversationId !== 'string' ||
    !response.conversationId.trim() ||
    typeof response.answer !== 'string' ||
    !response.answer.trim()
  ) {
    throw new AssistantApiError(
      'malformed-response',
      'The assistant returned an invalid response.',
    );
  }

  let citations: AssistantCitation[] | undefined;
  if (response.citations !== undefined) {
    if (!Array.isArray(response.citations)) {
      throw new AssistantApiError(
        'malformed-response',
        'The assistant returned invalid citations.',
      );
    }
    citations = response.citations.map(parseCitation).filter((item) => item !== null);
    if (citations.length !== response.citations.length) {
      throw new AssistantApiError(
        'malformed-response',
        'The assistant returned invalid citations.',
      );
    }
  }

  let suggestedQuestions: string[] | undefined;
  if (response.suggestedQuestions !== undefined) {
    if (
      !Array.isArray(response.suggestedQuestions) ||
      !response.suggestedQuestions.every(
        (question) => typeof question === 'string' && question.trim().length > 0,
      )
    ) {
      throw new AssistantApiError(
        'malformed-response',
        'The assistant returned invalid follow-up questions.',
      );
    }
    suggestedQuestions = response.suggestedQuestions.map((question: string) => question.trim());
  }

  return {
    conversationId: response.conversationId.trim(),
    answer: response.answer.trim(),
    citations,
    suggestedQuestions,
  };
}

export async function sendAssistantMessage(
  apiBaseUrl: string | undefined,
  message: string,
  conversationId?: string,
  signal?: AbortSignal,
): Promise<AssistantChatResponse> {
  const normalizedMessage = message.trim();
  if (!normalizedMessage) {
    throw new AssistantApiError('validation', 'Enter a message before sending it.');
  }
  if (!apiBaseUrl?.trim()) {
    throw new AssistantApiError('configuration', 'The assistant service is not configured.');
  }

  let endpoint: URL;
  try {
    const base = apiBaseUrl.trim().replace(/\/+$/, '');
    endpoint = new URL(`${base}/api/chat`);
    if (
      (endpoint.protocol !== 'https:' && endpoint.protocol !== 'http:') ||
      endpoint.username ||
      endpoint.password
    ) {
      throw new Error('Unsupported protocol');
    }
  } catch {
    throw new AssistantApiError('configuration', 'The assistant service URL is invalid.');
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: normalizedMessage,
        ...(conversationId ? { conversationId } : {}),
      } satisfies AssistantChatRequest),
      signal,
    });
  } catch {
    if (signal?.aborted) {
      throw new AssistantApiError('aborted', 'The request was cancelled.');
    }
    throw new AssistantApiError(
      'network',
      'Could not reach the assistant service. Please try again.',
    );
  }

  if (!response.ok) {
    throw new AssistantApiError(
      'http',
      `The assistant service returned an error (${response.status}). Please try again later.`,
      response.status,
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new AssistantApiError(
      'malformed-response',
      'The assistant returned an invalid response.',
    );
  }
  return parseResponse(payload);
}
