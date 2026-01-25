// Página pública para visualizar el Convenio de Colaboración Freelance para Agentes de Ventas en /colaboradores-agentes
import { useState, useMemo } from 'react';
// @ts-ignore - Vite raw import
import agenteVentasMd from '@/legal/agente_ventas_agreement.md?raw';
// @ts-ignore - Vite raw import
import changelogMd from '@/legal/CHANGELOG_AGENTE_VENTAS.md?raw';
import { Button } from '@/components/ui/button';
// Dynamic import para PDF generator (pesado, cargar bajo demanda)

export function ColaboradoresAgentes() {
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingMd, setDownloadingMd] = useState(false);
  const [downloadingChangelog, setDownloadingChangelog] = useState(false);
  const title = 'CONVENIO DE COLABORACIÓN FREELANCE ENTRE AGENTE DE VENTAS Y MIGRO SERVICIOS Y REMESAS S.L.';

  const versionInfo = useMemo(() => {
    const raw = (agenteVentasMd as unknown as string) || '';
    const anchor = '18. REGISTRO DE MODIFICACIONES';
    const start = raw.indexOf(anchor);
    if (start === -1) return { version: '1.0', date: 'Enero 2025' };
    
    const section = raw.substring(start, start + 500);
    const versionMatch = section.match(/Versión\s+(\d+\.\d+)/i);
    const dateMatch = section.match(/Fecha de creación:\s*([^\n]+)/i);
    
    return {
      version: versionMatch ? versionMatch[1] : '1.0',
      date: dateMatch ? dateMatch[1].trim() : 'Enero 2025',
    };
  }, []);

  const handlePreviewPdf = async () => {
    const { generatePdfWithTitle } = await import('@/utils/collabAgreementPdfFromMd');
    const blob = generatePdfWithTitle(
      agenteVentasMd as unknown as string,
      title,
      'contratacion.migro.es/colaboradores-agentes'
    );
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const { generatePdfWithTitle } = await import('@/utils/collabAgreementPdfFromMd');
      const blob = generatePdfWithTitle(
        agenteVentasMd as unknown as string,
        title,
        'contratacion.migro.es/colaboradores-agentes'
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Convenio_Colaboracion_Agente_Ventas_Migro.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setTimeout(() => setDownloadingPdf(false), 300);
    }
  };

  const handleDownloadMd = () => {
    setDownloadingMd(true);
    try {
      const blob = new Blob([agenteVentasMd as unknown as string], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Convenio_Colaboracion_Agente_Ventas_Migro.md';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setTimeout(() => setDownloadingMd(false), 300);
    }
  };

  const handleDownloadChangelog = () => {
    setDownloadingChangelog(true);
    try {
      const blob = new Blob([changelogMd as unknown as string], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'CHANGELOG_Agente_Ventas_Migro.md';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setTimeout(() => setDownloadingChangelog(false), 300);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-10">
      <section>
        <h1 className="text-2xl font-bold text-green-600 mb-2">
          Convenio de Colaboración Freelance - Agentes de Ventas
        </h1>
        <p className="text-sm text-gray-600 mb-4">
          Vista pública del convenio de colaboración freelance entre agentes de ventas y MIGRO SERVICIOS Y REMESAS S.L.
        </p>
        
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Versión:</strong> {versionInfo.version} | <strong>Fecha:</strong> {versionInfo.date}
          </p>
        </div>

        <div className="flex gap-3 mb-6 flex-wrap">
          <Button onClick={handlePreviewPdf} className="bg-green-600 hover:bg-green-700">
            Ver PDF en el navegador
          </Button>
          <Button onClick={handleDownloadPdf} variant="outline" disabled={downloadingPdf}>
            {downloadingPdf ? 'Generando…' : 'Descargar PDF'}
          </Button>
          <Button onClick={handleDownloadMd} variant="secondary" disabled={downloadingMd}>
            {downloadingMd ? 'Descargando…' : 'Descargar .MD'}
          </Button>
          <Button onClick={handleDownloadChangelog} variant="secondary" disabled={downloadingChangelog}>
            {downloadingChangelog ? 'Descargando…' : 'Descargar Changelog'}
          </Button>
        </div>

        <div className="rounded-md border border-gray-200">
          <div className="bg-green-600 text-white px-4 py-2 text-sm font-semibold">
            Vista previa del contrato (texto íntegro)
          </div>
          <div className="p-4 whitespace-pre-wrap text-sm leading-6 font-serif max-h-[600px] overflow-y-auto">
            {agenteVentasMd as unknown as string}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-green-600 mb-4">Resumen de condiciones principales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-200 rounded-md">
            <h3 className="font-semibold text-green-700 mb-2">💰 Remuneración</h3>
            <ul className="text-sm space-y-1 text-gray-700">
              <li>• Fijo mensual: 300 USD (150 USD/quincena)</li>
              <li>• Comisiones: 50 USD por contratación efectiva</li>
              <li>• Pago estándar: USDC mediante Binance</li>
              <li>• Formas alternativas negociables (sin comisiones para MIGRO)</li>
              <li>• Pago quincenal en 5 días hábiles</li>
            </ul>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-md">
            <h3 className="font-semibold text-green-700 mb-2">⏰ Jornada laboral</h3>
            <ul className="text-sm space-y-1 text-gray-700">
              <li>• 6 horas efectivas diarias (lunes a viernes)</li>
              <li>• 4 horas de llamadas telefónicas</li>
              <li>• 2 horas de trabajo operativo</li>
              <li>• Sábados: recuperar horas no efectivas de la semana en curso</li>
              <li>• Objetivo: empezar cada lunes con contador en 0</li>
              <li>• Trabajo 100% remoto a distancia</li>
            </ul>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-md">
            <h3 className="font-semibold text-green-700 mb-2">📞 Reunión diaria</h3>
            <ul className="text-sm space-y-1 text-gray-700">
              <li>• Primera reunión diaria: 13:30 a 13:45 (hora española)</li>
              <li>• Segunda reunión diaria: 20:30 a 20:45 (hora española)</li>
              <li>• Resolución de casos y soporte comercial</li>
            </ul>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-md">
            <h3 className="font-semibold text-green-700 mb-2">🛡️ Protección</h3>
            <ul className="text-sm space-y-1 text-gray-700">
              <li>• Confidencialidad indefinida</li>
              <li>• No competencia: 5 años</li>
              <li>• Respeto a RGPD y política de privacidad</li>
              <li>• MIGRO asume el riesgo comercial</li>
            </ul>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-md">
            <h3 className="font-semibold text-green-700 mb-2">📚 Formación</h3>
            <ul className="text-sm space-y-1 text-gray-700">
              <li>• MIGRO forma a sus agentes en productos y servicios</li>
              <li>• Formación continua y actualizaciones periódicas</li>
              <li>• Agentes como pilar del crecimiento del proyecto</li>
              <li>• Soporte y recursos para el éxito profesional</li>
            </ul>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-md">
            <h3 className="font-semibold text-green-700 mb-2">📱 Comunicación</h3>
            <ul className="text-sm space-y-1 text-gray-700">
              <li>• Zadarma (llamadas telefónicas)</li>
              <li>• WhatsApp Business a nombre de empresa</li>
              <li>• Correo electrónico corporativo</li>
              <li>• Herramientas comunicativas del CRM</li>
              <li>• Prohibido usar medios personales</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-green-600 mb-4">Changelog</h2>
        <div className="rounded-md border border-gray-200">
          <div className="bg-gray-50 px-4 py-2 text-sm font-semibold">
            Historial de modificaciones
          </div>
          <div className="p-4 whitespace-pre-wrap text-sm leading-6 font-serif max-h-[400px] overflow-y-auto">
            {changelogMd as unknown as string}
          </div>
        </div>
      </section>
    </div>
  );
}
