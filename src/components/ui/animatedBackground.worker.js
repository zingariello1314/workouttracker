import { BACKGROUND_FRAGMENT_SHADER, BACKGROUND_VERTEX_SHADER } from './animatedBackgroundShader.js';

let gl = null;
let program = null;
let uTime = null;
let uResolution = null;
let startedAt = 0;
let rafId = 0;
let readySent = false;

function compile(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

function draw(now) {
  if (!gl || !program) return;
  const elapsed = (now - startedAt) * 0.0005;
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.useProgram(program);
  gl.uniform1f(uTime, elapsed);
  gl.uniform3f(uResolution, gl.canvas.width, gl.canvas.height, 1);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  if (!readySent) {
    readySent = true;
    self.postMessage({ type: 'ready' });
  }
}

function frame(now) {
  draw(now);
  rafId = self.requestAnimationFrame(frame);
}

function applySize(width, height) {
  if (!gl) return;
  const w = Math.max(1, Math.floor(width || 1));
  const h = Math.max(1, Math.floor(height || 1));
  if (gl.canvas.width !== w) gl.canvas.width = w;
  if (gl.canvas.height !== h) gl.canvas.height = h;
}

self.onmessage = (event) => {
  const data = event.data || {};
  if (data.type === 'resize') {
    applySize(data.width, data.height);
    return;
  }
  if (data.type !== 'init' || !data.canvas) return;

  gl = data.canvas.getContext('webgl', {
    antialias: false,
    alpha: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance'
  });
  if (!gl) {
    self.postMessage({ type: 'ready' });
    return;
  }

  applySize(data.width, data.height);
  program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, BACKGROUND_VERTEX_SHADER));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, BACKGROUND_FRAGMENT_SHADER));
  gl.linkProgram(program);
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW
  );
  const loc = gl.getAttribLocation(program, 'a_pos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  uTime = gl.getUniformLocation(program, 'u_time');
  uResolution = gl.getUniformLocation(program, 'u_resolution');
  startedAt = self.performance.now();
  rafId = self.requestAnimationFrame(frame);
};
