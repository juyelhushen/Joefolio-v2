# Portfolio assistant API contract

The portfolio frontend is prepared to call a separately deployed service. No assistant backend is included or configured by default.

The [assistant service](../src/features/assistant/services/assistant-api.ts) consumes the shared
Axios client with a per-request host override. The
[conversation hook](../src/features/assistant/hooks/useAssistantConversation.ts) owns request and
conversation state; the component owns the panel's accessible focus and keyboard behavior.

## Endpoint

Set `VITE_AI_ASSISTANT_API_URL` to the backend's absolute HTTP(S) base URL, without a trailing slash, for example `http://localhost:8000`. The frontend appends `POST /api/chat`. Configure CORS on the backend to allow the portfolio origin. Do not put provider credentials or other secrets in Vite variables; values prefixed with `VITE_` are public in the browser bundle.

## Request

```http
POST /api/chat
Content-Type: application/json
```

```json
{
  "message": "Which projects explore retrieval-augmented generation?",
  "conversationId": "optional-server-issued-id"
}
```

`message` is required and must contain non-whitespace text. `conversationId` is optional on the first request and should be returned by the backend for subsequent turns in the same in-memory browser session. The frontend does not persist conversations.

## Success response

```json
{
  "conversationId": "server-issued-id",
  "answer": "The Enterprise Knowledge Assistant documents PDF ingestion and retrieval-grounded answers.",
  "citations": [
    {
      "title": "Enterprise Knowledge Assistant repository",
      "url": "https://github.com/juyelhushen/enterprise-knowledge-assistant"
    }
  ],
  "suggestedQuestions": ["How does the workflow handle citations?"]
}
```

`conversationId` and non-empty `answer` are required. `citations` and `suggestedQuestions` are optional. Each citation requires a non-empty title; if present, its URL must be an absolute HTTP(S) URL. The frontend renders all response text as text, not HTML. Citation links open in a new tab with `noopener noreferrer`.

Return a non-2xx status for failures. The frontend reports a generic status-based error and does not interpret an error body as an answer. Malformed JSON or an invalid success payload is reported as a response error.

## Frontend behavior and backend responsibilities

- Without a configured URL, the application hides the launcher and does not download the assistant
  interface. Search, source-backed case studies and contact remain the available alternatives.
  The standalone component still supports an honest disabled state for previews/tests.
- With a URL configured, the frontend sends JSON to the contract above, prevents duplicate submissions, and cancels an in-flight request when the widget unmounts.
- The frontend does not authenticate users, call a model, retrieve portfolio content, execute tools, or verify the truth of model claims.
- A future backend should ground answers in approved portfolio material, enforce its own rate limits and safety/access controls, and return citations only for sources it actually used.
- The current documented projects include a PDF knowledge assistant with retrieval citations and audit logging, and Sentinel with an investigation API plus a separate internal constrained repair workflow. Those project capabilities do not imply that this portfolio assistant backend exists.

## Enablement checklist

1. Implement and deploy the separate `/api/chat` service; no backend is supplied by this repository.
2. Keep model/provider credentials on that server. Do not add them to any `VITE_` variable.
3. Configure the service's CORS allowlist for `https://juyel.vercel.app` and only the development
   origins actually needed, plus server-side rate limits, timeouts and approved grounding content.
4. Set the public `VITE_AI_ASSISTANT_API_URL` in the build environment and rebuild. The launcher
   then appears; configuration alone does not establish backend availability or answer quality.
5. Verify a real grounded answer, citations, malformed-response handling, network/HTTP failures,
   pending state, cancellation and duplicate-submission protection before advertising readiness.
