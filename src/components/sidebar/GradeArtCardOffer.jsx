/**
 * Popup proposé à chaque nouveau grade mérité : appliquer l’illustration
 * comme fond de la carte sidebar.
 */

import React, { useEffect, useState } from 'react';
import { Lock, Sparkles, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSportGrade } from '../../hooks/useSportGrade';
import { useProfileCard } from '../../hooks/useProfileCard';
import {
  SPORT_GRADE_ACCENT,
  SPORT_GRADE_IDS,
  gradeIndex,
  sportGradeArtUrl
} from '../../services/xp/sportGradeCatalog';
import { sportGradeLabel } from '../sport/grades/SportGradeIdentity';
import { useTranslation } from '../../utils/translations';

function offerStoreKey(username) {
  return `momentum.gradeArtOffer.v1.${username || 'guest'}`;
}

function readOfferStore(username) {
  try {
    return JSON.parse(localStorage.getItem(offerStoreKey(username)) || '{}') || {};
  } catch {
    return {};
  }
}

function writeOfferStore(username, store) {
  try {
    localStorage.setItem(offerStoreKey(username), JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

export default function GradeArtCardOffer() {
  const { currentUser } = useAuth();
  const username = currentUser?.username || 'guest';
  const t = useTranslation();
  const { grades, isLoading } = useSportGrade();
  const { selectGradeArt, ensureGradeArtDefault, gradeArtId, cardIconMode } = useProfileCard(username);
  const [offerGradeId, setOfferGradeId] = useState(null);
  const [busy, setBusy] = useState(false);

  const meritedId = grades?.merited?.gradeId || 'novice';

  useEffect(() => {
    if (isLoading || !meritedId) return;

    const store = readOfferStore(username);

    // Première visite : pas de popup, on pose le fond grade + on marque l’existant
    if (!store._initialized) {
      const next = { _initialized: true };
      const mi = gradeIndex(meritedId);
      SPORT_GRADE_IDS.forEach((id, idx) => {
        if (idx <= mi) next[id] = true;
      });
      writeOfferStore(username, next);
      ensureGradeArtDefault(meritedId);
      return;
    }

    if (!store[meritedId]) {
      // Nouveau grade mérité → proposer le fond
      setOfferGradeId(meritedId);
    }
  }, [meritedId, username, isLoading, ensureGradeArtDefault]);

  const dismiss = (apply) => {
    const store = readOfferStore(username);
    store[offerGradeId] = true;
    writeOfferStore(username, store);
    setOfferGradeId(null);
    if (apply && offerGradeId) {
      setBusy(true);
      selectGradeArt(offerGradeId).finally(() => setBusy(false));
    }
  };

  if (!offerGradeId) return null;

  const artUrl = sportGradeArtUrl(offerGradeId);
  const name = sportGradeLabel(offerGradeId, t);
  const accent = SPORT_GRADE_ACCENT[offerGradeId] || '#2dd4bf';
  const already = gradeArtId === offerGradeId && cardIconMode === 'grade';

  return (
    <div
      className="fixed inset-0 z-[12000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="grade-art-offer-title"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b from-[#0a1a18] to-black shadow-2xl">
        <button
          type="button"
          onClick={() => dismiss(false)}
          className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
          aria-label="Fermer"
        >
          <X size={16} />
        </button>
        <div className="relative aspect-[4/3] overflow-hidden bg-black">
          {artUrl ? (
            <img
              src={artUrl}
              alt=""
              className="h-full w-full object-cover"
              style={{ objectPosition: 'center 18%', imageRendering: 'pixelated' }}
            />
          ) : null}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `linear-gradient(180deg, transparent 40%, #000 100%), radial-gradient(ellipse at top, ${accent}33, transparent 55%)`
            }}
          />
        </div>
        <div className="space-y-3 p-5">
          <div className="flex items-center gap-2 text-teal-300">
            <Sparkles size={16} />
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em]">
              Nouveau grade
            </span>
          </div>
          <h2 id="grade-art-offer-title" className="text-xl font-bold text-white">
            {name}
          </h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            {already
              ? 'Cette illustration est déjà sur ta carte de profil.'
              : 'Veux-tu mettre l’image de ce grade sur ta carte de la sidebar (à la place de l’ancienne) ?'}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {!already ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => dismiss(true)}
                className="rounded-lg border border-teal-400/40 bg-teal-500/20 px-3.5 py-2 text-sm font-medium text-teal-100 hover:bg-teal-500/30 disabled:opacity-50"
              >
                {busy ? 'Application…' : 'Oui, l’utiliser sur ma carte'}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => dismiss(false)}
              className="rounded-lg border border-white/15 px-3.5 py-2 text-sm text-zinc-300 hover:bg-white/5"
            >
              {already ? 'Fermer' : 'Non merci'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Badge cadenas pour grades verrouillés (réutilisable). */
export function GradeArtLockHint({ gradeName }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500">
      <Lock size={10} />
      Débloque le grade {gradeName} pour ajouter cette image à ta carte de profil
    </span>
  );
}
