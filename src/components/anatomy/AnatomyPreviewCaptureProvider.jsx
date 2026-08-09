import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { AnatomyModelCanvas } from './AnatomyModelCanvas';
import { buildCardDemandSignature } from '../../utils/anatomy/anatomyPreviewRasterKey';
import { setSessionPreviewUrl } from '../../utils/anatomy/anatomyPreviewSessionCache';
import { loadAnatomyPreviewStemSet } from '../../utils/anatomy/anatomyPreviewStemIndex';

const AnatomyPreviewCaptureContext = createContext(null);

/**
 * Un seul canvas WebGL pour générer les aperçus manquants (file FIFO).
 */
export function AnatomyPreviewCaptureProvider({ children }) {
  const queueRef = useRef([]);
  const [job, setJob] = useState(null);
  const canvasWrapRef = useRef(null);

  const pump = useCallback(() => {
    if (job) return;
    const next = queueRef.current.shift();
    if (next) setJob(next);
  }, [job]);

  const enqueueCapture = useCallback(
    (payload) => {
      const { stem, anatomy } = payload;
      if (!stem || !anatomy) return;
      const exists = queueRef.current.some((j) => j.stem === stem);
      if (exists || (job && job.stem === stem)) return;
      queueRef.current.push(payload);
      pump();
    },
    [job, pump]
  );

  const finishJob = useCallback(
    (dataUrl) => {
      if (job?.stem && dataUrl) {
        setSessionPreviewUrl(job.stem, dataUrl);
      }
      setJob(null);
      window.setTimeout(pump, 0);
    },
    [job, pump]
  );

  const handleSettled = useCallback(() => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const wrap = canvasWrapRef.current;
        const canvas = wrap?.querySelector('canvas');
        if (!canvas || typeof canvas.toDataURL !== 'function') {
          finishJob(null);
          return;
        }
        try {
          const url = canvas.toDataURL('image/jpeg', 0.88);
          finishJob(url);
        } catch {
          finishJob(null);
        }
      });
    });
  }, [finishJob]);

  const demandSignature = useMemo(
    () => (job ? buildCardDemandSignature(job.anatomy) : ''),
    [job]
  );

  const value = useMemo(() => ({ enqueueCapture }), [enqueueCapture]);

  useEffect(() => {
    loadAnatomyPreviewStemSet();
  }, []);

  return (
    <AnatomyPreviewCaptureContext.Provider value={value}>
      {children}
      {job ? (
        <div
          ref={canvasWrapRef}
          className="pointer-events-none fixed left-0 top-0 -z-[9999] h-[480px] w-[384px] opacity-0 overflow-hidden"
          aria-hidden
        >
          <AnatomyModelCanvas
            variant="cardStatic"
            muscleColors={job.anatomy.meshColors}
            uniformBodyColor={job.anatomy.uniformBodyColor}
            viewPreset={job.anatomy.inferredView}
            sceneBackground="#000000"
            dpr={[1, 1]}
            cardDemandSignature={demandSignature}
            onStaticCameraSettled={handleSettled}
            boundsMargin={job.anatomy.cameraTuningOverride?.boundsMargin ?? 0.82}
            cameraDistanceFactor={job.anatomy.cameraTuningOverride?.cameraDistanceFactor ?? 1}
            cameraTargetOffsetY={job.anatomy.cameraTuningOverride?.targetOffsetY ?? 0}
            className="h-full w-full"
          />
        </div>
      ) : null}
    </AnatomyPreviewCaptureContext.Provider>
  );
}

export function useAnatomyPreviewCapture() {
  return useContext(AnatomyPreviewCaptureContext);
}
