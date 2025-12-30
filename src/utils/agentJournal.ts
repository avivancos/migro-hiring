// Utilidades para Agent Daily Journal

/**
 * Formatea tiempo de llamada de segundos a string legible
 */
export function formatCallTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}min`;
}

/**
 * Formatea porcentaje de cambio
 */
export function formatChangePercentage(change: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
}

/**
 * Obtiene color según productividad
 */
export function getProductivityColor(score: number | null): 'green' | 'yellow' | 'orange' | 'red' | 'gray' {
  if (score === null) return 'gray';
  if (score >= 80) return 'green';
  if (score >= 60) return 'yellow';
  if (score >= 40) return 'orange';
  return 'red';
}

/**
 * Obtiene clase CSS para color de productividad
 */
export function getProductivityColorClass(score: number | null): string {
  const color = getProductivityColor(score);
  const colorMap = {
    green: 'bg-green-100 text-green-800 border-green-300',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    orange: 'bg-orange-100 text-orange-800 border-orange-300',
    red: 'bg-red-100 text-red-800 border-red-300',
    gray: 'bg-gray-100 text-gray-800 border-gray-300',
  };
  return colorMap[color];
}

