/** Aperçu statique. Le WebGL ne démarre que lorsque ce fond est choisi. */
export default function ToonFireballThumbnail() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: '#000000' }} aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 42% 35%, rgba(255,255,255,0.9) 0%, rgba(237,115,99,0.95) 12%, rgba(255,14,14,0.7) 28%, rgba(80,0,0,0.35) 48%, transparent 68%), radial-gradient(ellipse at 55% 70%, rgba(255,14,14,0.35) 0%, transparent 45%), linear-gradient(160deg,#1a0505,#000)'
        }}
      />
    </div>
  );
}
