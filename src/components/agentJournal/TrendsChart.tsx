// TrendsChart - Gráfico de líneas para tendencias

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { TrendDataPoint } from '@/types/agentJournal';
import { parseISO } from 'date-fns';
import { Skeleton } from '@/components/common/Skeleton';

interface TrendsChartProps {
  data: TrendDataPoint[];
  metric: 'calls' | 'time' | 'tasks' | 'notes';
  loading?: boolean;
}

export function TrendsChart({ data, metric, loading = false }: TrendsChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tendencias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-gray-500">
            No hay datos disponibles
          </div>
        </CardContent>
      </Card>
    );
  }

  // Preparar datos para el gráfico
  const chartData = data.map((item) => {
    const date = parseISO(item.date);
    const metricValue = metric === 'calls' ? item.total_calls :
                        metric === 'time' ? Math.round(item.total_call_time_seconds / 60) : // minutos
                        metric === 'tasks' ? item.tasks_completed :
                        item.notes_created;

    // Formatear fecha usando Intl.DateTimeFormat (consistente con el código existente)
    const fechaCorta = new Intl.DateTimeFormat('es-ES', { 
      weekday: 'short', 
      day: '2-digit' 
    }).format(date); // "lun. 29"
    
    const fechaCompleta = new Intl.DateTimeFormat('es-ES', { 
      day: '2-digit',
      month: '2-digit'
    }).format(date); // "29/01"

    return {
      fecha: fechaCorta,
      valor: metricValue,
      fechaCompleta: fechaCompleta,
    };
  });

  const metricLabels = {
    calls: 'Llamadas',
    time: 'Tiempo (min)',
    tasks: 'Tareas Completadas',
    notes: 'Notas Creadas',
  };

  const colors = {
    calls: '#3B82F6',
    time: '#8B5CF6',
    tasks: '#10B981',
    notes: '#F59E0B',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendencia: {metricLabels[metric]}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="fecha" 
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
              labelFormatter={(label) => `Fecha: ${chartData.find(d => d.fecha === label)?.fechaCompleta || label}`}
              formatter={(value: number | undefined) => [value ?? 0, metricLabels[metric]]}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="valor" 
              stroke={colors[metric]} 
              strokeWidth={2}
              dot={{ fill: colors[metric], r: 4 }}
              activeDot={{ r: 6 }}
              name={metricLabels[metric]}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

