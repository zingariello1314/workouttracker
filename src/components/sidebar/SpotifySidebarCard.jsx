import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Music2, Pause, Play, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import {
  fetchSpotifyCurrentPlayback,
  spotifyNextTrack,
  spotifyPausePlayback,
  spotifyPreviousTrack,
  spotifyResumePlayback,
  spotifySetVolume,
} from '../../utils/spotifyApi';

function formatSeconds(totalSeconds) {
  const sec = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const FALLBACK_ART = 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=500&q=60';

const SPOTIFY_SIDEBAR_EXPANDED_KEY = 'momentum_spotify_sidebar_expanded';

export default function SpotifySidebarCard({ user }) {
  const { setActiveTab } = useWorkout();
  const spotify = user?.spotify || null;
  // Aligné avec SpotifyIntegrationSettings (évite « connecté » côté réglages mais pas ici)
  const connected = !!(spotify?.accessToken && spotify?.userId);
  const [playback, setPlayback] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [volumeUi, setVolumeUi] = useState(null);
  const [volumeBusy, setVolumeBusy] = useState(false);
  const [adjustingVolume, setAdjustingVolume] = useState(false);
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window === 'undefined') return true;
    try {
      const v = localStorage.getItem(SPOTIFY_SIDEBAR_EXPANDED_KEY);
      if (v === '0' || v === 'false') return false;
      return true;
    } catch {
      return true;
    }
  });

  const toggleExpanded = () => {
    setIsExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SPOTIFY_SIDEBAR_EXPANDED_KEY, next ? '1' : '0');
      } catch {
        // ignore
      }
      return next;
    });
  };

  useEffect(() => {
    let cancelled = false;
    let intervalId;

    const pull = async () => {
      if (!connected) {
        if (!cancelled) setPlayback(null);
        return;
      }
      try {
        const now = await fetchSpotifyCurrentPlayback(spotify.accessToken);
        if (!cancelled) setPlayback(now || null);
      } catch {
        if (!cancelled) setPlayback(null);
      }
    };

    pull();
    intervalId = window.setInterval(pull, 15000);
    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [connected, spotify?.accessToken]);

  const refreshPlayback = async () => {
    if (!connected) {
      setPlayback(null);
      return;
    }
    const now = await fetchSpotifyCurrentPlayback(spotify.accessToken);
    setPlayback(now || null);
  };

  const runPlayerAction = async (action) => {
    if (!connected || actionBusy) return;
    setActionError('');
    setActionBusy(true);
    try {
      await action();
      // Spotify peut mettre un instant à refléter l'état ; on re-sync juste après.
      window.setTimeout(() => {
        refreshPlayback().catch(() => {});
      }, 250);
    } catch (e) {
      const raw = String(e?.message || 'Commande Spotify refusée.');
      const normalized = raw.toLowerCase();
      if (normalized.includes('permission') || normalized.includes('scope')) {
        setActionError('Permissions Spotify manquantes. Déconnecte puis reconnecte Spotify dans Paramètres.');
      } else if (normalized.includes('restriction violated')) {
        setActionError('Action refusée par le lecteur Spotify actif. Relance la lecture dans Spotify puis réessaie.');
      } else {
        setActionError(raw);
      }
    } finally {
      setActionBusy(false);
    }
  };

  const track = playback?.item || null;
  const title = track?.name || 'Aucun son en cours';
  const artists = (track?.artists || []).map((a) => a?.name).filter(Boolean).join(', ') || 'Connecte Spotify pour voir la lecture';
  const durationMs = Number(track?.duration_ms) || 0;
  const progressMs = Number(playback?.progress_ms) || 0;
  const progress = durationMs > 0 ? Math.min(100, (progressMs / durationMs) * 100) : 0;
  const volume = Number(playback?.device?.volume_percent);
  const safeVolume = Number.isFinite(volume) ? Math.max(0, Math.min(100, volume)) : 75;
  const activeDeviceId = playback?.device?.id || null;
  const displayedVolume = volumeUi ?? safeVolume;
  const albumArt = track?.album?.images?.[1]?.url || track?.album?.images?.[0]?.url || FALLBACK_ART;
  const statusText = connected
    ? (playback?.is_playing ? 'Lecture en cours' : 'Connecté')
    : 'Non connecté';

  const timeLabel = useMemo(() => {
    if (!durationMs) return '0:00 / 0:00';
    return `${formatSeconds(progressMs / 1000)} / ${formatSeconds(durationMs / 1000)}`;
  }, [durationMs, progressMs]);

  useEffect(() => {
    if (!adjustingVolume) {
      setVolumeUi(safeVolume);
    }
  }, [safeVolume, adjustingVolume]);

  const commitVolume = async (nextVolume) => {
    if (!connected || volumeBusy) return;
    setActionError('');
    setVolumeBusy(true);
    try {
      await spotifySetVolume(spotify.accessToken, nextVolume, activeDeviceId);
      window.setTimeout(() => {
        refreshPlayback().catch(() => {});
      }, 250);
    } catch (e) {
      setActionError(String(e?.message || 'Impossible de régler le volume Spotify.'));
    } finally {
      setVolumeBusy(false);
    }
  };

  return (
    <section className="mb-4 rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-900/55 via-emerald-900/40 to-black p-4 shadow-[0_8px_28px_rgba(0,0,0,0.45)]">
      <div className={`flex items-center justify-between ${isExpanded ? 'mb-3' : ''}`}>
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-3 rounded-xl py-1 text-left outline-none ring-emerald-400/40 transition hover:bg-white/5 focus-visible:ring-2"
          aria-expanded={isExpanded}
          onClick={toggleExpanded}
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black/70">
            <svg viewBox="0 0 24 24" className="h-8 w-8 fill-[#1ED760]">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-semibold text-white">Spotify</p>
            <p className="text-xs text-emerald-100/75">{statusText}</p>
            {!isExpanded && connected ? (
              <p className="truncate text-xs text-emerald-200/70" title={title}>
                {title}
              </p>
            ) : null}
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            className="rounded-full bg-black/40 p-2 text-emerald-100/90 transition hover:bg-black/55"
            aria-label={isExpanded ? 'Replier le module Spotify' : 'Déplier le module Spotify'}
            onClick={(e) => {
              e.stopPropagation();
              toggleExpanded();
            }}
          >
            <ChevronDown
              size={18}
              className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>
          <button
            type="button"
            className="rounded-full bg-black/40 p-2 text-emerald-100/90 transition hover:bg-black/55"
            aria-label="Aller aux paramètres Spotify"
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab('settings');
              window.setTimeout(() => {
                document.getElementById('settings-spotify')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 250);
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {isExpanded ? (
        <>
          <p className="mb-4 text-sm text-emerald-100/80">
            Search for music and podcasts, browse your library, and control playback.
          </p>

          <div className="mx-auto mb-4 h-48 w-48 overflow-hidden rounded-2xl border border-emerald-300/15 bg-black/60">
            <img src={albumArt} alt={title} className="h-full w-full object-cover" />
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-3 rounded-xl bg-black/70 p-3">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-white">{title}</p>
                <p className="truncate text-sm text-emerald-100/75">{artists}</p>
              </div>
              <p className="shrink-0 text-sm text-slate-300">{timeLabel}</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <button
                  type="button"
                  disabled={!connected || actionBusy}
                  className="rounded-full p-1.5 hover:bg-white/10 disabled:opacity-45"
                  aria-label="Précédent"
                  onClick={() => runPlayerAction(() => spotifyPreviousTrack(spotify.accessToken, activeDeviceId))}
                >
                  <SkipBack size={16} />
                </button>
                <button
                  type="button"
                  disabled={!connected || actionBusy}
                  className="rounded-full bg-white p-2 text-black disabled:opacity-45"
                  aria-label={playback?.is_playing ? 'Pause' : 'Lecture'}
                  onClick={() =>
                    runPlayerAction(() =>
                      playback?.is_playing
                        ? spotifyPausePlayback(spotify.accessToken, activeDeviceId)
                        : spotifyResumePlayback(spotify.accessToken, activeDeviceId),
                    )
                  }
                >
                  {playback?.is_playing ? <Pause size={16} /> : <Play size={16} className="translate-x-[1px]" />}
                </button>
                <button
                  type="button"
                  disabled={!connected || actionBusy}
                  className="rounded-full p-1.5 hover:bg-white/10 disabled:opacity-45"
                  aria-label="Suivant"
                  onClick={() => runPlayerAction(() => spotifyNextTrack(spotify.accessToken, activeDeviceId))}
                >
                  <SkipForward size={16} />
                </button>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Volume2 size={15} />
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={displayedVolume}
                  disabled={!connected || volumeBusy}
                  className="w-16 accent-white disabled:opacity-45"
                  aria-label="Volume Spotify"
                  onMouseDown={() => setAdjustingVolume(true)}
                  onTouchStart={() => setAdjustingVolume(true)}
                  onChange={(e) => setVolumeUi(Math.max(0, Math.min(100, Number(e.target.value))))}
                  onMouseUp={() => {
                    setAdjustingVolume(false);
                    commitVolume(volumeUi ?? safeVolume);
                  }}
                  onTouchEnd={() => {
                    setAdjustingVolume(false);
                    commitVolume(volumeUi ?? safeVolume);
                  }}
                  onKeyUp={() => {
                    setAdjustingVolume(false);
                    commitVolume(volumeUi ?? safeVolume);
                  }}
                />
              </div>
            </div>
          </div>

          {actionError ? (
            <p className="mt-2 text-xs text-amber-200/90">
              Spotify: {actionError}
            </p>
          ) : null}

          {!connected ? (
            <p className="mt-2 flex items-center gap-1 text-xs text-amber-200/80">
              <Music2 size={12} />
              Liez Spotify dans Paramètres pour activer ce module.
            </p>
          ) : null}
        </>
      ) : actionError ? (
        <p className="mt-1 text-xs text-amber-200/90">Spotify: {actionError}</p>
      ) : !connected ? (
        <p className="mt-1 flex items-center gap-1 text-xs text-amber-200/80">
          <Music2 size={12} />
          Liez Spotify dans Paramètres.
        </p>
      ) : null}
    </section>
  );
}
