import jsPDF from 'jspdf';

export function generateCollabAgreementPDF(): Blob {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  const addText = (text: string, size = 10, bold = false, align: 'left' | 'center' | 'right' = 'left') => {
    doc.setFontSize(size);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    const lines = doc.splitTextToSize(text, contentWidth);
    if (y + lines.length * (size / 2.5) > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    if (align === 'center') doc.text(lines, pageWidth / 2, y, { align: 'center' });
    else if (align === 'right') doc.text(lines, pageWidth - margin, y, { align: 'right' });
    else doc.text(lines, margin, y);
    y += lines.length * (size / 2.5) + 2;
  };

  const addSpace = (s = 4) => { y += s; };

  // Header Migro (verde)
  doc.setFillColor(22, 163, 74);
  doc.rect(margin, y, contentWidth, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('MIGRO SERVICIOS Y REMESAS S.L.', pageWidth / 2, y + 7, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('CIF: B22759765 · C/ Libreros, nº 54, 37008 Salamanca', pageWidth / 2, y + 13, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  y += 24;

  // Título
  addText('CONVENIO MARCO DE COLABORACIÓN ENTRE DESPACHO COLABORADOR Y MIGRO SERVICIOS Y REMESAS S.L.', 12, true, 'center');
  addSpace(2);

  // Fecha/lugar
  const today = new Date();
  const dateStr = `En Salamanca, a ${today.getDate()} de ${today.toLocaleString('es-ES', { month: 'long' })} de ${today.getFullYear()}.`;
  addText(dateStr, 10, true, 'center');
  addSpace(4);

  // Contenido clave (resumen contractual)
  addText('REUNIDOS', 11, true);
  addText('De una parte, [DESPACHO COLABORADOR] ("EL DESPACHO"). Y de otra, MIGRO SERVICIOS Y REMESAS S.L. ("MIGRO").');
  addSpace();

  addText('CLÁUSULAS', 11, true);
  addText('1. OBJETO');
  addText('Colaboración para atender clientes derivados por MIGRO y ejecutar gestiones jurídicas necesarias.');
  addSpace();

  addText('2. TITULARIDAD DEL CLIENTE Y NO CAPTACIÓN');
  addText('El cliente es siempre de MIGRO. Prohibida la captación directa por el DESPACHO (vigencia + 24 meses). No competencia 5 años en el objeto de MIGRO (app/plataforma online de ayuda a migrantes). Excepción: clientes propios fuera de ese esquema y sin usar recursos/info de MIGRO.');
  addSpace();

  addText('3. SLA Y CONTACTOS');
  addText('Hasta 30 contactos diarios. Mínimo 5 llamadas concertadas diarias. Desde la 4ª venta acumulada, el DESPACHO puede duplicar contactos. Si el cliente muestra interés en contratar, MIGRO realiza la segunda llamada con la info recabada por el DESPACHO. El cobro lo gestiona exclusivamente MIGRO (plataforma online o app). EL DESPACHO nunca recauda.');
  addSpace();

  addText('4. SISTEMA DE CALIFICACIÓN Y PRECIOS');
  addText('Calificación:');
  addText('— Nota A: Excelente – Alta probabilidad de éxito (400 € IVA incl.).');
  addText('— Nota B: Bueno – Probabilidad buena de éxito (400 € IVA incl.).');
  addText('— Nota C: Complejo – Requiere estudio adicional (600 € IVA incl.).');
  addText('Revisión: MIGRO podrá incrementar precios con previo aviso; no podrá reducirlos para un mismo grado.');
  addSpace();

  addText('5. COMISIONES DEL DESPACHO');
  addText('Primeras 3 ventas: 150 € (IVA incl.)/venta. Desde la 4ª: 200 € (IVA incl.)/venta. Pago en dos plazos: 50% a la semana de la venta y 50% dentro de 5 días hábiles tras la aprobación administrativa. MIGRO asume el riesgo comercial del segundo pago del cliente.');
  addSpace();

  addText('6. FACTURACIÓN Y PAGO');
  addText('Factura semanal; pago por MIGRO dentro de 5 días hábiles desde la recepción de factura correcta.');
  addSpace();

  addText('7. TRÁMITES POSTERIORES');
  addText('Derecho del DESPACHO a: 50% de ingresos netos si gestiona el trámite; 25% si no participa.');
  addSpace();

  addText('8. CONFIDENCIALIDAD Y DATOS');
  addText('Obligación de confidencialidad indefinida y tratamiento de datos según instrucciones de MIGRO.');
  addText('Propiedad intelectual & know‑how: prohibido replicar/app paralela, no ingeniería inversa, no uso de info confidencial para modelos equivalentes (5 años).');
  addSpace();

  addText('9. VIGENCIA Y JURISDICCIÓN');
  addText('Vigencia 12 meses renovables; Juzgados y Tribunales de Salamanca o del domicilio local del DESPACHO si se pacta expresamente.');
  addSpace(8);

  // Footer con URL corta
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Visualiza este convenio en: contratacion.migro.es/colaboradores', pageWidth / 2, pageHeight - 10, { align: 'center' });

  return doc.output('blob');
}

