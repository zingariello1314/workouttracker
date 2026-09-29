import { useEffect, useRef } from 'react';
import { markAnimatedBackgroundPrepared } from '../../utils/preloadTabs';
import { BACKGROUND_FRAGMENT_SHADER, BACKGROUND_VERTEX_SHADER } from './animatedBackgroundShader';

function viewportSize() {
  return {
    width: Math.max(1, Math.floor(window.innerWidth || 1)),
    height: Math.max(1, Math.floor(window.innerHeight || 1))
  };
}

/** Secours si OffscreenCanvas n'est pas disponible : même shader, fil principal. */
function startOnMainThread(canvas, onReady) {
  let gl = null;
  try {
    gl = canvas.getContext('webgl', {
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance'
    });
  } catch {
    gl = null;
  }
  if (!gl) {
    onReady();
    return () => {};
  }

  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  };
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, BACKGROUND_VERTEX_SHADER));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, BACKGROUND_FRAGMENT_SHADER));
  gl.linkProgram(program);
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, 'a_pos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uTime = gl.getUniformLocation(program, 'u_time');
  const uResolution = gl.getUniformLocation(program, 'u_resolution');
  const startedAt = performance.now();
  let rafId = 0;
  let ready = false;

  const applySize = () => {
    const { width, height } = viewportSize();
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
  };

  const frame = (now) => {
    applySize();
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(program);
    gl.uniform1f(uTime, (now - startedAt) * 0.0005);
    gl.uniform3f(uResolution, canvas.width, canvas.height, 1);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (!ready) {
      ready = true;
      onReady();
    }
    rafId = requestAnimationFrame(frame);
  };
  applySize();
  rafId = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(rafId);
}

/**
 * Fond animé vert.
 * Le shader tourne dans un worker (OffscreenCanvas) dès le montage de l'app,
 * pas à l'ouverture du premier onglet, et il ne s'arrête pas quand le fil
 * principal est occupé (coche, enregistrement).
 */
export default function AnimatedBackground({ className = '' }) {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'width:100%;height:100%;display:block';
    host.appendChild(canvas);

    const onReady = () => markAnimatedBackgroundPrepared();
    let worker = null;
    let stopMain = null;

    const onResize = () => {
      const size = viewportSize();
      if (worker) worker.postMessage({ type: 'resize', ...size });
    };

    const useMainThread = () => {
      if (worker) {
        worker.terminate();
        worker = null;
      }
      stopMain = startOnMainThread(canvas, onReady);
      window.addEventListener('resize', onResize);
    };

    if (typeof canvas.transferControlToOffscreen !== 'function') {
      useMainThread();
    } else {
      try {
        worker = new Worker(new URL('./animatedBackground.worker.js', import.meta.url), { type: 'module' });
        const offscreen = canvas.transferControlToOffscreen();
        worker.onmessage = (event) => {
          if (event.data?.type === 'ready') onReady();
        };
        worker.postMessage({ type: 'init', canvas: offscreen, ...viewportSize() }, [offscreen]);
        window.addEventListener('resize', onResize);
      } catch {
        useMainThread();
      }
    }

    return () => {
      window.removeEventListener('resize', onResize);
      if (worker) worker.terminate();
      if (stopMain) stopMain();
      canvas.remove();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className={`absolute inset-0 ${className}`}
      style={{
        pointerEvents: 'none',
        backgroundColor: '#0a2e1a'
      }}
    />
  );
}
