import { useEffect, useRef, useState } from 'react';
import './CosmicMeshBackground.css';
import { useSystemReducedMotion } from '../../../hooks/useSystemReducedMotion';
import { scheduleAfterIdle } from '../../../lib/scheduleAfterIdle';
import { useEnvironment } from '../EnvironmentContext';

const vertexShaderSource = `
  attribute vec2 a_position;
  varying vec2 v_uv;

  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision mediump float;

  varying vec2 v_uv;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec2 u_camera;
  uniform float u_fold;

  float hash(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p.x + p.y) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 3; i++) {
      value += noise(p) * amplitude;
      p = p * 2.03 + vec2(13.7, 8.1);
      amplitude *= 0.5;
    }
    return value;
  }

  vec3 atmosphere(vec2 p, float t) {
    vec2 drift = vec2(t * 0.012, -t * 0.009);
    float warp = fbm(p * 1.8 + drift);
    vec2 warped = p + vec2(warp - 0.4, sin(p.x * 2.1 + t * 0.025) * 0.11);
    float clouds = fbm(warped * 3.2 - drift * 0.65);
    float veil = fbm(warped * 2.1 + vec2(5.2, 1.8) + drift.yx);
    float filaments = fbm(warped * 6.0 + vec2(clouds, veil));
    float bandDistance = (p.y + sin(p.x * 1.7) * 0.24) * 2.5;
    float band = exp(-bandDistance * bandDistance);
    float density = smoothstep(0.24, 0.72, clouds) * band;
    float violet = smoothstep(0.28, 0.7, veil) * (0.4 + band * 0.6);
    float cyan = smoothstep(0.46, 0.73, filaments) * density;
    float dustLane = smoothstep(0.34, 0.66, filaments) * density;
    vec3 color = vec3(0.0314, 0.051, 0.106);
    color += vec3(0.12, 0.21, 0.51) * density * 0.48;
    color += vec3(0.32, 0.20, 0.49) * violet * 0.2;
    color += vec3(0.20, 0.62, 0.72) * cyan * 0.24;
    color *= 1.0 - dustLane * 0.25;
    return color;
  }

  void main() {
    vec2 uv = v_uv;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 screen = (uv - 0.5) * vec2(aspect, 1.0);
    vec2 center = vec2(aspect < 0.9 ? -0.015 : 0.12, 0.04);
    vec2 relative = screen - center;
    float formation = smoothstep(1.5, 2.4, u_fold);
    float opening = smoothstep(2.4, 3.2, u_fold);
    float gravity = smoothstep(0.0, 0.7, u_fold) * (1.0 - opening);
    float radius = length(relative);
    // Deflect the sampled sky, not a circle painted on top of it.
    vec2 lensAxis = relative * vec2(0.85, 1.3);
    vec2 deflection = (relative * vec2(1.0, 0.72) + vec2(0.025, -0.008)) /
      (dot(lensAxis, lensAxis) + 0.035);
    vec2 p = screen + u_camera + deflection * gravity * 0.035;
    float t = u_time;
    vec3 color = vec3(0.0314, 0.051, 0.106);
    float atmosphereReveal = smoothstep(1.9, 2.5, u_fold);
    if (atmosphereReveal > 0.0) {
      color = mix(color, atmosphere(p, t), atmosphereReveal);
    }
    float vignette = smoothstep(0.2, 1.0, length((uv - 0.5) * vec2(0.9, 0.7)));
    color = mix(color, vec3(0.0314, 0.051, 0.106), vignette * 0.45);
    if (u_fold < 3.2) {
      color = mix(vec3(0.0314, 0.051, 0.106), color, 0.12 + opening * 0.88);
      float travel = smoothstep(0.7, 2.4, u_fold);
      float scale = mix(0.48, aspect < 0.9 ? 2.5 : 3.6, formation);
      vec3 origin = vec3(0.14 * travel, -0.08 * travel, 2.8 - travel * 0.9);
      vec3 ray = normalize(vec3(relative * 2.0, -1.65));
      ray.xy -= deflection * gravity * 0.04;
      ray = normalize(ray);
      vec3 emission = vec3(0.0);
      vec3 normal = vec3(0.3198, -0.7098, 0.62);
      float incidence = min(-0.08, dot(ray, normal));
      float intersection = -dot(origin, normal) / incidence;
      // Eight stratified depth slices of a tilted, corrugated spiral volume.
      // No textures, dynamic loops, or additional render passes.
      for (int i = 0; i < 8; i++) {
        float distance = intersection + (float(i) - 3.5) * 0.075 * scale;
        vec3 point = (origin + ray * distance) / scale;
        point.xy = mat2(0.91, -0.41, 0.41, 0.91) * point.xy;
        point.yz = mat2(0.62, -0.78, 0.78, 0.62) * point.yz;
        float r = length(point.xy) + 0.035;
        float angle = atan(point.y, point.x);
        float spiral = angle * 2.0 + log(r) * 5.2 - travel * 1.7;
        float arm = pow(0.5 + 0.5 * sin(spiral), 7.0);
        float corrugation = sin(angle * 3.0 + r * 9.0 - t * 0.4) * 0.055;
        float slab = exp(-abs(point.z + corrugation) * 8.0);
        float grain = 0.72 + 0.28 * sin(r * 65.0 + angle * 11.0 + float(i) * 1.7);
        float envelope = exp(-r * 1.6) * smoothstep(0.07, 0.24, r);
        float density = slab * envelope * (0.12 + arm * 1.5) * grain;
        float nearSide = 0.65 + smoothstep(-0.4, 0.7, point.x) * 0.7;
        vec3 light = mix(vec3(0.48, 0.29, 0.72), vec3(0.22, 0.4, 0.8),
          0.5 + 0.3 * sin(angle * 1.6 + point.z * 4.0));
        light = mix(light, vec3(0.38, 0.86, 0.96), pow(arm, 4.0) * 0.16);
        emission += light * density * nearSide * 0.55;
      }
      float shadow = exp(-radius * radius / (0.003 + formation * 0.013));
      color *= 1.0 - shadow * gravity * (1.0 - formation) * 0.85;
      color += emission * gravity * (1.0 - opening);
    }
    gl_FragColor = vec4(color, 1.0);
  }
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Could not allocate a cosmic mesh shader.');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const details = gl.getShaderInfoLog(shader) ?? 'Unknown shader compilation error.';
    gl.deleteShader(shader);
    throw new Error(details);
  }
  return shader;
}

type CosmicMeshBackgroundProps = {
  paused?: boolean;
};

export default function CosmicMeshBackground({ paused = false }: CosmicMeshBackgroundProps) {
  const backgroundRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedEffects = useSystemReducedMotion();
  const { cameraRef } = useEnvironment();
  const [readyGeneration, setReadyGeneration] = useState(0);
  const generationRef = useRef(0);

  useEffect(() => {
    const updateVisibility = () => {
      if (backgroundRef.current)
        backgroundRef.current.dataset.paused = String(paused || reducedEffects || document.hidden);
    };
    updateVisibility();
    document.addEventListener('visibilitychange', updateVisibility);
    return () => document.removeEventListener('visibilitychange', updateVisibility);
  }, [paused, reducedEffects]);

  useEffect(() => {
    const generation = ++generationRef.current;
    const background = backgroundRef.current;
    if (paused || reducedEffects) {
      if (background) {
        background.dataset.mode = 'static';
        if (canvasRef.current) canvasRef.current.dataset.ready = 'static';
      }
      return;
    }

    let active = true;
    let cancelScheduledInitialization: (() => void) | undefined;
    const scheduleInitialization = () => {
      if (!active || cancelScheduledInitialization) return;
      if (window.__STELLAR_FOLD__?.active) {
        setReadyGeneration(generation);
        return;
      }
      cancelScheduledInitialization = scheduleAfterIdle(
        () => {
          if (active) setReadyGeneration(generation);
        },
        { timeout: 1400, fallbackDelay: 180 },
      );
    };
    scheduleInitialization();
    return () => {
      active = false;
      cancelScheduledInitialization?.();
    };
  }, [paused, reducedEffects]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (paused || reducedEffects) {
      canvas.dataset.ready = 'static';
      if (backgroundRef.current) backgroundRef.current.dataset.mode = 'static';
      return;
    }
    if (readyGeneration !== generationRef.current) return;

    let gl: WebGLRenderingContext | null = null;
    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;
    let frame = 0;
    let elapsed = 0;
    let previousFrame = 0;
    const reducedMotion = reducedEffects;
    let disposed = false;
    let contextLost = false;
    let vertexShader: WebGLShader | null = null;
    let fragmentShader: WebGLShader | null = null;

    try {
      gl = canvas.getContext('webgl', {
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: 'low-power',
        premultipliedAlpha: true,
      });
      if (!gl) throw new Error('WebGL is unavailable.');

      vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
      fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
      program = gl.createProgram();
      if (!program) throw new Error('Could not allocate a cosmic mesh program.');
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      vertexShader = null;
      fragmentShader = null;
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) ?? 'Unknown shader link error.');
      }

      buffer = gl.createBuffer();
      if (!buffer) throw new Error('Could not allocate the cosmic mesh geometry.');
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      gl.useProgram(program);
      const position = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), 1, 1);
      gl.clearColor(0, 0, 0, 0);
    } catch (error) {
      console.warn('Cosmic mesh WebGL setup failed; using its CSS background.', error);
      if (vertexShader && gl) gl.deleteShader(vertexShader);
      if (fragmentShader && gl) gl.deleteShader(fragmentShader);
      if (program && gl) gl.deleteProgram(program);
      if (buffer && gl) gl.deleteBuffer(buffer);
      const mode = reducedMotion ? 'static' : 'fallback';
      canvas.dataset.ready = mode;
      if (backgroundRef.current) backgroundRef.current.dataset.mode = mode;
      window.dispatchEvent(new Event('stellar-fold-failed'));
      return;
    }

    const context = gl;
    const shaderProgram = program;
    const geometry = buffer;
    const resolutionUniform = context.getUniformLocation(shaderProgram, 'u_resolution');
    const timeUniform = context.getUniformLocation(shaderProgram, 'u_time');
    const cameraUniform = context.getUniformLocation(shaderProgram, 'u_camera');
    const foldUniform = context.getUniformLocation(shaderProgram, 'u_fold');
    let cameraX = 0;
    let cameraY = 0;
    let lastDrawAt = 0;
    let painted = false;
    let qualityScale = 1;
    let framePressure = 0;
    let lastTickAt = 0;

    const resize = () => {
      if (disposed || contextLost) return;
      const bounds = canvas.getBoundingClientRect();
      const mobile =
        typeof window.matchMedia === 'function'
          ? window.matchMedia('(max-width: 768px)').matches
          : false;
      const quality = mobile ? 0.6 : 0.65;
      const pixelRatio =
        Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.25) * quality * qualityScale;
      canvas.width = Math.max(1, Math.round(bounds.width * pixelRatio));
      canvas.height = Math.max(1, Math.round(bounds.height * pixelRatio));
      canvas.dataset.quality = pixelRatio.toFixed(2);
      context.viewport(0, 0, canvas.width, canvas.height);
      context.uniform2f(resolutionUniform, canvas.width, canvas.height);
      context.clear(context.COLOR_BUFFER_BIT);
    };

    const render = () => {
      if (disposed || contextLost || document.hidden || reducedMotion) return;
      context.clear(context.COLOR_BUFFER_BIT);
      context.uniform1f(timeUniform, elapsed);
      context.uniform1f(
        foldUniform,
        window.__STELLAR_FOLD__?.active ? window.__STELLAR_FOLD__.elapsed / 1000 : 3.2,
      );
      cameraX += (cameraRef.current.parallaxOffsetX * 0.7 - cameraX) * 0.08;
      cameraY +=
        (cameraRef.current.scrollProgress * 0.14 + cameraRef.current.parallaxOffsetY - cameraY) *
        0.06;
      context.uniform2f(cameraUniform, cameraX, cameraY);
      context.drawArrays(context.TRIANGLES, 0, 3);
      canvas.dataset.ready = 'true';
      if (!painted) {
        painted = true;
        window.dispatchEvent(new Event('stellar-fold-painted'));
      }
      const fold = window.__STELLAR_FOLD__;
      if (fold?.active && fold.elapsed >= 3200 && !(fold.settled & 1)) {
        fold.settled |= 1;
        window.dispatchEvent(new Event('stellar-fold-settled'));
      }
    };

    const animate = (now: number) => {
      if (disposed || contextLost || document.hidden || reducedMotion) return;
      const mobile = window.innerWidth <= 768;
      const fold = window.__STELLAR_FOLD__;
      let resized = false;
      if (fold?.active && lastTickAt) {
        framePressure =
          now - lastTickAt > 26 ? framePressure + 1 : Math.max(0, framePressure - 0.5);
        if (framePressure >= 6 && qualityScale > 0.6) {
          qualityScale = Math.max(0.6, qualityScale * 0.8);
          framePressure = 0;
          resize();
          resized = true;
        }
      } else if (!fold?.active && qualityScale < 1) {
        qualityScale = 1;
        resize();
        resized = true;
      }
      lastTickAt = now;
      const targetFrameTime = 1000 / (fold?.active ? 30 : mobile ? 20 : 24);
      const delta = now - previousFrame;
      if (!resized && previousFrame && delta < targetFrameTime - 0.5) {
        frame = window.requestAnimationFrame(animate);
        return;
      }
      if (fold?.active) elapsed = fold.elapsed / 1000;
      else if (lastDrawAt) elapsed += Math.min(now - lastDrawAt, 100) / 1000;
      lastDrawAt = now;
      previousFrame = previousFrame
        ? previousFrame + Math.max(1, Math.floor((delta + 0.5) / targetFrameTime)) * targetFrameTime
        : now;
      render();
      if (fold?.active && fold.elapsed >= 3200) return;
      frame = window.requestAnimationFrame(animate);
    };

    const start = () => {
      window.cancelAnimationFrame(frame);
      previousFrame = 0;
      lastDrawAt = 0;
      lastTickAt = 0;
      if (!reducedMotion && !document.hidden && !contextLost && inViewport) {
        frame = window.requestAnimationFrame(animate);
      }
    };

    const onVisibilityChange = () => start();
    const onContextLost = (event: Event) => {
      event.preventDefault();
      contextLost = true;
      window.cancelAnimationFrame(frame);
      canvas.dataset.ready = 'fallback';
      if (backgroundRef.current) backgroundRef.current.dataset.mode = 'fallback';
      console.warn('Cosmic mesh context was lost; using the CSS sky until restoration.');
      window.dispatchEvent(new Event('stellar-fold-failed'));
    };
    const onContextRestored = () => {
      if (!disposed) setReadyGeneration(++generationRef.current);
    };

    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
    let inViewport = true;
    const intersectionObserver =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver((entries) => {
            const entry = entries.find((item) => item.target === canvas);
            if (!entry || inViewport === entry.isIntersecting) return;
            inViewport = entry.isIntersecting;
            start();
          });
    resizeObserver?.observe(canvas);
    intersectionObserver?.observe(canvas);
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('cosmic-intro-complete', start);
    canvas.addEventListener('webglcontextlost', onContextLost);
    canvas.addEventListener('webglcontextrestored', onContextRestored);
    resize();
    canvas.dataset.ready = reducedMotion ? 'static' : 'true';
    if (backgroundRef.current) {
      backgroundRef.current.dataset.mode = reducedMotion ? 'static' : 'active';
    }
    start();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('cosmic-intro-complete', start);
      intersectionObserver?.disconnect();
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      // Context loss already invalidates these handles, even after restoration.
      if (!contextLost) {
        context.deleteBuffer(geometry);
        context.deleteProgram(shaderProgram);
      }
    };
  }, [cameraRef, paused, reducedEffects, readyGeneration]);

  return (
    <div
      ref={backgroundRef}
      className="cosmic-mesh-background"
      data-mode="static"
      aria-hidden="true"
    >
      <div className="cosmic-mesh-fallback" />
      <canvas ref={canvasRef} className="cosmic-mesh-canvas" />
    </div>
  );
}
