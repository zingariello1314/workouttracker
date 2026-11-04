/** Aperçu statique. Le WebGL ne démarre que lorsque ce fond est choisi. */
export default function WireTerrain02Thumbnail() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: '#0b0420' }} aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 28%, rgba(255,178,63,0.55) 0%, rgba(255,43,214,0.2) 18%, transparent 42%), repeating-linear-gradient(0deg, transparent 0 10px, rgba(255,43,214,0.35) 10px 11px), repeating-linear-gradient(90deg, transparent 0 14px, rgba(255,43,214,0.22) 14px 15px), radial-gradient(circle at 20% 15%, rgba(255,255,255,0.5) 0 1px, transparent 2px), linear-gradient(180deg,#1a0830 0%,#0b0420 70%)'
        }}
      />
    </div>
  );
}
