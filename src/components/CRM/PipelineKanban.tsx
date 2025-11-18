// PipelineKanban - Vista Kanban con drag & drop para leads

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { KommoLead, Pipeline, PipelineStatus } from '@/types/crm';
import { crmService } from '@/services/crmService';
import { DollarSign, User, Calendar, Phone } from 'lucide-react';

interface PipelineKanbanProps {
  pipelineId?: string;
  onLeadClick?: (lead: KommoLead) => void;
}

export function PipelineKanban({ pipelineId, onLeadClick }: PipelineKanbanProps) {
  const [loading, setLoading] = useState(true);
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [stages, setStages] = useState<PipelineStatus[]>([]);
  const [leadsByStage, setLeadsByStage] = useState<Record<string, KommoLead[]>>({});
  const [draggedLead, setDraggedLead] = useState<KommoLead | null>(null);

  useEffect(() => {
    loadPipeline();
  }, [pipelineId]);

  const loadPipeline = async () => {
    setLoading(true);
    try {
      // Obtener pipelines
      const pipelines = await crmService.getPipelines();
      const selectedPipeline = pipelineId 
        ? pipelines.find(p => p.id === pipelineId)
        : pipelines.find(p => p.is_main) || pipelines[0];

      if (!selectedPipeline) return;

      setPipeline(selectedPipeline);

      // Obtener stages
      const stagesData = await crmService.getPipelineStages(selectedPipeline.id);
      setStages(stagesData);

      // Obtener leads del pipeline
      const leadsResponse = await crmService.getLeads({
        pipeline_id: selectedPipeline.id,
        limit: 100,
      });

      // Agrupar leads por stage
      const grouped: Record<string, KommoLead[]> = {};
      stagesData.forEach(stage => {
        grouped[stage.id] = (leadsResponse.items || []).filter(
          lead => lead.status === stage.name?.toLowerCase() || 
                  String(lead.status_id) === String(stage.id)
        );
      });

      setLeadsByStage(grouped);
    } catch (err) {
      console.error('Error loading pipeline:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (lead: KommoLead) => {
    setDraggedLead(lead);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetStatusId: string) => {
    if (!draggedLead || String(draggedLead.status_id) === String(targetStatusId)) {
      setDraggedLead(null);
      return;
    }

    try {
      // Encontrar el stage target para obtener el nombre del status
      const targetStage = stages.find(s => s.id === targetStatusId);
      const newStatus = targetStage?.name?.toLowerCase() || draggedLead.status;

      // Actualizar lead en backend
      await crmService.updateLead(draggedLead.id, {
        status: newStatus,
      });

      // Actualizar UI localmente
      const newLeadsByStage = { ...leadsByStage };
      const oldStatusId = String(draggedLead.status_id || '');
      
      // Remover del stage anterior
      if (newLeadsByStage[oldStatusId]) {
        newLeadsByStage[oldStatusId] = newLeadsByStage[oldStatusId].filter(
          l => l.id !== draggedLead.id
        );
      }

      // Agregar al nuevo stage
      const updatedLead = { ...draggedLead, status: newStatus, status_id: targetStatusId };
      newLeadsByStage[targetStatusId] = [...(newLeadsByStage[targetStatusId] || []), updatedLead];

      setLeadsByStage(newLeadsByStage);
    } catch (err) {
      console.error('Error updating lead:', err);
      // Recargar en caso de error
      loadPipeline();
    } finally {
      setDraggedLead(null);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const getStageTotal = (stageId: string): number => {
    return (leadsByStage[stageId] || []).reduce((sum, lead) => sum + (lead.price || 0), 0);
  };

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando pipeline...</p>
      </div>
    );
  }

  if (!pipeline) {
    return (
      <div className="py-12 text-center text-gray-500">
        No hay pipelines disponibles
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">{pipeline.name}</h2>
        <Button onClick={loadPipeline} variant="outline" size="sm">
          Actualizar
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map(stage => {
          const stageLeads = leadsByStage[stage.id] || [];
          const total = getStageTotal(stage.id);

          return (
            <div
              key={stage.id}
              className="flex-shrink-0 w-80"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage.id)}
            >
              <Card className="h-full">
                <CardHeader className="pb-3" style={{ borderTopColor: stage.color, borderTopWidth: '4px' }}>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {stage.name}
                      <span className="ml-2 text-sm font-normal text-gray-500">
                        ({stageLeads.length})
                      </span>
                    </CardTitle>
                  </div>
                  {total > 0 && (
                    <p className="text-sm font-semibold text-green-600 mt-1">
                      {formatCurrency(total)}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
                  {stageLeads.map(lead => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={() => handleDragStart(lead)}
                      onClick={() => onLeadClick?.(lead)}
                      className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-move"
                    >
                      <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                        {lead.name}
                      </h4>

                      <div className="space-y-2 text-sm text-gray-600">
                        {lead.price && (
                          <div className="flex items-center gap-2">
                            <DollarSign size={14} />
                            <span className="font-semibold text-green-600">
                              {formatCurrency(lead.price)}
                            </span>
                          </div>
                        )}

                        {lead.contact && (
                          <div className="flex items-center gap-2">
                            <User size={14} />
                            <span className="truncate">
                              {lead.contact.first_name} {lead.contact.last_name}
                            </span>
                          </div>
                        )}

                        {lead.contact?.phone && (
                          <div className="flex items-center gap-2">
                            <Phone size={14} />
                            <span>{lead.contact.phone}</span>
                          </div>
                        )}

                        {lead.expected_close_date && (
                          <div className="flex items-center gap-2">
                            <Calendar size={14} />
                            <span>
                              {new Date(lead.expected_close_date).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: 'short',
                              })}
                            </span>
                          </div>
                        )}
                      </div>

                      {lead.priority && lead.priority !== 'medium' && (
                        <div className="mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            lead.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                            lead.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {lead.priority}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}

                  {stageLeads.length === 0 && (
                    <div className="py-8 text-center text-gray-400 text-sm">
                      Arrastra leads aquí
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}

