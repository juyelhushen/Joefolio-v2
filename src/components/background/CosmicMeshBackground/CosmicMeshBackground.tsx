import { useEffect, useRef } from 'react';
import './CosmicMeshBackground.css';

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

  void main() {
    vec2 uv = v_uv;
    vec2 p = (uv - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);
    float t = u_time;
    vec2 slowDrift = vec2(t * 0.032, -t * 0.024);
    float warpA = fbm(p * 1.25 + slowDrift);
    float warpB = fbm(p * 1.7 - slowDrift.yx + vec2(4.3, -2.1));
    vec2 warped = p + (vec2(warpA, warpB) - 0.5) * 0.72;

    float blueField = fbm(warped * 1.55 + vec2(-0.42, 0.12) + slowDrift * 0.8);
    float cyanField = fbm(warped * 1.9 + vec2(0.56, -0.2) - slowDrift.yx * 1.1);
    float violetField = fbm(warped * 1.35 + vec2(0.05, 0.58) + slowDrift.yx * 0.7);
    float amberField = fbm(warped * 2.1 + vec2(-0.12, -0.62) + slowDrift * 0.45);

    vec3 color = vec3(0.012, 0.022, 0.055);
    float edgeFade = 1.0 - smoothstep(0.18, 0.95, length((uv - 0.5) * vec2(1.05, 0.9)));
    float blue = smoothstep(0.43, 0.79, blueField) * 0.58 * edgeFade;
    float cyan = smoothstep(0.57, 0.88, cyanField) * 0.23 * edgeFade;
    float violet = smoothstep(0.53, 0.83, violetField) * 0.31 * edgeFade;
    float amber = smoothstep(0.72, 0.94, amberField) * 0.09 * edgeFade;

    color += vec3(0.10, 0.27, 0.58) * blue;
    color += vec3(0.10, 0.43, 0.54) * cyan;
    color += vec3(0.25, 0.16, 0.48) * violet;
    color += vec3(0.50, 0.22, 0.09) * amber;

    float luminance = max(max(color.r, color.g), color.b);
    float alpha = clamp(luminance * 2.4, 0.0, 0.62);
    gl_FragColor = vec4(color, alpha);
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

export default function CosmicMeshBackground() {
  const backgroundRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const motionQuery =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;

    let gl: WebGLRenderingContext | null = null;
    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;
    let frame = 0;
    let elapsed = 0;
    let previousFrame = 0;
    let reducedMotion = Boolean(motionQuery?.matches);
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
      if (gl) console.warn('Cosmic mesh WebGL setup failed; using its CSS background.', error);
      if (vertexShader && gl) gl.deleteShader(vertexShader);
      if (fragmentShader && gl) gl.deleteShader(fragmentShader);
      if (program && gl) gl.deleteProgram(program);
      if (buffer && gl) gl.deleteBuffer(buffer);
      const mode = reducedMotion ? 'static' : 'fallback';
      canvas.dataset.ready = mode;
      if (backgroundRef.current) backgroundRef.current.dataset.mode = mode;
      return;
    }

    const context = gl;
    const shaderProgram = program;
    const geometry = buffer;

    const resize = () => {
      if (disposed || contextLost) return;
      const bounds = canvas.getBoundingClientRect();
      const mobile =
        typeof window.matchMedia === 'function'
          ? window.matchMedia('(max-width: 700px)').matches
          : false;
      const quality = mobile ? 0.56 : 0.68;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.35) * quality;
      canvas.width = Math.max(1, Math.round(bounds.width * pixelRatio));
      canvas.height = Math.max(1, Math.round(bounds.height * pixelRatio));
      context.viewport(0, 0, canvas.width, canvas.height);
      context.uniform2f(
        context.getUniformLocation(shaderProgram, 'u_resolution'),
        canvas.width,
        canvas.height,
      );
      context.clear(context.COLOR_BUFFER_BIT);
    };

    const render = () => {
      if (disposed || contextLost || document.hidden || reducedMotion) return;
      context.clear(context.COLOR_BUFFER_BIT);
      context.uniform1f(context.getUniformLocation(shaderProgram, 'u_time'), elapsed);
      context.drawArrays(context.TRIANGLES, 0, 3);
      canvas.dataset.ready = 'true';
    };

    const animate = (now: number) => {
      if (disposed || contextLost || document.hidden || reducedMotion) return;
      if (previousFrame && now - previousFrame < 33) {
        frame = window.requestAnimationFrame(animate);
        return;
      }
      if (previousFrame) elapsed += Math.min(now - previousFrame, 50) / 1000;
      previousFrame = now;
      render();
      frame = window.requestAnimationFrame(animate);
    };

    const start = () => {
      window.cancelAnimationFrame(frame);
      previousFrame = 0;
      if (!reducedMotion && !document.hidden && !contextLost) {
        frame = window.requestAnimationFrame(animate);
      }
    };

    const onMotionChange = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches;
      canvas.dataset.ready = reducedMotion ? 'static' : 'true';
      if (backgroundRef.current) {
        backgroundRef.current.dataset.mode = reducedMotion ? 'static' : 'active';
      }
      start();
    };
    const onVisibilityChange = () => start();
    const onContextLost = (event: Event) => {
      event.preventDefault();
      contextLost = true;
      window.cancelAnimationFrame(frame);
      canvas.dataset.ready = 'fallback';
      if (backgroundRef.current) backgroundRef.current.dataset.mode = 'fallback';
    };
    const onContextRestored = () => {
      contextLost = true;
      canvas.dataset.ready = 'fallback';
    };

    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
    resizeObserver?.observe(canvas);
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibilityChange);
    motionQuery?.addEventListener('change', onMotionChange);
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
      motionQuery?.removeEventListener('change', onMotionChange);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      context.deleteBuffer(geometry);
      context.deleteProgram(shaderProgram);
    };
  }, []);

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
