"use client"

import * as React from "react"
import { useEffect, useRef } from "react"

interface Props {
    background?: string
    baseColor?: string
    speed?: number
    density?: number
    twist?: number
    style?: React.CSSProperties
}

type Vec3 = [number, number, number]

const MAX_DPR = 1.5

const TAU = 6.283185307179586

const LINK_STEP = 1.32

const CHAIN_PERIOD = 2 * LINK_STEP

const LANE = 3.0

const SLIDE_RATE = 0.9

const DEFAULTS = {
    background: "#070000",
    baseColor: "#747474",
    speed: -100,
    density: 7,

    twist: -5,
}

function hueToChannel(p: number, q: number, tIn: number): number {
    let t = tIn
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
}

function parseColor(input: string | undefined, fallback: Vec3): Vec3 {
    if (!input) return fallback
    let str = String(input).trim()

    if (str.slice(0, 4).toLowerCase() === "var(") {
        const comma = str.indexOf(",")
        if (comma < 0) return fallback
        str = str.slice(comma + 1, str.lastIndexOf(")")).trim()
        if (!str) return fallback
    }

    if (str.charAt(0) === "#") {
        let hex = str.slice(1)
        if (hex.length === 3 || hex.length === 4) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
        }
        if (hex.length >= 6) {
            const r = parseInt(hex.slice(0, 2), 16)
            const g = parseInt(hex.slice(2, 4), 16)
            const b = parseInt(hex.slice(4, 6), 16)
            if (!isNaN(r) && !isNaN(g) && !isNaN(b)) return [r / 255, g / 255, b / 255]
        }
        return fallback
    }

    const parts = str.match(/-?[\d.]+/g)
    if (!parts || parts.length < 3) return fallback
    const n0 = parseFloat(parts[0])
    const n1 = parseFloat(parts[1])
    const n2 = parseFloat(parts[2])
    if (!isFinite(n0) || !isFinite(n1) || !isFinite(n2)) return fallback

    if (str.slice(0, 3).toLowerCase() === "hsl") {
        const h = ((n0 % 360) + 360) / 360
        const s = Math.min(1, Math.max(0, n1 / 100))
        const l = Math.min(1, Math.max(0, n2 / 100))
        if (s === 0) return [l, l, l]
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s
        const p = 2 * l - q
        return [
            hueToChannel(p, q, h + 1 / 3),
            hueToChannel(p, q, h),
            hueToChannel(p, q, h - 1 / 3),
        ]
    }

    return [
        Math.min(255, Math.max(0, n0)) / 255,
        Math.min(255, Math.max(0, n1)) / 255,
        Math.min(255, Math.max(0, n2)) / 255,
    ]
}

function clamp(v: number, lo: number, hi: number): number {
    return v < lo ? lo : v > hi ? hi : v
}

function num(v: unknown, fallback: number): number {
    return typeof v === "number" && isFinite(v) ? v : fallback
}

export function chainMap(density: number, twist: number): [number, number] {
    return [(density * LANE) / TAU, (-twist * CHAIN_PERIOD) / TAU]
}

const VERT_SRC = `
attribute vec2 aPos;
void main() {
    gl_Position = vec4(aPos, 0.0, 1.0);
}
`

const FRAG_SRC = `
precision highp float;

uniform vec2 uRes;
uniform vec2 uMap;
uniform float uSlide;
uniform vec3 uColor;

const float TAU = 6.283185307179586;

const float H = 0.42;
const float R = 0.45;
const float T = 0.21;
const float RC = 0.1;
const float S = 1.32;
const float LP = 2.64;
const float LANE = 3.0;
const float EXT = 0.66;
const float LINK = 2.16;

const float TOP = 0.67;
const float BACK_Z = -1.09;
const float FLOOR_Z = -1.47;

const float TILT = 0.35;

float sdLink(vec3 p) {
    vec2 w = vec2(length(vec2(max(abs(p.x) - H, 0.0), p.y)) - R, p.z);
    vec2 d = abs(w) - vec2(T - RC);
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - RC;
}

float sdChain(vec3 q, float lane) {
    q.y = mod(q.y + 0.5 * lane, lane) - 0.5 * lane;
    float a1 = mod(q.x + S, LP) - S;
    float a2 = mod(q.x, LP) - S;
    return min(sdLink(vec3(a1, q.y, q.z)), sdLink(vec3(a2, q.z, q.y)));
}

vec2 map(vec3 p) {
    float b1 = max(p.z - EXT, -EXT - p.z);
    float d1 = b1 > 0.08 ? b1 : sdChain(vec3(p.x + uSlide, p.y, p.z), LANE);

    float z2 = p.z - BACK_Z;
    float b2 = max(z2 - 0.5 * EXT, -0.5 * EXT - z2);
    float d2 = b2;
    if (b2 < 0.08 && b2 < d1) {
        d2 = 0.5 * sdChain(vec3(2.0 * p.x + uSlide, 2.0 * p.y + 0.75, 2.0 * z2), 0.5 * LANE);
    }
    return d1 < d2 ? vec2(d1, 1.0) : vec2(d2, 2.0);
}

vec3 calcNormal(vec3 p, float h) {
    vec2 e = vec2(1.0, -1.0) * h;
    return normalize(
        e.xyy * map(p + e.xyy).x +
        e.yyx * map(p + e.yyx).x +
        e.yxy * map(p + e.yxy).x +
        e.xxx * map(p + e.xxx).x
    );
}

void main() {
    float minRes = min(uRes.x, uRes.y);
    vec2 px = gl_FragCoord.xy - 0.5 * uRes;
    float rpx = max(length(px), 0.5);
    float theta = atan(px.y, px.x);
    float u = log(rpx / minRes);

    float k = length(uMap);
    vec2 ac = vec2(u * uMap.x - theta * uMap.y, u * uMap.y + theta * uMap.x);

    float foot = k / rpx;

    vec2 inward = -uMap / k;
    vec3 rd = normalize(vec3(inward * TILT, -1.0));
    vec3 ro = vec3(ac, TOP);

    float eps = max(0.25 * foot, 0.0008);
    float t = 0.0;
    vec2 hit = vec2(1e9, 0.0);
    bool found = false;
    for (int i = 0; i < 72; i++) {
        vec3 p = ro + rd * t;
        if (p.z < FLOOR_Z) break;
        hit = map(p);
        if (hit.x < eps) {
            found = true;
            break;
        }
        t += hit.x * 0.95;
    }

    if (!found) {
        gl_FragColor = vec4(0.0);
        return;
    }

    vec3 p = ro + rd * t;
    float layerScale = hit.y > 1.5 ? 2.0 : 1.0;
    vec3 nq = calcNormal(p, max(0.012 / layerScale, 0.5 * foot));

    float nu = (nq.x * uMap.x + nq.y * uMap.y) / k;
    float nt = (-nq.x * uMap.y + nq.y * uMap.x) / k;
    float cs = cos(theta);
    float sn = sin(theta);
    vec3 n = normalize(vec3(nu * cs - nt * sn, nu * sn + nt * cs, nq.z));

    vec3 L = normalize(vec3(-0.55, 0.6, 0.72));
    float diff = max(dot(n, L), 0.0);
    vec3 hv = normalize(L + vec3(0.0, 0.0, 1.0));
    float spec = pow(max(dot(n, hv), 0.0), 28.0);

    float occ = 0.0;
    float wgt = 1.0;
    for (int i = 1; i <= 4; i++) {
        float hh = 0.07 * float(i) / layerScale;
        occ += (hh - map(p + nq * hh).x) * wgt;
        wgt *= 0.6;
    }
    float ao = clamp(1.0 - occ * 3.0 * layerScale, 0.0, 1.0);

    float zl = hit.y > 1.5 ? (p.z - BACK_Z) / (0.5 * EXT) : p.z / EXT;
    float height = clamp(0.5 + 0.5 * zl, 0.0, 1.0);
    float depth = (hit.y > 1.5 ? 0.72 : 1.0) * mix(0.4, 1.0, height);

    vec3 col = uColor * (0.14 + 1.2 * diff) * ao * depth;
    col += spec * 0.35 * mix(uColor, vec3(1.0), 0.45) * ao * depth;

    float linkPx = LINK / (foot * layerScale);
    float detail = smoothstep(2.0, 7.0, linkPx);
    float rn = clamp((rpx / (0.5 * minRes) - 0.02) / 0.38, 0.0, 1.0);
    float throat = rn * (2.0 - rn);
    float a = detail * throat;

    gl_FragColor = vec4(clamp(col, 0.0, 1.0) * a, a);
}
`

function compileShader(
    gl: WebGLRenderingContext,
    type: number,
    src: string
): WebGLShader | null {
    const shader = gl.createShader(type)
    if (!shader) return null
    gl.shaderSource(shader, src)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("ChainVortex shader:", gl.getShaderInfoLog(shader))
        gl.deleteShader(shader)
        return null
    }
    return shader
}

export default function ChainVortex(props: Props) {
    const {
        background = DEFAULTS.background,
        baseColor = DEFAULTS.baseColor,
        speed = DEFAULTS.speed,
        density = DEFAULTS.density,
        twist = DEFAULTS.twist,
        style,
    } = props

    const rootRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const propsRef = useRef({ background, baseColor, speed, density, twist })
    propsRef.current = { background, baseColor, speed, density, twist }

    useEffect(() => {
        const root = rootRef.current
        const canvas = canvasRef.current
        if (!root || !canvas) return

        const gl = canvas.getContext("webgl", {
            antialias: false,
            alpha: true,
            premultipliedAlpha: true,
            depth: false,
        })
        if (!gl) {
            console.error("ChainVortex: WebGL unavailable")
            return
        }

        const vs = compileShader(gl, gl.VERTEX_SHADER, VERT_SRC)
        const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC)
        if (!vs || !fs) return

        const program = gl.createProgram()
        if (!program) return
        gl.attachShader(program, vs)
        gl.attachShader(program, fs)
        gl.linkProgram(program)
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error("ChainVortex link:", gl.getProgramInfoLog(program))
            return
        }
        gl.useProgram(program)

        const buffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
        const posLoc = gl.getAttribLocation(program, "aPos")
        gl.enableVertexAttribArray(posLoc)
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

        const uRes = gl.getUniformLocation(program, "uRes")
        const uMap = gl.getUniformLocation(program, "uMap")
        const uSlide = gl.getUniformLocation(program, "uSlide")
        const uColor = gl.getUniformLocation(program, "uColor")

        let cssWidth = root.offsetWidth || 1
        let cssHeight = root.offsetHeight || 1
        const resizeObserver = new ResizeObserver(() => {
            cssWidth = root.offsetWidth || 1
            cssHeight = root.offsetHeight || 1
        })
        resizeObserver.observe(root)

        const reduceMotion =
            typeof window !== "undefined" &&
            !!window.matchMedia &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches

        let raf = 0
        let last = performance.now()
        let slide = 0

        const render = (now: number) => {
            raf = requestAnimationFrame(render)

            const dt = Math.min(0.05, Math.max(0, (now - last) / 1000))
            last = now

            const p = propsRef.current
            const speed = clamp(num(p.speed, DEFAULTS.speed), -100, 100)

            if (!reduceMotion) slide += dt * (speed / 50) * SLIDE_RATE

            slide %= CHAIN_PERIOD
            if (slide < 0) slide += CHAIN_PERIOD

            const density = Math.round(clamp(num(p.density, DEFAULTS.density), 1, 24))
            const twist = Math.round(clamp(num(p.twist, DEFAULTS.twist), -24, 24))
            const [A, B] = chainMap(density, twist)

            const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
            const bufferWidth = Math.max(1, Math.round(cssWidth * dpr))
            const bufferHeight = Math.max(1, Math.round(cssHeight * dpr))
            if (canvas.width !== bufferWidth || canvas.height !== bufferHeight) {
                canvas.width = bufferWidth
                canvas.height = bufferHeight
                gl.viewport(0, 0, bufferWidth, bufferHeight)
            }

            const c = parseColor(p.baseColor, [0.83, 0.15, 0.12])
            gl.uniform2f(uRes, bufferWidth, bufferHeight)
            gl.uniform2f(uMap, A, B)
            gl.uniform1f(uSlide, slide)
            gl.uniform3f(uColor, c[0], c[1], c[2])

            gl.drawArrays(gl.TRIANGLES, 0, 3)
        }

        raf = requestAnimationFrame(render)

        return () => {
            cancelAnimationFrame(raf)
            resizeObserver.disconnect()
            gl.deleteBuffer(buffer)
            gl.deleteProgram(program)
            gl.deleteShader(vs)
            gl.deleteShader(fs)

        }
    }, [])

    return (
        <div
            ref={rootRef}
            style={{
                minWidth: 1200,
                minHeight: 800,
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                background,
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
                }}
            />
        </div>
    )
}