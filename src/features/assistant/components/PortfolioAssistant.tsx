import { FormEvent, useEffect, useId, useRef, useState } from 'react';
import { MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { useAssistantConversation } from '../hooks/useAssistantConversation';
import './PortfolioAssistant.css';

type PortfolioAssistantProps = {
  apiBaseUrl?: string;
};

export default function PortfolioAssistant({ apiBaseUrl }: PortfolioAssistantProps) {
  const configuredUrl = apiBaseUrl ?? import.meta.env.VITE_AI_ASSISTANT_API_URL;
  const { available, draft, setDraft, messages, pending, error, followUps, submitMessage } =
    useAssistantConversation(configuredUrl);
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (available) inputRef.current?.focus();
      else closeRef.current?.focus();
    }
  }, [available, open]);

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
                <h2>Joe&apos;s AI System</h2>
                <p>{available ? 'Portfolio Q&A' : 'In development'}</p>
              </div>
            </div>
            <button
              ref={closeRef}
              className="button button-secondary button-icon assistant-close"
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
                className="button button-secondary"
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
              className="form-control"
              ref={inputRef}
              id={`${panelId}-input`}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={available ? 'Ask a question…' : 'Assistant unavailable'}
              disabled={!available || pending}
            />
            <button
              className="button button-primary button-icon"
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
        className="button button-secondary assistant-launcher"
        type="button"
        aria-label={open ? 'Hide portfolio assistant panel' : 'Open portfolio assistant'}
        aria-expanded={open}
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        <span className="assistant-launcher-icon" aria-hidden="true">
          {open ? <X size={19} /> : <MessageCircle size={19} />}
        </span>
        <span>{open ? 'Close' : 'Ask about my work'}</span>
      </button>
    </div>
  );
}
