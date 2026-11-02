import { useEffect, useReducer, useState } from 'react';
import { useInteractiveActivity } from '../../../hooks/useInteractiveActivity';
import { createPipelineState, pipelineReducer, type PipelineStage } from '../pipeline';
import './EventPipelinePlayground.css';

const stages: readonly { readonly id: PipelineStage | 'delivery'; readonly label: string }[] = [
  { id: 'api', label: 'API' },
  { id: 'topic', label: 'Topic (queue)' },
  { id: 'consumer', label: 'Consumer' },
  { id: 'delivery', label: 'Delivery' },
  { id: 'retry', label: 'Retry loop' },
  { id: 'dead-letter', label: 'Dead-letter topic' },
];

export default function EventPipelinePlayground({
  reduceMotion = false,
}: {
  reduceMotion?: boolean;
}) {
  const { ref, active, staticEffects } = useInteractiveActivity<HTMLElement>(reduceMotion);
  const [state, dispatch] = useReducer(pipelineReducer, false, createPipelineState);
  const [announcement, setAnnouncement] = useState('');
  const retrying = state.events.filter((event) => event.stage === 'retry').length;
  const deadLetters = state.events.filter((event) => event.stage === 'dead-letter').length;
  const processing = state.events.some((event) => event.stage !== 'dead-letter');
  const latest = state.log.at(-1);

  useEffect(() => dispatch({ type: 'enabled', value: active }), [active]);

  useEffect(() => {
    if (!active || !state.enabled || !processing) return;
    const timer = window.setTimeout(() => dispatch({ type: 'tick' }), 650);
    return () => window.clearTimeout(timer);
  }, [active, state.enabled, state.events, processing]);

  useEffect(() => {
    if (!active || !latest) return;
    const timer = window.setTimeout(() => setAnnouncement(latest.message), 250);
    return () => window.clearTimeout(timer);
  }, [active, latest]);

  return (
    <section
      ref={ref}
      className="pipeline-playground"
      aria-labelledby="pipeline-title"
      data-static={staticEffects}
      data-active={active}
    >
      <h3 id="pipeline-title">How an async pipeline behaves</h3>
      <p className="pipeline-subtitle">
        An interactive simulation of a generic event-driven notification pipeline. No emails are
        sent and no network calls are made.
      </p>
      <div className="pipeline-controls">
        <button type="button" disabled={!active} onClick={() => dispatch({ type: 'send' })}>
          Send event
        </button>
        <button
          type="button"
          role="switch"
          aria-checked={state.failure}
          disabled={!active}
          onClick={() => dispatch({ type: 'failure', value: !state.failure })}
        >
          Simulate delivery failure <span aria-hidden="true">{state.failure ? 'On' : 'Off'}</span>
        </button>
        <button
          type="button"
          disabled={!active || !deadLetters}
          onClick={() => dispatch({ type: 'redrain' })}
        >
          Redrain dead letters
        </button>
      </div>
      <p className="pipeline-note">
        {state.queueFull
          ? 'Queue full'
          : 'Up to 12 retained events. Backoff: 0.65s, 1.3s, then 2.6s. Offscreen pauses progress.'}
      </p>
      <dl className="pipeline-counters">
        {[
          ['Accepted', state.accepted],
          ['Delivered', state.delivered],
          ['Retrying', retrying],
          ['In dead-letter', deadLetters],
        ].map(([label, count]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{count}</dd>
          </div>
        ))}
      </dl>
      <div className="pipeline-board" aria-label="Pipeline stages">
        {stages.map((stage) => (
          <div className={`pipeline-stage pipeline-stage-${stage.id}`} key={stage.id}>
            <h4>{stage.label}</h4>
            {stage.id === 'api' && <p>202 Accepted</p>}
            {stage.id === 'delivery' && <p>{state.delivered} delivered</p>}
            <ul aria-label={`${stage.label} events`}>
              {state.events
                .filter((event) => event.stage === stage.id)
                .map((event) => (
                  <li
                    className="pipeline-event"
                    key={`${event.id}-${event.stage}-${event.attempt}`}
                  >
                    <span className="pipeline-event-dot" aria-hidden="true" />
                    Event {event.id}
                    {event.stage === 'retry' && (
                      <span>
                        attempt {event.attempt}/3 · backoff {(event.wait * 0.65).toFixed(2)}s
                      </span>
                    )}
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
      <details className="pipeline-log" open>
        <summary>Recent activity</summary>
        <ol>
          {state.log.map((entry) => (
            <li key={entry.id}>{entry.message}</li>
          ))}
        </ol>
      </details>
      <p className="visually-hidden" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
    </section>
  );
}
