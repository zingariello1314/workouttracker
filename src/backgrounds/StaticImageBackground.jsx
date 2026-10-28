/**
 * Fond d’application statique : image plein écran (cover).
 * Utilisé pour les options `type: 'static'` du registre.
 */
export default function StaticImageBackground({ className = '', params }) {
  const src = typeof params?.src === 'string' ? params.src : '';

  return (
    <div
      className={`absolute inset-0 ${className}`}
      style={{
        pointerEvents: 'none',
        backgroundColor: '#0a0a0a',
        backgroundImage: src ? `url("${src}")` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
      }}
      aria-hidden="true"
    />
  );
}
