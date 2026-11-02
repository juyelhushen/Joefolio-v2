export type PipelineStage = 'api' | 'topic' | 'consumer' | 'retry' | 'dead-letter';

export type PipelineEvent = {
  readonly id: number;
  readonly stage: PipelineStage;
  readonly attempt: number;
  readonly wait: number;
};

export type PipelineState = {
  readonly enabled: boolean;
  readonly failure: boolean;
  readonly events: readonly PipelineEvent[];
  readonly nextId: number;
  readonly accepted: number;
  readonly delivered: number;
  readonly queueFull: boolean;
  readonly log: readonly { readonly id: number; readonly message: string }[];
  readonly revision: number;
};

export type PipelineAction =
  | { readonly type: 'enabled'; readonly value: boolean }
  | { readonly type: 'failure'; readonly value: boolean }
  | { readonly type: 'send' }
  | { readonly type: 'tick' }
  | { readonly type: 'redrain' };

export const MAX_EVENTS = 12;

export function createPipelineState(enabled = true): PipelineState {
  return {
    enabled,
    failure: false,
    events: [],
    nextId: 1,
    accepted: 0,
    delivered: 0,
    queueFull: false,
    log: [],
    revision: 0,
  };
}

function record(state: PipelineState, messages: readonly string[]): PipelineState {
  return {
    ...state,
    revision: state.revision + messages.length,
    log: [
      ...state.log,
      ...messages.map((message, index) => ({ id: state.revision + index + 1, message })),
    ].slice(-8),
  };
}

export function pipelineReducer(state: PipelineState, action: PipelineAction): PipelineState {
  if (action.type === 'enabled') {
    return state.enabled === action.value ? state : { ...state, enabled: action.value };
  }
  if (!state.enabled) return state;
  switch (action.type) {
    case 'failure':
      return state.failure === action.value ? state : { ...state, failure: action.value };
    case 'send':
      if (state.events.length >= MAX_EVENTS) {
        return state.queueFull ? state : record({ ...state, queueFull: true }, ['Queue full']);
      }
      return record(
        {
          ...state,
          events: [...state.events, { id: state.nextId, stage: 'api', attempt: 0, wait: 0 }],
          nextId: state.nextId + 1,
          accepted: state.accepted + 1,
          queueFull: false,
        },
        [`Event ${state.nextId} accepted — 202 Accepted`],
      );
    case 'redrain': {
      const deadLetters = state.events.filter((event) => event.stage === 'dead-letter');
      if (!deadLetters.length) return state;
      return record(
        {
          ...state,
          events: state.events.map((event) =>
            event.stage === 'dead-letter'
              ? { ...event, stage: 'topic', attempt: 0, wait: 0 }
              : event,
          ),
          queueFull: false,
        },
        deadLetters.map((event) => `Event ${event.id} redrained to topic`),
      );
    }
    case 'tick': {
      if (!state.events.some((event) => event.stage !== 'dead-letter')) return state;
      const events: PipelineEvent[] = [];
      const messages: string[] = [];
      let delivered = state.delivered;
      for (const event of state.events) {
        switch (event.stage) {
          case 'api':
            events.push({ ...event, stage: 'topic' });
            messages.push(`Event ${event.id} queued in topic`);
            break;
          case 'topic':
            events.push({ ...event, stage: 'consumer' });
            messages.push(`Event ${event.id} reached consumer`);
            break;
          case 'consumer':
            if (!state.failure) {
              delivered++;
              messages.push(`Event ${event.id} delivered`);
            } else if (event.attempt === 3) {
              events.push({ ...event, stage: 'dead-letter', wait: 0 });
              messages.push(`Event ${event.id} moved to dead-letter after 3 attempts`);
            } else {
              const attempt = event.attempt + 1;
              events.push({ ...event, stage: 'retry', attempt, wait: 2 ** (attempt - 1) });
              messages.push(`Event ${event.id} retry backoff, attempt ${attempt}/3`);
            }
            break;
          case 'retry':
            if (event.wait > 1) {
              events.push({ ...event, wait: event.wait - 1 });
            } else if (event.attempt === 3 && state.failure) {
              events.push({ ...event, stage: 'dead-letter', wait: 0 });
              messages.push(`Event ${event.id} moved to dead-letter after 3 attempts`);
            } else {
              events.push({ ...event, stage: 'consumer', wait: 0 });
            }
            break;
          case 'dead-letter':
            events.push(event);
            break;
        }
      }
      return record({ ...state, events, delivered, queueFull: false }, messages);
    }
  }
}
