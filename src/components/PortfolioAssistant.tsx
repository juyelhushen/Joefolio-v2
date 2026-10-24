import { FormEvent, useEffect, useId, useRef, useState } from 'react';
import { MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { AssistantApiError, AssistantCitation, sendAssistantMessage } from '../lib/assistant-api';

type ChatMessage = {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  citations?: AssistantCitation[];
};

const suggestedQuestions = [
  'What projects has Juyel built?',
  'Tell me about the AI engineering projects.',
  'Which backend technologies does the portfolio document?',
  'How can I get in touch?',
];

type PortfolioAssistantProps = {
  apiBaseUrl?: string;
};

export default function PortfolioAssistant({ apiBaseUrl }: PortfolioAssistantProps) {
  const configuredUrl = apiBaseUrl ?? import.meta.env.VITE_AI_ASSISTANT_API_URL;
  const available = Boolean(configuredUrl?.trim());
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [followUps, setFollowUps] = useState(suggestedQuestions);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingRef = useRef(false);
  const mountedRef = useRef(false);
  const controllerRef = useRef<AbortController | null>(null);
  const messageIdRef = useRef(0);

  useEffect(() => {
    if (open) {
      if (available) inputRef.current?.focus();
      else closeRef.current?.focus();
    }
  }, [available, open]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      controllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        launcherRef.current?.focus();
      }
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [open]);

  const submitMessage = async (message: string) => {
    const normalizedMessage = message.trim();
    if (!available || !normalizedMessage || pendingRef.current) return;

    pendingRef.current = true;
    setPending(true);
    setError('');
    setMessages((current) => [
      ...current,
      { id: messageIdRef.current++, role: 'user', text: normalizedMessage },
    ]);
    setDraft('');

    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      const result = await sendAssistantMessage(
        configuredUrl,
        normalizedMessage,
        conversationId,
        controller.signal,
      );
      if (!mountedRef.current) return;
      setConversationId(result.conversationId);
      setMessages((current) => [
        ...current,
        {
          id: messageIdRef.current++,
          role: 'assistant',
          text: result.answer,
          citations: result.citations,
        },
      ]);
      if (result.suggestedQuestions?.length) setFollowUps(result.suggestedQuestions);
    } catch (caught) {
      if (mountedRef.current && caught instanceof AssistantApiError && caught.code !== 'aborted') {
        setError(caught.message);
      } else if (mountedRef.current && !(caught instanceof AssistantApiError)) {
        setError('The assistant could not complete that request. Please try again.');
      }
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
      pendingRef.current = false;
      if (mountedRef.current) setPending(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitMessage(draft);
  };

  return (
    <div className="assistant-widget">
      {open && (
        <section
          className="assistant-panel"
          id={panelId}
          role="region"
          aria-label="Portfolio assistant"
        >
          <header className="assistant-header">
            <div className="assistant-identity">
              <span className="assistant-avatar" aria-hidden="true">
                <Sparkles size={17} />
              </span>
              <div>
                <h2>Portfolio Assistant</h2>
                <p>Explore documented projects and technologies</p>
              </div>
            </div>
            <button
              ref={closeRef}
              className="assistant-close"
              type="button"
              onClick={() => {
                setOpen(false);
                launcherRef.current?.focus();
              }}
              aria-label="Close portfolio assistant"
            >
              <X size={18} />
            </button>
          </header>

          <div className="assistant-messages" aria-live="polite" aria-relevant="additions">
            {messages.length === 0 ? (
              <p className="assistant-welcome">
                {available
                  ? 'Ask about the work and details documented on this portfolio.'
                  : 'This assistant is being prepared. A backend service must be configured before it can answer questions.'}
              </p>
            ) : (
              messages.map((message) => (
                <article
                  className={`assistant-message assistant-message-${message.role}`}
                  key={message.id}
                >
                  <p>{message.text}</p>
                  {message.citations?.length ? (
                    <ul className="assistant-citations" aria-label="Sources">
                      {message.citations.map((citation) => (
                        <li key={citation.url ?? `${message.id}-${citation.title}`}>
                          {citation.url ? (
                            <a href={citation.url} target="_blank" rel="noopener noreferrer">
                              {citation.title}
                            </a>
                          ) : (
                            <span>{citation.title}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              ))
            )}
            {pending && (
              <p className="assistant-loading" role="status">
                Waiting for the assistant…
              </p>
            )}
            {error && (
              <p className="assistant-error" role="alert">
                {error}
              </p>
            )}
          </div>

          <div className="assistant-suggestions" aria-label="Suggested questions">
            {followUps.map((question) => (
              <button
                key={question}
                type="button"
                disabled={!available || pending}
                onClick={() => void submitMessage(question)}
              >
                {question}
              </button>
            ))}
          </div>

          <form className="assistant-composer" onSubmit={handleSubmit}>
            <label className="visually-hidden" htmlFor={`${panelId}-input`}>
              Ask about Juyel’s portfolio
            </label>
            <input
              ref={inputRef}
              id={`${panelId}-input`}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={available ? 'Ask a question…' : 'Assistant unavailable'}
              disabled={!available || pending}
            />
            <button
              type="submit"
              aria-label="Send message"
              disabled={!available || pending || !draft.trim()}
            >
              <Send size={16} />
            </button>
          </form>
          <p className="assistant-disclaimer">
            {available
              ? 'Answers depend on the configured portfolio service.'
              : 'No AI service is connected; no answers are simulated.'}
          </p>
        </section>
      )}
      <button
        ref={launcherRef}
        className="assistant-launcher"
        type="button"
        aria-label={open ? 'Hide portfolio assistant panel' : 'Open portfolio assistant'}
        aria-expanded={open}
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        {open ? <X size={19} /> : <MessageCircle size={19} />}
        <span>{open ? 'Close' : 'Ask about my work'}</span>
      </button>
    </div>
  );
}
