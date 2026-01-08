// Contract PDF Viewer Component

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowDownTrayIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface ContractViewerProps {
  contractBlob: Blob | null;
  onDownload?: () => void;
}

export function ContractViewer({ contractBlob, onDownload }: ContractViewerProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (contractBlob) {
      const url = URL.createObjectURL(contractBlob);
      setPdfUrl(url);

      // Cleanup
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [contractBlob]);

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = 'Contrato_Migro.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      if (onDownload) {
        onDownload();
      }
    }
  };

  if (!contractBlob || !pdfUrl) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <DocumentTextIcon className="mx-auto mb-4 text-gray-400" width={48} height={48} />
        <p className="text-gray-600">Generando contrato...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden shadow-md">
        <div className="bg-primary px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <DocumentTextIcon width={20} height={20} />
            <span className="font-semibold">Contrato de Prestación de Servicios</span>
          </div>
          <Button
            onClick={handleDownload}
            size="sm"
            variant="secondary"
            className="flex items-center gap-2"
          >
            <ArrowDownTrayIcon width={16} height={16} />
            Descargar PDF
          </Button>
        </div>
        
        <div className="bg-gray-50 p-1">
          <iframe
            src={pdfUrl}
            className="w-full h-[600px] border-0 rounded"
            title="Contrato de Prestación de Servicios"
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Por favor, revisa el contrato completo</strong> antes de continuar.
          Puedes descargar una copia para tu archivo personal.
        </p>
      </div>
    </div>
  );
}

