/**
 * EnvironmentContext.tsx
 *
 * React Context for managing universe environment state.
 * Provides a mutable camera reference and active section identity
 * to all background components via context provider.
 */

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from 'react';
import { useScroll, useSpring } from 'motion/react';
import { calculateCameraState, type CameraState } from './VirtualCamera';
import { useSystemReducedMotion } from '../../hooks/useSystemReducedMotion';

export interface EnvironmentContextType {
  cameraRef: RefObject<CameraState>;
  activeSection: string;
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
  const mousePositionRef = useRef({ x: 0.5, y: 0.5 });

  // Reduced motion preference
  const reducedMotion = useSystemReducedMotion();

  // Derive camera state from scroll progress and mouse position
  const cameraRef = useRef<CameraState>(calculateCameraState(0, 0.5, 0.5, reducedMotion));

  // Update camera state when scroll progress changes
  useEffect(() => {
    const updateCamera = (value: number) => {
      Object.assign(
        cameraRef.current,
        calculateCameraState(
          value,
          mousePositionRef.current.x,
          mousePositionRef.current.y,
          reducedMotion,
        ),
      );
    };
    updateCamera(smoothedProgress.get());
    return smoothedProgress.on('change', updateCamera);
  }, [smoothedProgress, reducedMotion]);

  // Handle mouse move for desktop parallax
  useEffect(() => {
    if (reducedMotion || typeof window.matchMedia !== 'function') return;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

    const handleMouseMove = (event: MouseEvent) => {
      if (!finePointer.matches || window.innerWidth < 1024) return;
      const x = event.clientX / window.innerWidth;
      const y = event.clientY / window.innerHeight;
      mousePositionRef.current.x = x;
      mousePositionRef.current.y = y;
      cameraRef.current.parallaxOffsetX = (x * 2 - 1) * 0.02;
      cameraRef.current.parallaxOffsetY = (y * 2 - 1) * 0.01;
    };

    const resetMouse = () => {
      mousePositionRef.current.x = mousePositionRef.current.y = 0.5;
      cameraRef.current.parallaxOffsetX = cameraRef.current.parallaxOffsetY = 0;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('blur', resetMouse);
    finePointer.addEventListener('change', resetMouse);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('blur', resetMouse);
      finePointer.removeEventListener('change', resetMouse);
    };
  }, [reducedMotion]);

  const contextValue: EnvironmentContextType = {
    cameraRef,
    activeSection,
  };

  return <EnvironmentContext.Provider value={contextValue}>{children}</EnvironmentContext.Provider>;
}
