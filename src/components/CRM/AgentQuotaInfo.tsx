// AgentQuotaInfo - Componente para mostrar información de cuota diaria de agentes

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import type { CRMUser, KommoLead } from '@/types/crm';
import { crmService } from '@/services/crmService';

interface AgentQuotaInfoProps {
  agent: CRMUser;
}

export function AgentQuotaInfo({ agent }: AgentQuotaInfoProps) {
  const [leadsToday, setLeadsToday] = useState(0);
  const [incompleteLeadsYesterday, setIncompleteLeadsYesterday] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuotaInfo();
  }, [agent.id]);

  const loadQuotaInfo = async () => {
    setLoading(true);
    try {
      // Obtener todos los leads del agente
      const leadsResponse = await crmService.getLeads({
        responsible_user_id: agent.id,
        limit: 1000, // Obtener muchos para contar correctamente
      });

      const leads = leadsResponse.items || [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Contar leads asignados hoy
      const todayLeads = leads.filter(lead => {
        const leadDate = new Date(lead.created_at);
        leadDate.setHours(0, 0, 0, 0);
        return leadDate.getTime() === today.getTime();
      });
      setLeadsToday(todayLeads.length);

      // Contar leads incompletos del día anterior
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const yesterdayLeads = leads.filter(lead => {
        const leadDate = new Date(lead.created_at);
        leadDate.setHours(0, 0, 0, 0);
        return leadDate.getTime() === yesterday.getTime();
      });

      const incompleteYesterday = yesterdayLeads.filter(
        lead => !lead.initial_contact_completed
      );
      setIncompleteLeadsYesterday(incompleteYesterday.length);
    } catch (err) {
      console.error('Error loading quota info:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">Cargando información de cuota...</div>
        </CardContent>
      </Card>
    );
  }

  const quota = agent.daily_lead_quota || 10;
  const remaining = quota - leadsToday;
  const isQuotaReached = remaining <= 0;
  const hasIncompleteLeads = incompleteLeadsYesterday > 0;
  const isAvailable = !hasIncompleteLeads && !isQuotaReached;

  return (
    <Card className={hasIncompleteLeads ? 'border-yellow-300 bg-yellow-50' : ''}>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Cuota Diaria de Leads</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Cuota diaria:</span>
          <span className="font-semibold">{quota}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Leads asignados hoy:</span>
          <span className="font-semibold">{leadsToday}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Leads restantes:</span>
          <span className={`font-semibold ${remaining > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {remaining}
          </span>
        </div>

        {hasIncompleteLeads && (
          <div className="mt-3 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={18} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-yellow-900">
                  ⚠️ Leads incompletos del día anterior
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Tienes {incompleteLeadsYesterday} lead(s) sin completar del día anterior. 
                  Debes completarlos antes de recibir nuevos leads.
                </p>
              </div>
            </div>
          </div>
        )}

        {isQuotaReached && !hasIncompleteLeads && (
          <div className="mt-3 p-3 bg-blue-100 border border-blue-300 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900">
                  Cuota diaria alcanzada
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Has alcanzado tu cuota diaria de {quota} leads. Podrás recibir más leads mañana.
                </p>
              </div>
            </div>
          </div>
        )}

        {isAvailable && (
          <div className="mt-3 p-3 bg-green-100 border border-green-300 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-900">
                  ✅ Disponible para recibir leads
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Puedes recibir hasta {remaining} lead(s) más hoy.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

