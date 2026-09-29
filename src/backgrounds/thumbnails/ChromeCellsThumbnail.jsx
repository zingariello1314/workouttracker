/** Aperçu statique. Le WebGL ne démarre que lorsque ce fond est choisi. */
export default function ChromeCellsThumbnail() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: '#040405' }} aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 30% 40%, transparent 18%, rgba(220,220,220,0.85) 19.2%, transparent 21%), radial-gradient(circle at 68% 58%, transparent 22%, rgba(255,255,255,0.75) 23%, transparent 25%), radial-gradient(circle at 48% 72%, transparent 14%, rgba(180,180,180,0.7) 15%, transparent 17%)'
        }}
      />
    </div>
  );
}
