// Página pública para visualizar el Anexo del Closer en /closer
import { useState } from 'react';
// @ts-ignore - Vite raw import
import closerAnnexMd from '@/legal/closer_annex.md?raw';
import { Button } from '@/components/ui/button';
import { generatePdfWithTitle } from '@/utils/collabAgreementPdfFromMd';

export function Closer() {
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const title = 'ANEXO I — ABOGADO COLABORADOR CLOSER DE VENTAS';

  const handlePreviewPdf = () => {
    const blob = generatePdfWithTitle(closerAnnexMd as unknown as string, title, 'contratacion.migro.es/closer');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadPdf = () => {
    setDownloadingPdf(true);
    try {
      const blob = generatePdfWithTitle(closerAnnexMd as unknown as string, title, 'contratacion.migro.es/closer');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Anexo_Closer_Migro.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setTimeout(() => setDownloadingPdf(false), 300);
    }
  };

  const handleDownloadMd = () => {
    const blob = new Blob([closerAnnexMd as unknown as string], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Anexo_Closer_Migro.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const examples = [
    {
      label: 'Sin ventas',
      promedio: 2,
      adelanto: 200,
      ventas: 0,
      imputacion: 0,
      remanente: 200,
      extra: 0,
      nota: 'Remanente no se reclama ni se arrastra',
    },
    {
      label: 'Base',
      promedio: 2,
      adelanto: 200,
      ventas: 2,
      imputacion: 200,
      remanente: 0,
      extra: 0,
      nota: 'Adelanto totalmente compensado',
    },
    {
      label: 'Ventas > adelanto',
      promedio: 3,
      adelanto: 300,
      ventas: 5,
      imputacion: 500,
      remanente: 0,
      extra: 200,
      nota: 'MIGRO abona la diferencia (200 €)',
    },
    {
      label: 'Tope y renegociación',
      promedio: 10,
      adelanto: 1000,
      ventas: 10,
      imputacion: 1000,
      remanente: 0,
      extra: 0,
      nota: 'Posible renegociación al alcanzar tope',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-10">
      <section>
        <h1 className="text-2xl font-bold text-green-600 mb-2">
          Anexo I — Abogado Colaborador Closer de Ventas
        </h1>
        <p className="text-sm text-gray-600 mb-4">
          Vista pública del anexo para el rol de Closer. Este documento complementa el Convenio Marco.
        </p>
        <div className="flex gap-3 mb-6">
          <Button onClick={handlePreviewPdf} className="bg-green-600 hover:bg-green-700">
            Ver PDF en el navegador
          </Button>
          <Button onClick={handleDownloadPdf} variant="outline" disabled={downloadingPdf}>
            {downloadingPdf ? 'Generando…' : 'Descargar PDF'}
          </Button>
          <Button onClick={handleDownloadMd} variant="secondary">
            Descargar .MD
          </Button>
        </div>

        <div className="rounded-md border border-gray-200">
          <div className="bg-green-600 text-white px-4 py-2 text-sm font-semibold">
            Vista previa (texto íntegro)
          </div>
          <div className="p-4 whitespace-pre-wrap text-sm leading-6 font-serif">
            {closerAnnexMd as unknown as string}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-green-600 mb-4">Cuadro-resumen de ejemplos</h2>
        <div className="overflow-x-auto rounded-md border border-gray-200">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left">
                <th className="px-4 py-2 font-semibold">Escenario</th>
                <th className="px-4 py-2 font-semibold">Promedio</th>
                <th className="px-4 py-2 font-semibold">Adelanto (€)</th>
                <th className="px-4 py-2 font-semibold">Ventas</th>
                <th className="px-4 py-2 font-semibold">Imputación (€)</th>
                <th className="px-4 py-2 font-semibold">Remanente (€)</th>
                <th className="px-4 py-2 font-semibold">Extra a pagar (€)</th>
                <th className="px-4 py-2 font-semibold">Nota</th>
              </tr>
            </thead>
            <tbody>
              {examples.map((ex) => (
                <tr key={ex.label} className="border-t">
                  <td className="px-4 py-2">{ex.label}</td>
                  <td className="px-4 py-2">{ex.promedio}</td>
                  <td className="px-4 py-2">{ex.adelanto}</td>
                  <td className="px-4 py-2">{ex.ventas}</td>
                  <td className="px-4 py-2">{ex.imputacion}</td>
                  <td className="px-4 py-2">{ex.remanente}</td>
                  <td className="px-4 py-2">{ex.extra}</td>
                  <td className="px-4 py-2 text-gray-600">{ex.nota}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}


