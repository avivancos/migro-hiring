// Modal para mostrar el wizard de pipeline
// Diseño mobile-first simple

import { Modal } from '@/components/common/Modal';
import { PipelineModifyWizard } from './PipelineModifyWizard';
import type { EntityType } from '@/types/pipeline';
import type { WizardChanges } from './PipelineModifyWizard';

interface PipelineWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: EntityType;
  entityId: string;
  onComplete?: (changes: WizardChanges) => void;
}

export function PipelineWizardModal({
  isOpen,
  onClose,
  entityType,
  entityId,
  onComplete,
}: PipelineWizardModalProps) {
  const handleComplete = (changes: WizardChanges) => {
    onComplete?.(changes);
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Modificar Pipeline"
      size="xl"
    >
      <div className="min-h-0">
        <PipelineModifyWizard
          entityType={entityType}
          entityId={entityId}
          onComplete={handleComplete}
          onCancel={onClose}
        />
      </div>
    </Modal>
  );
}

