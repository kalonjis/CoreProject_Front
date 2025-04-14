/**
 * Formate une date en texte relatif (par exemple: "il y a 2 heures", "hier", etc.)
 * @param dateString La date à formater, au format ISO ou timestamp
 * @returns Une chaîne de caractères représentant la durée relative
 */
export function formatRelative(dateString: string | number | Date | null): string {
  if (!dateString) return 'Date inconnue';

  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Si la date est dans le futur
  if (diffInSeconds < 0) {
    return 'Dans le futur';
  }

  // Moins d'une minute
  if (diffInSeconds < 60) {
    return `Il y a ${diffInSeconds} seconde${diffInSeconds > 1 ? 's' : ''}`;
  }

  // Moins d'une heure
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
  }

  // Moins d'un jour
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
  }

  // Moins d'une semaine
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    if (diffInDays === 1) {
      return 'Hier';
    }
    return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
  }

  // Moins d'un mois (approximatif)
  if (diffInDays < 30) {
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `Il y a ${diffInWeeks} semaine${diffInWeeks > 1 ? 's' : ''}`;
  }

  // Moins d'un an
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `Il y a ${diffInMonths} mois`;
  }

  // Plus d'un an
  const diffInYears = Math.floor(diffInMonths / 12);
  return `Il y a ${diffInYears} an${diffInYears > 1 ? 's' : ''}`;
}
