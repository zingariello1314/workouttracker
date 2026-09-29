/** Aperçu statique. Le WebGL ne démarre que lorsque ce fond est choisi. */
export default function ChainVortexThumbnail() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: '#070000' }} aria-hidden="true">
      <div
        className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: 'conic-gradient(from 20deg, transparent 0 12%, rgba(180,180,180,0.85) 16%, transparent 28%, rgba(116,116,116,0.7) 40%, transparent 55%, rgba(200,200,200,0.8) 68%, transparent 82%)',
          filter: 'blur(0.4px)',
          WebkitMaskImage: 'radial-gradient(circle, transparent 18%, #000 32%, #000 70%, transparent 78%)',
          maskImage: 'radial-gradient(circle, transparent 18%, #000 32%, #000 70%, transparent 78%)'
        }}
      />
    </div>
  );
}
