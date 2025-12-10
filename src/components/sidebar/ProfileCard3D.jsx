import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { useProfileCard } from '../../hooks/useProfileCard';
import ProfileCardSettings from './ProfileCardSettings';
import './ProfileCard3D.css';

const DEFAULT_INNER_GRADIENT = 'linear-gradient(145deg,#60496e8c 0%,#71C4FF44 100%)';

const ANIMATION_CONFIG = {
  INITIAL_DURATION: 1200,
  INITIAL_X_OFFSET: 70,
  INITIAL_Y_OFFSET: 60,
  DEVICE_BETA_OFFSET: 20,
  ENTER_TRANSITION_MS: 180
};

const clamp = (v, min = 0, max = 100) => Math.min(Math.max(v, min), max);
const round = (v, precision = 3) => parseFloat(v.toFixed(precision));
const adjust = (v, fMin, fMax, tMin, tMax) => round(tMin + ((tMax - tMin) * (v - fMin)) / (fMax - fMin));

const ProfileCard3D = ({
  username,
  grainUrl,
  innerGradient,
  behindGlowEnabled = true,
  behindGlowColor,
  behindGlowSize,
  className = '',
  enableTilt = true,
  enableMobileTilt = false,
  mobileTiltSensitivity = 5,
  contactText = 'Profil',
  showUserInfo = true,
  onContactClick
}) => {
  // État pour forcer le rechargement
  const [refreshKey, setRefreshKey] = useState(0);

  // Système de double layer pour transitions fluides (comme HomePage)
  // CardIcon layers
  const [cardIconLayer0, setCardIconLayer0] = useState(null);
  const [cardIconLayer1, setCardIconLayer1] = useState(null);
  const [cardIconLayer0Opacity, setCardIconLayer0Opacity] = useState(1);
  const [cardIconLayer1Opacity, setCardIconLayer1Opacity] = useState(0);
  const [activeCardIconLayer, setActiveCardIconLayer] = useState(0);

  // Avatar layers
  const [avatarLayer0, setAvatarLayer0] = useState(null);
  const [avatarLayer1, setAvatarLayer1] = useState(null);
  const [avatarLayer0Opacity, setAvatarLayer0Opacity] = useState(1);
  const [avatarLayer1Opacity, setAvatarLayer1Opacity] = useState(0);
  const [activeAvatarLayer, setActiveAvatarLayer] = useState(0);

  // Utiliser le hook pour récupérer les données du profil
  const {
    avatarUrl,
    handle,
    title,
    status,
    cardIconUrl,
    username: currentUsername,
    refresh
  } = useProfileCard(username);

  const name = currentUsername || username || 'Utilisateur';
  
  // CORRECTION: Avatar = petite image ronde, CardIcon = grande image de fond
  // Ne jamais afficher le logo - seulement les images uploadées
  // Filtrer les URLs invalides ou vides
  const finalAvatarUrl = avatarUrl && 
                         avatarUrl !== '/logo.png' && 
                         avatarUrl.startsWith('data:image/') && 
                         avatarUrl.length > 50 ? avatarUrl : null;
  
  const finalCardIconUrl = cardIconUrl && 
                           cardIconUrl !== '/logo.png' && 
                           cardIconUrl.startsWith('data:image/') && 
                           cardIconUrl.length > 50 ? cardIconUrl : null;

  // Gérer les transitions fluides pour cardIcon (système double layer)
  useEffect(() => {
    if (!finalCardIconUrl) {
      setCardIconLayer0(null);
      setCardIconLayer1(null);
      return;
    }

    // Premier chargement
    if (!cardIconLayer0 && !cardIconLayer1) {
      setCardIconLayer0(finalCardIconUrl);
      setCardIconLayer0Opacity(1);
      setActiveCardIconLayer(0);
      return;
    }

    // Changement d'image - utiliser le layer inactif
    const inactiveLayer = activeCardIconLayer === 0 ? 1 : 0;
    
    if (inactiveLayer === 1) {
      // Charger dans layer 1
      setCardIconLayer1(finalCardIconUrl);
      // Crossfade
      setCardIconLayer1Opacity(1);
      setCardIconLayer0Opacity(0);
      setActiveCardIconLayer(1);
    } else {
      // Charger dans layer 0
      setCardIconLayer0(finalCardIconUrl);
      // Crossfade
      setCardIconLayer0Opacity(1);
      setCardIconLayer1Opacity(0);
      setActiveCardIconLayer(0);
    }
  }, [finalCardIconUrl]);

  // Gérer les transitions fluides pour avatar (système double layer)
  useEffect(() => {
    if (!finalAvatarUrl) {
      setAvatarLayer0(null);
      setAvatarLayer1(null);
      return;
    }

    // Premier chargement
    if (!avatarLayer0 && !avatarLayer1) {
      setAvatarLayer0(finalAvatarUrl);
      setAvatarLayer0Opacity(1);
      setActiveAvatarLayer(0);
      return;
    }

    // Changement d'image - utiliser le layer inactif
    const inactiveLayer = activeAvatarLayer === 0 ? 1 : 0;
    
    if (inactiveLayer === 1) {
      // Charger dans layer 1
      setAvatarLayer1(finalAvatarUrl);
      // Crossfade
      setAvatarLayer1Opacity(1);
      setAvatarLayer0Opacity(0);
      setActiveAvatarLayer(1);
    } else {
      // Charger dans layer 0
      setAvatarLayer0(finalAvatarUrl);
      // Crossfade
      setAvatarLayer0Opacity(1);
      setAvatarLayer1Opacity(0);
      setActiveAvatarLayer(0);
    }
  }, [finalAvatarUrl]);

  // État pour le modal de paramètres
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const wrapRef = useRef(null);
  const shellRef = useRef(null);

  const enterTimerRef = useRef(null);
  const leaveRafRef = useRef(null);

  const tiltEngine = useMemo(() => {
    if (!enableTilt) return null;

    let rafId = null;
    let running = false;
    let lastTs = 0;

    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;

    const DEFAULT_TAU = 0.14;
    const INITIAL_TAU = 0.6;
    let initialUntil = 0;

    const setVarsFromXY = (x, y) => {
      const shell = shellRef.current;
      const wrap = wrapRef.current;
      if (!shell || !wrap) return;

      const width = shell.clientWidth || 1;
      const height = shell.clientHeight || 1;

      const percentX = clamp((100 / width) * x);
      const percentY = clamp((100 / height) * y);

      const centerX = percentX - 50;
      const centerY = percentY - 50;

      const properties = {
        '--pointer-x': `${percentX}%`,
        '--pointer-y': `${percentY}%`,
        '--background-x': `${adjust(percentX, 0, 100, 35, 65)}%`,
        '--background-y': `${adjust(percentY, 0, 100, 35, 65)}%`,
        '--pointer-from-center': `${clamp(Math.hypot(percentY - 50, percentX - 50) / 50, 0, 1)}`,
        '--pointer-from-top': `${percentY / 100}`,
        '--pointer-from-left': `${percentX / 100}`,
        '--rotate-x': `${round(-(centerX / 5))}deg`,
        '--rotate-y': `${round(centerY / 4)}deg`
      };

      for (const [k, v] of Object.entries(properties)) wrap.style.setProperty(k, v);
    };

    const step = ts => {
      if (!running) return;
      if (lastTs === 0) lastTs = ts;
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;

      const tau = ts < initialUntil ? INITIAL_TAU : DEFAULT_TAU;
      const k = 1 - Math.exp(-dt / tau);

      currentX += (targetX - currentX) * k;
      currentY += (targetY - currentY) * k;

      setVarsFromXY(currentX, currentY);

      const stillFar = Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05;

      if (stillFar || document.hasFocus()) {
        rafId = requestAnimationFrame(step);
      } else {
        running = false;
        lastTs = 0;
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      }
    };

    const start = () => {
      if (running) return;
      running = true;
      lastTs = 0;
      rafId = requestAnimationFrame(step);
    };

    return {
      setImmediate(x, y) {
        currentX = x;
        currentY = y;
        setVarsFromXY(currentX, currentY);
      },
      setTarget(x, y) {
        targetX = x;
        targetY = y;
        start();
      },
      toCenter() {
        const shell = shellRef.current;
        if (!shell) return;
        this.setTarget(shell.clientWidth / 2, shell.clientHeight / 2);
      },
      beginInitial(durationMs) {
        initialUntil = performance.now() + durationMs;
        start();
      },
      getCurrent() {
        return { x: currentX, y: currentY, tx: targetX, ty: targetY };
      },
      cancel() {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
        running = false;
        lastTs = 0;
      }
    };
  }, [enableTilt]);

  const getOffsets = (evt, el) => {
    const rect = el.getBoundingClientRect();
    return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
  };

  const handlePointerMove = useCallback(
    event => {
      const shell = shellRef.current;
      if (!shell || !tiltEngine) return;
      const { x, y } = getOffsets(event, shell);
      tiltEngine.setTarget(x, y);
    },
    [tiltEngine]
  );

  const handlePointerEnter = useCallback(
    event => {
      const shell = shellRef.current;
      if (!shell || !tiltEngine) return;

      shell.classList.add('active');
      shell.classList.add('entering');
      if (enterTimerRef.current) window.clearTimeout(enterTimerRef.current);
      enterTimerRef.current = window.setTimeout(() => {
        shell.classList.remove('entering');
      }, ANIMATION_CONFIG.ENTER_TRANSITION_MS);

      const { x, y } = getOffsets(event, shell);
      tiltEngine.setTarget(x, y);
    },
    [tiltEngine]
  );

  const handlePointerLeave = useCallback(() => {
    const shell = shellRef.current;
    if (!shell || !tiltEngine) return;

    tiltEngine.toCenter();

    const checkSettle = () => {
      const { x, y, tx, ty } = tiltEngine.getCurrent();
      const settled = Math.hypot(tx - x, ty - y) < 0.6;
      if (settled) {
        shell.classList.remove('active');
        leaveRafRef.current = null;
      } else {
        leaveRafRef.current = requestAnimationFrame(checkSettle);
      }
    };
    if (leaveRafRef.current) cancelAnimationFrame(leaveRafRef.current);
    leaveRafRef.current = requestAnimationFrame(checkSettle);
  }, [tiltEngine]);

  const handleDeviceOrientation = useCallback(
    event => {
      const shell = shellRef.current;
      if (!shell || !tiltEngine) return;

      const { beta, gamma } = event;
      if (beta == null || gamma == null) return;

      const centerX = shell.clientWidth / 2;
      const centerY = shell.clientHeight / 2;
      const x = clamp(centerX + gamma * mobileTiltSensitivity, 0, shell.clientWidth);
      const y = clamp(
        centerY + (beta - ANIMATION_CONFIG.DEVICE_BETA_OFFSET) * mobileTiltSensitivity,
        0,
        shell.clientHeight
      );

      tiltEngine.setTarget(x, y);
    },
    [tiltEngine, mobileTiltSensitivity]
  );

  useEffect(() => {
    if (!enableTilt || !tiltEngine) return;

    const shell = shellRef.current;
    if (!shell) return;

    const pointerMoveHandler = handlePointerMove;
    const pointerEnterHandler = handlePointerEnter;
    const pointerLeaveHandler = handlePointerLeave;
    const deviceOrientationHandler = handleDeviceOrientation;

    shell.addEventListener('pointerenter', pointerEnterHandler);
    shell.addEventListener('pointermove', pointerMoveHandler);
    shell.addEventListener('pointerleave', pointerLeaveHandler);

    const handleClick = () => {
      if (!enableMobileTilt || location.protocol !== 'https:') return;
      const anyMotion = window.DeviceMotionEvent;
      if (anyMotion && typeof anyMotion.requestPermission === 'function') {
        anyMotion
          .requestPermission()
          .then(state => {
            if (state === 'granted') {
              window.addEventListener('deviceorientation', deviceOrientationHandler);
            }
          })
          .catch(console.error);
      } else {
        window.addEventListener('deviceorientation', deviceOrientationHandler);
      }
    };
    shell.addEventListener('click', handleClick);

    const initialX = (shell.clientWidth || 0) - ANIMATION_CONFIG.INITIAL_X_OFFSET;
    const initialY = ANIMATION_CONFIG.INITIAL_Y_OFFSET;
    tiltEngine.setImmediate(initialX, initialY);
    tiltEngine.toCenter();
    tiltEngine.beginInitial(ANIMATION_CONFIG.INITIAL_DURATION);

    return () => {
      shell.removeEventListener('pointerenter', pointerEnterHandler);
      shell.removeEventListener('pointermove', pointerMoveHandler);
      shell.removeEventListener('pointerleave', pointerLeaveHandler);
      shell.removeEventListener('click', handleClick);
      window.removeEventListener('deviceorientation', deviceOrientationHandler);
      if (enterTimerRef.current) window.clearTimeout(enterTimerRef.current);
      if (leaveRafRef.current) cancelAnimationFrame(leaveRafRef.current);
      tiltEngine.cancel();
      shell.classList.remove('entering');
    };
  }, [
    enableTilt,
    enableMobileTilt,
    tiltEngine,
    handlePointerMove,
    handlePointerEnter,
    handlePointerLeave,
    handleDeviceOrientation
  ]);

  const cardStyle = useMemo(
    () => ({
      '--icon': 'none', // Toujours none - on n'utilise plus cette variable CSS
      '--grain': grainUrl ? `url(${grainUrl})` : 'none',
      '--inner-gradient': innerGradient ?? DEFAULT_INNER_GRADIENT,
      '--behind-glow-color': behindGlowColor ?? 'rgba(125, 190, 255, 0.67)',
      '--behind-glow-size': behindGlowSize ?? '50%'
    }),
    [grainUrl, innerGradient, behindGlowColor, behindGlowSize]
  );

  // Recharger les données quand refreshKey change
  useEffect(() => {
    if (refreshKey > 0 && refresh) {
      console.log('[ProfileCard3D] Refreshing data after settings close...');
      refresh();
    }
  }, [refreshKey, refresh]);

  // Log pour debug
  useEffect(() => {
    console.log('[ProfileCard3D] cardIconUrl changed:', cardIconUrl);
    console.log('[ProfileCard3D] finalCardIconUrl:', finalCardIconUrl);
  }, [cardIconUrl, finalCardIconUrl]);

  const handleContactClick = useCallback(() => {
    if (onContactClick) {
      onContactClick();
    } else {
      // Par défaut, ouvrir les paramètres
      setIsSettingsOpen(true);
    }
  }, [onContactClick]);

  const handleSettingsClose = useCallback(() => {
    console.log('[ProfileCard3D] Settings closed, refreshing data...');
    setIsSettingsOpen(false);
    // Force un rechargement des données
    setRefreshKey(prev => prev + 1);
    if (refresh) {
      refresh();
    }
  }, [refresh]);

  return (
    <>
      <div ref={wrapRef} className={`pc-card-wrapper ${className}`.trim()} style={cardStyle}>
        {behindGlowEnabled && <div className="pc-behind" />}
        <div ref={shellRef} className="pc-card-shell">
          <section className="pc-card">
            <div className="pc-inside">
              {/* Double layer system pour transitions fluides (comme HomePage) */}
              {/* Layer 0 - CardIcon */}
              {cardIconLayer0 && (
                <div 
                  className="pc-card-icon"
                  style={{
                    opacity: cardIconLayer0Opacity,
                    transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    zIndex: activeCardIconLayer === 0 ? 2 : 1,
                    willChange: 'opacity'
                  }}
                >
                  <img 
                    src={cardIconLayer0} 
                    alt="Card background layer 0" 
                    onLoad={() => console.log('[ProfileCard3D] Layer 0 loaded')}
                    onError={() => console.error('[ProfileCard3D] Layer 0 failed')}
                  />
                </div>
              )}
              
              {/* Layer 1 - CardIcon */}
              {cardIconLayer1 && (
                <div 
                  className="pc-card-icon"
                  style={{
                    opacity: cardIconLayer1Opacity,
                    transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    zIndex: activeCardIconLayer === 1 ? 2 : 1,
                    willChange: 'opacity'
                  }}
                >
                  <img 
                    src={cardIconLayer1} 
                    alt="Card background layer 1" 
                    onLoad={() => console.log('[ProfileCard3D] Layer 1 loaded')}
                    onError={() => console.error('[ProfileCard3D] Layer 1 failed')}
                  />
                </div>
              )}
              <div className="pc-shine" />
              <div className="pc-glare" />
              <div className="pc-content pc-avatar-content">
                {/* NE RIEN AFFICHER ICI - L'image de fond est déjà dans pc-card-icon */}
                {/* L'avatar (image de profil) n'apparaît QUE dans le petit cercle en bas */}
              </div>
              <div className="pc-content">
                <div className="pc-details">
                  <h3>{name}</h3>
                  <p>{title}</p>
                </div>
              </div>
              {/* Rectangle utilisateur HORS de pc-avatar-content pour éviter le mix-blend-mode */}
              {showUserInfo && (
                <div className="pc-user-info">
                  <div className="pc-user-details">
                    {/* Mini avatar avec double layer pour transitions fluides */}
                    {(avatarLayer0 || avatarLayer1) && (
                      <div className="pc-mini-avatar">
                        {/* Layer 0 - Avatar */}
                        {avatarLayer0 && (
                          <img
                            src={avatarLayer0}
                            alt={`${name || 'User'} avatar layer 0`}
                            loading="lazy"
                            style={{
                              opacity: avatarLayer0Opacity,
                              transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              zIndex: activeAvatarLayer === 0 ? 2 : 1,
                              willChange: 'opacity'
                            }}
                            onLoad={() => console.log('[ProfileCard3D] Avatar layer 0 loaded')}
                            onError={() => console.error('[ProfileCard3D] Avatar layer 0 failed')}
                          />
                        )}
                        
                        {/* Layer 1 - Avatar */}
                        {avatarLayer1 && (
                          <img
                            src={avatarLayer1}
                            alt={`${name || 'User'} avatar layer 1`}
                            loading="lazy"
                            style={{
                              opacity: avatarLayer1Opacity,
                              transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              zIndex: activeAvatarLayer === 1 ? 2 : 1,
                              willChange: 'opacity'
                            }}
                            onLoad={() => console.log('[ProfileCard3D] Avatar layer 1 loaded')}
                            onError={() => console.error('[ProfileCard3D] Avatar layer 1 failed')}
                          />
                        )}
                      </div>
                    )}
                    <div className="pc-user-text">
                      <div className="pc-handle">@{handle}</div>
                      <div className="pc-status">{status}</div>
                    </div>
                  </div>
                  <button
                    className="pc-contact-btn"
                    onClick={handleContactClick}
                    style={{ pointerEvents: 'auto' }}
                    type="button"
                    aria-label={`Contact ${name || 'user'}`}
                  >
                    {contactText}
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Modal de paramètres */}
      <ProfileCardSettings
        username={username}
        isOpen={isSettingsOpen}
        onClose={handleSettingsClose}
      />
    </>
  );
};

export default React.memo(ProfileCard3D);
