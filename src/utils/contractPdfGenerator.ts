// PDF Contract Generator for Migro

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { HiringDetails } from '@/types/hiring';

export function generateContractPDF(details: HiringDetails, paymentData?: {
  paymentIntentId?: string;
  stripeTransactionId?: string;
  paymentDate?: string;
  paymentMethod?: string;
  clientSignature?: string;
}, isDraft: boolean = true): Blob {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Helper function to add text with auto page break
  const addText = (text: string, fontSize: number, isBold: boolean = false, align: 'left' | 'center' | 'right' = 'left') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    
    const lines = doc.splitTextToSize(text, contentWidth);
    
    // Check if we need a new page
    if (yPosition + lines.length * (fontSize / 2.5) > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }
    
    if (align === 'center') {
      doc.text(lines, pageWidth / 2, yPosition, { align: 'center' });
    } else if (align === 'right') {
      doc.text(lines, pageWidth - margin, yPosition, { align: 'right' });
    } else {
      doc.text(lines, margin, yPosition);
    }
    
    yPosition += lines.length * (fontSize / 2.5) + 2;
  };

  const addSpace = (space: number) => {
    yPosition += space;
  };

  // Función para agregar marca de agua "BORRADOR" - una sola palabra por página
  const addWatermark = () => {
    const totalPages = doc.getNumberOfPages();
    
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      // Configurar marca de agua diagonal
      doc.setTextColor(200, 200, 200); // Gris claro pero visible
      doc.setFontSize(80); // Tamaño grande
      doc.setFont('helvetica', 'bold');
      
      // Dimensiones de página A4
      const pageWidth = doc.internal.pageSize.getWidth();  // ~210mm
      const pageHeight = doc.internal.pageSize.getHeight(); // ~297mm
      
      const text = 'BORRADOR';
      
      // Calcular posición central de la página
      const centerX = pageWidth / 2;
      const centerY = pageHeight / 2;
      
      // Dibujar "BORRADOR" una sola vez en el centro de la página
      doc.text(text, centerX, centerY, { align: 'center' });
      
      // Restaurar configuración normal
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
    }
  };

  // Header mejorado con diseño profesional
  doc.setFillColor(22, 163, 74); // #16a34a - Migro green
  doc.rect(margin, yPosition, contentWidth, 20, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('MIGRO SERVICIOS Y REMESAS SL', pageWidth / 2, yPosition + 12, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('CIF: B22759765 | C/ Libreros, 54, 1º - Salamanca', pageWidth / 2, yPosition + 18, { align: 'center' });
  
  yPosition += 25;
  doc.setTextColor(0, 0, 0);

  // Título principal con mejor diseño
  addSpace(8);
  doc.setFillColor(240, 240, 240); // Fondo gris claro
  doc.rect(margin, yPosition, contentWidth, 8, 'F');
  yPosition += 2;
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  // Título cambia según si es borrador o definitivo
  const title = isDraft ? 'BORRADOR DE CONTRATO DE PRESTACIÓN DE SERVICIOS' : 'CONTRATO DE PRESTACIÓN DE SERVICIOS';
  doc.text(title, pageWidth / 2, yPosition + 5, { align: 'center' });
  yPosition += 10;
  
  // Restaurar configuración normal
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Fecha con mejor formato
  const today = new Date();
  const dateStr = `En Salamanca, a ${today.getDate()} de ${today.toLocaleString('es-ES', { month: 'long' })} de ${today.getFullYear()}`;
  
  // Fondo para la fecha
  doc.setFillColor(250, 250, 250);
  doc.rect(margin, yPosition, contentWidth, 6, 'F');
  yPosition += 1;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(dateStr, pageWidth / 2, yPosition + 4, { align: 'center' });
  yPosition += 8;
  
  // Restaurar configuración
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  addSpace(5);

  // REUNIDOS con mejor diseño
  doc.setFillColor(220, 220, 220);
  doc.rect(margin, yPosition, contentWidth, 6, 'F');
  yPosition += 1;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('REUNIDOS', margin + 5, yPosition + 4);
  yPosition += 8;
  
  // Restaurar configuración
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  addSpace(3);

  // Construir dirección completa del cliente
  // El backend ahora devuelve client_address, client_city, etc. (con prefijo client_)
  // pero también mantenemos compatibilidad con user_address por si acaso
  let clientAddress = details.client_address || details.user_address || '';
  const city = details.client_city || details.user_city;
  const province = details.client_province || details.user_province;
  const postalCode = details.client_postal_code || details.user_postal_code;
  
  if (city) {
    clientAddress += clientAddress ? `, ${city}` : city;
  }
  if (province) {
    clientAddress += clientAddress ? `, ${province}` : province;
  }
  if (postalCode) {
    clientAddress += clientAddress ? `, ${postalCode}` : postalCode;
  }
  if (clientAddress) {
    clientAddress += ', España';
  }

  const passport = details.client_passport || details.user_passport;
  const nie = details.client_nie || details.user_nie;

  const reunidosText = `De una parte, D. ${details.client_name || '____________________'}, mayor de edad, con correo electrónico ${details.client_email || '____________________'}${passport ? `, Pasaporte nº ${passport}` : ''}${nie ? ` y/o NIE ${nie}` : ''}${clientAddress ? `, con domicilio en ${clientAddress}` : ''}, en lo sucesivo denominada EL CLIENTE y,

De la otra parte, la entidad MIGRO SERVICIOS Y REMESAS SL, con CIF B22759765, con domicilio social en C/ Libreros, 54, 1º de Salamanca – España, debidamente representada en función de la escritura de constitución social de fecha 15 de julio de 2025 y protocolo 940/25 otorgada ante el Notario de Huelva, Dª María Gómez – Rodulfo García de Castro, en lo sucesivo denominada LA PRESTADORA DEL SERVICIO o AGENCIA.`;
  
  addText(reunidosText, 10, false);
  addSpace(5);

  // INTERVIENEN
  addText('INTERVIENEN', 12, true);
  addSpace(3);
  addText('Los comparecientes intervienen en su propio nombre, reconociéndose capacidad legal para el otorgamiento del presente contrato de PRESTACIÓN DE SERVICIOS y a tal fin,', 10, false);
  addSpace(5);

  // EXPONEN
  addText('EXPONEN:', 12, true);
  addSpace(3);
  
  const exponenText = `Que el CLIENTE está interesado en que la PRESTADORA DEL SERVICIO proceda a tramitarle en su nombre el expediente administrativo para la obtención de la RESIDENCIA LEGAL en ESPAÑA al reunir los requisitos exigidos.

Que LA AGENCIA es una empresa prestadora de servicios de ámbito general, y especialmente a migrantes, cuya actividad se desarrolla en el territorio en España, pudiendo cumplir la función pretendida por el CLIENTE.

Que ambas partes acuerdan celebrar el presente contrato de INTERMEDIACIÓN, en adelante el "Contrato", de acuerdo con las siguientes,`;
  
  addText(exponenText, 10, false);
  addSpace(5);

  // CLÁUSULAS
  addText('CLÁUSULAS:', 12, true);
  addSpace(3);

  // Cláusula PRIMERA
  addText('PRIMERA.- OBJETO.', 11, true);
  addText(`En virtud del Contrato la AGENCIA se obliga a prestar al CLIENTE los servicios de intermediación consistentes en la tramitación del expediente para la obtención de ${details.service_name || 'la residencia en España'}.`, 10, false);
  addSpace(4);

  // Cláusula SEGUNDA
  addText('SEGUNDA.- POLÍTICA DE USO.', 11, true);
  addText('Aun siendo el CLIENTE es el único responsable de determinar si los servicios que constituyen el objeto de este contrato se ajustan a sus necesidades, la AGENCIA se compromete a la devolución del importe por la prestación del servicio en caso de haber transcurrido treinta (30) días desde la contratación, no ajustarse a la pretensión contratada y/o no haberse iniciado la prestación de servicio contratada.', 10, false);
  addSpace(2);
  addText('No obstante, si el CLIENTE no facilita la documentación necesaria para la tramitación de la prestación, o en su caso la requerida al efecto, de la cantidad entregada como pago a cuenta se le detraerá la cantidad de NOVENTA Y CINCO (95) EUROS como gastos de gestión devengados por la tramitación del expediente devolviéndose el resto.', 10, false);
  addSpace(4);

  // Cláusula TERCERA - CONTRAPRESTACIÓN
  addText('TERCERA.- CONTRAPRESTACIÓN.', 11, true);
  
  // Convert amount from cents to euros
  // El backend devuelve el monto en CÉNTIMOS
  const totalAmountCents = details.amount || 40000;
  const totalAmount = totalAmountCents / 100; // Convert to euros
  const firstPayment = totalAmount / 2;
  const secondPayment = totalAmount / 2;
  
  // Amount in words
  const amountInWords = totalAmount === 600 
    ? 'SEISCIENTOS (600)' 
    : totalAmount === 400
    ? 'CUATROCIENTOS (400)'
    : totalAmount === 300
    ? 'TRESCIENTOS (300)'
    : totalAmount === 200
    ? 'DOSCIENTOS (200)'
    : `${Math.round(totalAmount)} (${Math.round(totalAmount)})`;
  
  const firstPaymentText = firstPayment === 300 
    ? 'TRESCIENTOS (300)' 
    : firstPayment === 200
    ? 'DOSCIENTOS (200)'
    : firstPayment === 150
    ? 'CIENTO CINCUENTA (150)'
    : firstPayment === 100
    ? 'CIEN (100)'
    : `${Math.round(firstPayment)} (${Math.round(firstPayment)})`;
  
  const secondPaymentText = secondPayment === 300 
    ? 'TRESCIENTOS (300)' 
    : secondPayment === 200
    ? 'DOSCIENTOS (200)'
    : secondPayment === 150
    ? 'CIENTO CINCUENTA (150)'
    : secondPayment === 100
    ? 'CIEN (100)'
    : `${Math.round(secondPayment)} (${Math.round(secondPayment)})`;
  
  const amountText = `El precio del servicio contratado descrito en la cláusula primera se concreta correspondiente a la cantidad de ${amountInWords} EUROS (${totalAmount.toFixed(2)} €), IVA incluido. El CLIENTE abonará las siguientes cantidades mediante cargo en la tarjeta bancaria que éste autorizada de forma expresa y al efecto como medio de abono y garantía para la prestación del servicio.

• ${firstPaymentText} EUROS (${firstPayment.toFixed(2)} €) en el momento de la contratación.
• Otros ${secondPaymentText} EUROS (${secondPayment.toFixed(2)} €) tras la comunicación de aprobación por parte de la administración.

En caso de no atenderse los pagos anteriores en el medio, plazo y forma autorizado al efecto, previo requerimiento de pago realizado por la AGENCIA en el medio designado para recibir notificaciones, el CLIENTE autoriza expresamente para que la AGENCIA proceda a desistir del expediente administrativo para el que se la ha contratado, así como a dejar sin efecto y anular la prestación del servicio.`;
  
  addText(amountText, 10, false);
  addSpace(2);
  addText('De igual forma, en caso de no lograrse la resolución administrativa favorable del expediente para el servicio contratado en un plazo de UN (1) AÑO, así como por causa imputable a la AGENCIA, se devolverá al CLIENTE el importe total entregado como pago a cuenta.', 10, false);
  addSpace(2);
  addText('No se contemplan en el precio para la prestación del servicio contratado, el abono de las tasas giradas por la administración pública para su tramitación que serán abonados íntegramente por el CLIENTE previa notificación por parte de la AGENCIA.', 10, false);
  addSpace(4);

  // Cláusula CUARTA - GARANTÍA
  addText('CUARTA.- GARANTÍA - DEVOLUCIÓN POR RECHAZOS ADMINISTRATIVOS.', 11, true);
  const garantiaText = `LA AGENCIA actúa como intermediaria en la tramitación administrativa ante las autoridades competentes, sin que ello suponga garantía alguna sobre el resultado final del procedimiento, el cual depende exclusivamente de la decisión de la administración pública correspondiente.

No obstante lo anterior, y como garantía adicional para el CLIENTE, LA AGENCIA se compromete a devolver el importe total satisfecho, descontando TREINTA Y CINCO EUROS (35 €) en concepto de gastos de gestión administrativa, en el supuesto de que concurran simultáneamente las siguientes circunstancias:

a) Que el procedimiento administrativo finalice en un plazo inferior a DOCE (12) MESES desde la fecha de inicio de la tramitación.

b) Que se produzcan DOS (2) RESOLUCIONES DESESTIMATORIAS O DENEGATORIAS firmes por parte de la administración competente en relación con la solicitud tramitada.

c) Que dichas resoluciones no sean consecuencia de la falta de aportación de documentación por parte del CLIENTE, de la presentación de documentación falsa o incompleta, o de cualquier otra causa imputable al mismo.

d) Que el CLIENTE haya cumplido con todas sus obligaciones contractuales, especialmente en lo relativo a los pagos y a la entrega de la documentación requerida en tiempo y forma.

La devolución se realizará en el plazo máximo de TREINTA (30) DÍAS desde la notificación de la segunda resolución desestimatoria, previa solicitud expresa del CLIENTE y aportación de la documentación que acredite el cumplimiento de los requisitos anteriormente expuestos.

Esta garantía no resultará aplicable en los supuestos de desistimiento voluntario del CLIENTE, de resoluciones administrativas favorables condicionadas, de archivos por falta de documentación, ni en ningún otro supuesto no contemplado expresamente en esta cláusula.`;
  
  addText(garantiaText, 10, false);
  addSpace(4);

  // Cláusula QUINTA (antes CUARTA)
  addText('QUINTA.- DOCUMENTACIÓN.', 11, true);
  addText('Por su parte el CLIENTE hará entrega de la documentación necesaria a la AGENCIA para la debida prestación del servicio contratado siguiendo todas y cada una de sus instrucciones. De no verificarse su entrega, no habrá lugar a la devolución de la cantidad entregada como pago a cuenta.', 10, false);
  addSpace(4);

  // Cláusula SEXTA (antes QUINTA)
  addText('SEXTA.- CONFIDENCIALIDAD.', 11, true);
  addText('LA AGENCIA guardará confidencialidad sobre la información que le facilite el CLIENTE en o para la ejecución del contrato o que por su propia naturaleza deba ser tratada como tal. No obstante, se excluye de la categoría de información confidencial toda aquella divulgada por el CLIENTE que haya de ser revelada de acuerdo con las leyes, resolución judicial o acto de autoridad competente. Este deber se mantendrá durante un plazo de tres años a contar desde la finalización del servicio.', 10, false);
  addSpace(4);

  // Cláusula SÉPTIMA (antes SEXTA) - PROTECCIÓN DE DATOS
  addText('SÉPTIMA.- PROTECCIÓN DE DATOS.', 11, true);
  addText('En el caso de que la prestación de los servicios suponga la necesidad de acceder a datos de carácter personal, LA AGENCIA como encargado del tratamiento, queda obligado al cumplimiento del Reglamento (UE) 2016/679 del Parlamento Europeo y del Consejo, de 27 de abril de 2016, relativo a la protección de las personas físicas en lo que respecta al tratamiento de datos personales y a la libre circulación de estos datos y por el que se deroga la Directiva 95/46/CE y de la Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales.', 10, false);
  addSpace(2);
  addText('La finalidad del tratamiento de datos será la gestión de la relación contractual que une a las partes, sin que éstos se comuniquen a terceros excepto en caso de obligación legal. Los datos se conservarán mientras dure la relación contractual entre las partes y mientras subsistan, en su caso, responsabilidades derivadas del presente contrato.', 10, false);
  addSpace(2);
  addText('El CLIENTE puede ejercer en cualquier momento los derechos de acceso, rectificación y supresión de sus datos personales ante LA AGENCIA, así como también puede solicitar la portabilidad de los mismos, oponerse al tratamiento y solicitar la limitación de éste, en este último caso únicamente se conservarán para el ejercicio o la defensa de reclamaciones.', 10, false);
  addSpace(2);
  addText('El CLIENTE puede ejercer dichos derechos dirigiéndose al domicilio de la AGENCIA, o mediante correo electrónico, a través de la dirección hola@migro.es', 10, false);
  addSpace(4);

  // Cláusula OCTAVA (antes SÉPTIMA)
  addText('OCTAVA.- RESPONSABILIDADES.', 11, true);
  addText('LA AGENCIA responderá de los daños y perjuicios que se deriven para el CLIENTE y de las reclamaciones que pueda realizar un tercero, y que tengan su causa directa en errores de LA AGENCIA o de su personal, en la ejecución del contrato o que deriven de la falta de diligencia referida anteriormente.', 10, false);
  addSpace(4);

  // Cláusula NOVENA (antes OCTAVA)
  addText('NOVENA.- DURACIÓN DEL CONTRATO.', 11, true);
  addText('Se acuerda por ambas partes que el plazo de duración del presente contrato será el necesario para la debida obtención de la prestación contratada según se reseña en la Cláusula primera.', 10, false);
  addSpace(4);

  // Cláusula DÉCIMA (antes NOVENA)
  addText('DÉCIMA.- RESOLUCIÓN.', 11, true);
  addText('El contrato podrá resolverse por las siguientes causas: Por voluntad de cualquiera de las partes cuando medie incumplimiento grave de las obligaciones pactadas; Por acuerdo de las partes por escrito; Por la extinción de la personalidad jurídica.', 10, false);
  addSpace(4);

  // Cláusula DECIMOPRIMERA (antes DÉCIMA)
  addText('DECIMOPRIMERA.- GASTOS E IMPUESTOS.', 11, true);
  addText('Todos los gastos e impuestos que se originen como consecuencia de la formalización, cumplimiento o extinción del presente contrato y de las obligaciones que de él se deriven serán abonadas conforme a Ley.', 10, false);
  addSpace(4);

  // Cláusula DECIMOSEGUNDA (antes DECIMOPRIMERA)
  addText('DECIMOSEGUNDA.- NOTIFICACIONES.', 11, true);
  addText('Toda notificación que se efectúe entre las partes se hará por escrito y será entregada personalmente o de cualquier otra forma que certifique la recepción por la parte notificada en los respectivos domicilios indicados en el encabezamiento de este Contrato, sin perjuicio de ser practicado de forma inmediata y por un medio que garantice la recepción del mensaje, incluso los electrónicos.', 10, false);
  addSpace(4);

  // Cláusula DECIMOTERCERA (antes DECIMOSEGUNDA)
  addText('DECIMOTERCERA.- LEY Y JURISDICCIÓN APLICABLES.', 11, true);
  addText('El Contrato y su ejecución se regirá por las estipulaciones pactadas y, en su defecto, por la legislación española, más concretamente, por la aplicable del Código Civil, por lo previsto en el Reglamento General Europeo de Protección de Datos, y demás normas especiales que resulten de aplicación.', 10, false);
  addSpace(2);
  addText('Las Partes, con renuncia expresa a cualquier otro fuero que le pudiera corresponder, someten a la jurisdicción de los Juzgados y Tribunales de Salamanca para la resolución de controversias que pudiera surgir en la interpretación, ejecución o cumplimiento.', 10, false);
  addSpace(8);

  // Información del Pago (si está disponible)
  if (paymentData) {
    addSpace(5);
    addText('INFORMACIÓN DEL PAGO:', 12, true);
    addSpace(2);
    
    const paymentInfo = `Fecha de pago: ${paymentData.paymentDate || new Date().toLocaleDateString('es-ES')}
Método de pago: ${paymentData.paymentMethod || 'Tarjeta bancaria'}
ID de transacción: ${paymentData.paymentIntentId || paymentData.stripeTransactionId || 'N/A'}
Estado: Pagado y confirmado`;
    
    addText(paymentInfo, 10, false);
    addSpace(5);
  }

  // Firmas
  addText('FIRMAS:', 12, true);
  addSpace(3);
  
  doc.setDrawColor(0);
  doc.line(margin, yPosition, margin + 60, yPosition);
  doc.line(pageWidth - margin - 60, yPosition, pageWidth - margin, yPosition);
  
  yPosition += 5;
  addText('EL CLIENTE', 10, true, 'left');
  doc.text('LA AGENCIA', pageWidth - margin - 30, yPosition - 5);
  yPosition += 3;
  addText(details.client_name || '', 9, false, 'left');
  doc.text('CIF B22759765', pageWidth - margin - 30, yPosition - 3);
  
  // Firma digital del cliente
  yPosition += 8;
  addText('Firma digital del cliente:', 9, true, 'left');
  yPosition += 2;
  addText(`Nombre completo: ${details.client_name || ''}`, 9, false, 'left');
  yPosition += 1;
  addText(`Fecha de firma: ${new Date().toLocaleDateString('es-ES')}`, 9, false, 'left');
  yPosition += 1;
  addText(`ID de transacción: ${paymentData?.stripeTransactionId || 'Generado localmente'}`, 9, false, 'left');
  
  // Firma incrustada del cliente
  if (paymentData?.clientSignature) {
    yPosition += 4;
    addText('Firma del cliente:', 9, true, 'left');
    yPosition += 2;
    
    // Crear una firma visual usando el nombre
    const signatureText = paymentData.clientSignature;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold'); // Cambiar de italic a bold
    doc.setTextColor(0, 0, 0);
    
    // Dibujar línea de firma
    doc.line(margin, yPosition, margin + 60, yPosition);
    yPosition += 2;
    
    // Escribir nombre como firma
    doc.text(signatureText, margin, yPosition);
    yPosition += 5;
    
    // Restaurar fuente normal
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Contrato de Prestación de Servicios - Migro | Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Agregar marca de agua "BORRADOR" en todas las páginas
  // Solo agregar marca de agua si es un borrador
  if (isDraft) {
    addWatermark();
  }

  // Generate Blob
  return doc.output('blob');
}

