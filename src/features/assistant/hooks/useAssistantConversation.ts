import { useEffect, useRef, useState } from 'react';
import {
  AssistantApiError,
  sendAssistantMessage,
  type AssistantCitation,
} from '../services/assistant-api';

type ChatMessage = {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  citations?: AssistantCitation[];
};

const SUGGESTED_QUESTIONS = [
  'What projects has Juyel built?',
  'Tell me about the AI engineering projects.',
  'Which backend technologies does the portfolio document?',
  'How can I get in touch?',
];

export const useAssistantConversation = (configuredUrl: string | undefined) => {
  const available = Boolean(configuredUrl?.trim());
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [followUps, setFollowUps] = useState(SUGGESTED_QUESTIONS);
  const pendingRef = useRef(false);
  const mountedRef = useRef(false);
  const controllerRef = useRef<AbortController | null>(null);
  const messageIdRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      controllerRef.current?.abort();
    };
  }, []);

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

  return { available, draft, setDraft, messages, pending, error, followUps, submitMessage };
};
