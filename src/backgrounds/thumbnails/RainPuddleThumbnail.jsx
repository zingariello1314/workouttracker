/** Aperçu statique. Le WebGL ne démarre que lorsque ce fond est choisi. */
export default function RainPuddleThumbnail() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: '#000000' }} aria-hidden="true">
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,#0a1a12 0%,#021008 45%,#000 100%), radial-gradient(ellipse at 50% 75%, rgba(3,102,26,0.55) 0%, transparent 55%), repeating-linear-gradient(185deg,transparent 0 10px,rgba(255,255,255,0.06) 10px 11px)' }} />
    </div>
  );
}
