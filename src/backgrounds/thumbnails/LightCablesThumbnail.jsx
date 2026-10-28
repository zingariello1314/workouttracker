/** Aperçu statique. Le WebGL ne démarre que lorsque ce fond est choisi. */
export default function LightCablesThumbnail() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: '#000000' }} aria-hidden="true">
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 40% 20%, rgba(255,208,0,0.7) 0%, transparent 40%), linear-gradient(180deg,#1a1000,#000), repeating-linear-gradient(90deg,transparent 0 18px,rgba(255,176,0,0.12) 18px 20px)' }} />
    </div>
  );
}
