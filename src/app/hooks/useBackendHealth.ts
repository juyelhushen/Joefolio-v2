import { useEffect, useState } from 'react';
import { wakeBackend, type BackendHealthStatus } from '../../lib/api/backend-health';

export type BackendStartupStatus = 'CHECKING' | BackendHealthStatus;

export const useBackendHealth = (): BackendStartupStatus => {
  const [status, setStatus] = useState<BackendStartupStatus>('CHECKING');

  useEffect(() => {
    let active = true;
    void wakeBackend().then((result) => {
      if (active) setStatus(result);
    });
    return () => {
      active = false;
    };
  }, []);

  return status;
};
