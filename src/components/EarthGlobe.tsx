import { useEffect, useRef, useState } from 'react';
import {
  AdditiveBlending,
  AmbientLight,
  BackSide,
  Color,
  DirectionalLight,
  Mesh,
  MeshPhongMaterial,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  WebGLRenderer,
  PerspectiveCamera,
} from 'three';

type EarthGlobeProps = {
  lit: boolean;
  reduceMotion: boolean;
};

export default function EarthGlobe({ lit, reduceMotion }: EarthGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webGlUnavailable, setWebGlUnavailable] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
      });
    } catch (error) {
      console.error('WebGL is unavailable for the Earth visualization.', error);
      setWebGlUnavailable(true);
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const scene = new Scene();
    const camera = new PerspectiveCamera(34, 1, 0.1, 20);
    camera.position.z = 3.25;
    scene.add(new AmbientLight(0xa7c9ff, 1.35));

    const sunlight = new DirectionalLight(0xffffff, 3.1);
    sunlight.position.set(-3, 2, 4);
    scene.add(sunlight);

    const geometry = new SphereGeometry(1, 72, 56);
    const material = new MeshPhongMaterial({
      color: 0xd9efff,
      shininess: 10,
      specular: new Color(0x183d68),
    });
    const earth = new Mesh(geometry, material);
    earth.rotation.x = 0.06;
    scene.add(earth);

    const atmosphere = new Mesh(
      new SphereGeometry(1.055, 64, 48),
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        side: BackSide,
        vertexShader: `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vNormal;
          void main() {
            float rim = pow(0.72 - dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 3.0);
            gl_FragColor = vec4(0.18, 0.55, 1.0, clamp(rim, 0.0, 0.58));
          }
        `,
      }),
    );
    scene.add(atmosphere);

    let frame = 0;
    let texture: Texture | null = null;
    let disposed = false;
    let draw = () => renderer.render(scene, camera);
    new TextureLoader().load(
      `${import.meta.env.BASE_URL}images/earth-blue-marble.jpg`,
      (loadedTexture) => {
        if (disposed) {
          loadedTexture.dispose();
          return;
        }
        texture = loadedTexture;
        texture.colorSpace = SRGBColorSpace;
        material.map = texture;
        material.needsUpdate = true;
        draw();
      },
      undefined,
      (error) => {
        if (disposed) return;
        console.error('The local Earth texture could not be loaded.', error);
        window.cancelAnimationFrame(frame);
        setWebGlUnavailable(true);
      },
    );

    let previousFrame = 0;
    draw = () => renderer.render(scene, camera);
    const animate = (time: number) => {
      if (disposed) return;
      if (previousFrame) earth.rotation.y += Math.min(time - previousFrame, 60) * 0.000012;
      previousFrame = time;
      draw();
      frame = window.requestAnimationFrame(animate);
    };
    const resizeEarth = () => {
      if (disposed) return;
      const { width, height } = container.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      draw();
    };
    const observerConstructor = Reflect.get(globalThis, 'ResizeObserver') as
      (new (callback: ResizeObserverCallback) => ResizeObserver) | undefined;
    const resizeObserver = observerConstructor ? new observerConstructor(resizeEarth) : undefined;
    resizeObserver?.observe(container);
    window.addEventListener('resize', resizeEarth);
    resizeEarth();
    const motionQuery =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;
    let motionReduced = reduceMotion || Boolean(motionQuery?.matches);
    if (motionReduced) draw();
    else frame = window.requestAnimationFrame(animate);

    const onMotionPreferenceChange = (event: MediaQueryListEvent) => {
      motionReduced = event.matches;
      window.cancelAnimationFrame(frame);
      if (motionReduced || document.hidden) {
        draw();
        return;
      }
      previousFrame = 0;
      frame = window.requestAnimationFrame(animate);
    };
    const onVisibilityChange = () => {
      window.cancelAnimationFrame(frame);
      if (document.hidden || motionReduced) {
        draw();
        return;
      }
      previousFrame = 0;
      frame = window.requestAnimationFrame(animate);
    };
    motionQuery?.addEventListener('change', onMotionPreferenceChange);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      motionQuery?.removeEventListener('change', onMotionPreferenceChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', resizeEarth);
      texture?.dispose();
      geometry.dispose();
      material.dispose();
      atmosphere.geometry.dispose();
      (atmosphere.material as ShaderMaterial).dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [reduceMotion]);

  return (
    <div
      ref={containerRef}
      className={`earth-renderer${webGlUnavailable ? ' is-fallback' : ''}`}
      data-lit={lit}
      data-reduced-motion={reduceMotion}
      aria-hidden="true"
    />
  );
}
