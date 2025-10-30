import jsPDF from 'jspdf';
// Import MD crudo (Vite ?raw)
// @ts-ignore – Vite raw import
import agreementMd from '@/legal/colab_agreement.md?raw';

export function generateCollabAgreementPdfFromMd(): Blob {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  const addText = (text: string, size = 10, align: 'left' | 'center' | 'right' = 'left') => {
    doc.setFontSize(size);
    doc.setFont('courier', 'normal');
    const lines = doc.splitTextToSize(text, contentWidth);
    const lineHeight = size / 2.0; // más aire para evitar solapes
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
  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.text('MIGRO SERVICIOS Y REMESAS S.L.', pageWidth / 2, y + 7, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('times', 'normal');
  doc.text('CIF: B22759765 · C/ Libreros, 4, 1º, 37008 Salamanca', pageWidth / 2, y + 13, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  y += 24;

  // Título fijo (sin negritas)
  addText('CONVENIO MARCO DE COLABORACIÓN ENTRE DESPACHO COLABORADOR Y MIGRO SERVICIOS Y REMESAS S.L.', 12, 'center');
  addSpace(2);

  // Preprocesar contenido: eliminar título MD duplicado y normalizar caracteres problemáticos
  let cleaned = agreementMd
    .replace(/^#\s.*$/m, '') // eliminar línea título MD
    .replace(/\u00b7/g, '-')   // · -> -
    .replace(/\u2013|\u2014/g, '-') // – — -> -
    .replace(/\u25cf/g, '-') // ● -> -
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\t+/g, ' ')
    .replace(/\s+$/gm, '')
    .trim();

  // Normalizar a ASCII para evitar glifos incompatibles en algunos lectores PDF
  cleaned = cleaned
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // eliminar diacríticos
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ') // restringir a ASCII visible
    .replace(/\s{2,}/g, ' ');

  // Render plain text, sin negritas automáticas
  const lines = cleaned.split(/\r?\n/);
  lines.forEach((line) => {
    if (/^\s*$/.test(line)) {
      addSpace(2);
    } else {
      addText(line, 10);
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


