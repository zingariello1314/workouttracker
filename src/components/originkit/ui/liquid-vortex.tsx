"use client"

import * as React from "react"
import { useEffect, useRef } from "react"
import * as THREE from "three"

const DEFAULTS = {
    smoke: "#FFF700",
    deep: "#FFF700",
    ember: "#FFF700",
    detail: 20,
    turbulence: 20,
    swirl: 10,
    density: 4,
    contrast: 20,
    emberAmount: 0,
    speed: 5,
    hoverBoost: 20,
    sizePercent: 100,
}

type Config = {
    smoke: string
    deep: string
    ember: string
    detail: number
    turbulence: number
    swirl: number
    density: number
    contrast: number
    emberAmount: number
    speed: number
    hoverBoost: number
    sizePercent: number
}

function clamp(v: number, lo: number, hi: number, fallback: number): number {
    const n = typeof v === "number" && isFinite(v) ? v : fallback
    return Math.max(lo, Math.min(hi, n))
}

function settingsFor(cfg: Config) {
    return {
        detail: 1.0 + clamp(cfg.detail, 1, 20, DEFAULTS.detail) * 0.25,

        turbulence: clamp(cfg.turbulence, 0, 20, DEFAULTS.turbulence) * 0.12,

        swirl: 2.8 + (clamp(cfg.swirl, 1, 10, DEFAULTS.swirl) - 1) * 0.3111,
        density: 0.25 + clamp(cfg.density, 1, 10, DEFAULTS.density) * 0.055,
        contrast: 0.6 + clamp(cfg.contrast, 1, 20, DEFAULTS.contrast) * 0.13,
        ember: clamp(cfg.emberAmount, 0, 20, DEFAULTS.emberAmount) * 0.06,
        speed: clamp(cfg.speed, 0, 20, DEFAULTS.speed) * 0.07,

        hoverBoost: clamp(cfg.hoverBoost, 0, 20, DEFAULTS.hoverBoost) * 0.15,
        zoom: 100 / clamp(cfg.sizePercent, 20, 200, 100),
    }
}

const QUAD_VERTEX =  `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
    }
`

const SMOKE_FRAGMENT =  `
    precision highp float;

    uniform vec2 uResolution;
    uniform vec3 uSmoke;
    uniform vec3 uDeep;
    uniform vec3 uEmber;
    uniform float uTime;
    uniform float uDetail;
    uniform float uTurbulence;
    uniform float uSwirl;
    uniform float uDensity;
    uniform float uContrast;
    uniform float uEmberAmount;
    uniform float uZoom;

    varying vec2 vUv;

    float hash(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
    }

    float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }

    float fbm(vec2 p) {
        float sum = 0.0;
        float amp = 0.5;
        float norm = 0.0;
        for (int i = 0; i < 6; i++) {
            float w = clamp(uDetail - float(i), 0.0, 1.0);
            sum += noise(p) * amp * w;
            norm += amp * w;
            p *= 2.02;

            p = mat2(0.8, 0.6, -0.6, 0.8) * p;
            amp *= 0.5;
        }
        return sum / max(0.0001, norm);
    }

    void main() {
        vec2 uv = (vUv - 0.5) * uZoom;
        uv.x *= uResolution.x / max(1.0, uResolution.y);

        float r = length(uv);
        float a = atan(uv.y, uv.x) + uSwirl / (r + 0.35) - uTime * 0.6;
        vec2 p = vec2(cos(a), sin(a)) * r;

        vec2 q = vec2(fbm(p * 1.6 + uTime * 0.15), fbm(p * 1.6 - uTime * 0.11));
        vec2 s = vec2(
            fbm(p * 2.1 + q * uTurbulence * 4.0 + uTime * 0.2),
            fbm(p * 2.1 - q * uTurbulence * 4.0 - uTime * 0.17)
        );
        float f = fbm(p * 2.6 + s * uTurbulence * 4.0);

        float fall = exp(-r * r * 1.1);
        float d = pow(clamp(f * uDensity * 3.2 * fall, 0.0, 1.0), uContrast);

        vec3 col = mix(uDeep, uSmoke, pow(d, 0.6));

        float heat = pow(max(dot(s, s), 0.0), 1.2) * exp(-r * 2.2);
        col += uEmber * heat * uEmberAmount * 6.0;

        float alpha = clamp(d * 1.15, 0.0, 1.0);
        gl_FragColor = vec4(col * alpha, alpha);
    }
`

class SmokeScene {
    private container: HTMLElement
    private cfg: Config

    private renderer: THREE.WebGLRenderer
    private scene = new THREE.Scene()
    private camera = new THREE.Camera()
    private geometry = new THREE.PlaneGeometry(2, 2)
    private material: THREE.ShaderMaterial
    private mesh: THREE.Mesh

    private hover = 0
    private hoverTarget = 0
    private time = 0
    private width = 0
    private height = 0
    private frameId = 0
    private lastT = 0
    private disposed = false

    constructor(container: HTMLElement, cfg: Config) {
        this.container = container
        this.cfg = cfg
        const S = settingsFor(cfg)

        this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true })

        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
        this.renderer.outputColorSpace = THREE.SRGBColorSpace
        this.renderer.setClearColor(0x000000, 0)
        const el = this.renderer.domElement
        el.style.position = "absolute"
        el.style.inset = "0"
        el.style.width = "100%"
        el.style.height = "100%"
        el.style.touchAction = "none"
        container.appendChild(el)

        this.material = new THREE.ShaderMaterial({
            vertexShader: QUAD_VERTEX,
            fragmentShader: SMOKE_FRAGMENT,
            uniforms: {
                uResolution: { value: new THREE.Vector2(1, 1) },
                uSmoke: { value: new THREE.Color(cfg.smoke) },
                uDeep: { value: new THREE.Color(cfg.deep) },
                uEmber: { value: new THREE.Color(cfg.ember) },
                uTime: { value: 0 },
                uDetail: { value: S.detail },
                uTurbulence: { value: S.turbulence },
                uSwirl: { value: S.swirl },
                uDensity: { value: S.density },
                uContrast: { value: S.contrast },
                uEmberAmount: { value: S.ember },
                uZoom: { value: S.zoom },
            },
            transparent: true,
            depthTest: false,
            depthWrite: false,
        })

        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.frustumCulled = false
        this.scene.add(this.mesh)
        this.bindEvents()
    }

    private bindEvents() {
        const el = this.renderer.domElement
        const enter = () => {
            this.hoverTarget = 1
        }
        const leave = () => {
            this.hoverTarget = 0
        }

        el.addEventListener("pointerenter", enter)
        el.addEventListener("pointerleave", leave)

        el.addEventListener("pointercancel", leave)
        this.unbind = () => {
            el.removeEventListener("pointerenter", enter)
            el.removeEventListener("pointerleave", leave)
            el.removeEventListener("pointercancel", leave)
        }
    }

    private unbind = () => {}

    start() {
        this.lastT = performance.now()
        const loop = () => {
            this.frameId = requestAnimationFrame(loop)
            this.step()
        }
        loop()
    }

    setSize(width: number, height: number) {
        if (this.disposed || width <= 0 || height <= 0) return
        this.width = width
        this.height = height
        this.renderer.setSize(width, height, false)
        this.material.uniforms.uResolution.value.set(width, height)
    }

    updateConfig(cfg: Config) {
        if (this.disposed) return
        this.cfg = cfg
        const S = settingsFor(cfg)
        const u = this.material.uniforms
        u.uSmoke.value.set(cfg.smoke || "#ffffff")
        u.uDeep.value.set(cfg.deep || "#000000")
        u.uEmber.value.set(cfg.ember || "#ffffff")
        u.uDetail.value = S.detail
        u.uTurbulence.value = S.turbulence
        u.uSwirl.value = S.swirl
        u.uDensity.value = S.density
        u.uContrast.value = S.contrast
        u.uEmberAmount.value = S.ember
        u.uZoom.value = S.zoom
    }

    private step() {
        if (this.disposed) return
        const now = performance.now()
        let dt = (now - this.lastT) / 1000
        this.lastT = now
        if (!isFinite(dt) || dt < 0) dt = 0
        if (dt > 0.05) dt = 0.05

        const S = settingsFor(this.cfg)

        this.hover += (this.hoverTarget - this.hover) * (1 - Math.exp(-dt * 3.5))

        this.time += dt * S.speed * (1 + S.hoverBoost * this.hover)

        this.material.uniforms.uTime.value = this.time

        this.renderer.render(this.scene, this.camera)
    }

    dispose() {
        this.disposed = true
        cancelAnimationFrame(this.frameId)
        this.unbind()
        this.geometry.dispose()
        this.material.dispose()
        this.renderer.dispose()
        const el = this.renderer.domElement
        if (el.parentNode === this.container) this.container.removeChild(el)
    }
}

export interface SmokeVortexProps extends Partial<Config> {
    smoke?: string

    deep?: string
    ember?: string

    swirl?: number

    turbulence?: number

    detail?: number

    density?: number

    contrast?: number

    emberAmount?: number

    speed?: number

    hoverBoost?: number

    sizePercent?: number
    style?: React.CSSProperties
}

type Props = SmokeVortexProps

export default function SmokeVortex(props: Props) {
    const {
        smoke = DEFAULTS.smoke,
        deep = DEFAULTS.deep,
        ember = DEFAULTS.ember,
        detail = DEFAULTS.detail,
        turbulence = DEFAULTS.turbulence,
        swirl = DEFAULTS.swirl,
        density = DEFAULTS.density,
        contrast = DEFAULTS.contrast,
        emberAmount = DEFAULTS.emberAmount,
        speed = DEFAULTS.speed,
        hoverBoost = DEFAULTS.hoverBoost,
        sizePercent = DEFAULTS.sizePercent,
        style,
    } = props

    const containerRef = useRef<HTMLDivElement | null>(null)
    const sceneRef = useRef<SmokeScene | null>(null)

    const cfgRef = useRef<Config>(null as any)
    cfgRef.current = {
        smoke,
        deep,
        ember,
        detail,
        turbulence,
        swirl,
        density,
        contrast,
        emberAmount,
        speed,
        hoverBoost,
        sizePercent,
    }

    useEffect(() => {
        const container = containerRef.current
        if (!container) return
        let scene: SmokeScene
        try {
            scene = new SmokeScene(container, cfgRef.current)
        } catch {
            return
        }
        sceneRef.current = scene
        scene.setSize(container.clientWidth, container.clientHeight)
        scene.start()

        const ro = new ResizeObserver(() => {
            scene.setSize(container.clientWidth, container.clientHeight)
        })
        ro.observe(container)
        return () => {
            ro.disconnect()
            scene.dispose()
            sceneRef.current = null
        }
    }, [])

    useEffect(() => {
        sceneRef.current?.updateConfig(cfgRef.current)
    }, [
        smoke,
        deep,
        ember,
        detail,
        turbulence,
        swirl,
        density,
        contrast,
        emberAmount,
        speed,
        hoverBoost,
        sizePercent,
    ])

    return (
        <div
            ref={containerRef}
            role="img"
            aria-label="Smoke vortex"
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minWidth: 160,
                minHeight: 160,
                overflow: "hidden",
                ...style,
            }}
        />
    )
}

SmokeVortex.displayName = "Smoke Vortex"