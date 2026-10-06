/** Aperçu statique. Le WebGL ne démarre que lorsque ce fond est choisi. */
export default function LatticeFlightThumbnail() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: '#000000' }} aria-hidden="true">
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 45%, rgba(0,255,255,0.55) 0%, transparent 55%), linear-gradient(180deg,#001018,#000)' }} />
    </div>
  );
}
