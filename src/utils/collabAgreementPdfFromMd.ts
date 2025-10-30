import jsPDF from 'jspdf';
// Importa el markdown como texto crudo (Vite soporta ?raw)
// Asegúrate de que el archivo exista en src/legal/
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import agreementMd from '@/legal/colab_agreement.md?raw';

export function generateCollabAgreementPdfFromMd(): Blob {
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
    const lineHeight = size / 2.5;
    if (y + lines.length * lineHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    if (align === 'center') doc.text(lines, pageWidth / 2, y, { align: 'center' });
    else if (align === 'right') doc.text(lines, pageWidth - margin, y, { align: 'right' });
    else doc.text(lines, margin, y);
    y += lines.length * lineHeight + 2;
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
  doc.text('CIF: B22759765 · C/ Libreros, 4, 1º, 37008 Salamanca', pageWidth / 2, y + 13, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  y += 24;

  // Título fijo
  addText('CONVENIO MARCO DE COLABORACIÓN ENTRE DESPACHO COLABORADOR Y MIGRO SERVICIOS Y REMESAS S.L.', 12, true, 'center');
  addSpace(2);

  // Render del markdown como texto plano con separadores de secciones visuales
  const lines = agreementMd.split(/\r?\n/);
  lines.forEach((line) => {
    // Encabezados simples por patrón
    if (/^#\s/.test(line)) {
      addSpace(2);
      addText(line.replace(/^#\s*/, ''), 12, true, 'center');
      addSpace(2);
    } else if (/^\d+\./.test(line) || /^[A-ZÁÉÍÓÚÑ]+\.-/.test(line)) {
      addSpace(1);
      addText(line, 11, true);
    } else if (/^\s*$/.test(line)) {
      addSpace(2);
    } else {
      addText(line, 10, false);
    }
  });

  // Footer con URL
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('Visualiza este convenio en: contratacion.migro.es/colaboradores', pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  return doc.output('blob');
}


