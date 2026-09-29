/**
 * Aperçu statique. Le WebGL ne démarre que lorsque ce fond est choisi.
 */
export default function AccretionDiscThumbnail() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: '#000000' }} aria-hidden="true">
      <div
        className="absolute left-1/2 top-1/2 h-16 w-24 -translate-x-1/2 -translate-y-1/2 rounded-[50%]"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(160,192,255,0.95) 0%, rgba(25,0,255,0.55) 28%, rgba(25,0,255,0.15) 52%, transparent 70%)',
          transform: 'translate(-50%, -50%) rotate(-18deg)',
          filter: 'blur(0.5px)'
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: 'radial-gradient(circle, #f4f7ff 0%, #7aa2ff 55%, transparent 80%)',
          boxShadow: '0 0 12px rgba(160, 192, 255, 0.8)'
        }}
      />
    </div>
  );
}
