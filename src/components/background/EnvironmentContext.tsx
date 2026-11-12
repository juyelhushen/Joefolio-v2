/**
 * EnvironmentContext.tsx
 *
 * React Context for managing universe environment state.
 * Provides camera state, rendering profile, and active section atmosphere
 * to all background components via context provider.
 */

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useScroll, useSpring } from 'motion/react';
import {
  calculateCameraState,
  calculateRenderingProfile,
  type CameraState,
  type RenderingProfile,
} from './VirtualCamera';
import { useSystemReducedMotion } from '../../hooks/useSystemReducedMotion';

export interface EnvironmentContextType {
  cameraState: CameraState;
  renderingProfile: RenderingProfile;
  activeSection: string;
  mousePosition: { x: number; y: number };
}

const EnvironmentContext = createContext<EnvironmentContextType | undefined>(undefined);

export function useEnvironment(): EnvironmentContextType {
  const context = useContext(EnvironmentContext);
  if (!context) {
    throw new Error('useEnvironment must be used within EnvironmentProvider');
  }
  return context;
}

interface EnvironmentProviderProps {
  activeSection?: string;
  children: ReactNode;
}

export function EnvironmentProvider({ activeSection = '', children }: EnvironmentProviderProps) {
  // Use Motion's useScroll hook to get scroll progress (0–1)
  const { scrollYProgress } = useScroll();
  const smoothedProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
  });

  // Track mouse position for parallax (desktop only)
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const mousePositionRef = useRef({ x: 0.5, y: 0.5 });

  // Reduced motion preference
  const reducedMotion = useSystemReducedMotion();

  // Rendering profile based on device capability
  const [renderingProfile, setRenderingProfile] = useState<RenderingProfile>(() =>
    calculateRenderingProfile(
      { width: window.innerWidth, height: window.innerHeight },
      window.devicePixelRatio,
      reducedMotion,
    ),
  );

  // Derive camera state from scroll progress and mouse position
  const [cameraState, setCameraState] = useState<CameraState>(() =>
    calculateCameraState(0, 0.5, 0.5, reducedMotion),
  );

  // Update camera state when scroll progress changes
  useEffect(() => {
    const unsubscribe = smoothedProgress.onChange((value: number) => {
      setCameraState(
        calculateCameraState(
          value,
          mousePositionRef.current.x,
          mousePositionRef.current.y,
          reducedMotion,
        ),
      );
    });
    return () => unsubscribe();
  }, [smoothedProgress, reducedMotion]);

  // Handle mouse move for desktop parallax
  useEffect(() => {
    if (reducedMotion) return;

    const handleMouseMove = (event: MouseEvent) => {
      // Normalize mouse position to [0, 1]
      const x = event.clientX / window.innerWidth;
      const y = event.clientY / window.innerHeight;
      mousePositionRef.current = { x, y };
      setMousePosition({ x, y });

      // Update camera state with new mouse position
      setCameraState((current) =>
        calculateCameraState(current.scrollProgress, x, y, reducedMotion),
      );
    };

    // Throttle mouse events for performance
    let animationFrameId: number | null = null;
    const throttledMouseMove = (event: MouseEvent) => {
      if (animationFrameId !== null) return;
      animationFrameId = requestAnimationFrame(() => {
        handleMouseMove(event);
        animationFrameId = null;
      });
    };

    window.addEventListener('mousemove', throttledMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', throttledMouseMove);
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [reducedMotion]);

  // Update rendering profile when viewport changes
  useEffect(() => {
    const handleResize = () => {
      setRenderingProfile(
        calculateRenderingProfile(
          { width: window.innerWidth, height: window.innerHeight },
          window.devicePixelRatio,
          reducedMotion,
        ),
      );
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [reducedMotion]);

  const contextValue: EnvironmentContextType = {
    cameraState,
    renderingProfile,
    activeSection,
    mousePosition,
  };

  return <EnvironmentContext.Provider value={contextValue}>{children}</EnvironmentContext.Provider>;
}
