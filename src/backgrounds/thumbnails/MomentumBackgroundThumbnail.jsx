/**
 * Aperçu statique du fond Momentum.
 * N’instancie pas le shader WebGL : une seule animation doit tourner à la fois.
 */
export default function MomentumBackgroundThumbnail() {
  return (
    <div
      className="absolute inset-0"
      style={{ backgroundColor: '#0a2e1a' }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 20% 80%, rgba(32, 140, 96, 0.85), transparent 60%), radial-gradient(ellipse 70% 50% at 80% 20%, rgba(16, 92, 64, 0.9), transparent 55%), radial-gradient(ellipse 40% 40% at 55% 55%, rgba(72, 196, 140, 0.35), transparent 50%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-80"
        style={{
          background:
            'conic-gradient(from 210deg at 40% 60%, transparent 0deg, rgba(46, 180, 120, 0.45) 40deg, transparent 90deg, rgba(12, 70, 48, 0.5) 180deg, transparent 260deg)',
        }}
      />
    </div>
  );
}
