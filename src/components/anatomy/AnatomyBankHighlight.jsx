import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from '../../utils/translations';
import { AnatomyModelCanvas, ANATOMY_VIEW_PRESET_KEYS, BODY_VIEW_PRESETS } from './AnatomyModelCanvas';
import { resolveBankItemAnatomy } from '../../utils/anatomy/resolveBankItemAnatomy';

/**
 * Viewer anatomique pour banque d’exercices / d’étirements : coloration primaire/secondaire,
 * vue par défaut inférée (face / dos / …), ajustable par l’utilisateur.
 */
export default function AnatomyBankHighlight({
  primaryMuscles,
  secondaryMuscles,
  mode = 'exercise',
  compact = false,
  /** Colonne portrait plus haute pour fiche étirement (gain de scroll). */
  portrait = false,
  className = ''
}) {
  const t = useTranslation();
  const anatomy = useMemo(
    () =>
      resolveBankItemAnatomy(
        {
          primaryMuscles,
          secondaryMuscles
        },
        mode
      ),
    [primaryMuscles, secondaryMuscles, mode]
  );

  const [viewPreset, setViewPreset] = useState(anatomy.inferredView);

  useEffect(() => {
    setViewPreset(anatomy.inferredView);
  }, [anatomy.inferredView]);

  const neutralUnmapped =
    anatomy.usedFullBodyUniform && !anatomy.anatomyFallback ? undefined : '#475569';

  const height = portrait
    ? 'min(calc(100vh - 12rem), 540px)'
    : compact
      ? 'min(32vh, 240px)'
      : 'min(48vh, 380px)';

  const exerciseTightCam = mode === 'exercise';

  return (
    <div className={portrait ? `max-w-[min(100%,340px)] mx-auto ${className}` : className}>
      <div
        className="relative w-full rounded-xl overflow-hidden border border-[#0F4C5C]/70 bg-black shadow-inner shadow-black/50 ring-1 ring-[#0F5C45]/25"
        style={{ height }}
      >
        <AnatomyModelCanvas
          muscleColors={anatomy.meshColors}
          uniformBodyColor={anatomy.uniformBodyColor}
          viewPreset={viewPreset in BODY_VIEW_PRESETS ? viewPreset : 'frontLow'}
          autoRotate={false}
          autoRotateSpeed={0}
          className="h-full w-full bg-black"
          neutralUnmapped={neutralUnmapped}
          sceneBackground="#000000"
          controlsEnableZoom={false}
          boundsMargin={exerciseTightCam ? 0.805 : 0.82}
          cameraDistanceFactor={exerciseTightCam ? 0.993 : 1}
        />
      </div>

      {anatomy.anatomyFallback ? (
        <p className="mt-2 text-center text-[10px] text-slate-500 px-1 leading-snug">
          {t(
            'anatomy.bank.fallbackBodyHint',
            'Aucun muscle ne correspond encore au maillage 3D : affichage du corps entier. Tu peux affiner les libellés dans la base.'
          )}
        </p>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center justify-center gap-1">
        {ANATOMY_VIEW_PRESET_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setViewPreset(key)}
            className={`rounded-lg border px-2 py-0.5 text-[10px] font-medium transition ${
              viewPreset === key
                ? 'border-sky-500/70 bg-black text-sky-100 ring-1 ring-[#0F5C45]/35'
                : 'border-[#0F4C5C]/50 bg-black text-slate-400 hover:border-[#0F5C45]/65 hover:text-slate-200'
            }`}
          >
            {t(`recap.bodyView.${key}`)}
          </button>
        ))}
      </div>

      <p className="mt-1.5 text-center text-[10px] text-teal-500/75 px-1">
        {mode === 'stretch' ? t('anatomy.bank.viewHintStretch') : t('anatomy.bank.viewHintExercise')}
      </p>
    </div>
  );
}
