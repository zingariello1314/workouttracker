export function fitBuffer(width, height) {
  let w = Math.max(1, Math.round(width || 1));
  let h = Math.max(1, Math.round(height || 1));
  const cap = 1280 * 720;
  if (w * h > cap) {
    const scale = Math.sqrt(cap / (w * h));
    w = Math.max(1, Math.round(w * scale));
    h = Math.max(1, Math.round(h * scale));
  }
  return { w, h, dpr: w / Math.max(1, width || 1) };
}

export function hexToRgb(hex, fallback = [0, 0, 0]) {
  const raw = String(hex || '').replace('#', '');
  if (raw.length < 6) return fallback.slice();
  const rgb = [0, 2, 4].map((index) => parseInt(raw.slice(index, index + 2), 16) / 255);
  return rgb.some((channel) => !Number.isFinite(channel)) ? fallback.slice() : rgb;
}

export function linkProgram(gl, vertSrc, fragSrc) {
  const compile = (type, src) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(log || 'shader');
    }
    return shader;
  };
  const program = gl.createProgram();
  const vs = compile(gl.VERTEX_SHADER, vertSrc);
  const fs = compile(gl.FRAGMENT_SHADER, fragSrc);
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || 'link');
  }
  return program;
}

export function bindTriangle(gl, program, attrib) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, attrib);
  if (loc >= 0) {
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  }
  return buffer;
}
