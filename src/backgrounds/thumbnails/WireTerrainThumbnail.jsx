/** Aperçu statique. Le WebGL ne démarre que lorsque ce fond est choisi. */
export default function WireTerrainThumbnail() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: '#000000' }} aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 28%, rgba(255,60,0,0.55) 0%, rgba(177,43,0,0.2) 18%, transparent 42%), repeating-linear-gradient(0deg, transparent 0 10px, rgba(177,43,0,0.35) 10px 11px), repeating-linear-gradient(90deg, transparent 0 14px, rgba(177,43,0,0.22) 14px 15px), linear-gradient(180deg,#1a0800 0%,#000 70%)'
        }}
      />
    </div>
  );
}
