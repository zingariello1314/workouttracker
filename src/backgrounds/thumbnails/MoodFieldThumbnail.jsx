/** Aperçu statique. Le WebGL ne démarre que lorsque ce fond est choisi. */
export default function MoodFieldThumbnail() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: '#05060a' }} aria-hidden="true">
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 35% 40%, rgba(255,0,179,0.55) 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(47,107,255,0.45) 0%, transparent 55%), linear-gradient(160deg,#05060a,#120818)' }} />
    </div>
  );
}
