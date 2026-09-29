/** Aperçu statique. Le WebGL ne démarre que lorsque ce fond est choisi. */
export default function CosmicThumbnail() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: '#05010f' }} aria-hidden="true">
      <div
        className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: 'radial-gradient(circle, #f4e9ff 0%, #6823c3 18%, #007bff 36%, #9900ff 58%, transparent 72%)',
          filter: 'blur(2px)'
        }}
      />
    </div>
  );
}
