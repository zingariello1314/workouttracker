import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useRubiksPrefs } from '../../hooks/useRubiksPrefs';
import { DEFAULT_SCHEME } from '../../lib/cube/colorScheme';
import { formatMove } from '../../lib/cube/notation';
import { PLAY_SPEEDS, saveRubiksPrefs } from '../../lib/cube/rubiksPrefs';

const EXAMPLES = ['U', "U'", 'U2', 'R', "R'", 'F', 'D', 'L', 'B'];

export default function RubiksSettingsView() {
  const { isFrench } = useLanguage();
  const [prefs, update] = useRubiksPrefs();
  const lang = isFrench ? 'fr' : 'en';
  const opts = { scheme: DEFAULT_SCHEME, mode: prefs.notationMode, lang, compact: false };

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4">
      <header>
        <h2 className="mb-2 text-lg font-bold text-white">Paramètres Rubik&apos;s cube</h2>
        <p className="text-sm text-slate-400">
          Ces choix s&apos;appliquent à tout l&apos;onglet : résolution, chrono, méthodes, démos 3D.
        </p>
      </header>

      <section className="space-y-3 rounded-xl border border-emerald-800/40 bg-emerald-950/20 p-4">
        <h3 className="font-semibold text-emerald-100">Affichage des coups</h3>
        <p className="text-sm text-slate-400">
          La mécanique ne change pas : le cube comprend uniquement la notation WCA. Tu choisis seulement comment on te
          la traduit à l&apos;écran.
        </p>
        {[
          { id: 'wca', label: 'Notation WCA seulement', hint: '« R\' » — compact, standard compétition' },
          { id: 'plain', label: 'Langage clair seulement', hint: 'Face de droite, contre les aiguilles (rouge)' },
          { id: 'both', label: 'Les deux (recommandé)', hint: 'Phrase claire, puis la notation entre « guillemets »' }
        ].map((opt) => (
          <label key={opt.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-800 p-3">
            <input
              type="radio"
              name="notationMode"
              checked={prefs.notationMode === opt.id}
              onChange={() => update({ notationMode: opt.id })}
              className="mt-1"
            />
            <span>
              <span className="block text-sm text-white">{opt.label}</span>
              <span className="text-xs text-slate-500">{opt.hint}</span>
            </span>
          </label>
        ))}
      </section>

      <section className="space-y-3 rounded-xl border border-emerald-800/40 bg-emerald-950/20 p-4">
        <h3 className="font-semibold text-emerald-100">Vitesse de lecture 3D</h3>
        <p className="text-sm text-slate-400">
          S’applique au bouton Lire (résoudre + démos méthodes) et aux tours manuels. ×0,5 = lent et lisible, ×3 = rapide.
        </p>
        <label className="flex items-center gap-3 text-sm text-slate-200">
          <input
            type="range"
            min={0}
            max={PLAY_SPEEDS.length - 1}
            step={1}
            value={Math.max(0, PLAY_SPEEDS.indexOf(prefs.playSpeed))}
            onChange={(e) => update({ playSpeed: PLAY_SPEEDS[Number(e.target.value)] })}
            className="flex-1"
          />
          <span className="tabular-nums text-emerald-200">×{prefs.playSpeed}</span>
        </label>
      </section>
        <h3 className="font-semibold text-white">Ce n&apos;est pas tout à fait les échecs</h3>
        <p>
          Aux échecs, « Nf3 » dit <em>quelle pièce</em> va <em>sur quelle case</em>. Sur un cube, « R » ne déplace pas
          un cubie vers une case : ça <strong>fait pivoter toute une face</strong> (9 stickers) d&apos;un quart de tour.
          Il n&apos;y a pas de prise (« x »), pas de joueur blanc/noir, pas d&apos;échec au roi.
        </p>
        <p>
          Le point commun, c&apos;est seulement le <strong>cahier de parties</strong> : une suite courte de symboles pour
          rejouer la même chose. « R U R&apos; U&apos; » est une partition, comme « 1. e4 e5 ».
        </p>
        <ul className="list-disc space-y-2 pl-5 text-slate-400">
          <li>
            Lettres de faces (anglais, figées) : « U » = Up (haut), « D » = Down (dessous), « F » = Front (devant), « B »
            = Back (derrière), « R » = Right (droite), « L » = Left (gauche). Ce n&apos;est pas la couleur : si tu mets
            le jaune en haut, « U » reste « la face du haut », devenue jaune.
          </li>
          <li>
            Lettre seule « R » = un quart de tour <strong>dans le sens des aiguilles d&apos;une montre</strong>, en
            regardant cette face (comme une horloge posée sur la face).
          </li>
          <li>
            Apostrophe « R&apos; » (on dit « R prime ») = le même quart, <strong>contre</strong> les aiguilles. Ce n&apos;est
            pas une pièce noire, ni un « échec ».
          </li>
          <li>
            « R2 » = demi-tour (180°). « R2 » et « R2&apos; » sont le même mouvement.
          </li>
          <li>
            Les coups se lisent dans <strong>ta tenue</strong> : U = ce que tu as choisi comme haut, F = ce que tu as
            choisi comme devant. Ce n&apos;est pas « toujours le blanc » si tu as changé la tenue.
          </li>
        </ul>
      </section>

      <section className="rounded-xl border border-slate-800 p-4">
        <h3 className="mb-3 font-semibold text-white">Traduction des symboles (tenue WCA : blanc haut, vert devant)</h3>
        <ul className="space-y-2 text-sm text-slate-300">
          {EXAMPLES.map((tok) => (
            <li key={tok} className="rounded-md bg-black/40 px-3 py-2">
              <span className="font-mono text-emerald-200">« {tok} »</span>
              <span className="text-slate-500"> → </span>
              <span>{formatMove(tok, opts)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-slate-500">
          Aperçu selon le mode choisi plus haut. En mode « les deux », la notation officielle reste entre « guillemets ».
        </p>
      </section>

      <p className="text-xs text-slate-600">
        Préférences enregistrées sur cet appareil ({JSON.stringify(prefs.notationMode)}).{' '}
        <button type="button" className="underline" onClick={() => saveRubiksPrefs({ notationMode: 'both' })}>
          Réinitialiser
        </button>
      </p>
    </div>
  );
}
