// Admin Contract Create - Crear nuevo contrato (hiring code)
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { adminService } from '@/services/adminService';
import { crmService } from '@/services/crmService';
import { GRADE_PRICING, GRADE_PRICING_SUBSCRIPTION, GRADE_DESCRIPTIONS, type ClientGrade, type PaymentType } from '@/types/admin';
import type { Contact } from '@/types/crm';
import { UserPlus, CheckCircle, Copy, AlertCircle, ArrowLeft, Search, X, Users } from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export function AdminContractCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  // Form fields
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassport, setUserPassport] = useState('');
  const [userNie, setUserNie] = useState('');
  const [userNationality, setUserNationality] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [userCity, setUserCity] = useState('');
  const [userProvince, setUserProvince] = useState('');
  const [userPostalCode, setUserPostalCode] = useState('');
  const [serviceName, setServiceName] = useState('Residencia Legal en España');
  const [serviceDescription, setServiceDescription] = useState('Tramitación de expediente para obtención de residencia legal');
  const [grade, setGrade] = useState<ClientGrade>('B');
  const [paymentType, setPaymentType] = useState<PaymentType>('one_time');
  const [manualPaymentMode, setManualPaymentMode] = useState(false);
  const [manualPaymentNote, setManualPaymentNote] = useState('');

  // Contact search
  const [contactSearch, setContactSearch] = useState('');
  const [contactSearchResults, setContactSearchResults] = useState<Contact[]>([]);
  const [contactSearchLoading, setContactSearchLoading] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const contactSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contactSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check authentication
    if (!adminService.isAuthenticated()) {
      navigate('/auth/login');
    }
  }, [navigate]);

  // Buscar contactos con debounce
  useEffect(() => {
    if (contactSearchTimeoutRef.current) {
      clearTimeout(contactSearchTimeoutRef.current);
    }

    if (contactSearch.trim().length < 2) {
      setContactSearchResults([]);
      setShowContactDropdown(false);
      return;
    }

    contactSearchTimeoutRef.current = setTimeout(async () => {
      setContactSearchLoading(true);
      try {
        const response = await crmService.getContacts({
          search: contactSearch.trim(),
          limit: 10,
          skip: 0,
        });
        setContactSearchResults(response.items || []);
        setShowContactDropdown(true);
      } catch (error) {
        console.error('Error buscando contactos:', error);
        setContactSearchResults([]);
      } finally {
        setContactSearchLoading(false);
      }
    }, 300);

    return () => {
      if (contactSearchTimeoutRef.current) {
        clearTimeout(contactSearchTimeoutRef.current);
      }
    };
  }, [contactSearch]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contactSearchRef.current && !contactSearchRef.current.contains(event.target as Node)) {
        setShowContactDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    setContactSearch(contact.name || `${contact.first_name} ${contact.last_name || ''}`.trim());
    setShowContactDropdown(false);
    
    // Precargar datos del contacto
    if (contact.name || contact.first_name) {
      setUserName(contact.name || `${contact.first_name} ${contact.last_name || ''}`.trim());
    }
    if (contact.email) {
      setUserEmail(contact.email);
    }
    if (contact.nacionalidad) {
      setUserNationality(contact.nacionalidad);
    }
    if (contact.address) {
      setUserAddress(contact.address);
    }
    if (contact.city) {
      setUserCity(contact.city);
    }
    if (contact.state) {
      setUserProvince(contact.state);
    }
    if (contact.postal_code) {
      setUserPostalCode(contact.postal_code);
    }
    // Nota: Pasaporte y NIE no están en Contact por defecto, pero si están en custom_fields, se pueden obtener
    // Por ahora, dejamos esos campos vacíos ya que no son campos estándar del contacto
  };

  const handleClearContact = () => {
    setSelectedContact(null);
    setContactSearch('');
    setContactSearchResults([]);
    setShowContactDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (!userName.trim()) {
      setError('El nombre completo es obligatorio');
      return;
    }

    if (!userEmail.trim() || !userEmail.includes('@')) {
      setError('El email es obligatorio y debe ser válido');
      return;
    }

    if (!userPassport.trim() && !userNie.trim()) {
      setError('Debe proporcionar al menos Pasaporte o NIE');
      return;
    }

    if (manualPaymentMode && !manualPaymentNote.trim()) {
      setError('Debes describir cómo se realizó el pago previo');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setGeneratedCode(null);
    setGeneratedUrl(null);

    try {
      // Calcular monto total según tipo de pago
      const totalAmount = paymentType === 'subscription' 
        ? GRADE_PRICING_SUBSCRIPTION[grade]
        : GRADE_PRICING[grade];
      
      const requestBody = {
        contract_template: "standard", // Campo requerido
        service_name: serviceName,
        service_description: serviceDescription,
        amount: totalAmount * 100, // Convertir a centavos
        currency: "EUR",
        grade: grade,
        payment_type: paymentType, // Tipo de pago: "one_time" o "subscription"
        expires_in_days: 30,
        notes: `Código creado por administrador - Grado ${grade} - ${paymentType === 'subscription' ? 'Suscripción' : 'Pago Único'}`,
        // Asociación con contacto del CRM (si se seleccionó uno)
        contact_id: selectedContact?.id || undefined,
        // Datos del cliente (información de contacto principal) - REQUERIDOS
        client_name: userName,
        client_email: userEmail,
        client_nationality: userNationality || undefined,
        // Datos del cliente (información adicional del documento)
        client_passport: userPassport || undefined,
        client_nie: userNie || undefined,
        client_address: userAddress || undefined,
        client_city: userCity || undefined,
        client_province: userProvince || undefined,
        client_postal_code: userPostalCode || undefined,
        // Pago manual (si el admin lo marca)
        manual_payment_confirmed: manualPaymentMode,
        manual_payment_note: manualPaymentMode ? manualPaymentNote : undefined,
        manual_payment_method: manualPaymentMode ? `Pago previo registrado: ${manualPaymentNote}` : undefined,
      };

      console.log('📤 REQUEST COMPLETO A ENVIAR:', JSON.stringify(requestBody, null, 2));
      console.log('📤 client_name:', requestBody.client_name);
      console.log('📤 client_email:', requestBody.client_email);
      if (requestBody.contact_id) {
        console.log('🔗 contact_id asociado:', requestBody.contact_id);
      } else {
        console.log('⚠️ No se asoció ningún contacto del CRM (se creará nota si el backend encuentra el contacto por email)');
      }

      const response = await adminService.createHiringCode(requestBody);

      console.log('✅ Respuesta del backend:', response);

      // Extraer código y URL de la respuesta
      const hiringCode = response.hiring_code;
      const shortUrl = response.short_url;

      console.log('📝 Código extraído:', hiringCode);
      console.log('🔗 URL extraída:', shortUrl);

      if (hiringCode) {
        setGeneratedCode(hiringCode);
        setSuccess(`¡Código de contratación creado exitosamente!`);
      } else {
        console.warn('⚠️ No se encontró código de contratación en la respuesta');
        setError('Código creado pero no se pudo extraer de la respuesta');
        return;
      }

      if (shortUrl) {
        setGeneratedUrl(shortUrl);
      } else {
        // Generar URL manualmente si no viene en la respuesta
        const manualUrl = `${window.location.origin}/contratacion/${hiringCode}`;
        setGeneratedUrl(manualUrl);
        console.log('🔗 URL generada manualmente:', manualUrl);
      }
      
      // Clear form
      setUserName('');
      setUserEmail('');
      setUserPassport('');
      setUserNie('');
      setUserNationality('');
      setUserAddress('');
      setUserCity('');
      setUserProvince('');
      setUserPostalCode('');
      setGrade('B');
      setPaymentType('one_time');
      setManualPaymentMode(false);
      setManualPaymentNote('');
      // Limpiar contacto seleccionado
      handleClearContact();
    } catch (err: any) {
      console.error('Error creando contrato:', err);
      setError(err.message || 'Error al crear el código de contratación');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('¡Copiado al portapapeles!');
  };

  const getPaymentInfo = () => {
    // Calcular monto total según tipo de pago
    const totalAmount = paymentType === 'subscription' 
      ? GRADE_PRICING_SUBSCRIPTION[grade]
      : GRADE_PRICING[grade];
    
    let firstPayment, secondPayment, monthlyPayment, numberOfPayments;
    
    if (paymentType === 'subscription') {
      // Suscripción: 10 pagos mensuales
      numberOfPayments = 10;
      monthlyPayment = totalAmount / numberOfPayments;
      firstPayment = monthlyPayment;
      secondPayment = 0; // No aplica para suscripción
    } else {
      // Pago único: 2 pagos (50% + 50%)
      numberOfPayments = 2;
      if (grade === 'T') {
        // Para testing: 1€ total (0.50€ ahora + 0.50€ después)
        firstPayment = 0.5;
        secondPayment = 0.5;
      } else if (grade === 'C') {
        firstPayment = 300;
        secondPayment = 300;
      } else {
        firstPayment = 200;
        secondPayment = 200;
      }
      monthlyPayment = 0; // No aplica para pago único
    }
    
    return {
      total: totalAmount,
      first: firstPayment,
      second: secondPayment,
      monthly: monthlyPayment,
      numberOfPayments,
    };
  };

  const paymentInfo = getPaymentInfo();

  const handleViewContract = () => {
    if (generatedCode) {
      navigate(`/admin/contracts/${generatedCode}`);
    }
  };

  if (loading && !generatedCode) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" text="Creando contrato..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Crear Nuevo Contrato</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Genera un nuevo código de contratación con todos los datos necesarios
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/admin/contracts')}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          Volver
        </Button>
      </div>

      {/* Success Message */}
      {success && generatedCode && (
        <Card className="border-green-500 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="text-green-600 mt-1" size={24} />
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 mb-2">{success}</h3>
                
                <div className="bg-white border border-green-300 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Código de contratación:</p>
                    <div className="flex items-center gap-2">
                      <code className="text-2xl font-bold text-primary">{generatedCode}</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(generatedCode)}
                      >
                        <Copy size={16} />
                      </Button>
                    </div>
                  </div>

                  {generatedUrl && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">URL de contratación:</p>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-gray-100 px-3 py-2 rounded flex-1 break-all">
                          {generatedUrl}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(generatedUrl)}
                        >
                          <Copy size={16} />
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-3 border-t">
                    <Button
                      onClick={handleViewContract}
                      className="flex-1"
                    >
                      Ver Contrato
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setGeneratedCode(null);
                        setGeneratedUrl(null);
                        setSuccess(null);
                      }}
                      className="flex-1"
                    >
                      Crear Otro
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      {!generatedCode && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <UserPlus className="text-primary" size={24} />
              Datos del Contrato
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Buscar Contacto Existente */}
              <div>
                <Label htmlFor="contact-search" className="text-base font-semibold text-gray-900 mb-2 block">
                  Buscar Contacto Existente (Opcional)
                </Label>
                <p className="text-sm text-gray-600 mb-3">
                  Busca un contacto existente para precargar sus datos en el formulario
                </p>
                <div className="relative" ref={contactSearchRef}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="contact-search"
                      type="text"
                      placeholder="Buscar por nombre, email o teléfono..."
                      value={contactSearch}
                      onChange={(e) => setContactSearch(e.target.value)}
                      onFocus={() => {
                        if (contactSearchResults.length > 0) {
                          setShowContactDropdown(true);
                        }
                      }}
                      className="pl-10 pr-10"
                    />
                    {selectedContact && (
                      <button
                        type="button"
                        onClick={handleClearContact}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  {/* Dropdown de resultados */}
                  {showContactDropdown && (contactSearchResults.length > 0 || contactSearchLoading) && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {contactSearchLoading ? (
                        <div className="p-4 text-center text-sm text-gray-500">
                          Buscando contactos...
                        </div>
                      ) : (
                        <>
                          {contactSearchResults.map((contact) => (
                            <button
                              key={contact.id}
                              type="button"
                              onClick={() => handleSelectContact(contact)}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 truncate">
                                    {contact.name || `${contact.first_name} ${contact.last_name || ''}`.trim() || 'Sin nombre'}
                                  </div>
                                  {contact.email && (
                                    <div className="text-sm text-gray-500 truncate">{contact.email}</div>
                                  )}
                                  {contact.phone && (
                                    <div className="text-sm text-gray-500 truncate">{contact.phone}</div>
                                  )}
                                </div>
                                <Users className="w-5 h-5 text-gray-400 ml-2 flex-shrink-0" />
                              </div>
                            </button>
                          ))}
                          {contactSearchResults.length === 0 && contactSearch.trim().length >= 2 && (
                            <div className="p-4 text-center text-sm text-gray-500">
                              No se encontraron contactos
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
                {selectedContact && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-900">
                          Contacto seleccionado: {selectedContact.name || `${selectedContact.first_name} ${selectedContact.last_name || ''}`.trim()}
                        </p>
                        <p className="text-xs text-green-700 mt-1">
                          Los datos se han precargado en el formulario. Puedes editarlos si es necesario.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClearContact}
                        className="text-green-700 hover:text-green-900"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Datos del Cliente */}
              <div>
                <h3 className="font-semibold text-lg mb-4 text-gray-900">Datos del Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="userName">Nombre y Apellidos *</Label>
                    <Input
                      id="userName"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Juan Pérez García"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="userEmail">Correo Electrónico *</Label>
                    <Input
                      id="userEmail"
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="cliente@ejemplo.com"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="userPassport">Número de Pasaporte</Label>
                    <Input
                      id="userPassport"
                      value={userPassport}
                      onChange={(e) => setUserPassport(e.target.value.toUpperCase())}
                      placeholder="ABC123456"
                    />
                  </div>

                  <div>
                    <Label htmlFor="userNie">NIE</Label>
                    <Input
                      id="userNie"
                      value={userNie}
                      onChange={(e) => setUserNie(e.target.value.toUpperCase())}
                      placeholder="X1234567Y"
                    />
                  </div>

                  <div>
                    <Label htmlFor="userNationality">Nacionalidad</Label>
                    <Input
                      id="userNationality"
                      value={userNationality}
                      onChange={(e) => setUserNationality(e.target.value)}
                      placeholder="Ej: Venezolana, Colombiana, Española..."
                      maxLength={100}
                    />
                  </div>

                  <div>
                    <Label htmlFor="userAddress">Dirección</Label>
                    <Input
                      id="userAddress"
                      value={userAddress}
                      onChange={(e) => setUserAddress(e.target.value)}
                      placeholder="Calle Principal 123"
                    />
                  </div>

                  <div>
                    <Label htmlFor="userCity">Ciudad</Label>
                    <Input
                      id="userCity"
                      value={userCity}
                      onChange={(e) => setUserCity(e.target.value)}
                      placeholder="Salamanca"
                    />
                  </div>
                </div>

                {/* Provincia y Código Postal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="userProvince">Provincia (opcional)</Label>
                    <Input
                      id="userProvince"
                      value={userProvince}
                      onChange={(e) => setUserProvince(e.target.value)}
                      placeholder="Salamanca"
                    />
                  </div>

                  <div>
                    <Label htmlFor="userPostalCode">Código Postal (opcional)</Label>
                    <Input
                      id="userPostalCode"
                      value={userPostalCode}
                      onChange={(e) => setUserPostalCode(e.target.value)}
                      placeholder="37001"
                    />
                  </div>
                </div>
              </div>

              {/* Servicio */}
              <div>
                <h3 className="font-semibold text-lg mb-4 text-gray-900">Servicio</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="serviceName">Nombre del Servicio</Label>
                    <Input
                      id="serviceName"
                      value={serviceName}
                      onChange={(e) => setServiceName(e.target.value)}
                      placeholder="Residencia Legal en España"
                    />
                  </div>

                  <div>
                    <Label htmlFor="serviceDescription">Descripción</Label>
                    <Input
                      id="serviceDescription"
                      value={serviceDescription}
                      onChange={(e) => setServiceDescription(e.target.value)}
                      placeholder="Tramitación de expediente..."
                    />
                  </div>
                </div>
              </div>

              {/* Calificación y Coste */}
              <div>
                <h3 className="font-semibold text-lg mb-4 text-gray-900">
                  Calificación y Estudio Migro
                </h3>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800 mb-2">
                    <strong>Sistema de Calificación:</strong>
                  </p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li><strong>Nota A:</strong> Excelente - Alta probabilidad de éxito (400€)</li>
                    <li><strong>Nota B:</strong> Bueno - Probabilidad buena de éxito (400€)</li>
                    <li><strong>Nota C:</strong> Complejo - Requiere estudio adicional (600€)</li>
                    <li><strong>Nota T:</strong> Testing - Solo para pruebas internas (1€)</li>
                  </ul>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {(['A', 'B', 'C', 'T'] as ClientGrade[]).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGrade(g)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        grade === g
                          ? (g === 'T' ? 'border-yellow-500 bg-yellow-500 text-white' : 'border-primary bg-primary text-white')
                          : 'border-gray-300 bg-white hover:border-primary'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-3xl font-bold mb-2">Nota {g}</div>
                        <div className="text-sm">{GRADE_DESCRIPTIONS[g]}</div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Selección de Tipo de Pago */}
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Tipo de Pago</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setPaymentType('one_time')}
                      className={`p-5 rounded-lg border-2 transition-all text-left ${
                        paymentType === 'one_time'
                          ? 'border-primary bg-primary/10 shadow-md'
                          : 'border-gray-300 bg-white hover:border-primary hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          paymentType === 'one_time'
                            ? 'border-primary bg-primary'
                            : 'border-gray-400'
                        }`}>
                          {paymentType === 'one_time' && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900 mb-2 text-lg">Pago Único</h5>
                          <p className="text-sm text-gray-600 mb-1">2 pagos</p>
                          <p className="text-xs text-gray-500 mb-3">50% inicial + 50% después de comunicación favorable</p>
                          <p className="text-xl font-bold text-primary">
                            {GRADE_PRICING[grade]} EUR total
                          </p>
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentType('subscription')}
                      className={`p-5 rounded-lg border-2 transition-all text-left ${
                        paymentType === 'subscription'
                          ? 'border-primary bg-primary/10 shadow-md'
                          : 'border-gray-300 bg-white hover:border-primary hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          paymentType === 'subscription'
                            ? 'border-primary bg-primary'
                            : 'border-gray-400'
                        }`}>
                          {paymentType === 'subscription' && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900 mb-2 text-lg">Suscripción</h5>
                          <p className="text-sm text-gray-600 mb-1">10 pagos mensuales</p>
                          <p className="text-xs text-gray-500 mb-3">Pago automático cada mes</p>
                          <p className="text-xl font-bold text-primary">
                            {GRADE_PRICING_SUBSCRIPTION[grade]} EUR total
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Resumen de Pago */}
                <div className="mt-4 bg-gray-50 border-2 border-gray-300 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Resumen de Pago</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Coste Total (IVA incluido):</span>
                      <span className="font-bold text-lg text-primary">{paymentInfo.total}€</span>
                    </div>
                    {paymentType === 'subscription' ? (
                      <>
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-gray-600">Pago mensual:</span>
                          <span className="font-semibold">{paymentInfo.monthly.toFixed(2)}€</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Número de pagos:</span>
                          <span className="font-semibold">{paymentInfo.numberOfPayments} pagos mensuales</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-gray-600">Primer pago (al contratar):</span>
                          <span className="font-semibold">{paymentInfo.first}€</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Segundo pago (tras aprobación):</span>
                          <span className="font-semibold">{paymentInfo.second}€</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Pago Manual */}
              <div>
                <h3 className="font-semibold text-lg mb-4 text-gray-900">
                  Pago Manual (Opcional)
                </h3>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="manual-payment-admin"
                      checked={manualPaymentMode}
                      onCheckedChange={(checked) => {
                        const isChecked = checked === true;
                        setManualPaymentMode(isChecked);
                        if (!isChecked) {
                          setManualPaymentNote('');
                        }
                      }}
                    />
                    <div className="flex-1">
                      <Label htmlFor="manual-payment-admin" className="text-base font-semibold text-gray-900 cursor-pointer">
                        El cliente ya pagó por otro medio
                      </Label>
                      <p className="text-sm text-gray-700 mt-1">
                        Activa esta opción si el cliente abonó por transferencia, efectivo u otro método. 
                        El código generado omitirá el paso de Stripe y permitirá firmar directamente el contrato.
                      </p>
                    </div>
                  </div>

                  {manualPaymentMode && (
                    <div className="mt-4 space-y-2">
                      <Label htmlFor="manual-payment-note" className="text-sm font-semibold">
                        Describe cómo se realizó el pago *
                      </Label>
                      <Textarea
                        id="manual-payment-note"
                        value={manualPaymentNote}
                        onChange={(e) => setManualPaymentNote(e.target.value)}
                        placeholder="Ej: Pago recibido en efectivo el 19/11/2025"
                        rows={3}
                        required={manualPaymentMode}
                      />
                      <p className="text-xs text-gray-600">
                        Esta nota se incluirá en el contrato. El código generado tendrá status "paid" automáticamente y NO requerirá Stripe.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-2">
                  <AlertCircle size={20} />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/contracts')}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary hover:bg-primary-700 text-white"
                >
                  {loading ? 'Generando...' : 'Generar Código de Contratación'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

