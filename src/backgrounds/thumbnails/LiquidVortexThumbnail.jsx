/** Aperçu statique. Le WebGL ne démarre que lorsque ce fond est choisi. */
export default function LiquidVortexThumbnail() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: '#000000' }} aria-hidden="true">
      <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(255,247,0,0.85) 0%, rgba(255,200,0,0.35) 28%, transparent 62%), radial-gradient(ellipse at 50% 55%, rgba(80,40,0,0.5) 0%, #000 70%)' }} />
    </div>
  );
}
