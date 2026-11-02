import { useEffect, useState } from 'react';
import { wakeBackend, type BackendHealthStatus } from '../../lib/api/backend-health';
import { scheduleAfterIdle } from '../../lib/scheduleAfterIdle';

export type BackendStartupStatus = 'CHECKING' | BackendHealthStatus;

export const useBackendHealth = (): BackendStartupStatus => {
  const [status, setStatus] = useState<BackendStartupStatus>('CHECKING');

  useEffect(() => {
    let active = true;
    const cancelScheduledWarmup = scheduleAfterIdle(
      () => {
        void wakeBackend().then((result) => {
          if (active) setStatus(result);
        });
      },
      { timeout: 2500, fallbackDelay: 1200 },
    );
    return () => {
      active = false;
      cancelScheduledWarmup();
    };
  }, []);

  return status;
};
