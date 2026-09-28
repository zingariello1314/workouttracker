/**
 * Aperçu statique de Saturne. Le rendu Three.js ne tourne que lorsque ce fond est actif.
 */
export default function ParticleSaturnThumbnail() {
  return (
    <div className="absolute inset-0" style={{ backgroundColor: '#07060a' }} aria-hidden="true">
      <div
        className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: 'radial-gradient(circle at 40% 35%, #ffe38a, #c9a227 45%, #5c4308 78%)',
          boxShadow: '0 0 18px rgba(255, 212, 0, 0.45)',
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-14 w-[4.5rem] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-amber-200/80"
        style={{ transform: 'translate(-50%, -50%) rotate(-18deg)', boxShadow: '0 0 12px rgba(255, 212, 0, 0.35)' }}
      />
    </div>
  );
}
