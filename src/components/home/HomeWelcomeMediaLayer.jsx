import React, { useEffect, useRef } from 'react';

/**
 * Calque d’accueil : image (CSS background) ou vidéo plein écran.
 * Gère play/pause, boucle, mute et arrêt propre au démontage / changement de src.
 */
export default function HomeWelcomeMediaLayer({
  media,
  opacity = 1,
  zIndex = 0,
  active = false,
  sessionMuted = true,
  onVideoEnded,
}) {
  const videoRef = useRef(null);
  const kind = media?.kind === 'video' ? 'video' : 'image';
  const src = media?.src || '';

  // Play / pause / mute — ne jamais stripper `src` ici (sinon React ne le
  // remet pas quand seul `active` change → fond noir).
  useEffect(() => {
    const el = videoRef.current;
    if (!el || kind !== 'video' || !src) return undefined;

    if (!el.getAttribute('src') && src) {
      el.src = src;
    }

    el.loop = Boolean(media?.loop);
    const wantsSound = Boolean(media?.allowSound) && !sessionMuted;
    el.muted = !wantsSound;
    el.defaultMuted = !wantsSound;

    const tryPlay = () => {
      const p = el.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          // Autoplay avec son souvent bloqué : repli muet
          el.muted = true;
          el.play().catch(() => {});
        });
      }
    };

    if (active) tryPlay();
    else {
      try {
        el.pause();
      } catch {
        /* ignore */
      }
    }

    return () => {
      try {
        el.pause();
      } catch {
        /* ignore */
      }
    };
  }, [kind, src, active, media?.loop, media?.allowSound, sessionMuted]);

  // Libération réelle : capturer l’élément (pas videoRef.current au cleanup,
  // sinon après key={src} on strippe la nouvelle vidéo).
  useEffect(() => {
    const el = videoRef.current;
    if (kind !== 'video' || !el) return undefined;
    return () => {
      try {
        el.pause();
        el.removeAttribute('src');
        el.load();
      } catch {
        /* ignore */
      }
    };
  }, [kind, src]);

  if (!src) return null;

  // Images : léger grain d’ambiance. Vidéos : aucun filtre (qualité max).
  const grain =
    kind === 'video' ? null : (
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.4'/%3E%3C/svg%3E")`,
          mixBlendMode: 'overlay',
        }}
      />
    );

  const shellStyle = {
    opacity,
    // Pas de contrast/brightness sur les vidéos (ça les « écrase »)
    ...(kind === 'video' ? {} : { filter: 'contrast(1.05) brightness(0.95)' }),
    transition: 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
    zIndex,
    willChange: 'opacity',
  };

  if (kind === 'video') {
    return (
      <div className="absolute inset-0 overflow-hidden bg-black" style={shellStyle}>
        <video
          ref={videoRef}
          key={src}
          src={src}
          className="absolute inset-0 h-full w-full object-cover"
          playsInline
          autoPlay={active}
          muted={!media?.allowSound || sessionMuted}
          loop={Boolean(media?.loop)}
          preload="auto"
          // Qualité max côté navigateur (évite downscale agressif)
          style={{ imageRendering: 'auto' }}
          onEnded={() => {
            if (!media?.loop && typeof onVideoEnded === 'function') onVideoEnded();
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 bg-cover bg-center bg-no-repeat"
      style={{
        ...shellStyle,
        backgroundImage: `url(${src})`,
      }}
    >
      {grain}
    </div>
  );
}
