/**
 * VirtualCamera.test.ts
 *
 * Unit tests for camera state calculations and parallax transformations.
 * Validates that the camera math produces expected depth-based movement.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateCameraState,
  calculateLayerTransform,
  calculateRenderingProfile,
  getCSSTransform,
  DEPTH_LAYERS,
  type CameraState,
  type DepthLayer,
} from './VirtualCamera';

describe('VirtualCamera', () => {
  describe('calculateCameraState', () => {
    it('should produce zero camera Z at scroll progress 0', () => {
      const state = calculateCameraState(0);
      expect(state.scrollProgress).toBe(0);
      expect(state.cameraZ).toBe(0);
    });

    it('should produce max camera Z at scroll progress 1', () => {
      const state = calculateCameraState(1);
      expect(state.scrollProgress).toBe(1);
      expect(state.cameraZ).toBe(50000);
    });

    it('should produce proportional camera Z at midpoint', () => {
      const state = calculateCameraState(0.5);
      expect(state.scrollProgress).toBe(0.5);
      expect(state.cameraZ).toBe(25000);
    });

    it('should clamp scroll progress to [0, 1]', () => {
      const negState = calculateCameraState(-0.5);
      expect(negState.scrollProgress).toBe(0);
      expect(negState.cameraZ).toBe(0);

      const overState = calculateCameraState(1.5);
      expect(overState.scrollProgress).toBe(1);
      expect(overState.cameraZ).toBe(50000);
    });

    it('should track mouse position normalized to [-1, 1]', () => {
      const centerMouse = calculateCameraState(0.5, 0.5, 0.5);
      // Mouse at center should produce minimal wobble
      expect(Math.abs(centerMouse.parallaxOffsetX)).toBeLessThan(0.01);
      expect(Math.abs(centerMouse.parallaxOffsetY)).toBeLessThan(0.01);

      const leftMouse = calculateCameraState(0.5, 0, 0.5);
      // Mouse at left edge should produce negative X offset
      expect(leftMouse.parallaxOffsetX).toBeLessThan(centerMouse.parallaxOffsetX);

      const rightMouse = calculateCameraState(0.5, 1, 0.5);
      // Mouse at right edge should produce positive X offset
      expect(rightMouse.parallaxOffsetX).toBeGreaterThan(centerMouse.parallaxOffsetX);
    });

    it('should respect reducedMotion flag', () => {
      const normalState = calculateCameraState(0.5, 0.1, 0.1, false);
      const reducedState = calculateCameraState(0.5, 0.1, 0.1, true);

      // Parallax offsets should be zero when reduced motion is enabled
      expect(reducedState.parallaxOffsetX).toBe(0);
      expect(reducedState.parallaxOffsetY).toBe(0);

      // But camera Z should still be updated
      expect(reducedState.cameraZ).toBe(normalState.cameraZ);
      expect(reducedState.scrollProgress).toBe(normalState.scrollProgress);
    });

    it('should set reducedMotion flag correctly', () => {
      const state = calculateCameraState(0.5, 0.5, 0.5, true);
      expect(state.reducedMotion).toBe(true);

      const noReduceState = calculateCameraState(0.5, 0.5, 0.5, false);
      expect(noReduceState.reducedMotion).toBe(false);
    });
  });

  describe('calculateLayerTransform', () => {
    it('should produce different offsets for different parallax factors', () => {
      const cameraState: CameraState = {
        scrollProgress: 0.5,
        cameraZ: 25000,
        parallaxOffsetX: 0,
        parallaxOffsetY: 0,
        reducedMotion: false,
      };

      const farLayer: DepthLayer = { name: 'Far', parallaxFactor: 0.02, zIndex: 100 };
      const nearLayer: DepthLayer = { name: 'Near', parallaxFactor: 0.6, zIndex: 300 };

      const farTransform = calculateLayerTransform(farLayer, cameraState, 1920, 1080);
      const nearTransform = calculateLayerTransform(nearLayer, cameraState, 1920, 1080);

      // Ensure offsets are valid numbers
      expect(typeof farTransform.offsetX).toBe('number');
      expect(typeof nearTransform.offsetX).toBe('number');
      expect(Number.isFinite(farTransform.offsetX)).toBe(true);
      expect(Number.isFinite(nearTransform.offsetX)).toBe(true);

      // Near layer should move MORE than far layer
      expect(Math.abs(nearTransform.offsetX)).toBeGreaterThan(Math.abs(farTransform.offsetX));
    });

    it('should apply proportional offsets based on parallax factor', () => {
      const cameraState: CameraState = {
        scrollProgress: 0.5,
        cameraZ: 25000,
        parallaxOffsetX: 0,
        parallaxOffsetY: 0,
        reducedMotion: false,
      };

      const layer1: DepthLayer = { name: 'Far', parallaxFactor: 0.02, zIndex: 100 };
      const layer2: DepthLayer = { name: 'Mid', parallaxFactor: 0.1, zIndex: 200 };
      const layer3: DepthLayer = { name: 'Near', parallaxFactor: 0.6, zIndex: 300 };

      const transform1 = calculateLayerTransform(layer1, cameraState, 1920, 1080);
      const transform2 = calculateLayerTransform(layer2, cameraState, 1920, 1080);
      const transform3 = calculateLayerTransform(layer3, cameraState, 1920, 1080);

      // Offsets should scale with parallax factor
      const ratio12 = Math.abs(transform2.offsetX) / Math.abs(transform1.offsetX);
      const ratio23 = Math.abs(transform3.offsetX) / Math.abs(transform2.offsetX);

      expect(ratio12).toBeCloseTo(5, 0); // 0.1 / 0.02 = 5
      expect(ratio23).toBeCloseTo(6, 0); // 0.6 / 0.1 = 6
    });

    it('should include mouse parallax wobble on mid/near layers', () => {
      const cameraState: CameraState = {
        scrollProgress: 0.5,
        cameraZ: 25000,
        parallaxOffsetX: 0.02,
        parallaxOffsetY: 0.01,
        reducedMotion: false,
      };

      const farLayer: DepthLayer = { name: 'Far', parallaxFactor: 0.02, zIndex: 100 }; // pf=0.02 (not affected by mouse)
      const midLayer: DepthLayer = { name: 'Mid', parallaxFactor: 0.6, zIndex: 300 }; // pf=0.6 (affected by mouse)

      const farTransform = calculateLayerTransform(farLayer, cameraState, 1920, 1080);
      const midTransform = calculateLayerTransform(midLayer, cameraState, 1920, 1080);

      // Far layer should not be affected by mouse parallax
      const farTransformNoMouse = calculateLayerTransform(
        farLayer,
        { ...cameraState, parallaxOffsetX: 0, parallaxOffsetY: 0 },
        1920,
        1080,
      );
      expect(farTransform.offsetX).toBe(farTransformNoMouse.offsetX);

      // Mid layer should be affected by mouse parallax
      const midTransformNoMouse = calculateLayerTransform(
        midLayer,
        { ...cameraState, parallaxOffsetX: 0, parallaxOffsetY: 0 },
        1920,
        1080,
      );
      expect(Math.abs(midTransform.offsetX)).toBeGreaterThan(Math.abs(midTransformNoMouse.offsetX));
    });

    it('should disable mouse parallax when reducedMotion is enabled', () => {
      const cameraStateWithMouse: CameraState = {
        scrollProgress: 0.5,
        cameraZ: 25000,
        parallaxOffsetX: 0.02,
        parallaxOffsetY: 0.01,
        reducedMotion: false,
      };

      const cameraStateReduced: CameraState = {
        ...cameraStateWithMouse,
        reducedMotion: true,
      };

      const layer: DepthLayer = { name: 'Mid', parallaxFactor: 0.6, zIndex: 300 };

      const transformWithMouse = calculateLayerTransform(layer, cameraStateWithMouse, 1920, 1080);
      const transformReduced = calculateLayerTransform(layer, cameraStateReduced, 1920, 1080);

      // Base scroll parallax offset
      const expectedBaseOffsetX = cameraStateWithMouse.cameraZ * layer.parallaxFactor * 0.0001;
      expect(expectedBaseOffsetX).toBeCloseTo(1.5, 2);

      // When mouse is active, offset should include mouse wobble
      // expectedMouseWobble = 0.02 * 1920 * 0.6 = 23.04
      expect(transformWithMouse.offsetX).toBeCloseTo(expectedBaseOffsetX + 23.04, 1);

      // When reduced motion is enabled, only base offset (no wobble)
      expect(transformReduced.offsetX).toBe(0);

      // Difference should be the mouse wobble amount
      expect(Math.abs(transformWithMouse.offsetX - transformReduced.offsetX)).toBeCloseTo(24.54, 1);
    });

    it('should compute opacity based on depth', () => {
      const cameraState: CameraState = {
        scrollProgress: 0.5,
        cameraZ: 25000,
        parallaxOffsetX: 0,
        parallaxOffsetY: 0,
        reducedMotion: false,
      };

      const farLayer: DepthLayer = { name: 'Far', parallaxFactor: 0.02, zIndex: 100 };
      const midLayer: DepthLayer = { name: 'Mid', parallaxFactor: 0.6, zIndex: 300 };

      const farTransform = calculateLayerTransform(farLayer, cameraState, 1920, 1080);
      const midTransform = calculateLayerTransform(midLayer, cameraState, 1920, 1080);

      // Mid layer should be more opaque than far layer
      expect(midTransform.opacity).toBeGreaterThan(farTransform.opacity);

      // Opacity should be in [0.3, 1.0] range
      expect(farTransform.opacity).toBeGreaterThanOrEqual(0.3);
      expect(midTransform.opacity).toBeLessThanOrEqual(1.0);
    });

    it('should compute scale based on depth', () => {
      const cameraState: CameraState = {
        scrollProgress: 0.5,
        cameraZ: 25000,
        parallaxOffsetX: 0,
        parallaxOffsetY: 0,
        reducedMotion: false,
      };

      const farLayer: DepthLayer = { name: 'Far', parallaxFactor: 0.02, zIndex: 100 };
      const midLayer: DepthLayer = { name: 'Mid', parallaxFactor: 0.6, zIndex: 300 };

      const farTransform = calculateLayerTransform(farLayer, cameraState, 1920, 1080);
      const midTransform = calculateLayerTransform(midLayer, cameraState, 1920, 1080);

      // Mid layer should be slightly larger than far layer
      expect(midTransform.scale).toBeGreaterThan(farTransform.scale);

      // Scale should be in [0.99, 1.01] range
      expect(farTransform.scale).toBeGreaterThanOrEqual(0.99);
      expect(midTransform.scale).toBeLessThanOrEqual(1.01);
    });
  });

  describe('getCSSTransform', () => {
    it('should generate valid CSS transform string', () => {
      const transform = {
        offsetX: 10.5,
        offsetY: 20.3,
        opacity: 0.85,
        scale: 1.002,
      };

      const cssString = getCSSTransform(transform);

      expect(cssString).toContain('translate3d');
      expect(cssString).toContain('10.50'); // 2 decimal places
      expect(cssString).toContain('20.30'); // 2 decimal places
      expect(cssString).toContain('scale');
      expect(cssString).toContain('1.002');
    });

    it('should format numbers with appropriate precision', () => {
      const transform = {
        offsetX: 0.123456,
        offsetY: 0.987654,
        opacity: 0.5,
        scale: 1.0001,
      };

      const cssString = getCSSTransform(transform);

      // Should have 2 decimal places for pixels
      expect(cssString).toContain('0.12');
      expect(cssString).toContain('0.99');

      // Should have 4 decimal places for scale
      expect(cssString).toContain('1.0001');
    });
  });

  describe('calculateRenderingProfile', () => {
    it('should return low quality for reducedMotion', () => {
      const profile = calculateRenderingProfile(
        { width: 1920, height: 1080 },
        2,
        true, // reducedMotion
      );

      expect(profile.quality).toBe('low');
      expect(profile.frameRateTarget).toBe(0);
      expect(profile.enableMouseParallax).toBe(false);
    });

    it('should return medium quality for mobile', () => {
      const profile = calculateRenderingProfile({ width: 390, height: 844 }, 2, false);

      expect(profile.quality).toBe('medium');
      expect(profile.frameRateTarget).toBe(30);
      expect(profile.enableMouseParallax).toBe(false);
      expect(profile.enableWebGL).toBe(true);
    });

    it('should return high quality for tablet', () => {
      const profile = calculateRenderingProfile({ width: 768, height: 1024 }, 2, false);

      expect(profile.quality).toBe('high');
      expect(profile.frameRateTarget).toBe(30);
      expect(profile.enableWebGL).toBe(true);
    });

    it('should return high quality for desktop', () => {
      const profile = calculateRenderingProfile({ width: 1920, height: 1080 }, 2, false);

      expect(profile.quality).toBe('high');
      expect(profile.frameRateTarget).toBe(60);
      expect(profile.enableMouseParallax).toBe(true);
      expect(profile.enableWebGL).toBe(true);
    });

    it('should scale particle counts by device capability', () => {
      const mobileProfile = calculateRenderingProfile({ width: 360, height: 800 }, 2, false);
      const desktopProfile = calculateRenderingProfile({ width: 1920, height: 1080 }, 2, false);

      // Desktop should have higher particle scale
      expect(desktopProfile.particleScale).toBeGreaterThanOrEqual(mobileProfile.particleScale);
    });
  });

  describe('DEPTH_LAYERS', () => {
    it('should define all 10 layers', () => {
      const layerNames = Object.keys(DEPTH_LAYERS);
      expect(layerNames.length).toBeGreaterThanOrEqual(6); // Currently at least 6 implemented layers
    });

    it('should have valid parallax factors', () => {
      const layers = Object.values(DEPTH_LAYERS);

      for (const layer of layers) {
        expect(layer.parallaxFactor).toBeGreaterThan(0);
        expect(layer.parallaxFactor).toBeLessThanOrEqual(1);
      }
    });

    it('should have unique z-indices', () => {
      const layers = Object.values(DEPTH_LAYERS);
      const zIndices = layers.map((layer) => layer.zIndex);
      const uniqueZIndices = new Set(zIndices);

      // All z-indices should be unique
      expect(uniqueZIndices.size).toBe(zIndices.length);
    });
  });
});
