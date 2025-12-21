/**
 * Fonction utilitaire pour combiner les classes CSS
 * Combine clsx et tailwind-merge pour gérer les conflits de classes Tailwind
 */

export function cn(...inputs) {
  // Version simple sans dépendances externes
  // Filtre les valeurs null/undefined et joint les classes
  return inputs
    .filter(Boolean)
    .map(input => {
      if (typeof input === 'string') return input;
      if (typeof input === 'object' && input !== null) {
        return Object.entries(input)
          .filter(([_, value]) => value)
          .map(([key]) => key)
          .join(' ');
      }
      return '';
    })
    .filter(Boolean)
    .join(' ');
}

