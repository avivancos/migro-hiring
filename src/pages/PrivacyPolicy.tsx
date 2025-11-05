// Privacy Policy Page Component

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Eye, Lock, Mail, Phone, MapPin } from 'lucide-react';

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Política de Privacidad
          </h1>
          <div className="flex justify-center gap-2 mb-4">
            <Badge variant="outline" className="text-sm">
              Español
            </Badge>
            <Badge variant="secondary" className="text-sm">
              English
            </Badge>
          </div>
          <p className="text-gray-600">
            Última actualización: 19 de octubre de 2025
          </p>
        </div>

        {/* Disclaimer */}
        <Card className="mb-8 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertTriangle className="text-red-600" size={24} />
              RENUNCIA DE RESPONSABILIDAD IMPORTANTE
            </CardTitle>
          </CardHeader>
          <CardContent className="text-red-700">
            <p className="mb-4 font-semibold">
              Migro NO es una entidad gubernamental ni está afiliada, patrocinada o autorizada por ninguna institución pública o gubernamental.
            </p>
            <p className="mb-4">
              Nuestra aplicación es un servicio privado de asesoría migratoria que proporciona información general y orientación. Toda la información gubernamental compartida en nuestra aplicación proviene de fuentes oficiales públicas y se proporciona únicamente con fines informativos.
            </p>
            
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Fuentes oficiales utilizadas:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Ministerio del Interior de España (www.interior.gob.es)</li>
                <li>Ministerio de Asuntos Exteriores, Unión Europea y Cooperación (www.exteriores.gob.es)</li>
                <li>Oficina de Asilo y Refugio (OAR)</li>
                <li>Boletín Oficial del Estado (BOE)</li>
                <li>Páginas web oficiales de embajadas y consulados</li>
              </ul>
            </div>
            
            <p className="font-semibold">
              Importante: Siempre consulte directamente con las autoridades competentes para obtener información oficial y actualizada sobre procedimientos migratorios específicos.
            </p>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Section 1 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="text-primary" size={24} />
                1. Información que Recopilamos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-3">1.1 Información Personal</h3>
                <p className="mb-3">Recopilamos la siguiente información personal cuando te registras y utilizas nuestra aplicación:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li><strong>Datos de identificación:</strong> Nombre completo, dirección de correo electrónico, número de teléfono</li>
                  <li><strong>Información de perfil:</strong> Foto de perfil (avatar), biografía personal</li>
                  <li><strong>Datos de autenticación:</strong> Contraseña (encriptada), identificadores de servicios de terceros (Google, Facebook, Apple)</li>
                  <li><strong>Información de cuenta:</strong> Estado de verificación, rol de usuario, fecha de último acceso</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">1.2 Información de Uso</h3>
                <p className="mb-3">Recopilamos automáticamente información sobre cómo utilizas nuestra aplicación:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Datos de uso de la aplicación y funcionalidades utilizadas</li>
                  <li>Información de dispositivos (tipo de dispositivo, sistema operativo, versión de la aplicación)</li>
                  <li>Datos de conectividad y rendimiento</li>
                  <li>Información de errores y crashes para mejorar la aplicación</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">1.3 Información de Servicios Migratorios</h3>
                <p className="mb-3">Para proporcionar nuestros servicios de asesoría migratoria, podemos recopilar:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Documentos migratorios que nos proporciones</li>
                  <li>Información sobre tu situación migratoria</li>
                  <li>Historial de consultas y servicios utilizados</li>
                  <li>Comunicaciones entre tú y nuestros asesores</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Section 2 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="text-primary" size={24} />
                2. Cómo Utilizamos tu Información
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-3">2.1 Prestación de Servicios</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Proporcionar servicios de asesoría migratoria</li>
                  <li>Gestionar tu cuenta y perfil de usuario</li>
                  <li>Facilitar la comunicación con nuestros asesores especializados</li>
                  <li>Procesar pagos y transacciones</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">2.2 Mejora de Servicios</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Analizar el uso de la aplicación para mejorar la experiencia del usuario</li>
                  <li>Desarrollar nuevas funcionalidades y servicios</li>
                  <li>Corregir errores y optimizar el rendimiento</li>
                  <li>Realizar investigaciones y análisis estadísticos</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">2.3 Comunicación</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Enviar notificaciones importantes sobre tu cuenta</li>
                  <li>Proporcionar actualizaciones sobre el estado de tus trámites</li>
                  <li>Enviar información relevante sobre cambios legislativos migratorios</li>
                  <li>Responder a tus consultas y solicitudes de soporte</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Section 3 */}
          <Card>
            <CardHeader>
              <CardTitle>3. Base Legal para el Procesamiento</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Procesamos tu información personal basándonos en las siguientes bases legales:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li><strong>Consentimiento:</strong> Cuando nos das tu consentimiento explícito</li>
                <li><strong>Ejecución de contrato:</strong> Para proporcionar los servicios que has solicitado</li>
                <li><strong>Interés legítimo:</strong> Para mejorar nuestros servicios y prevenir fraudes</li>
                <li><strong>Cumplimiento legal:</strong> Cuando sea requerido por la legislación aplicable</li>
              </ul>
            </CardContent>
          </Card>

          {/* Section 4 */}
          <Card>
            <CardHeader>
              <CardTitle>4. Compartir Información</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-3">4.1 No Vendemos tu Información</h3>
                <p className="text-gray-700">
                  No vendemos, alquilamos ni compartimos tu información personal con terceros para fines comerciales.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">4.2 Compartir con Proveedores de Servicios</h3>
                <p className="mb-3">Podemos compartir información con proveedores de servicios de confianza que nos ayudan a operar nuestra aplicación:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li><strong>Firebase (Google):</strong> Para autenticación, almacenamiento y análisis</li>
                  <li><strong>Stripe:</strong> Para procesamiento de pagos</li>
                  <li><strong>Proveedores de hosting:</strong> Para almacenamiento seguro de datos</li>
                  <li><strong>Servicios de comunicación:</strong> Para enviar notificaciones</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">4.3 Requerimientos Legales</h3>
                <p className="mb-3">Podemos divulgar tu información cuando sea requerido por ley o para:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Cumplir con órdenes judiciales o citaciones</li>
                  <li>Proteger nuestros derechos legales</li>
                  <li>Prevenir fraudes o actividades ilegales</li>
                  <li>Proteger la seguridad de nuestros usuarios</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Section 5 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="text-primary" size={24} />
                5. Seguridad de Datos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-3">5.1 Medidas de Seguridad Técnicas</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Encriptación de datos en tránsito y en reposo</li>
                  <li>Autenticación de dos factores cuando sea posible</li>
                  <li>Monitoreo continuo de seguridad</li>
                  <li>Copias de seguridad regulares y seguras</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">5.2 Medidas de Seguridad Organizativas</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Acceso limitado a información personal solo al personal autorizado</li>
                  <li>Capacitación regular del personal en protección de datos</li>
                  <li>Políticas estrictas de confidencialidad</li>
                  <li>Auditorías regulares de seguridad</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Section 6 */}
          <Card>
            <CardHeader>
              <CardTitle>6. Retención de Datos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Conservamos tu información personal durante el tiempo necesario para:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Proporcionar los servicios que has solicitado</li>
                <li>Cumplir con obligaciones legales y regulatorias</li>
                <li>Resolver disputas y hacer cumplir nuestros acuerdos</li>
                <li>Mejorar nuestros servicios</li>
              </ul>
              <p className="text-gray-700">
                Los datos de cuenta inactiva se eliminarán después de 3 años de inactividad, salvo que la ley requiera un período de retención más largo.
              </p>
            </CardContent>
          </Card>

          {/* Section 7 */}
          <Card>
            <CardHeader>
              <CardTitle>7. Tus Derechos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-700">
                Bajo el Reglamento General de Protección de Datos (RGPD) y otras leyes aplicables, tienes los siguientes derechos:
              </p>

              <div>
                <h3 className="font-semibold text-lg mb-3">7.1 Derechos de Acceso y Control</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li><strong>Acceso:</strong> Solicitar una copia de la información personal que tenemos sobre ti</li>
                  <li><strong>Rectificación:</strong> Corregir información inexacta o incompleta</li>
                  <li><strong>Eliminación:</strong> Solicitar la eliminación de tu información personal</li>
                  <li><strong>Limitación:</strong> Restringir el procesamiento de tu información</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">7.2 Derechos de Portabilidad y Objeción</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li><strong>Portabilidad:</strong> Recibir tu información en un formato estructurado y legible</li>
                  <li><strong>Objeción:</strong> Oponerte al procesamiento de tu información para ciertos fines</li>
                  <li><strong>Retiro de consentimiento:</strong> Retirar tu consentimiento en cualquier momento</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">7.3 Cómo Ejercer tus Derechos</h3>
                <p className="mb-3">Para ejercer cualquiera de estos derechos, puedes:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Contactarnos a través de la información de contacto proporcionada al final de esta política</li>
                  <li>Utilizar las configuraciones de privacidad en la aplicación</li>
                  <li>Enviar una solicitud por escrito a nuestra dirección</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Section 8 */}
          <Card>
            <CardHeader>
              <CardTitle>8. Cookies y Tecnologías Similares</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Nuestra aplicación puede utilizar cookies y tecnologías similares para:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Recordar tus preferencias y configuraciones</li>
                <li>Analizar el uso de la aplicación</li>
                <li>Mejorar la funcionalidad y rendimiento</li>
                <li>Proporcionar contenido personalizado</li>
              </ul>
              <p className="text-gray-700">
                Puedes controlar el uso de cookies a través de la configuración de tu dispositivo.
              </p>
            </CardContent>
          </Card>

          {/* Section 9 */}
          <Card>
            <CardHeader>
              <CardTitle>9. Transferencias Internacionales</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Algunos de nuestros proveedores de servicios pueden estar ubicados fuera del Espacio Económico Europeo (EEE). Cuando transferimos información personal a estos países, nos aseguramos de que:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Existan salvaguardas adecuadas para proteger tu información</li>
                <li>Se cumplan las garantías de protección de datos apropiadas</li>
                <li>Se respeten los estándares internacionales de privacidad</li>
              </ul>
            </CardContent>
          </Card>

          {/* Section 10 */}
          <Card>
            <CardHeader>
              <CardTitle>10. Menores de Edad</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                Nuestros servicios están dirigidos a personas mayores de 16 años. No recopilamos intencionalmente información personal de menores de 16 años sin el consentimiento verificable de sus padres o tutores legales.
              </p>
            </CardContent>
          </Card>

          {/* Section 11 */}
          <Card>
            <CardHeader>
              <CardTitle>11. Cambios a esta Política</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Podemos actualizar esta Política de Privacidad ocasionalmente. Te notificaremos sobre cambios significativos a través de:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Notificaciones en la aplicación</li>
                <li>Correo electrónico a la dirección registrada</li>
                <li>Actualización de la fecha de "última modificación" en esta página</li>
              </ul>
              <p className="text-gray-700">
                Te recomendamos revisar esta política periódicamente para mantenerte informado sobre cómo protegemos tu información.
              </p>
            </CardContent>
          </Card>

          {/* Section 12 - Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="text-primary" size={24} />
                12. Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-700">
                Si tienes preguntas, inquietudes o solicitudes relacionadas con esta Política de Privacidad o el manejo de tu información personal, puedes contactarnos:
              </p>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-4">Información de Contacto:</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="text-gray-500" size={18} />
                    <span className="text-gray-700">Email: privacidad@migro.com</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="text-gray-500" size={18} />
                    <span className="text-gray-700">Email general: info@migro.es</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="text-gray-500" size={18} />
                    <span className="text-gray-700">Dirección: C/ Libreros, nº 4, 1º - Salamanca, España</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="text-gray-500" size={18} />
                    <span className="text-gray-700">Teléfono: +34 923 123 456</span>
                  </div>
                  <div className="text-gray-700">
                    <strong>Horario de atención:</strong> Lunes a Viernes, 9:00 - 18:00 (CET)
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-3">Delegado de Protección de Datos (DPO):</h3>
                <p className="text-gray-700">
                  Si tienes consultas específicas sobre protección de datos, puedes contactar a nuestro Delegado de Protección de Datos en: dpo@migro.com
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 13 */}
          <Card>
            <CardHeader>
              <CardTitle>13. Autoridad de Control</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-gray-700">
                Si consideras que el procesamiento de tu información personal no cumple con la legislación aplicable, tienes derecho a presentar una reclamación ante la autoridad de control de protección de datos competente en tu jurisdicción.
              </p>
              
              <div className="bg-yellow-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-3">En España, la autoridad de control es la Agencia Española de Protección de Datos (AEPD):</h3>
                <div className="space-y-2 text-gray-700">
                  <div><strong>Sitio web:</strong> www.aepd.es</div>
                  <div><strong>Dirección:</strong> C/ Jorge Juan, 6, 28001 Madrid</div>
                  <div><strong>Teléfono:</strong> 901 100 099</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 p-6 bg-gray-100 rounded-lg">
          <p className="text-gray-600 mb-2">
            <strong>Última actualización:</strong> 19 de octubre de 2025
          </p>
          <p className="text-gray-600">
            Esta Política de Privacidad es efectiva a partir de la fecha de última actualización indicada arriba.
          </p>
        </div>
      </div>
    </div>
  );
}
