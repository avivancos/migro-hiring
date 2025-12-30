// CallAttemptsChart - Gráfico de barras para intentos de llamada

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { CallAttemptDetail } from '@/types/agentJournal';
import { Skeleton } from '@/components/common/Skeleton';

interface CallAttemptsChartProps {
  data: CallAttemptDetail[];
  loading?: boolean;
}

export function CallAttemptsChart({ data, loading = false }: CallAttemptsChartProps) {
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
          <CardTitle>Intentos de Llamada</CardTitle>
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
  const chartData = data.map((item) => ({
    intento: `Intento ${item.attempt_number}`,
    exitosas: item.successful,
    fallidas: item.failed,
    rechazadas: item.rejected,
    total: item.calls_count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribución de Intentos de Llamada</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="intento" 
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar dataKey="exitosas" stackId="a" fill="#10B981" name="Exitosas" />
            <Bar dataKey="fallidas" stackId="a" fill="#F59E0B" name="Fallidas" />
            <Bar dataKey="rechazadas" stackId="a" fill="#EF4444" name="Rechazadas" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

