// CRMOpportunities - Página principal de oportunidades

import { useNavigate } from 'react-router-dom';
import { OpportunityList } from '@/components/opportunities/OpportunityList';
import { crmService } from '@/services/crmService';
import { useEffect, useState } from 'react';

export function CRMOpportunities() {
  const navigate = useNavigate();
  const [availableAgents, setAvailableAgents] = useState<
    Array<{ id: string; name: string }>
  >([]);

  useEffect(() => {
    // Cargar lista de agentes disponibles
    crmService
      .getUsers(true)
      .then((users) => {
        setAvailableAgents(
          users.map((user) => ({ id: user.id, name: user.name }))
        );
      })
      .catch((err) => {
        console.error('Error cargando usuarios:', err);
      });
  }, []);

  const handleOpportunitySelect = (id: string) => {
    navigate(`/crm/opportunities/${id}`);
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Oportunidades
        </h1>
        <p className="text-gray-600">
          Oportunidades detectadas automáticamente y listas para ser contactadas
        </p>
      </div>

      <OpportunityList
        onOpportunitySelect={handleOpportunitySelect}
        availableAgents={availableAgents}
        filters={undefined}
      />
    </div>
  );
}

