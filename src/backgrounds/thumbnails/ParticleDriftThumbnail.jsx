/** Aperçu statique. Le WebGL ne démarre que lorsque ce fond est choisi. */
export default function ParticleDriftThumbnail() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: '#030509' }} aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 30% 40%, rgba(255,255,255,0.7) 0 1.5px, transparent 3px), radial-gradient(circle at 70% 55%, rgba(253,253,0,0.8) 0 2px, transparent 4px), radial-gradient(circle at 50% 25%, rgba(255,255,255,0.45) 0 1px, transparent 2px), linear-gradient(160deg, rgba(255,255,255,0.08), transparent 40%), linear-gradient(180deg,#030509,#000)'
        }}
      />
    </div>
  );
}
