import { describe, expect, it } from 'vitest';
import { createPipelineState, MAX_EVENTS, pipelineReducer, type PipelineState } from './pipeline';

function tick(state: PipelineState, count = 1): PipelineState {
  for (let index = 0; index < count; index++) state = pipelineReducer(state, { type: 'tick' });
  return state;
}

function failOneEvent() {
  let state = pipelineReducer(createPipelineState(), { type: 'failure', value: true });
  state = pipelineReducer(state, { type: 'send' });
  return tick(state, 12);
}

describe('pipelineReducer', () => {
  it('accepts with 202 then visits topic, consumer and delivery without mutating prior state', () => {
    const initial = createPipelineState();
    const accepted = pipelineReducer(initial, { type: 'send' });
    expect(initial.events).toEqual([]);
    expect(accepted.accepted).toBe(1);
    expect(accepted.log[0].message).toContain('202 Accepted');
    expect(accepted.events[0].stage).toBe('api');
    const queued = tick(accepted);
    expect(queued.events[0].stage).toBe('topic');
    const consumed = tick(queued);
    expect(consumed.events[0].stage).toBe('consumer');
    const delivered = tick(consumed);
    expect(delivered.delivered).toBe(1);
    expect(delivered.events).toEqual([]);
    expect(delivered.log.at(-1)?.message).toBe('Event 1 delivered');
    expect(tick(delivered)).toBe(delivered);
  });

  it('backs off for 1, 2 and 4 ticks before retaining a dead letter after three attempts', () => {
    let state = pipelineReducer(createPipelineState(), { type: 'failure', value: true });
    state = tick(pipelineReducer(state, { type: 'send' }), 3);
    expect(state.events[0]).toMatchObject({ stage: 'retry', attempt: 1, wait: 1 });
    state = tick(state, 2);
    expect(state.events[0]).toMatchObject({ stage: 'retry', attempt: 2, wait: 2 });
    state = tick(state);
    expect(state.events[0]).toMatchObject({ stage: 'retry', attempt: 2, wait: 1 });
    state = tick(state, 2);
    expect(state.events[0]).toMatchObject({ stage: 'retry', attempt: 3, wait: 4 });
    state = tick(state, 3);
    expect(state.events[0]).toMatchObject({ stage: 'retry', attempt: 3, wait: 1 });
    state = tick(state);
    expect(state.events[0].stage).toBe('dead-letter');
    expect(state.delivered).toBe(0);
    expect(state.log.at(-1)?.message).toBe('Event 1 moved to dead-letter after 3 attempts');
    expect(tick(state)).toBe(state);
  });

  it('redrains to topic, resets attempts and delivers when failure is off', () => {
    let state = failOneEvent();
    state = pipelineReducer(state, { type: 'failure', value: false });
    state = pipelineReducer(state, { type: 'redrain' });
    expect(state.events[0]).toMatchObject({ stage: 'topic', attempt: 0 });
    state = tick(state, 2);
    expect(state.delivered).toBe(1);
    expect(state.accepted).toBe(1);
    expect(state.events).toEqual([]);
  });

  it('fails again after redrain with failure still on', () => {
    let state = pipelineReducer(failOneEvent(), { type: 'redrain' });
    state = tick(state, 11);
    expect(state.events[0]).toMatchObject({ stage: 'dead-letter', attempt: 3 });
    expect(state.delivered).toBe(0);
    expect(state.accepted).toBe(1);
  });

  it('handles failure toggles during the last backoff without a fourth retry', () => {
    let state = pipelineReducer(createPipelineState(), { type: 'failure', value: true });
    state = tick(pipelineReducer(state, { type: 'send' }), 11);
    state = pipelineReducer(state, { type: 'failure', value: false });
    state = tick(state);
    state = pipelineReducer(state, { type: 'failure', value: true });
    state = tick(state);
    expect(state.events[0]).toMatchObject({ stage: 'dead-letter', attempt: 3 });
  });

  it('caps retained events at twelve, reports Queue full and frees space on delivery', () => {
    let state = createPipelineState();
    for (let index = 0; index < MAX_EVENTS; index++) {
      state = pipelineReducer(state, { type: 'send' });
    }
    state = pipelineReducer(state, { type: 'send' });
    expect(state.events).toHaveLength(MAX_EVENTS);
    expect(state.accepted).toBe(MAX_EVENTS);
    expect(state.nextId).toBe(13);
    expect(state.queueFull).toBe(true);
    expect(pipelineReducer(state, { type: 'send' })).toBe(state);
    state = tick(state, 3);
    expect(pipelineReducer(state, { type: 'send' }).accepted).toBe(13);
  });

  it('is unchanged for every simulation action when disabled and resumes explicitly', () => {
    let state = pipelineReducer(createPipelineState(), { type: 'send' });
    state = pipelineReducer(state, { type: 'enabled', value: false });
    expect(pipelineReducer(state, { type: 'send' })).toBe(state);
    expect(pipelineReducer(state, { type: 'tick' })).toBe(state);
    expect(pipelineReducer(state, { type: 'redrain' })).toBe(state);
    expect(pipelineReducer(state, { type: 'failure', value: true })).toBe(state);
    expect(pipelineReducer(state, { type: 'enabled', value: false })).toBe(state);
    const resumed = pipelineReducer(state, { type: 'enabled', value: true });
    expect(tick(resumed).events[0].stage).toBe('topic');
  });

  it('does not redrain an empty queue or create more than eight log entries', () => {
    const state = createPipelineState();
    expect(pipelineReducer(state, { type: 'redrain' })).toBe(state);
    let next = state;
    for (let index = 0; index < 12; index++) next = pipelineReducer(next, { type: 'send' });
    expect(next.log).toHaveLength(8);
    expect(new Set(next.log.map((entry) => entry.id)).size).toBe(8);
  });
});
