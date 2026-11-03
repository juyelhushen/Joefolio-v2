import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createFlightPath } from '../flight-path';
import { sendContactMessage } from '../services/contact-api';
import type { ContactMessage, ContactStatus } from '../types';

export const useContactTransmission = (reduceMotion: boolean) => {
  const [status, setStatus] = useState<ContactStatus>('idle');
  const [error, setError] = useState('');
  const [earthLit, setEarthLit] = useState(false);
  const [formResetVersion, setFormResetVersion] = useState(0);
  const [flightPath, setFlightPath] = useState('');
  const stageRef = useRef<HTMLDivElement>(null);
  const launchButtonRef = useRef<HTMLButtonElement>(null);
  const earthRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);

  const measureFlightPath = useCallback(() => {
    const stage = stageRef.current;
    const launchButton = launchButtonRef.current;
    const earth = earthRef.current;
    if (!stage || !launchButton || !earth) return false;
    const route = createFlightPath(
      stage.getBoundingClientRect(),
      launchButton.getBoundingClientRect(),
      earth.getBoundingClientRect(),
    );
    if (!route) return false;
    setFlightPath(route);
    return true;
  }, []);

  const completeFlight = useCallback(() => {
    setEarthLit(true);
    setStatus('success');
    setFormResetVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    if (!reduceMotion || status !== 'flying') return;
    const frame = window.requestAnimationFrame(completeFlight);
    return () => window.cancelAnimationFrame(frame);
  }, [completeFlight, reduceMotion, status]);

  useLayoutEffect(() => {
    measureFlightPath();
    const elements = [stageRef.current, launchButtonRef.current, earthRef.current].filter(
      (element): element is HTMLDivElement | HTMLButtonElement => element !== null,
    );
    const observer =
      typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(measureFlightPath);
    elements.forEach((element) => observer?.observe(element));
    window.addEventListener('resize', measureFlightPath);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measureFlightPath);
    };
  }, [measureFlightPath]);

  const submitMessage = async (message: ContactMessage) => {
    if (sendingRef.current) return;
    sendingRef.current = true;
    setStatus('pending');
    setError('');
    setEarthLit(false);
    try {
      await sendContactMessage(message);
      if (reduceMotion || !measureFlightPath()) {
        completeFlight();
      } else {
        setStatus('flying');
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'The email service is unavailable right now.',
      );
      setStatus('error');
    } finally {
      sendingRef.current = false;
    }
  };

  return {
    status,
    error,
    earthLit,
    formResetVersion,
    flightPath,
    stageRef,
    launchButtonRef,
    earthRef,
    completeFlight,
    submitMessage,
  };
};
