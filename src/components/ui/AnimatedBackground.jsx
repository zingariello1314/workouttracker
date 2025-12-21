import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * Composant ShaderPlane - Rendu du shader animé
 * 
 * Ce composant crée un plan 2D qui affiche le shader de fragment
 * avec animation basée sur le temps.
 */
const ShaderPlane = ({
	vertexShader,
	fragmentShader,
	uniforms,
}) => {
	const meshRef = useRef(null);
	const { size } = useThree();

	// Mise à jour des uniforms à chaque frame pour l'animation
	useFrame((state) => {
		if (meshRef.current) {
			const material = meshRef.current.material;
			if (material && material.uniforms) {
				material.uniforms.u_time.value = state.clock.elapsedTime * 0.5;
				material.uniforms.u_resolution.value.set(size.width, size.height, 1.0);
			}
		}
	});

	return (
		<mesh ref={meshRef}>
			<planeGeometry args={[2, 2]} />
			<shaderMaterial
				vertexShader={vertexShader}
				fragmentShader={fragmentShader}
				uniforms={uniforms}
				side={THREE.FrontSide}
				depthTest={false}
				depthWrite={false}
			/>
		</mesh>
	);
};

/**
 * Vertex Shader - Simple passe-coordonnées UV
 * 
 * Ce shader passe simplement les coordonnées UV au fragment shader.
 */
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

/**
 * Fragment Shader - Effet visuel vert animé
 * 
 * Ce shader crée l'effet de lignes vertes tourbillonnantes
 * avec des transformations polaires et des rotations.
 */
const fragmentShader = `
  precision highp float;

  varying vec2 vUv;
  uniform float u_time;
  uniform vec3 u_resolution;

  vec2 toPolar(vec2 p) {
      float r = length(p);
      float a = atan(p.y, p.x);
      return vec2(r, a);
  }

  vec2 fromPolar(vec2 polar) {
      return vec2(cos(polar.y), sin(polar.y)) * polar.x;
  }

  void mainImage(out vec4 fragColor, in vec2 fragCoord) {
      vec2 p = 6.0 * ((fragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y);

      vec2 polar = toPolar(p);
      float r = polar.x;
      float a = polar.y;

      vec2 i = p;
      float c = 0.0;
      float rot = r + u_time + p.x * 0.100;
      for (float n = 0.0; n < 4.0; n++) {
          float rr = r + 0.15 * sin(u_time*0.7 + float(n) + r*2.0);
          p *= mat2(
              cos(rot - sin(u_time / 10.0)), sin(rot),
              -sin(cos(rot) - u_time / 10.0), cos(rot)
          ) * -0.25;

          float t = r - u_time / (n + 30.0);
          i -= p + sin(t - i.y) + rr;

          c += 2.2 / length(vec2(
              (sin(i.x + t) / 0.15),
              (cos(i.y + t) / 0.15)
          ));
      }

      c /= 8.0;

      vec3 baseColor = vec3(0.2, 0.7, 0.5);
      vec3 finalColor = baseColor * smoothstep(0.0, 1.0, c * 0.6);

      fragColor = vec4(finalColor, 1.0);
  }

  void main() {
      vec4 fragColor;
      vec2 fragCoord = vUv * u_resolution.xy;
      mainImage(fragColor, fragCoord);
      gl_FragColor = fragColor;
  }
`;

/**
 * Composant AnimatedBackground
 * 
 * Composant réutilisable qui affiche uniquement le fond animé vert.
 * Le fond est en position fixed pour occuper toute la page (viewport).
 * 
 * @param {Object} props
 * @param {string} props.className - Classes CSS additionnelles
 */
const AnimatedBackground = ({ className = "" }) => {
	const shaderUniforms = useMemo(
		() => ({
			u_time: { value: 0 },
			u_resolution: { value: new THREE.Vector3(1, 1, 1) },
		}),
		[],
	);

	return (
		<div
			className={`fixed inset-0 ${className}`}
			style={{ 
				pointerEvents: 'none', 
				width: '100vw', 
				height: '100vh',
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				zIndex: -1, // Derrière tout le reste
				// Fond de fallback pendant le chargement du Canvas (couleur de base du shader)
				backgroundColor: '#0a2e1a', // Vert foncé correspondant à vec3(0.2, 0.7, 0.5) du shader
			}}
		>
			<Canvas
				style={{ width: '100%', height: '100%' }}
				gl={{ 
					antialias: true, 
					alpha: false,
					// Optimisations pour réduire le flash
					powerPreference: 'high-performance',
					preserveDrawingBuffer: false,
				}}
			>
				<ShaderPlane
					vertexShader={vertexShader}
					fragmentShader={fragmentShader}
					uniforms={shaderUniforms}
				/>
			</Canvas>
		</div>
	);
};

export default AnimatedBackground;

