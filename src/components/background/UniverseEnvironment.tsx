/**
 * UniverseEnvironment.tsx
 *
 * Root container for the immersive universe experience.
 * Wraps all background components and provides coordinated environment state.
 *
 * Responsibilities:
 * - Initialize EnvironmentProvider with current active section
 * - Position and manage all depth layers
 * - Ensure proper z-index stacking
 * - Handle responsive layout
 */

import { ReactNode } from 'react';
import { EnvironmentProvider } from './EnvironmentContext';
import './UniverseEnvironment.css';

interface UniverseEnvironmentProps {
  activeSection: string;
  children: ReactNode;
}

/**
 * UniverseEnvironment: Root container for immersive background experience.
 * Must wrap all background layers and be positioned fixed/absolute
 * so that content renders on top.
 */
export function UniverseEnvironment({ activeSection, children }: UniverseEnvironmentProps) {
  return (
    <EnvironmentProvider activeSection={activeSection}>
      <div className="universe-environment" role="presentation" aria-hidden="true">
        {/* All background layers rendered here via context consumers */}
        {children}
      </div>
    </EnvironmentProvider>
  );
}

export default UniverseEnvironment;
