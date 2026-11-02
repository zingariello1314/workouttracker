/** Aperçu statique. Le canvas ne démarre que lorsque ce fond est choisi. */
export default function SnowfallThumbnail() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: '#000000' }} aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.55) 0 1px, transparent 2px), radial-gradient(circle at 70% 45%, rgba(255,255,255,0.4) 0 1px, transparent 2px), radial-gradient(circle at 40% 75%, rgba(255,255,255,0.5) 0 1.5px, transparent 3px), radial-gradient(circle at 85% 20%, rgba(255,255,255,0.35) 0 1px, transparent 2px), linear-gradient(180deg,#050505,#000)'
        }}
      />
    </div>
  );
}
