// Utilidades para Agent Daily Journal

/**
 * Verifica si una fecha es un día laboral (lunes a viernes).
 * 
 * Según el Convenio de Colaboración (Cláusula 3.1 y 3.2),
 * los días laborales efectivos son de lunes a viernes.
 * 
 * @param date - Fecha a verificar (Date o string YYYY-MM-DD)
 * @returns true si es día laboral (lunes a viernes), false si es fin de semana
 */
export function isWorkingDay(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const weekday = dateObj.getDay();
  // 0 = domingo, 1 = lunes, ..., 5 = sábado
  // Días laborales: lunes (1) a viernes (5)
  return weekday >= 1 && weekday <= 5;
}

/**
 * Calcula el número de días laborales (lunes a viernes) entre dos fechas.
 * 
 * Para aprobar las métricas de productividad, se debe calcular solo los días laborales,
 * excluyendo sábados y domingos.
 * 
 * @param startDate - Fecha de inicio (incluida)
 * @param endDate - Fecha de fin (incluida)
 * @returns Número de días laborales entre las fechas
 */
export function countWorkingDays(startDate: Date | string, endDate: Date | string): number {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  if (start > end) {
    return 0;
  }
  
  let workingDays = 0;
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  const endDateObj = new Date(end);
  endDateObj.setHours(0, 0, 0, 0);
  
  while (current <= endDateObj) {
    if (isWorkingDay(current)) {
      workingDays++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return workingDays;
}

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

