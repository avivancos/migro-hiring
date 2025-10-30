import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { generateCollabAgreementPDF } from '@/utils/collabAgreementPdfGenerator';

export function Colaboradores() {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    try {
      const blob = generateCollabAgreementPDF();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Convenio_Colaboracion_Migro.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setTimeout(() => setDownloading(false), 300);
    }
  };

  const handlePreview = () => {
    const blob = generateCollabAgreementPDF();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    // No revocar inmediatamente para permitir la previsualización
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-green-600 mb-2">Convenio de Colaboración</h1>
      <p className="text-sm text-gray-600 mb-6">
        Visualiza o descarga el convenio marco de colaboración entre despachos colaboradores y MIGRO.
      </p>
      <div className="flex gap-3">
        <Button onClick={handlePreview} variant="default" className="bg-green-600 hover:bg-green-700">
          Ver en el navegador
        </Button>
        <Button onClick={handleDownload} disabled={downloading} variant="outline">
          {downloading ? 'Generando…' : 'Descargar PDF'}
        </Button>
      </div>
    </div>
  );
}


