"use client"

import * as React from "react"
import { useEffect, useRef } from "react"

const MAX_DPR = 2
const CHASE = 14
const MAX_PULSES = 8
const EMIT_DIST = 0.09
const PULSE_LIFE = 2.4

const VERT_SRC = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`

const FRAG_SRC = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2  uRes;
uniform float uTime;
uniform float uPitch;
uniform vec3  uSky;
uniform vec3  uBase;
uniform vec3  uAccent;
uniform float uRain;
uniform float uCover;
uniform float uPScale;
uniform float uReflect;
uniform float uRipple;
uniform float uStreak;
uniform vec2  uCursor;
uniform float uReach;
uniform float uGlow;
uniform float uPulseAmp;
uniform float uEngaged;
uniform vec4  uPulses[8];
uniform float uNow;

const float CAM_H = 1.0;
const float TANH  = 0.45;
const float FOG_K = 0.055;
const float RIP   = 7.0;
const float PULSE_SPEED = 1.1;
const float PULSE_K = 14.0;
const float PULSE_W = 0.16;

float sq(float x) { return x * x; }

float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.x + p3.y) * p3.z);
}

vec2 hash22(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.xx + p3.yz) * p3.zy);
}

float vn(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), f.x),
               mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), f.x), f.y);
}

float fbm3(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
        v += a * vn(p);
        p = p * 2.07 + vec2(31.4, 17.1);
        a *= 0.5;
    }
    return v / 0.875;
}

float fbm4(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
        v += a * vn(p);
        p = p * 2.03 + vec2(11.7, 53.3);
        a *= 0.5;
    }
    return v / 0.9375;
}

vec2 rippleGrad(vec2 uv, float time) {
    vec2 p0 = floor(uv);
    vec2 circles = vec2(0.0);
    for (int j = -1; j <= 1; ++j) {
        for (int i = -1; i <= 1; ++i) {
            vec2 pi = p0 + vec2(float(i), float(j));
            vec2 p = pi + hash22(pi);

            float t = fract(0.3 * time + hash12(pi));
            vec2 v = p - uv;
            float len = length(v);

            vec2 dir = v / max(len, 1e-5);
            float d = len - 2.0 * t;

            float h = 1e-3;
            float d1 = d - h;
            float d2 = d + h;
            float c1 = sin(31.0 * d1) * smoothstep(-0.6, -0.3, d1) * smoothstep(0.0, -0.3, d1);
            float c2 = sin(31.0 * d2) * smoothstep(-0.6, -0.3, d2) * smoothstep(0.0, -0.3, d2);
            circles += 0.5 * dir * ((c2 - c1) / (2.0 * h) * (1.0 - t) * (1.0 - t));
        }
    }
    return circles / 9.0;
}

vec3 pulseInfo(vec2 P) {
    vec3 acc = vec3(0.0);
    for (int i = 0; i < 8; i++) {
        vec4 pl = uPulses[i];
        if (pl.w < 0.5) continue;
        float age = uNow - pl.z;
        if (age < 0.0) continue;
        vec2 v = P - pl.xy;
        float r = length(v);
        vec2 dir = v / max(r, 1e-5);
        float rad = age * PULSE_SPEED;
        float band = exp(-sq((r - rad) / PULSE_W));

        float amp = exp(-age * 0.9) / (1.0 + rad * 1.5);
        acc.xy += dir * sin(PULSE_K * (r - rad)) * band * amp;
        float disc = 1.0 - smoothstep(rad * 0.75, rad * 1.15, r);
        acc.z = max(acc.z, disc * exp(-age * 0.9));
    }
    return acc;
}

vec3 env(vec3 d) {
    float up = clamp(d.y, -1.0, 1.0);
    vec3 zen = uSky * 0.7;
    vec3 hor = mix(uSky, uAccent, 0.5);
    vec3 c = mix(hor, zen, smoothstep(0.0, 0.5, up));
    c = mix(c * 0.35, c, smoothstep(-0.2, 0.0, up));

    float band = exp(-sq(up / 0.06));
    float az = atan(d.z, d.x);
    float lamps = 0.0;
    for (int i = 0; i < 4; i++) {
        float fi = float(i);
        float a0 = -2.30 + fi * 1.37;
        lamps += exp(-sq((az - a0) / 0.11)) * (0.55 + 0.45 * fract(fi * 0.37 + 0.2));
    }
    c += uAccent * band * lamps * 2.4;
    c += mix(uAccent, vec3(1.0, 0.86, 0.62), 0.65) * band * 0.30;
    return c;
}

float streaks(vec2 S, float t) {
    float s = 0.0;
    for (int i = 0; i < 3; i++) {
        float fi = float(i);
        float sc = 26.0 + fi * 20.0;
        vec2 q = S * sc;
        q.x += q.y * 0.11;

        q.y += t * (5.5 + fi * 3.0);
        vec2 id = floor(q);
        vec2 f = fract(q);
        float h = hash12(id + fi * 31.7);
        float present = step(0.70, h);
        float cx = 0.2 + 0.6 * fract(h * 17.3);
        float line = smoothstep(0.055, 0.0, abs(f.x - cx))
                   * smoothstep(0.0, 0.10, f.y)
                   * (1.0 - smoothstep(0.10, 0.62, f.y));
        s += present * line * (0.5 + 0.5 * fract(h * 7.1));
    }
    return s;
}

void main() {
    vec2 q = (2.0 * gl_FragCoord.xy - uRes) / uRes.y;

    vec3 rc = normalize(vec3(q * TANH, -1.0));
    float cp = cos(uPitch);
    float sp = sin(uPitch);
    vec3 rd = vec3(rc.x, rc.y * cp + rc.z * sp, -rc.y * sp + rc.z * cp);

    vec3 col;
    float sky = 1.0;

    if (rd.y < -1e-3) {
        sky = 0.0;
        float t = min(CAM_H / -rd.y, 400.0);
        vec2 P = vec2(rd.x, rd.z) * t;

        float fp = t * t * (2.0 * TANH / uRes.y) / CAM_H;

        float pn = fbm4(P * uPScale + vec2(3.0, 0.0));
        float lo = mix(0.74, 0.20, uCover);
        float puddle = smoothstep(lo, lo + 0.09, pn);
        puddle *= 1.0 / (1.0 + sq(fp * uPScale * 2.0));

        float wetProgress = clamp(smoothstep(0.0, 0.75, uRain), 0.0, 1.0);
        float ripProgress = clamp(smoothstep(0.55, 1.0, uRain), 0.0, 1.0);
        vec3 pulse = pulseInfo(P);
        float wet = clamp(puddle * wetProgress
                        + pulse.z * 0.6 * uEngaged * min(uPulseAmp, 1.0), 0.0, 1.0);

        float ripFade = 1.0 / (1.0 + sq(fp * RIP * 5.0));

        vec2 g = rippleGrad(P * RIP, uTime) * (0.85 * uRipple * ripProgress * ripFade * wet);
        g += pulse.xy * (2.2 * uPulseAmp * uEngaged);
        vec3 N = normalize(vec3(-g.x, 1.0, -g.y));

        float grainFade = 1.0 / (1.0 + sq(fp * 26.0));
        float grain = fbm3(P * 26.0);
        float gravel = step(0.72, hash12(floor(P * 150.0)));
        vec3 albedo = uBase * (0.45 + 1.15 * mix(0.5, grain, grainFade));
        albedo *= 1.0 + 0.34 * (gravel - 0.5) * grainFade;

        albedo *= mix(1.0, 0.42, wet);

        vec3 amb = mix(uSky, uAccent, 0.25) * 3.0;
        col = albedo * amb * (0.55 + 0.45 * N.y);

        col += mix(uSky, uAccent, 0.5) * wet * 0.10;

        vec3 R = reflect(rd, N);
        float F = 0.03 + 0.97 * pow(1.0 - clamp(dot(N, -rd), 0.0, 1.0), 5.0);

        float refl = mix(0.02, 1.0, wet) * uReflect;
        col += env(R) * F * refl;

        if (uEngaged > 0.5 && uGlow > 0.0) {
            float rr = length(P - uCursor);
            float pool = exp(-sq(rr / max(uReach, 1e-3)));

            col += uAccent * pool * uGlow * (0.10 + 0.90 * wet);
        }

        vec3 far = env(normalize(vec3(rd.x, 0.012, rd.z)));
        col = mix(col, far, 1.0 - exp(-t * FOG_K));
    } else {
        col = env(rd);
    }

    vec2 S = gl_FragCoord.xy / uRes.y;
    float rainNear = clamp(smoothstep(0.0, 0.5, uRain), 0.0, 1.0);
    col += mix(vec3(1.0), uAccent, 0.45) * streaks(S, uTime) * 0.30 * uStreak * rainNear;

    vec2 v = (2.0 * gl_FragCoord.xy - uRes) / uRes.y;
    float vig = smoothstep(0.72, 1.75, length(v * vec2(0.68, 1.0)));
    col *= 1.0 - 0.72 * vig;
    float fy = gl_FragCoord.y / uRes.y;
    col = mix(col, col * vec3(0.84, 0.89, 1.20), (1.0 - smoothstep(0.0, 0.5, fy)) * 0.22);
    col = mix(col, col * vec3(1.18, 1.06, 0.86), smoothstep(0.55, 1.0, fy) * 0.30);

    col += (hash12(gl_FragCoord.xy * 0.41 + fract(uTime)) - 0.5) * 0.010;

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`

function hexToRgb(hex: string): [number, number, number] {
    if (typeof hex !== "string") return [0.5, 0.5, 0.5]
    let s = hex.trim()
    const m = s.match(/^rgba?\(([^)]+)\)$/i)
    if (m) {
        const p = m[1].split(",").map((v) => parseFloat(v))
        return [(p[0] || 0) / 255, (p[1] || 0) / 255, (p[2] || 0) / 255]
    }
    s = s.replace("#", "")
    if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2]
    if (s.length === 8) s = s.slice(0, 6)
    if (s.length !== 6) return [0.5, 0.5, 0.5]
    const n = parseInt(s, 16)
    if (!isFinite(n)) return [0.5, 0.5, 0.5]
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
    const sh = gl.createShader(type)
    if (!sh) return null
    gl.shaderSource(sh, src)
    gl.compileShader(sh)
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.error("RainPuddle shader:", gl.getShaderInfoLog(sh))
        gl.deleteShader(sh)
        return null
    }
    return sh
}

const CAM_H = 1.0
const TANH = 0.45

interface PuddlesGroup {
    coverage?: number
    scale?: number
    reflection?: number
}
interface DropsGroup {
    ripples?: number
    streaks?: number
}
interface CursorGroup {
    reach?: number
    ripple?: number
    glow?: number
}

interface Props {
    background: string
    baseColor: string
    accentColor: string
    rain: number
    speed: number
    tilt: number
    puddles: PuddlesGroup
    drops: DropsGroup
    cursor: CursorGroup
    width?: number
    height?: number
    style?: React.CSSProperties
}

const PUDDLES_DEFAULTS: Required<PuddlesGroup> = { coverage: 62, scale: 170, reflection: 150 }
const DROPS_DEFAULTS: Required<DropsGroup> = { ripples: 100, streaks: 70 }
const CURSOR_DEFAULTS: Required<CursorGroup> = { reach: 54, ripple: 100, glow: 60 }

export default function RainPuddle(props: Partial<Props>) {
    const {
        background = "#000000",
        baseColor = "#03661A",
        accentColor = "#FFFFFF",
        rain = 100,
        speed = 100,
        tilt = 25,
        puddles,
        drops,
        cursor,
        width,
        height,
        style,
    } = props

    const pd = { ...PUDDLES_DEFAULTS, ...(puddles || {}) }
    const dr = { ...DROPS_DEFAULTS, ...(drops || {}) }
    const cu = { ...CURSOR_DEFAULTS, ...(cursor || {}) }

    const hostRef = useRef<HTMLDivElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)

    const live = useRef({
        speed: 50,
        pitch: 0.38,
        rain: 1,
        cover: 0.55,
        pScale: 1.1,
        reflect: 1,
        ripple: 1,
        streak: 0.7,
        reach: 0.3,
        pulseAmp: 1,
        glow: 0.6,
        sky: [0, 0, 0] as number[],
        base: [0.2, 0.2, 0.2] as number[],
        accent: [0.5, 0.6, 1] as number[],
    })

    live.current = {
        speed,

        pitch: (Math.max(2, tilt) * Math.PI) / 180,
        rain: rain / 100,
        cover: pd.coverage / 100,
        pScale: (pd.scale / 100) * 1.1,
        reflect: pd.reflection / 100,
        ripple: dr.ripples / 100,
        streak: dr.streaks / 100,
        reach: (cu.reach / 100) * 1.2,
        pulseAmp: cu.ripple / 100,
        glow: (cu.glow / 100) * 0.55,
        sky: hexToRgb(background),
        base: hexToRgb(baseColor),
        accent: hexToRgb(accentColor),
    }

    useEffect(() => {
        const host = hostRef.current
        const canvas = canvasRef.current
        if (!host || !canvas) return

        const gl = canvas.getContext("webgl", {
            antialias: false,
            alpha: false,
            depth: false,

            preserveDrawingBuffer: true,
        }) as WebGLRenderingContext | null
        if (!gl) return

        const vs = compile(gl, gl.VERTEX_SHADER, VERT_SRC)
        const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG_SRC)
        if (!vs || !fs) return
        const prog = gl.createProgram()
        if (!prog) return
        gl.attachShader(prog, vs)
        gl.attachShader(prog, fs)
        gl.linkProgram(prog)
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            console.error("RainPuddle link:", gl.getProgramInfoLog(prog))
            return
        }
        gl.useProgram(prog)

        const quad = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, quad)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
        const aPos = gl.getAttribLocation(prog, "a_pos")
        gl.enableVertexAttribArray(aPos)
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

        const u = {
            res: gl.getUniformLocation(prog, "uRes"),
            time: gl.getUniformLocation(prog, "uTime"),
            pitch: gl.getUniformLocation(prog, "uPitch"),
            sky: gl.getUniformLocation(prog, "uSky"),
            base: gl.getUniformLocation(prog, "uBase"),
            accent: gl.getUniformLocation(prog, "uAccent"),
            rain: gl.getUniformLocation(prog, "uRain"),
            cover: gl.getUniformLocation(prog, "uCover"),
            pScale: gl.getUniformLocation(prog, "uPScale"),
            reflect: gl.getUniformLocation(prog, "uReflect"),
            ripple: gl.getUniformLocation(prog, "uRipple"),
            streak: gl.getUniformLocation(prog, "uStreak"),
            cursor: gl.getUniformLocation(prog, "uCursor"),
            reach: gl.getUniformLocation(prog, "uReach"),
            glow: gl.getUniformLocation(prog, "uGlow"),
            pulseAmp: gl.getUniformLocation(prog, "uPulseAmp"),
            engaged: gl.getUniformLocation(prog, "uEngaged"),
            pulses: gl.getUniformLocation(prog, "uPulses[0]"),
            now: gl.getUniformLocation(prog, "uNow"),
        }

        let bufW = 0
        let bufH = 0
        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)

            const bw = Math.max(1, Math.round((canvas.clientWidth || host.clientWidth || 1) * dpr))
            const bh = Math.max(1, Math.round((canvas.clientHeight || host.clientHeight || 1) * dpr))
            if (bw === bufW && bh === bufH) return
            bufW = bw
            bufH = bh
            canvas.width = bw
            canvas.height = bh
            gl.viewport(0, 0, bw, bh)
        }
        const ro = new ResizeObserver(resize)
        ro.observe(host)
        resize()

        let aimX = 0
        let aimZ = 0
        let curX = 0
        let curZ = 0
        let engaged = false

        const pulses = new Float32Array(MAX_PULSES * 4)
        let pulseHead = 0
        let lastEmitX = 0
        let lastEmitZ = 0
        let hasEmitted = false

        const project = (nx: number, ny: number, pitch: number): [number, number] | null => {
            const rcx = nx * TANH
            const rcy = ny * TANH
            const rcz = -1
            const inv = 1 / Math.hypot(rcx, rcy, rcz)
            const cx = rcx * inv
            const cy = rcy * inv
            const cz = rcz * inv
            const cp = Math.cos(pitch)
            const sp = Math.sin(pitch)
            const ry = cy * cp + cz * sp
            const rz = -cy * sp + cz * cp
            if (ry >= -1e-3) return null
            const t = Math.min(CAM_H / -ry, 400)
            return [cx * t, rz * t]
        }

        const onMove = (e: PointerEvent) => {
            const r = host.getBoundingClientRect()
            if (r.width <= 0 || r.height <= 0) return

            const nx = (2 * (e.clientX - r.left) - r.width) / r.height
            const ny = (r.height - 2 * (e.clientY - r.top)) / r.height
            const hit = project(nx, ny, live.current.pitch)
            if (!hit) return
            aimX = hit[0]
            aimZ = hit[1]
            if (!engaged) {
                curX = aimX
                curZ = aimZ
                lastEmitX = aimX
                lastEmitZ = aimZ
                hasEmitted = false
            }
            engaged = true
        }

        window.addEventListener("pointermove", onMove)

        let clock = 0
        let last = 0
        let raf = 0
        const frame = (now: number) => {
            raf = requestAnimationFrame(frame)
            const dt = last ? Math.min(0.05, (now - last) / 1000) : 0
            last = now
            const L = live.current

            clock += dt * (L.speed / 50)

            const k = 1 - Math.exp(-CHASE * dt)
            curX += (aimX - curX) * k
            curZ += (aimZ - curZ) * k

            if (engaged) {
                const dx = curX - lastEmitX
                const dz = curZ - lastEmitZ
                if (!hasEmitted || dx * dx + dz * dz > EMIT_DIST * EMIT_DIST) {
                    const o = pulseHead * 4
                    pulses[o] = curX
                    pulses[o + 1] = curZ
                    pulses[o + 2] = clock
                    pulses[o + 3] = 1
                    pulseHead = (pulseHead + 1) % MAX_PULSES
                    lastEmitX = curX
                    lastEmitZ = curZ
                    hasEmitted = true
                }
            }
            for (let i = 0; i < MAX_PULSES; i++) {
                if (pulses[i * 4 + 3] > 0.5 && clock - pulses[i * 4 + 2] > PULSE_LIFE) {
                    pulses[i * 4 + 3] = 0
                }
            }

            resize()

            gl.uniform2f(u.res, bufW, bufH)
            gl.uniform1f(u.time, clock)
            gl.uniform1f(u.pitch, L.pitch)
            gl.uniform3fv(u.sky, L.sky)
            gl.uniform3fv(u.base, L.base)
            gl.uniform3fv(u.accent, L.accent)
            gl.uniform1f(u.rain, L.rain)
            gl.uniform1f(u.cover, L.cover)
            gl.uniform1f(u.pScale, L.pScale)
            gl.uniform1f(u.reflect, L.reflect)
            gl.uniform1f(u.ripple, L.ripple)
            gl.uniform1f(u.streak, L.streak)
            gl.uniform2f(u.cursor, curX, curZ)
            gl.uniform1f(u.reach, L.reach)
            gl.uniform1f(u.glow, L.glow)
            gl.uniform1f(u.pulseAmp, L.pulseAmp)
            gl.uniform1f(u.engaged, engaged ? 1 : 0)
            gl.uniform4fv(u.pulses, pulses)
            gl.uniform1f(u.now, clock)

            gl.drawArrays(gl.TRIANGLES, 0, 3)
        }
        raf = requestAnimationFrame(frame)

        return () => {
            cancelAnimationFrame(raf)
            ro.disconnect()
            window.removeEventListener("pointermove", onMove)

        }
    }, [])

    return (
        <div
            ref={hostRef}
            style={{
                position: "relative",
                overflow: "hidden",
                background,

                minWidth: 1200,
                minHeight: 800,
                width: typeof width === "number" && width > 0 ? width : "100%",
                height: typeof height === "number" && height > 0 ? height : "100%",
                ...style,
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    display: "block",

                    filter: "contrast(1.2) saturate(1.1) brightness(1.1)",
                }}
            />
        </div>
    )
}