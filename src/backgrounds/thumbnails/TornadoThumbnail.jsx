/** Aperçu statique. Le WebGL ne démarre que lorsque ce fond est choisi. */
export default function TornadoThumbnail() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-black" aria-hidden="true">
      <div
        className="absolute left-1/2 top-1/2 h-[160%] w-[160%] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            'repeating-radial-gradient(ellipse at 50% 46%, transparent 0 6px, rgba(255,158,122,0.55) 7px 8px, transparent 9px 14px)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 46%, #000 0 6%, transparent 42%)',
          maskImage: 'radial-gradient(ellipse at 50% 46%, #000 0 6%, transparent 42%)'
        }}
      />
      <div
        className="absolute left-1/2 top-[46%] h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: '#fff6ee', boxShadow: '0 0 16px 6px rgba(255,158,122,0.85)' }}
      />
    </div>
  );
}
