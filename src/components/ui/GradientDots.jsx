import React from 'react';
import { motion } from 'framer-motion';

/**
 * Fond animé en grille de points avec dégradés colorés (Framer Motion).
 * @param {object} props
 * @param {number} [props.dotSize=8]
 * @param {number} [props.spacing=10]
 * @param {number} [props.duration=30]
 * @param {number} [props.colorCycleDuration=6]
 * @param {string} [props.backgroundColor='#09090b']
 * @param {number} [props.dotRingOpacity=0.2] opacité du « disque » de chaque point (0–1), au-dessus des couleurs animées
 * @param {number} [props.colorSpread=50] plus bas = halos RGB plus larges / plus intenses sous la grille
 * @param {boolean} [props.enableHueRotate=false] — si true, cycle hue-rotate sur tout le calque (souvent dominé par le cyan/vert) ; false = couleurs RGB fixes comme la démo « propre »
 * @param {string} [props.className]
 */
export function GradientDots({
  dotSize = 9,
  spacing = 9,
  duration = 30,
  colorCycleDuration = 6,
  backgroundColor = '#09090b',
  dotRingOpacity = 0.2,
  colorSpread = 50,
  enableHueRotate = false,
  className = '',
  ...props
}) {
  const hexSpacing = spacing * 1.732;
  const dotRgba = `rgba(250,250,250,${dotRingOpacity})`;
  const fall = `${colorSpread}%`;

  const posFrom = `
          0px 0px, ${spacing / 2}px ${hexSpacing / 2}px,
          0% 0%,
          0% 0%,
          0% 0px
        `;
  const posTo = `
          0px 0px, ${spacing / 2}px ${hexSpacing / 2}px, 800% 400%, 1000% -400%, -1200% -600%, 400% ${hexSpacing}px
        `;
  const posReset = `
          0px 0px, ${spacing / 2}px ${hexSpacing / 2}px, 0% 0%, 0% 0%, 0% 0%, 0% 0%
        `;

  const animate = enableHueRotate
    ? {
        backgroundPosition: [posTo, posReset],
        filter: ['hue-rotate(0deg)', 'hue-rotate(360deg)'],
      }
    : {
        backgroundPosition: [posTo, posReset],
      };

  const transition = enableHueRotate
    ? {
        backgroundPosition: {
          duration,
          ease: 'linear',
          repeat: Number.POSITIVE_INFINITY,
        },
        filter: {
          duration: colorCycleDuration,
          ease: 'linear',
          repeat: Number.POSITIVE_INFINITY,
        },
      }
    : {
        backgroundPosition: {
          duration,
          ease: 'linear',
          repeat: Number.POSITIVE_INFINITY,
        },
      };

  return (
    <motion.div
      className={`absolute inset-0 ${className}`.trim()}
      style={{
        backgroundColor,
        isolation: 'isolate',
        backgroundImage: `
          radial-gradient(circle at 50% 50%, transparent 0.8px, ${dotRgba} 1px ${dotSize}px, transparent ${dotSize}px),
          radial-gradient(circle at 50% 50%, transparent 0.8px, ${dotRgba} 1px ${dotSize}px, transparent ${dotSize}px),
          radial-gradient(circle at 50% 50%, rgba(255,55,55,0.95), transparent ${fall}),
          radial-gradient(circle at 50% 50%, rgba(255,230,40,0.92), transparent ${fall}),
          radial-gradient(circle at 50% 50%, rgba(45,255,130,0.88), transparent ${fall}),
          radial-gradient(ellipse at 50% 50%, rgba(70,130,255,0.95), transparent ${fall})
        `,
        backgroundSize: `
          ${spacing}px ${hexSpacing}px,
          ${spacing}px ${hexSpacing}px,
          200% 200%,
          200% 200%,
          200% 200%,
          200% ${hexSpacing}px
        `,
        backgroundPosition: posFrom,
      }}
      animate={animate}
      transition={transition}
      {...props}
    />
  );
}

export default GradientDots;
