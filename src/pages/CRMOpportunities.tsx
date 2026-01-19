// CRMOpportunities - Página principal de oportunidades

import { useNavigate } from 'react-router-dom';
import { OpportunityList } from '@/components/opportunities/OpportunityList';
import { useEffect, useMemo } from 'react';
import { useCRMUsers } from '@/hooks/useCRMUsers';

export function CRMOpportunities() {
  const navigate = useNavigate();
  const { users: responsibleUsers, loading: loadingUsers } = useCRMUsers({ isActive: true, onlyResponsibles: true });

  const availableAgents = useMemo(
    () =>
      responsibleUsers.map((user) => ({
        id: user.id,
        name: user.name?.trim() || user.email?.trim() || `Usuario ${user.id?.slice(0, 8) || 'N/A'}`,
      })),
    [responsibleUsers]
  );
  
  useEffect(() => {
    console.info('🐛 [CRMOpportunities] Responsables para select:', {
      total: availableAgents.length,
      sample: availableAgents.slice(0, 5),
      loading: loadingUsers,
    });
  }, [availableAgents, loadingUsers]);

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
        loadingAgents={loadingUsers}
        filters={undefined}
      />
    </div>
  );
}

